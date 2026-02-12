import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  user_id?: string;
  user_ids?: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const fcmKey = Deno.env.get("FCM_SERVER_KEY");
    if (!fcmKey) {
      return new Response(
        JSON.stringify({ error: "FCM_SERVER_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const payload: PushPayload = await req.json();
    const { title, body, data } = payload;

    if (!title || !body) {
      return new Response(
        JSON.stringify({ error: "title and body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine target user IDs
    const targetIds = payload.user_ids || (payload.user_id ? [payload.user_id] : []);
    if (targetIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "user_id or user_ids required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch tokens from database
    const tokenQuery = targetIds.map(id => `"${id}"`).join(',');
    const dbResponse = await fetch(
      `${supabaseUrl}/rest/v1/push_tokens?user_id=in.(${tokenQuery})&select=token,platform`,
      {
        headers: {
          "apikey": serviceRoleKey,
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
      }
    );

    const tokens: { token: string; platform: string }[] = await dbResponse.json();

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No tokens found for users" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send to all tokens via FCM HTTP v1 (legacy API)
    const results = await Promise.allSettled(
      tokens.map(async ({ token }) => {
        const fcmResponse = await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `key=${fcmKey}`,
          },
          body: JSON.stringify({
            to: token,
            notification: {
              title,
              body,
              icon: "/icon.png",
              click_action: data?.route || "/",
            },
            data: data || {},
          }),
        });
        return fcmResponse.json();
      })
    );

    const sent = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected").length;

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent, 
        failed, 
        total_tokens: tokens.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending push:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
