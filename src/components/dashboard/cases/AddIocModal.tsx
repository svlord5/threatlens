"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { linkIocToCase } from "@/app/actions";

export function AddIocModal({ caseId }: { caseId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [value, setValue] = useState("");
  const [type, setType] = useState("domain");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const res = await linkIocToCase(caseId, value, type);
    if (res.success) {
      setIsOpen(false);
      setValue("");
    } else {
      setError(res.error || "Failed to link IOC");
    }
    setIsLoading(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-md transition-colors font-medium"
      >
        <Plus className="w-3.5 h-3.5" />
        Add IOC
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-foreground">Link Indicator to Case</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm text-muted-foreground mb-1">Indicator Value</label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="e.g. malicious-domain.com or 1.1.1.1"
                  className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1">Indicator Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="domain">Domain</option>
                  <option value="ip">IP Address</option>
                  <option value="url">URL</option>
                  <option value="hash">File Hash</option>
                  <option value="email">Email</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-foreground text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Link to Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
