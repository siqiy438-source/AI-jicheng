import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const nowIso = new Date().toISOString();

    const { data: expiredWorks, error: worksError } = await supabase
      .from("works")
      .select("id, storage_bucket, storage_path")
      .lt("expires_at", nowIso)
      .limit(1000);

    if (worksError) {
      throw worksError;
    }

    const { data: expiredMaterials, error: materialsError } = await supabase
      .from("materials")
      .select("id, storage_bucket, storage_path")
      .lt("expires_at", nowIso)
      .limit(2000);

    if (materialsError) {
      throw materialsError;
    }

    const worksToDelete = expiredWorks || [];
    const materialsToDelete = expiredMaterials || [];

    const worksStorageMap = new Map<string, string[]>();
    worksToDelete.forEach((row) => {
      if (!row.storage_bucket || !row.storage_path) return;
      const list = worksStorageMap.get(row.storage_bucket) || [];
      list.push(row.storage_path);
      worksStorageMap.set(row.storage_bucket, list);
    });

    const materialsStorageMap = new Map<string, string[]>();
    materialsToDelete.forEach((row) => {
      if (!row.storage_bucket || !row.storage_path) return;
      const list = materialsStorageMap.get(row.storage_bucket) || [];
      list.push(row.storage_path);
      materialsStorageMap.set(row.storage_bucket, list);
    });

    for (const [bucket, paths] of worksStorageMap.entries()) {
      if (paths.length > 0) {
        await supabase.storage.from(bucket).remove(paths);
      }
    }

    for (const [bucket, paths] of materialsStorageMap.entries()) {
      if (paths.length > 0) {
        await supabase.storage.from(bucket).remove(paths);
      }
    }

    if (worksToDelete.length > 0) {
      const { error } = await supabase
        .from("works")
        .delete()
        .in(
          "id",
          worksToDelete.map((row) => row.id)
        );

      if (error) {
        throw error;
      }
    }

    if (materialsToDelete.length > 0) {
      const { error } = await supabase
        .from("materials")
        .delete()
        .in(
          "id",
          materialsToDelete.map((row) => row.id)
        );

      if (error) {
        throw error;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        deletedWorks: worksToDelete.length,
        deletedMaterials: materialsToDelete.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
