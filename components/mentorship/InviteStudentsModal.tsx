/**
 * InviteStudentsModal
 *
 * Allows a Mentor to invite up to 4 Students into an active session room.
 * - Shows room capacity badge (e.g. "2 / 4 Students in Room")
 * - Lists all connected Students with their profile pictures (UserAvatar)
 * - Disables invite when room is full
 * - Shows loading spinners and graceful error states
 * - Fully compatible with Tailwind CSS light/dark mode
 * - Accessible: aria-modal, role="dialog", focus trap
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Users, X, UserPlus, CheckCircle } from "lucide-react";
import { UserAvatar } from "@/components/mentorship/UserAvatar";

const MAX_STUDENTS = 4;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConnectedStudent {
  id: string;
  name: string;
  email: string;
  image: string;
  initials: string;
  lastActive: string | null;
}

interface InviteStudentsModalProps {
  /** Whether the modal is open. */
  isOpen: boolean;
  /** Session ID used to call the invite-student API. */
  sessionId: string;
  /** IDs of Students already in the room (for capacity display + disabling). */
  currentStudentIds: string[];
  /** Called when the modal should close. */
  onClose: () => void;
  /** Called after a Student is successfully invited, so the parent can refresh state. */
  onStudentInvited?: (studentId: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function InviteStudentsModal({
  isOpen,
  sessionId,
  currentStudentIds,
  onClose,
  onStudentInvited,
}: InviteStudentsModalProps) {
  const [students, setStudents] = useState<ConnectedStudent[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(
    () => new Set(currentStudentIds)
  );

  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Sync invited IDs when prop changes
  useEffect(() => {
    setInvitedIds(new Set(currentStudentIds));
  }, [currentStudentIds]);

  // Fetch connected Students when modal opens
  const fetchStudents = useCallback(async () => {
    try {
      setIsLoadingStudents(true);
      setStudentsError(null);

      const response = await fetch("/api/mentor/students", {
        cache: "no-store",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load Students.");
      }

      setStudents(Array.isArray(data?.students) ? data.students : []);
    } catch (error) {
      setStudentsError(
        error instanceof Error ? error.message : "Failed to load Students."
      );
    } finally {
      setIsLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      void fetchStudents();
    }
  }, [isOpen, fetchStudents]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Close on overlay click
  function handleOverlayClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === overlayRef.current) onClose();
  }

  // Invite a Student
  async function handleInvite(student: ConnectedStudent) {
    if (invitedIds.size >= MAX_STUDENTS) return;
    if (invitedIds.has(student.id)) return;

    try {
      setInvitingId(student.id);

      const response = await fetch(
        `/api/sessions/${sessionId}/invite-student`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId: student.id }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to invite Student.");
      }

      setInvitedIds((prev) => new Set([...prev, student.id]));
      toast.success(`Invitation sent to ${student.name}.`);
      onStudentInvited?.(student.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to invite Student."
      );
    } finally {
      setInvitingId(null);
    }
  }

  if (!isOpen) return null;

  const occupiedSlots = invitedIds.size;
  const isFull = occupiedSlots >= MAX_STUDENTS;
  const slotsLeft = MAX_STUDENTS - occupiedSlots;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      aria-label="Invite Students to Mentor Session"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-white shadow-2xl dark:border-white/10 dark:bg-[#191121]"
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between border-b border-border p-5 dark:border-white/10">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <UserPlus size={20} className="text-[#7C3AED]" />
              Invite Students
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select a connected Student to invite to this session.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground dark:hover:bg-white/10"
            aria-label="Close invite Students modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Room Capacity Badge ─────────────────────────────────────────── */}
        <div className="border-b border-border px-5 py-3 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">
                Room Capacity
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Capacity dots */}
              <div className="flex gap-1" aria-label={`${occupiedSlots} of ${MAX_STUDENTS} Student slots filled`}>
                {Array.from({ length: MAX_STUDENTS }).map((_, i) => (
                  <span
                    key={i}
                    className={[
                      "h-3 w-3 rounded-full transition-colors",
                      i < occupiedSlots
                        ? "bg-[#7C3AED]"
                        : "bg-slate-200 dark:bg-white/15",
                    ].join(" ")}
                  />
                ))}
              </div>
              <span
                className={[
                  "rounded-full px-2.5 py-0.5 text-xs font-bold",
                  isFull
                    ? "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"
                    : "bg-purple-100 text-[#7C3AED] dark:bg-purple-500/15 dark:text-purple-300",
                ].join(" ")}
              >
                {occupiedSlots} / {MAX_STUDENTS} Students
              </span>
            </div>
          </div>

          {isFull && (
            <p className="mt-2 text-xs font-medium text-red-500 dark:text-red-400">
              Room is full. Remove a Student to invite another.
            </p>
          )}
          {!isFull && (
            <p className="mt-1 text-xs text-muted-foreground">
              {slotsLeft} slot{slotsLeft !== 1 ? "s" : ""} remaining.
            </p>
          )}
        </div>

        {/* ── Student List ────────────────────────────────────────────────── */}
        <div className="max-h-[360px] overflow-y-auto p-3">
          {isLoadingStudents && (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <Loader2 size={28} className="animate-spin text-[#7C3AED]" />
              <p className="text-sm text-muted-foreground">
                Loading your Students…
              </p>
            </div>
          )}

          {!isLoadingStudents && studentsError && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <p className="text-sm font-semibold text-red-500">
                {studentsError}
              </p>
              <button
                onClick={() => void fetchStudents()}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-slate-50 dark:hover:bg-white/10"
              >
                Try again
              </button>
            </div>
          )}

          {!isLoadingStudents && !studentsError && students.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <Users size={36} className="text-muted-foreground/40" />
              <p className="text-sm font-semibold text-muted-foreground">
                No connected Students found
              </p>
              <p className="text-xs text-muted-foreground/70">
                Students appear here after an accepted or completed session.
              </p>
            </div>
          )}

          {!isLoadingStudents && !studentsError && students.length > 0 && (
            <ul className="space-y-2" role="list" aria-label="Connected Students">
              {students.map((student) => {
                const isInvited = invitedIds.has(student.id);
                const isInviting = invitingId === student.id;
                const isDisabled = isFull && !isInvited;

                return (
                  <li
                    key={student.id}
                    className={[
                      "flex items-center gap-3 rounded-xl border p-3 transition-all",
                      isInvited
                        ? "border-purple-200 bg-purple-50/60 dark:border-purple-500/20 dark:bg-purple-500/5"
                        : isDisabled
                        ? "cursor-not-allowed border-border opacity-50 dark:border-white/10"
                        : "border-border hover:border-[#7C3AED]/40 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5",
                    ].join(" ")}
                  >
                    {/* Avatar */}
                    <UserAvatar
                      name={student.name}
                      imageUrl={student.image || null}
                      size="md"
                    />

                    {/* Name + Email */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-foreground">
                        {student.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {student.email || "No email"}
                      </p>
                    </div>

                    {/* Action button */}
                    {isInvited ? (
                      <span className="flex items-center gap-1.5 rounded-lg bg-purple-100 px-3 py-1.5 text-xs font-bold text-[#7C3AED] dark:bg-purple-500/15 dark:text-purple-300">
                        <CheckCircle size={14} />
                        Invited
                      </span>
                    ) : (
                      <button
                        onClick={() => void handleInvite(student)}
                        disabled={isDisabled || isInviting}
                        className="flex min-w-[80px] items-center justify-center gap-1.5 rounded-lg bg-[#7C3AED] px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`Invite ${student.name} to session`}
                      >
                        {isInviting ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <UserPlus size={13} />
                        )}
                        {isInviting ? "Inviting…" : "Invite"}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="border-t border-border px-5 py-3 dark:border-white/10">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-border py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default InviteStudentsModal;
