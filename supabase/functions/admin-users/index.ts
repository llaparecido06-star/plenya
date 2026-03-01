import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");

    // Check admin role
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

    // GET metrics
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

      return new Response(JSON.stringify({
        total_users: totalUsers ?? 0,
        premium_users: premiumUsers ?? 0,
        active_users: activeUsers ?? 0,
        onboarded_users: onboardedUsers ?? 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET users list
    if (action === "list") {
      const search = url.searchParams.get("search") || "";
      const page = parseInt(url.searchParams.get("page") || "0");
      const filterPremium = url.searchParams.get("premium"); // "true" or "false"
      const filterActive = url.searchParams.get("active"); // "true"
      const filterLifePhase = url.searchParams.get("life_phase"); // e.g. "menstruating"
      const pageSize = 20;

      // If filtering by active, get active user IDs first
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

      // Build profile query with filters for server-side filtering
      let profileQuery = supabase
        .from("profiles")
        .select("user_id, full_name, premium_override, onboarding_completed, created_at, life_phase, goal, diet_type, fitness_level, contraceptive_type, last_period_start");

      if (filterPremium === "true") {
        profileQuery = profileQuery.eq("premium_override", true);
      }
      if (filterLifePhase) {
        profileQuery = profileQuery.eq("life_phase", filterLifePhase);
      }

      const { data: profiles } = await profileQuery;
      const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p]) || []);

      // When using filters, we get all auth users and filter in memory
      const hasFilters = filterPremium || filterActive || filterLifePhase;

      let allUsers: any[] = [];
      let totalCount = 0;

      if (hasFilters) {
        // Fetch more users for filtering (up to 1000)
        const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });
        if (listError) throw listError;

        let users = authUsers.users.map((u: any) => {
          const profile = profileMap.get(u.id);
          return {
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
          };
        });

        // Apply filters
        if (filterPremium === "true") {
          users = users.filter((u: any) => u.premium_override);
        }
        if (filterLifePhase) {
          users = users.filter((u: any) => u.life_phase === filterLifePhase);
        }
        if (activeUserIds) {
          users = users.filter((u: any) => activeUserIds!.has(u.id));
        }
        if (search) {
          const s = search.toLowerCase();
          users = users.filter((u: any) => u.email?.toLowerCase().includes(s) || u.full_name?.toLowerCase().includes(s));
        }

        totalCount = users.length;
        allUsers = users.slice(page * pageSize, (page + 1) * pageSize);
      } else {
        // No filters - use paginated auth list
        const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers({
          page: page + 1,
          perPage: pageSize,
        });
        if (listError) throw listError;

        const userIds = authUsers.users.map((u: any) => u.id);
        const { data: unfilteredProfiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, premium_override, onboarding_completed, created_at, life_phase, goal, diet_type, fitness_level, contraceptive_type, last_period_start")
          .in("user_id", userIds);
        const unfilteredMap = new Map(unfilteredProfiles?.map((p: any) => [p.user_id, p]) || []);

        allUsers = authUsers.users.map((u: any) => {
          const profile = unfilteredMap.get(u.id);
          return {
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
          };
        });

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

    // GET user subscription info from Stripe
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
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 5,
      });

      const payments = await stripe.paymentIntents.list({
        customer: customer.id,
        limit: 10,
      });

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

    // POST toggle premium
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

    // POST delete user
    if (action === "delete-user" && req.method === "POST") {
      const { user_id } = await req.json();
      if (!user_id) throw new Error("user_id required");

      // Prevent self-deletion
      if (user_id === userData.user.id) {
        throw new Error("Cannot delete your own admin account");
      }

      // Delete all user data from tables
      const tables = [
        'daily_logs', 'menstruation_logs', 'intimacy_logs', 'nutrition_intake',
        'workouts', 'pill_logs', 'chat_messages', 'login_streaks',
        'contraceptive_history', 'recipe_history', 'push_tokens', 'profiles'
      ];

      for (const table of tables) {
        await supabase.from(table).delete().eq('user_id', user_id);
      }

      // Delete from auth
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
