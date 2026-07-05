import React, { useState } from "react";
import { PlusCircle, CalendarSync } from "lucide-react";
import CreateTaskModal from "./CreateTaskModal";
import RescheduleSessionModal from "./RescheduleSessionModal";

export default function MentorQuickActions() {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);

  return (
    <section 
      aria-labelledby="quick-actions-heading" 
      className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 w-full max-w-3xl"
    >
      <header className="mb-6">
        <h2 id="quick-actions-heading" className="text-xl font-bold text-slate-900 dark:text-white">
          Mentor Quick Actions
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Streamline your mentorship workflow by assigning tasks or managing upcoming sessions.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Create Task Button */}
        <button
          onClick={() => setIsTaskModalOpen(true)}
          className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-900/20 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          aria-label="Open Create Task modal"
        >
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-200">
              <PlusCircle size={20} aria-hidden="true" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Create Task</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Assign homework to students</p>
            </div>
          </div>
        </button>

        {/* Reschedule Session Button */}
        <button
          onClick={() => setIsRescheduleModalOpen(true)}
          className="group flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-900/20 hover:border-rose-200 dark:hover:border-rose-500/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          aria-label="Open Reschedule Session modal"
        >
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-700 shadow-sm text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform duration-200">
              <CalendarSync size={20} aria-hidden="true" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Reschedule Session</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Modify an upcoming class</p>
            </div>
          </div>
        </button>
      </div>

      {/* Modals */}
      {isTaskModalOpen && (
        <CreateTaskModal onClose={() => setIsTaskModalOpen(false)} />
      )}
      {isRescheduleModalOpen && (
        <RescheduleSessionModal onClose={() => setIsRescheduleModalOpen(false)} />
      )}
    </section>
  );
}
