import React, { useState } from "react";
import { X, Loader2, Clock } from "lucide-react";

interface RescheduleSessionModalProps {
  onClose: () => void;
}

export default function RescheduleSessionModal({ onClose }: RescheduleSessionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    sessionId: "",
    newDate: "",
    newTime: "",
  });

  // Placeholder sessions - In a real app, this would be fetched via API
  const mockSessions = [
    { id: "sess_1", title: "Algebra Review", studentName: "Alice Johnson", date: "2026-07-06", time: "14:00" },
    { id: "sess_2", title: "Physics Q&A", studentName: "Michael Chen", date: "2026-07-07", time: "16:30" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Placeholder for API Call
      // await fetch(`/api/mentor/sessions/${formData.sessionId}/reschedule`, { method: 'PATCH', body: JSON.stringify(formData) })
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Session Rescheduled:", formData);
      onClose();
    } catch (error) {
      console.error("Error rescheduling session", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reschedule-session-title"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-rose-100 dark:bg-rose-900/30 p-2 rounded-lg text-rose-600 dark:text-rose-400">
              <Clock size={20} />
            </div>
            <h2 id="reschedule-session-title" className="text-xl font-semibold text-slate-900 dark:text-white">
              Reschedule Session
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Select Session */}
          <div className="space-y-1.5">
            <label htmlFor="session" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Select Session <span className="text-red-500">*</span>
            </label>
            <select
              id="session"
              required
              value={formData.sessionId}
              onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
            >
              <option value="" disabled>Select an upcoming session...</option>
              {mockSessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.title} with {session.studentName} ({session.date} at {session.time})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* New Date */}
            <div className="space-y-1.5">
              <label htmlFor="newDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                New Date <span className="text-red-500">*</span>
              </label>
              <input
                id="newDate"
                type="date"
                required
                value={formData.newDate}
                onChange={(e) => setFormData({ ...formData, newDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
              />
            </div>

            {/* New Time */}
            <div className="space-y-1.5">
              <label htmlFor="newTime" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                New Time <span className="text-red-500">*</span>
              </label>
              <input
                id="newTime"
                type="time"
                required
                value={formData.newTime}
                onChange={(e) => setFormData({ ...formData, newTime: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !formData.sessionId || !formData.newDate || !formData.newTime}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              Confirm Reschedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
