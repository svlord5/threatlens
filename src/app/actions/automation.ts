"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { blockInDemo } from "@/lib/action-guard";

export async function createDetectionRule(formData: FormData) {
  const demo = await blockInDemo();
  if (demo) return { success: false, error: demo };
  try {
    const supabase = await createClient();
    
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const target_field = formData.get("target_field") as string;
    const match_pattern = formData.get("match_pattern") as string;
    const action_type = formData.get("action_type") as string;
    const severity = formData.get("severity") as string;

    const { data, error } = await supabase.from('detection_rules').insert({
      name,
      description,
      target_field,
      match_pattern,
      action_type,
      severity,
      is_active: true
    }).select().single();

    if (error) {
      console.error("Failed to create rule:", error);
      return { success: false, error: "Database error." };
    }

    revalidatePath("/dashboard/automation");
    return { success: true, data };
  } catch (err) {
    console.error("Create rule error:", err);
    return { success: false, error: "Server error." };
  }
}

export async function toggleRuleStatus(id: string, currentStatus: boolean) {
  const demo = await blockInDemo();
  if (demo) return { success: false, error: demo };
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('detection_rules').update({ is_active: !currentStatus }).eq('id', id);
    
    if (error) return { success: false, error: "Database error." };
    
    revalidatePath("/dashboard/automation");
    return { success: true };
  } catch (err) {
    return { success: false, error: "Server error." };
  }
}

export async function deleteRule(id: string) {
  const demo = await blockInDemo();
  if (demo) return { success: false, error: demo };
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('detection_rules').delete().eq('id', id);
    
    if (error) return { success: false, error: "Database error." };
    
    revalidatePath("/dashboard/automation");
    return { success: true };
  } catch (err) {
    return { success: false, error: "Server error." };
  }
}

export async function savePlaybook(name: string, description: string, nodes: any[], edges: any[], id?: string) {
  const demo = await blockInDemo();
  if (demo) return { success: false, error: demo };
  if (String(name ?? "").length > 200 || String(description ?? "").length > 2000 || (nodes?.length ?? 0) > 300 || (edges?.length ?? 0) > 600) {
    return { success: false, error: "Playbook is too large (200-char name, 300 nodes, 600 edges)." };
  }
  try {
    const supabase = await createClient();
    
    let data, error;

    if (id) {
      // Update existing playbook
      const res = await supabase.from('soar_playbooks').update({
        name,
        description,
        nodes,
        edges,
        updated_at: new Date().toISOString()
      }).eq('id', id).select().single();
      data = res.data;
      error = res.error;
    } else {
      // Insert new playbook
      const res = await supabase.from('soar_playbooks').insert({
        name,
        description,
        nodes,
        edges,
        is_active: false
      }).select().single();
      data = res.data;
      error = res.error;
    }

    if (error) {
      console.error("Failed to save playbook:", error);
      return { success: false, error: "Database error: " + error.message };
    }

    revalidatePath("/dashboard/automation/playbooks");
    revalidatePath("/dashboard/automation/playbooks/list");
    return { success: true, data };
  } catch (err: any) {
    console.error("Save playbook error:", err);
    return { success: false, error: err.message || "Server error." };
  }
}
