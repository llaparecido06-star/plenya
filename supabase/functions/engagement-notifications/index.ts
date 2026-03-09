import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Cycle phase tips database
const phaseTips: Record<string, { title: string; body: string }[]> = {
  menstrual: [
    { title: "🩸 Fase Menstrual — Descanse", body: "Seu corpo está se renovando. Priorize descanso, chás quentes e alimentos ricos em ferro." },
    { title: "🌙 Momento de introspecção", body: "Sua intuição está mais forte agora. Aproveite para refletir e planejar o próximo ciclo." },
    { title: "🍫 Dica nutricional", body: "Chocolate amargo 70%+ é seu aliado! Rico em magnésio, ajuda com cólicas e humor." },
  ],
  folicular: [
    { title: "🌱 Fase Folicular — Energia subindo!", body: "Estrogênio em alta! Ótimo momento para iniciar projetos e treinos intensos." },
    { title: "💪 Treino potente hoje", body: "Seu corpo responde melhor ao treino de força agora. Aproveite para bater recordes!" },
    { title: "🥗 Foco em proteína", body: "Na fase folicular, priorize proteínas magras e vegetais verdes para sustentar sua energia." },
  ],
  ovulatoria: [
    { title: "✨ Fase Ovulatória — Você está brilhando!", body: "Pico de energia e magnetismo social. Aproveite para apresentações e conexões." },
    { title: "🏃‍♀️ Performance máxima", body: "Sua força e resistência estão no auge. Aproveite para HIIT e exercícios de alta intensidade!" },
    { title: "🌸 Janela fértil ativa", body: "Seu corpo está no pico de fertilidade. Fique atenta aos sinais como muco cervical e libido." },
  ],
  lutea: [
    { title: "🍂 Fase Lútea — Gentileza consigo", body: "Progesterona em alta: é normal sentir mais fome e irritabilidade. Seja gentil com você." },
    { title: "🧘‍♀️ Prefira yoga hoje", body: "Na fase lútea, exercícios leves como yoga e caminhada ajudam mais que treinos intensos." },
    { title: "🥑 Dica anti-TPM", body: "Alimentos ricos em B6 (banana, abacate) e ômega-3 (salmão) ajudam a reduzir sintomas de TPM." },
  ],
};

// Weekly summary messages
const weeklyMessages = [
  "📊 Resumo semanal pronto! Confira como foi sua semana de nutrição, treinos e humor.",
  "📈 Sua semana no Plenya está completa! Veja seus padrões e conquistas.",
  "🌟 Hora do check-in semanal! Descubra insights sobre seu corpo essa semana.",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sendPushUrl = `${supabaseUrl}/functions/v1/send-push`;

    const { type } = await req.json();
    const results: Record<string, unknown> = {};

    const dbFetch = async (path: string) => {
      const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      });
      return res.json();
    };

    const sendPush = async (user_ids: string[], title: string, body: string, route = "/") => {
      if (user_ids.length === 0) return { skipped: true };
      const res = await fetch(sendPushUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ user_ids, title, body, data: { route } }),
      });
      return res.json();
    };

    // ─── 1. LOST STREAKS ────────────────────────────
    if (type === "streak" || type === "all") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const twoDaysAgoStr = twoDaysAgo.toISOString().split("T")[0];

      // Users who logged 2 days ago but NOT yesterday (streak broken)
      const loggedBefore: { user_id: string }[] = await dbFetch(
        `login_streaks?login_date=eq.${twoDaysAgoStr}&select=user_id`
      );
      const loggedYesterday: { user_id: string }[] = await dbFetch(
        `login_streaks?login_date=eq.${yesterdayStr}&select=user_id`
      );

      const yesterdaySet = new Set(loggedYesterday.map((r) => r.user_id));
      const lostStreakUsers = loggedBefore
        .filter((r) => !yesterdaySet.has(r.user_id))
        .map((r) => r.user_id);

      results.streak = await sendPush(
        lostStreakUsers,
        "🌿 Sua plantinha sentiu sua falta!",
        "Não perca seu streak! Faça um check-in rápido para manter sua planta crescendo.",
        "/"
      );
    }

    // ─── 2. WEEKLY SUMMARY (Mondays) ────────────────
    if (type === "weekly" || type === "all") {
      // Get all users with push tokens
      const tokenUsers: { user_id: string }[] = await dbFetch(
        "push_tokens?select=user_id"
      );
      const uniqueUsers = [...new Set(tokenUsers.map((r) => r.user_id))];

      const msg = weeklyMessages[Math.floor(Math.random() * weeklyMessages.length)];
      results.weekly = await sendPush(uniqueUsers, msg, "Abra o Plenya para ver seu progresso completo.", "/perfil");
    }

    // ─── 3. CYCLE PHASE TIPS ────────────────────────
    if (type === "cycle_tips" || type === "all") {
      // Get users with last_period_start and cycle_length
      const profiles: {
        user_id: string;
        last_period_start: string;
        cycle_length: number;
        life_phase: string | null;
      }[] = await dbFetch(
        "profiles?last_period_start=not.is.null&select=user_id,last_period_start,cycle_length,life_phase"
      );

      const phaseGroups: Record<string, string[]> = {
        menstrual: [],
        folicular: [],
        ovulatoria: [],
        lutea: [],
      };

      const today = new Date();

      for (const p of profiles) {
        if (p.life_phase === "menopause" || p.life_phase === "pregnant") continue;

        const dumDate = new Date(p.last_period_start);
        const diffDays = Math.floor((today.getTime() - dumDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const cycleDay = ((diffDays - 1) % (p.cycle_length || 28)) + 1;

        let phase: string;
        if (cycleDay <= 5) phase = "menstrual";
        else if (cycleDay <= 13) phase = "folicular";
        else if (cycleDay <= 16) phase = "ovulatoria";
        else phase = "lutea";

        phaseGroups[phase]?.push(p.user_id);
      }

      const phaseResults: Record<string, unknown> = {};
      for (const [phase, userIds] of Object.entries(phaseGroups)) {
        if (userIds.length === 0) continue;
        const tips = phaseTips[phase] || phaseTips.menstrual;
        const tip = tips[Math.floor(Math.random() * tips.length)];
        phaseResults[phase] = await sendPush(userIds, tip.title, tip.body, "/");
      }
      results.cycle_tips = phaseResults;
    }

    // ─── 5. HRT REMINDERS (Menopause) ────────────────
    if (type === "hrt" || type === "all") {
      const todayStr = new Date().toISOString().split("T")[0];

      const hrtUsers: {
        user_id: string;
        hrt_type: string;
        hrt_frequency_days: number;
        hrt_last_taken: string | null;
      }[] = await dbFetch(
        "profiles?life_phase=eq.menopause&hrt_type=not.is.null&hrt_frequency_days=not.is.null&select=user_id,hrt_type,hrt_frequency_days,hrt_last_taken"
      );

      const hrtNeedReminder: string[] = [];
      for (const u of hrtUsers) {
        if (!u.hrt_last_taken) {
          hrtNeedReminder.push(u.user_id);
          continue;
        }
        const lastTaken = new Date(u.hrt_last_taken);
        const nextDue = new Date(lastTaken);
        nextDue.setDate(nextDue.getDate() + u.hrt_frequency_days);
        const today = new Date(todayStr);
        if (nextDue <= today) {
          hrtNeedReminder.push(u.user_id);
        }
      }

      results.hrt = await sendPush(
        hrtNeedReminder,
        "💊 Lembrete de Terapia Hormonal",
        "Está na hora da sua dose de TRH. Não esqueça de registrar!",
        "/"
      );
    }

    // ─── 6. MENOPAUSE EXAMS OVERDUE ─────────────────
    if (type === "exams" || type === "all") {
      const todayStr = new Date().toISOString().split("T")[0];

      const overdueExams: { user_id: string }[] = await dbFetch(
        `menopause_exams?is_completed=eq.false&next_due_at=lt.${todayStr}&select=user_id`
      );

      const uniqueExamUsers = [...new Set(overdueExams.map((r) => r.user_id))];

      results.exams = await sendPush(
        uniqueExamUsers,
        "🩺 Exames pendentes",
        "Você tem exames de saúde vencidos. Agende uma consulta para ficar em dia!",
        "/"
      );
    }

    // ─── 7. SMART TREND ALERTS (Menopause) ───────────
    if (type === "trend_alerts" || type === "all") {
      const menopauseProfiles: { user_id: string; alert_thresholds: {
        sleep_min_hours?: number;
        sleep_consecutive_nights?: number;
        hot_flash_increase_percent?: number;
        alerts_enabled?: boolean;
      } | null }[] = await dbFetch(
        "profiles?life_phase=eq.menopause&select=user_id,alert_thresholds"
      );

      const alertUsers: { userId: string; alerts: string[] }[] = [];

      for (const profile of menopauseProfiles) {
        const userId = profile.user_id;
        const th = profile.alert_thresholds || {};
        
        // Skip if alerts disabled
        if (th.alerts_enabled === false) continue;

        const sleepMinHours = th.sleep_min_hours ?? 6;
        const sleepNights = th.sleep_consecutive_nights ?? 3;
        const flashPercent = th.hot_flash_increase_percent ?? 50;
        
        const alerts: string[] = [];

        // --- Sleep alert: N consecutive nights < Xh ---
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - sleepNights);
        const sleepLogs: { notes: string; log_date: string }[] = await dbFetch(
          `daily_logs?user_id=eq.${userId}&log_date=gte.${daysAgo.toISOString().split("T")[0]}&order=log_date.desc&limit=${sleepNights}&select=notes,log_date`
        );

        if (sleepLogs.length >= sleepNights) {
          let consecutiveLow = 0;
          for (const log of sleepLogs) {
            try {
              const parsed = JSON.parse(log.notes || "{}");
              if (parsed.sleep_hours && parsed.sleep_hours < sleepMinHours) consecutiveLow++;
            } catch { /* ignore */ }
          }
          if (consecutiveLow >= sleepNights) {
            alerts.push("sleep_low");
          }
        }

        // --- Hot flash spike: compare last 7 days vs previous 7 days ---
        const now = new Date();
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const twoWeeksAgo = new Date(now);
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        const recentFlashes: { id: string }[] = await dbFetch(
          `hot_flash_logs?user_id=eq.${userId}&logged_at=gte.${oneWeekAgo.toISOString()}&select=id`
        );
        const prevFlashes: { id: string }[] = await dbFetch(
          `hot_flash_logs?user_id=eq.${userId}&logged_at=gte.${twoWeeksAgo.toISOString()}&logged_at=lt.${oneWeekAgo.toISOString()}&select=id`
        );

        if (prevFlashes.length > 0) {
          const increase = ((recentFlashes.length - prevFlashes.length) / prevFlashes.length) * 100;
          if (increase >= 50) {
            alerts.push("flash_spike");
          }
        }

        if (alerts.length > 0) {
          alertUsers.push({ userId, alerts });
        }
      }

      // Send targeted notifications
      const sleepAlertUsers = alertUsers.filter(u => u.alerts.includes("sleep_low")).map(u => u.userId);
      const flashAlertUsers = alertUsers.filter(u => u.alerts.includes("flash_spike")).map(u => u.userId);

      const trendResults: Record<string, unknown> = {};

      if (sleepAlertUsers.length > 0) {
        trendResults.sleep = await sendPush(
          sleepAlertUsers,
          "🌙 Alerta de Sono",
          "Você dormiu menos de 6h nas últimas 3 noites. Tente um chá de camomila antes de dormir e evite telas 1h antes de deitar.",
          "/"
        );
      }

      if (flashAlertUsers.length > 0) {
        trendResults.flashes = await sendPush(
          flashAlertUsers,
          "🔥 Ondas de Calor em Alta",
          "Suas ondas de calor aumentaram 50%+ esta semana. Considere reduzir cafeína e alimentos picantes, e converse com seu médico.",
          "/"
        );
      }

      results.trend_alerts = trendResults;
    }
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Engagement error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
