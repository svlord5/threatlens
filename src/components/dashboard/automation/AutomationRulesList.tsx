"use client";

import { useState } from "react";
import { Plus, Power, Trash2, Cpu, Zap, Target } from "lucide-react";
import { AddRuleModal } from "./AddRuleModal";
import { toggleRuleStatus, deleteRule } from "@/app/actions/automation";

export function AutomationRulesList({ initialRules }: { initialRules: any[] }) {
  const [rules, setRules] = useState(initialRules);
  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingToggles, setPendingToggles] = useState<Record<string, boolean>>({});

  const handleToggle = async (rule: any) => {
    setPendingToggles(prev => ({ ...prev, [rule.id]: true }));
    const result = await toggleRuleStatus(rule.id, rule.is_active);
    if (result.success) {
      setRules(rules.map(r => r.id === rule.id ? { ...r, is_active: !r.is_active } : r));
    }
    setPendingToggles(prev => ({ ...prev, [rule.id]: false }));
  };

  const handleDelete = async (id: string) => {
    const result = await deleteRule(id);
    if (result.success) {
      setRules(rules.filter(r => r.id !== id));
    }
  };

  const getActionColor = (action: string) => {
    switch(action) {
      case 'isolate_host': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'create_case': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default: return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-foreground tracking-wide">Active Playbooks</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-foreground font-bold rounded shadow-[0_0_15px_rgba(225,29,72,0.5)] transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Rule
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rules.map((rule) => (
          <div key={rule.id} className={`bg-[#020202] border ${rule.is_active ? 'border-rose-500/30' : 'border-white/5'} p-6 rounded-lg flex flex-col justify-between group hover:border-rose-500/50 hover:bg-rose-950/10 transition-all shadow-xl relative overflow-hidden`}>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`p-2 border ${rule.is_active ? 'border-rose-500/30 text-rose-400' : 'border-border text-muted-foreground'} bg-background/50 rounded`}>
                    <Cpu className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-mono font-bold uppercase px-2 py-1 rounded border ${rule.is_active ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-border text-muted-foreground bg-muted'}`}>
                    {rule.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <button onClick={() => handleDelete(rule.id)} className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-lg font-bold text-foreground mb-1">{rule.name}</h3>
              <p className="text-xs text-muted-foreground mb-6">{rule.description}</p>

              <div className="bg-background/40 border border-white/5 rounded p-3 mb-4 font-mono text-[11px]">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Target className="w-3.5 h-3.5" /> IF <span className="text-foreground font-bold">{rule.target_field}</span> CONTAINS
                </div>
                <div className="bg-muted px-2 py-1 rounded text-emerald-400 border border-border overflow-hidden text-ellipsis">
                  &quot;{rule.match_pattern}&quot;
                </div>
              </div>

              <div className="flex items-center gap-2 mb-6 text-[11px] font-mono font-bold uppercase">
                <Zap className="w-3.5 h-3.5 text-muted-foreground" /> THEN: 
                <span className={`px-2 py-1 rounded border ${getActionColor(rule.action_type)}`}>
                  {rule.action_type.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 relative z-10">
              <button 
                onClick={() => handleToggle(rule)}
                disabled={pendingToggles[rule.id]}
                className={`w-full flex items-center justify-center gap-2 py-2 border rounded transition-all bg-background/50 ${rule.is_active ? 'border-white/5 text-muted-foreground hover:text-red-400 hover:border-red-500/30' : 'border-white/5 text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500/30'} font-mono text-xs uppercase tracking-widest font-bold disabled:opacity-50`}
              >
                <Power className="w-3.5 h-3.5" />
                {rule.is_active ? 'Disable Rule' : 'Enable Rule'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <AddRuleModal 
          onClose={() => setShowAddModal(false)} 
          onRuleAdded={(rule) => setRules([rule, ...rules])} 
        />
      )}
    </>
  );
}
