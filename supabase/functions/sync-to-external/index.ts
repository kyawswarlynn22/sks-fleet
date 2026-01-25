import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const internalClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await internalClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const userId = claimsData.claims.sub;
    const { data: roleData } = await internalClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (roleData?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body for sync options
    const body = await req.json().catch(() => ({}));
    const tables = body.tables || ["cars", "drivers", "routes", "trips", "preorders", "ledger", "energy_logs", "maintenance_logs", "payment_methods"];

    // Create external Supabase client
    const externalUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
    const externalKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_KEY");

    if (!externalUrl || !externalKey) {
      return new Response(JSON.stringify({ error: "External Supabase credentials not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const externalClient = createClient(externalUrl, externalKey);

    // Use service role to read all data
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const results: Record<string, { synced: number; error?: string }> = {};

    for (const table of tables) {
      try {
        // Fetch all data from internal database
        const { data, error: fetchError } = await serviceClient
          .from(table)
          .select("*");

        if (fetchError) {
          results[table] = { synced: 0, error: fetchError.message };
          continue;
        }

        if (!data || data.length === 0) {
          results[table] = { synced: 0 };
          continue;
        }

        // Upsert to external database
        const { error: upsertError } = await externalClient
          .from(table)
          .upsert(data, { onConflict: "id" });

        if (upsertError) {
          results[table] = { synced: 0, error: upsertError.message };
        } else {
          results[table] = { synced: data.length };
        }
      } catch (err) {
        results[table] = { synced: 0, error: String(err) };
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Sync completed",
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
