"use client";

import { FormEvent, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { useFocusTodoStore } from "@/store/useFocusTodoStore";

export function MinimalTodoList({ compact = false }: { compact?: boolean }) {
  const [draft, setDraft] = useState("");
  const tasks = useFocusTodoStore((state) => state.tasks);
  const addTask = useFocusTodoStore((state) => state.addTask);
  const toggleTask = useFocusTodoStore((state) => state.toggleTask);
  const deleteTask = useFocusTodoStore((state) => state.deleteTask);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addTask(draft);
    setDraft("");
  }

  return (
    <section
      aria-labelledby={compact ? "dashboard-todo-title" : "focus-todo-title"}
      className="glass-panel rounded-2xl border border-white/60 bg-white/60 p-5 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03]"
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3
            id={compact ? "dashboard-todo-title" : "focus-todo-title"}
            className="text-lg font-black text-text-main dark:text-white"
          >
            To-Do List
          </h3>
          <p className="mt-0.5 text-xs font-medium text-text-muted dark:text-slate-400">
            Session tasks stay synced while this dashboard is open.
          </p>
        </div>
        <span className="rounded-full bg-[#7C3AED]/10 px-2.5 py-1 text-xs font-bold text-[#7C3AED]">
          {tasks.filter((task) => !task.completed).length} open
        </span>
      </header>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a task..."
          aria-label="Add a focus task"
          className="min-h-[44px] flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
        />
        <button
          type="submit"
          aria-label="Add task"
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-[#7C3AED] text-white transition-colors hover:bg-purple-700"
        >
          <Plus size={18} aria-hidden="true" />
        </button>
      </form>

      <div className={compact ? "mt-4 max-h-48 space-y-2 overflow-y-auto" : "mt-4 space-y-2"}>
        {tasks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-text-muted dark:border-white/10 dark:text-slate-400">
            Add one small task to begin.
          </p>
        ) : (
          tasks.map((task) => (
            <article
              key={task.id}
              className="flex min-h-[44px] items-center gap-3 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]"
            >
              <button
                type="button"
                onClick={() => toggleTask(task.id)}
                aria-label={task.completed ? `Mark ${task.text} incomplete` : `Complete ${task.text}`}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                  task.completed
                    ? "border-[#7C3AED] bg-[#7C3AED] text-white"
                    : "border-slate-300 text-transparent hover:border-[#7C3AED] dark:border-white/20"
                }`}
              >
                <Check size={14} aria-hidden="true" />
              </button>
              <p
                className={`min-w-0 flex-1 truncate text-sm font-medium ${
                  task.completed
                    ? "text-muted-foreground line-through"
                    : "text-text-main dark:text-white"
                }`}
              >
                {task.text}
              </p>
              <button
                type="button"
                onClick={() => deleteTask(task.id)}
                aria-label={`Delete ${task.text}`}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
