import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { Member, Subject, Task, Tab } from '../types';
import { loadState, saveState, seedData } from '../lib/store';
import { hasFirebaseConfig } from '../lib/firebase';
import {
  subscribeMembers,
  subscribeSubjects,
  subscribeTasks,
  setMember as fbSetMember,
  removeMember as fbRemoveMember,
  setSubject as fbSetSubject,
  removeSubject as fbRemoveSubject,
  setTask as fbSetTask,
  removeTask as fbRemoveTask,
} from '../lib/firestore';

const STORAGE_KEY = 'group-study-app-v1';

type State = { members: Member[]; subjects: Subject[]; tasks: Task[] };

type Ctx = State & {
  tab: Tab;
  setTab: (t: Tab) => void;
  addMember: (name: string) => void;
  updateMember: (id: string, patch: Partial<Member>) => void;
  removeMember: (id: string) => void;
  addSubject: (name: string, color: string) => void;
  updateSubject: (id: string, patch: Partial<Subject>) => void;
  removeSubject: (id: string) => void;
  addTask: (t: Omit<Task, 'id'>) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  removeTask: (id: string) => void;
  online: boolean;
};

const AppCtx = createContext<Ctx | null>(null);

function initLocalState(): State {
  const raw = loadState<Partial<State> | null>(STORAGE_KEY, null);
  return {
    members: raw?.members?.length ? raw.members : [...seedData.members],
    subjects: raw?.subjects?.length ? raw.subjects : [...seedData.subjects],
    tasks: raw?.tasks ?? [],
  };
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp outside provider');
  return ctx;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const fbMode = hasFirebaseConfig();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [state, setState] = useState<State>(() => fbMode ? { members: [], subjects: [], tasks: [] } : initLocalState());
  const [online, setOnline] = useState(false);

  // ─── Firestore real-time subscribers ───
  useEffect(() => {
    if (!fbMode) return;
    const unsubs: (() => void)[] = [];

    const sub1 = subscribeMembers(list => { setState(prev => ({ ...prev, members: list })); setOnline(true); });
    const sub2 = subscribeSubjects(list => { setState(prev => ({ ...prev, subjects: list })); setOnline(true); });
    const sub3 = subscribeTasks(list => { setState(prev => ({ ...prev, tasks: list })); setOnline(true); });

    if (sub1) unsubs.push(sub1);
    if (sub2) unsubs.push(sub2);
    if (sub3) unsubs.push(sub3);

    return () => unsubs.forEach(u => u());
  }, [fbMode]);

  // ─── Persist helper (local mode only) ───
  const persist = useCallback((patch: Partial<State>) => {
    if (fbMode) return;
    setState(prev => {
      const next = { ...prev, ...patch };
      saveState(STORAGE_KEY, next);
      return next;
    });
  }, [fbMode]);

  // ─── Mutations ───
  const addMember = useCallback((name: string) => {
    const m: Member = { id: crypto.randomUUID(), name, schedule: Array.from({ length: 63 }, () => true) };
    if (fbMode) { fbSetMember(m); return; }
    persist({ members: [...state.members, m] });
  }, [state.members, persist, fbMode]);

  const updateMember = useCallback((id: string, patch: Partial<Member>) => {
    if (fbMode) {
      const existing = state.members.find(m => m.id === id);
      if (existing) fbSetMember({ ...existing, ...patch });
      return;
    }
    persist({ members: state.members.map(m => m.id === id ? { ...m, ...patch } : m) });
  }, [state.members, persist, fbMode]);

  const removeMember = useCallback((id: string) => {
    if (fbMode) { fbRemoveMember(id); return; }
    persist({ members: state.members.filter(m => m.id !== id) });
  }, [state.members, persist, fbMode]);

  const addSubject = useCallback((name: string, color: string) => {
    const s: Subject = { id: crypto.randomUUID(), name, color };
    if (fbMode) { fbSetSubject(s); return; }
    persist({ subjects: [...state.subjects, s] });
  }, [state.subjects, persist, fbMode]);

  const updateSubject = useCallback((id: string, patch: Partial<Subject>) => {
    if (fbMode) {
      const existing = state.subjects.find(s => s.id === id);
      if (existing) fbSetSubject({ ...existing, ...patch });
      return;
    }
    persist({ subjects: state.subjects.map(s => s.id === id ? { ...s, ...patch } : s) });
  }, [state.subjects, persist, fbMode]);

  const removeSubject = useCallback((id: string) => {
    if (fbMode) { fbRemoveSubject(id); return; }
    persist({ subjects: state.subjects.filter(s => s.id !== id) });
  }, [state.subjects, persist, fbMode]);

  const addTask = useCallback((t: Omit<Task, 'id'>) => {
    const task: Task = { ...t, id: crypto.randomUUID() };
    if (fbMode) { fbSetTask(task); return; }
    persist({ tasks: [...state.tasks, task] });
  }, [state.tasks, persist, fbMode]);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    if (fbMode) {
      const existing = state.tasks.find(t => t.id === id);
      if (existing) fbSetTask({ ...existing, ...patch });
      return;
    }
    persist({ tasks: state.tasks.map(t => t.id === id ? { ...t, ...patch } : t) });
  }, [state.tasks, persist, fbMode]);

  const removeTask = useCallback((id: string) => {
    if (fbMode) { fbRemoveTask(id); return; }
    persist({ tasks: state.tasks.filter(t => t.id !== id) });
  }, [state.tasks, persist, fbMode]);

  const value: Ctx = {
    ...state, tab, setTab,
    addMember, updateMember, removeMember,
    addSubject, updateSubject, removeSubject,
    addTask, updateTask, removeTask,
    online,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
