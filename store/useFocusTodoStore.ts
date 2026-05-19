"use client";

import { create } from "zustand";

export type FocusTodo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
};

type FocusTodoState = {
  tasks: FocusTodo[];
  addTask: (text: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
};

export const useFocusTodoStore = create<FocusTodoState>((set) => ({
  tasks: [],
  addTask: (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    set((state) => ({
      tasks: [
        ...state.tasks,
        {
          id: crypto.randomUUID(),
          text: trimmed,
          completed: false,
          createdAt: Date.now(),
        },
      ],
    }));
  },
  toggleTask: (id) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      ),
    })),
  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    })),
}));
