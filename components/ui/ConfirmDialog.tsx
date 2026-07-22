"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, X } from "lucide-react";

export interface ConfirmDialogOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface ConfirmDialogProps extends ConfirmDialogOptions {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

type RequestConfirmation = (options: ConfirmDialogOptions) => Promise<boolean>;

const ConfirmDialogContext = createContext<RequestConfirmation | null>(null);

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/15 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40"
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close confirmation dialog"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X size={16} aria-hidden="true" />
        </button>

        <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          <AlertTriangle size={20} aria-hidden="true" />
        </div>
        <h2 id={titleId} className="pr-8 text-lg font-bold tracking-tight text-slate-950 dark:text-white">
          {title}
        </h2>
        <p id={descriptionId} className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {description}
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-red-950/20 transition-all hover:bg-red-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [dialogOptions, setDialogOptions] = useState<ConfirmDialogOptions | null>(null);
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null);

  const resolveDialog = useCallback((confirmed: boolean) => {
    resolverRef.current?.(confirmed);
    resolverRef.current = null;
    setDialogOptions(null);
  }, []);

  const requestConfirmation = useCallback<RequestConfirmation>((options) => {
    resolverRef.current?.(false);
    setDialogOptions(options);

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  useEffect(
    () => () => {
      resolverRef.current?.(false);
    },
    []
  );

  return (
    <ConfirmDialogContext.Provider value={requestConfirmation}>
      {children}
      <ConfirmDialog
        open={dialogOptions !== null}
        title={dialogOptions?.title || "Confirm action"}
        description={dialogOptions?.description || "Please confirm this action."}
        confirmLabel={dialogOptions?.confirmLabel}
        cancelLabel={dialogOptions?.cancelLabel}
        onCancel={() => resolveDialog(false)}
        onConfirm={() => resolveDialog(true)}
      />
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog(): RequestConfirmation {
  const context = useContext(ConfirmDialogContext);

  if (!context) {
    throw new Error("useConfirmDialog must be used within ConfirmDialogProvider.");
  }

  return context;
}
