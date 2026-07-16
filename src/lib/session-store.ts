import { useSyncExternalStore } from "react";

export type Todo = {
  id: string;
  text: string;
  project?: string;
  source: "email" | "manual";
  done: boolean;
  createdAt: number;
};

export type FollowUp = {
  id: string;
  project: string;
  recipient: string;
  originalSubject: string;
  dueAt: number; // ms epoch
  type: "email" | "meeting";
  note?: string;
  done: boolean;
};

type State = { todos: Todo[]; followUps: FollowUp[] };

const KEY = "wfai:store:v1";
const isBrowser = typeof window !== "undefined";

let state: State = { todos: [], followUps: [] };
if (isBrowser) {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) state = JSON.parse(raw) as State;
  } catch {}
}

const listeners = new Set<() => void>();
function emit() {
  if (isBrowser) {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const store = {
  getState: () => state,
  addTodos(items: Array<Omit<Todo, "id" | "done" | "createdAt">>) {
    const now = Date.now();
    const existing = new Set(state.todos.map((t) => t.text.toLowerCase().trim()));
    const fresh = items
      .filter((t) => t.text.trim() && !existing.has(t.text.toLowerCase().trim()))
      .map<Todo>((t) => ({ ...t, id: uid(), done: false, createdAt: now }));
    if (!fresh.length) return 0;
    state = { ...state, todos: [...state.todos, ...fresh] };
    emit();
    return fresh.length;
  },
  addTodo(text: string) {
    return store.addTodos([{ text, source: "manual" }]);
  },
  toggleTodo(id: string) {
    state = { ...state, todos: state.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) };
    emit();
  },
  removeTodo(id: string) {
    state = { ...state, todos: state.todos.filter((t) => t.id !== id) };
    emit();
  },
  addFollowUp(f: Omit<FollowUp, "id" | "done">) {
    const item: FollowUp = { ...f, id: uid(), done: false };
    state = { ...state, followUps: [...state.followUps, item] };
    emit();
    return item;
  },
  toggleFollowUp(id: string) {
    state = {
      ...state,
      followUps: state.followUps.map((f) => (f.id === id ? { ...f, done: !f.done } : f)),
    };
    emit();
  },
  removeFollowUp(id: string) {
    state = { ...state, followUps: state.followUps.filter((f) => f.id !== id) };
    emit();
  },
};

const serverSnap: State = { todos: [], followUps: [] };
export function useStore() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => serverSnap,
  );
}
