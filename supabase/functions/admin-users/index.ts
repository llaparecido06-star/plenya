import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import Stripe from "npm:stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALL_USER_TABLES = [
  'daily_logs', 'menstruation_logs', 'intimacy_logs', 'nutrition_intake',
  'workouts', 'pill_logs', 'chat_messages', 'login_streaks',
  'contraceptive_history', 'recipe_history', 'push_tokens',
  'hot_flash_logs', 'cycle_diary', 'breastfeeding_logs', 'kick_logs',
  'menopause_diary', 'menopause_exams', 'pregnancy_diary',
  'pregnancy_appointments', 'alert_logs', 'monthly_reports',
  'postpartum_logs', 'user_roles', 'profiles',
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // ─── METRICS ───────────────────────────────────────────────
    if (action === "metrics") {
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: premiumUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("premium_override", true);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { count: activeUsers } = await supabase
        .from("login_streaks")
        .select("user_id", { count: "exact", head: true })
        .gte("login_date", sevenDaysAgo.toISOString().split("T")[0]);

      const { count: onboardedUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("onboarding_completed", true);

      // Life phase distribution
      const { data: phaseData } = await supabase
        .from("profiles")
        .select("life_phase");
      const lifePhaseDistribution: Record<string, number> = {};
      (phaseData || []).forEach((p: any) => {
        const phase = p.life_phase || 'unknown';
        lifePhaseDistribution[phase] = (lifePhaseDistribution[phase] || 0) + 1;
      });

      // Content counts
      const [dailyLogs, meals, workouts, chatMsgs, intimacyLogs, menstruationLogs] = await Promise.all([
        supabase.from("daily_logs").select("*", { count: "exact", head: true }),
        supabase.from("nutrition_intake").select("*", { count: "exact", head: true }),
        supabase.from("workouts").select("*", { count: "exact", head: true }),
        supabase.from("chat_messages").select("*", { count: "exact", head: true }),
        supabase.from("intimacy_logs").select("*", { count: "exact", head: true }),
        supabase.from("menstruation_logs").select("*", { count: "exact", head: true }),
      ]);

      // Registrations last 30 days (by day)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: recentProfiles } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", thirtyDaysAgo.toISOString());

      const registrationsByDay: Record<string, number> = {};
      (recentProfiles || []).forEach((p: any) => {
        const day = p.created_at?.split('T')[0];
        if (day) registrationsByDay[day] = (registrationsByDay[day] || 0) + 1;
      });

      return new Response(JSON.stringify({
        total_users: totalUsers ?? 0,
        premium_users: premiumUsers ?? 0,
        active_users: activeUsers ?? 0,
        onboarded_users: onboardedUsers ?? 0,
        life_phase_distribution: lifePhaseDistribution,
        content_counts: {
          daily_logs: dailyLogs.count ?? 0,
          meals: meals.count ?? 0,
          workouts: workouts.count ?? 0,
          chat_messages: chatMsgs.count ?? 0,
          intimacy_logs: intimacyLogs.count ?? 0,
          menstruation_logs: menstruationLogs.count ?? 0,
        },
        registrations_by_day: registrationsByDay,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── LIST USERS ────────────────────────────────────────────
    if (action === "list") {
      const search = url.searchParams.get("search") || "";
      const page = parseInt(url.searchParams.get("page") || "0");
      const filterPremium = url.searchParams.get("premium");
      const filterActive = url.searchParams.get("active");
      const filterLifePhase = url.searchParams.get("life_phase");
      const pageSize = 20;

      let activeUserIds: Set<string> | null = null;
      if (filterActive === "true") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const { data: activeLogins } = await supabase
          .from("login_streaks")
          .select("user_id")
          .gte("login_date", sevenDaysAgo.toISOString().split("T")[0]);
        activeUserIds = new Set((activeLogins || []).map((l: any) => l.user_id));
      }

      let profileQuery = supabase
        .from("profiles")
        .select("user_id, full_name, premium_override, onboarding_completed, created_at, life_phase, goal, diet_type, fitness_level, contraceptive_type, last_period_start");

      if (filterPremium === "true") profileQuery = profileQuery.eq("premium_override", true);
      if (filterLifePhase) profileQuery = profileQuery.eq("life_phase", filterLifePhase);

      const { data: profiles } = await profileQuery;
      const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p]) || []);

      const hasFilters = filterPremium || filterActive || filterLifePhase;

      const mapUser = (u: any, profile: any) => ({
        id: u.id,
        email: u.email,
        full_name: profile?.full_name || null,
        premium_override: profile?.premium_override || false,
        onboarding_completed: profile?.onboarding_completed || false,
        life_phase: profile?.life_phase || null,
        goal: profile?.goal || null,
        diet_type: profile?.diet_type || null,
        fitness_level: profile?.fitness_level || null,
        contraceptive_type: profile?.contraceptive_type || null,
        last_period_start: profile?.last_period_start || null,
        created_at: profile?.created_at || u.created_at,
        last_sign_in_at: u.last_sign_in_at || null,
      });

      let allUsers: any[] = [];
      let totalCount = 0;

      if (hasFilters) {
        const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (listError) throw listError;

        let users = authUsers.users.map((u: any) => mapUser(u, profileMap.get(u.id)));
        if (filterPremium === "true") users = users.filter((u: any) => u.premium_override);
        if (filterLifePhase) users = users.filter((u: any) => u.life_phase === filterLifePhase);
        if (activeUserIds) users = users.filter((u: any) => activeUserIds!.has(u.id));
        if (search) {
          const s = search.toLowerCase();
          users = users.filter((u: any) => u.email?.toLowerCase().includes(s) || u.full_name?.toLowerCase().includes(s));
        }
        totalCount = users.length;
        allUsers = users.slice(page * pageSize, (page + 1) * pageSize);
      } else {
        const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers({ page: page + 1, perPage: pageSize });
        if (listError) throw listError;

        const userIds = authUsers.users.map((u: any) => u.id);
        const { data: unfilteredProfiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, premium_override, onboarding_completed, created_at, life_phase, goal, diet_type, fitness_level, contraceptive_type, last_period_start")
          .in("user_id", userIds);
        const unfilteredMap = new Map(unfilteredProfiles?.map((p: any) => [p.user_id, p]) || []);

        allUsers = authUsers.users.map((u: any) => mapUser(u, unfilteredMap.get(u.id)));
        if (search) {
          const s = search.toLowerCase();
          allUsers = allUsers.filter((u: any) => u.email?.toLowerCase().includes(s) || u.full_name?.toLowerCase().includes(s));
        }
        totalCount = authUsers.total;
      }

      return new Response(JSON.stringify({ users: allUsers, total: totalCount }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── USER STATS (activity counts) ──────────────────────────
    if (action === "user-stats") {
      const targetId = url.searchParams.get("user_id");
      if (!targetId) throw new Error("user_id required");

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const since30 = thirtyDaysAgo.toISOString().split("T")[0];

      const [logins, dailyLogs, meals, workoutsData, chatMsgs, intimacy, menstruation, pillLogs, diaryEntries] = await Promise.all([
        supabase.from("login_streaks").select("*", { count: "exact", head: true }).eq("user_id", targetId).gte("login_date", since30),
        supabase.from("daily_logs").select("*", { count: "exact", head: true }).eq("user_id", targetId).gte("log_date", since30),
        supabase.from("nutrition_intake").select("*", { count: "exact", head: true }).eq("user_id", targetId).gte("intake_date", since30),
        supabase.from("workouts").select("*", { count: "exact", head: true }).eq("user_id", targetId).gte("workout_date", since30),
        supabase.from("chat_messages").select("*", { count: "exact", head: true }).eq("user_id", targetId),
        supabase.from("intimacy_logs").select("*", { count: "exact", head: true }).eq("user_id", targetId),
        supabase.from("menstruation_logs").select("*", { count: "exact", head: true }).eq("user_id", targetId),
        supabase.from("pill_logs").select("*", { count: "exact", head: true }).eq("user_id", targetId),
        supabase.from("cycle_diary").select("*", { count: "exact", head: true }).eq("user_id", targetId),
      ]);

      return new Response(JSON.stringify({
        last_30_days: {
          logins: logins.count ?? 0,
          daily_logs: dailyLogs.count ?? 0,
          meals: meals.count ?? 0,
          workouts: workoutsData.count ?? 0,
        },
        lifetime: {
          chat_messages: chatMsgs.count ?? 0,
          intimacy_logs: intimacy.count ?? 0,
          menstruation_logs: menstruation.count ?? 0,
          pill_logs: pillLogs.count ?? 0,
          diary_entries: diaryEntries.count ?? 0,
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── USER SUBSCRIPTION (Stripe) ────────────────────────────
    if (action === "user-subscription") {
      const targetEmail = url.searchParams.get("email");
      if (!targetEmail) throw new Error("email required");

      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey) {
        return new Response(JSON.stringify({ subscribed: false, message: "Stripe not configured" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
      const customers = await stripe.customers.list({ email: targetEmail, limit: 1 });

      if (customers.data.length === 0) {
        return new Response(JSON.stringify({ subscribed: false, customer: null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const customer = customers.data[0];
      const subscriptions = await stripe.subscriptions.list({ customer: customer.id, limit: 5 });
      const payments = await stripe.paymentIntents.list({ customer: customer.id, limit: 10 });

      const subData = subscriptions.data.map((sub) => ({
        id: sub.id,
        status: sub.status,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        plan_amount: sub.items.data[0]?.price?.unit_amount ?? 0,
        plan_currency: sub.items.data[0]?.price?.currency ?? 'brl',
        plan_interval: sub.items.data[0]?.price?.recurring?.interval ?? null,
        product_id: sub.items.data[0]?.price?.product ?? null,
        cancel_at_period_end: sub.cancel_at_period_end,
      }));

      const paymentData = payments.data.map((pi) => ({
        id: pi.id,
        amount: pi.amount,
        currency: pi.currency,
        status: pi.status,
        created: new Date(pi.created * 1000).toISOString(),
      }));

      return new Response(JSON.stringify({
        subscribed: subData.some(s => s.status === 'active'),
        customer_id: customer.id,
        subscriptions: subData,
        payments: paymentData,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── TOGGLE PREMIUM ────────────────────────────────────────
    if (action === "toggle-premium" && req.method === "POST") {
      const { user_id, premium_override } = await req.json();
      if (!user_id) throw new Error("user_id required");

      const { error } = await supabase
        .from("profiles")
        .update({ premium_override: !!premium_override })
        .eq("user_id", user_id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── GRANT ADMIN ───────────────────────────────────────────
    if (action === "grant-admin" && req.method === "POST") {
      const { user_id } = await req.json();
      if (!user_id) throw new Error("user_id required");

      const { error } = await supabase
        .from("user_roles")
        .upsert({ user_id, role: "admin" }, { onConflict: "user_id,role" });
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── REVOKE ADMIN ──────────────────────────────────────────
    if (action === "revoke-admin" && req.method === "POST") {
      const { user_id } = await req.json();
      if (!user_id) throw new Error("user_id required");
      if (user_id === userData.user.id) throw new Error("Cannot revoke your own admin role");

      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", user_id)
        .eq("role", "admin");
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── DELETE USER ───────────────────────────────────────────
    if (action === "delete-user" && req.method === "POST") {
      const { user_id } = await req.json();
      if (!user_id) throw new Error("user_id required");
      if (user_id === userData.user.id) throw new Error("Cannot delete your own admin account");

      for (const table of ALL_USER_TABLES) {
        await supabase.from(table).delete().eq('user_id', user_id);
      }

      const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id);
      if (deleteError) throw deleteError;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
