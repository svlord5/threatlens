"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Paperclip, Send, Loader2 } from "lucide-react";
import { addCaseNote } from "@/app/actions";
import { formatDistanceToNow } from "date-fns";
import { createClient } from "@/utils/supabase/client";

export function CaseDocs({ caseId, initialNotes }: { caseId: string, initialNotes: any[] }) {
  const [notes, setNotes] = useState(initialNotes || []);
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel(`case_notes_${caseId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "case_note", filter: `case_id=eq.${caseId}` },
        (payload) => {
          setNotes((prev) => {
            // Prevent duplicate if optimistic UI already added it
            if (prev.some((n) => n.id === payload.new.id)) return prev;
            return [payload.new, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [caseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsSubmitting(true);
    const res = await addCaseNote(caseId, newNote);
    if (res.success) {
      // Optimistically append the note so we don't have to wait for the server refresh
      setNotes([{
        id: res.id,
        content: newNote.trim(),
        author: "Analyst 1",
        created_at: new Date().toISOString()
      }, ...notes]);
      setNewNote("");
    } else {
      alert("Failed to add note. Ensure you have run the SQL script to create the case_note table!");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="bg-card border border-border p-6 rounded-md space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium flex items-center gap-2 text-foreground uppercase tracking-wider">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          Docs / Analyst Notes
        </h2>
        <span className="text-xs text-muted-foreground">{notes.length} items</span>
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a new note, finding, or link to a doc..."
          className="w-full bg-muted border border-border rounded-md p-3 pb-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border focus:ring-1 focus:ring-white/20 transition-all min-h-[100px] resize-y"
        />
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
          <button type="button" className="text-muted-foreground hover:text-foreground transition-colors" title="File attachments coming soon">
            <Paperclip className="w-4 h-4" />
          </button>
          <button 
            type="submit"
            disabled={!newNote.trim() || isSubmitting}
            className="flex items-center gap-2 px-3 py-1.5 text-xs bg-white text-black font-medium rounded hover:bg-zinc-200 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Post Note
          </button>
        </div>
      </form>

      {/* Notes List */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {notes.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-4 border border-dashed border-border rounded-md">
            No notes or docs added yet.
          </p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="bg-muted border border-white/5 rounded-md p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{note.author}</span>
                <span className="text-muted-foreground">
                  {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
