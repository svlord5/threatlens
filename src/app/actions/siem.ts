"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { blockInDemo } from "@/lib/action-guard";

export async function exportSiemLogs() {
  try {
    const supabase = await createClient();
    
    // Fetch all logs (in a real scenario you might chunk this or export to a CSV file)
    const { data, error } = await supabase
      .from("endpoint_logs")
      .select("*")
      .order("timestamp", { ascending: false });

    if (error) throw error;
    
    return { success: true, data };
  } catch (error: any) {
    console.error("Failed to export SIEM logs:", error);
    return { success: false, error: error.message };
  }
}

export async function resetSiemLogs() {
  const demo = await blockInDemo();
  if (demo) return { success: false, error: demo };
  try {
    const supabase = await createClient();
    
    // Delete all logs using a dummy condition since Supabase might require a condition for deletes
    // Alternatively, if you have no filter, you can match everything by checking a column
    const { error } = await supabase
      .from("endpoint_logs")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Deletes all rows

    if (error) throw error;
    
    revalidatePath("/dashboard/siem");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to reset SIEM logs:", error);
    return { success: false, error: error.message };
  }
}
