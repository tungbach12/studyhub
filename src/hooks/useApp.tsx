import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { Member, Subject, Task, Tab, Group } from '../types';
import { loadState, saveState, seedData } from '../lib/store';
import { hasFirebaseConfig } from '../lib/firebase';
import {
  subscribeGroups as fbSubscribeGroups,
  subscribeMembers as fbSubscribeMembers,
  subscribeSubjects as fbSubscribeSubjects,
  subscribeTasks as fbSubscribeTasks,
  setGroup as fbSetGroup,
  setMember as fbSetMember,
  removeMember as fbRemoveMember,
  setSubject as fbSetSubject,
  removeSubject as fbRemoveSubject,
  setTask as fbSetTask,
  removeTask as fbRemoveTask,
} from '../lib/firestore';

const STORAGE_KEY = 'group-study-app-v1';

type State = { groups: Group[]; members: Member[]; subjects: Subject[]; tasks: Task[] };

type Ctx = State & {
  tab: Tab;
  setTab: (t: Tab) => void;
  currentGroupId: string;
  setCurrentGroupId: (id: string) => void;
  addGroup: (name: string) => void;
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

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp outside provider');
  return ctx;
}

const genId = (): string =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const fbMode = hasFirebaseConfig();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentGroupId, setCurrentGroupId] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [online, setOnline] = useState(false);
  const [fbReady, setFbReady] = useState(false);

  // ─── Firestore groups subscription ───
  useEffect(() => {
    if (!fbMode) {
      const local = loadState<Partial<State> | null>(STORAGE_KEY, null);
      const gs = local?.groups?.length ? local.groups : [{ id: 'default', name: 'Nhóm 1', createdAt: new Date().toISOString() }];
      setGroups(gs);
      setCurrentGroupId(gs[0].id);
      setMembers(local?.members?.length ? local.members : seedData.members.map(m => ({ ...m, groupId: gs[0].id })));
      setSubjects(local?.subjects?.length ? local.subjects : seedData.subjects.map(s => ({ ...s, groupId: gs[0].id })));
      setTasks(local?.tasks ?? []);
      setOnline(false);
      return;
    }

    const unsubGroups = fbSubscribeGroups(list => {
      setGroups(list);
      if (list.length > 0) {
        setCurrentGroupId(prev => prev || list[0].id);
        setFbReady(true);
      } else {
        // auto-create first group
        const g: Group = { id: genId(), name: 'Nhóm 1', createdAt: new Date().toISOString() };
        fbSetGroup(g);
      }
    });

    return () => { unsubGroups?.(); };
  }, [fbMode]);

  // ─── Firestore data subscriptions (per group) ───
  useEffect(() => {
    if (!fbMode || !currentGroupId) return;
    setOnline(true);

    const unsubs: (() => void)[] = [];

    const sub1 = fbSubscribeMembers(currentGroupId, list => { setMembers(list); });
    const sub2 = fbSubscribeSubjects(currentGroupId, list => { setSubjects(list); });
    const sub3 = fbSubscribeTasks(currentGroupId, list => { setTasks(list); });

    if (sub1) unsubs.push(sub1);
    if (sub2) unsubs.push(sub2);
    if (sub3) unsubs.push(sub3);

    return () => unsubs.forEach(u => u());
  }, [fbMode, currentGroupId]);

  // ─── Persist helper (local mode only) ───
  const persist = useCallback(() => {
    if (fbMode) return;
    saveState(STORAGE_KEY, { groups, members, subjects, tasks });
  }, [fbMode, groups, members, subjects, tasks]);

  // ─── Group ───
  const addGroup = useCallback((name: string) => {
    const g: Group = { id: genId(), name, createdAt: new Date().toISOString() };
    if (fbMode) { fbSetGroup(g); return; }
    setGroups(prev => [...prev, g]);
    setCurrentGroupId(g.id);
    persist();
  }, [fbMode, persist]);

  // ─── Member mutations ───
  const addMember = useCallback((name: string) => {
    if (!currentGroupId) return;
    const m: Member = { id: genId(), name, groupId: currentGroupId, schedule: Array.from({ length: 63 }, () => true) };
    if (fbMode) { fbSetMember(m); return; }
    setMembers(prev => [...prev, m]);
    persist();
  }, [currentGroupId, fbMode, persist]);

  const updateMember = useCallback((id: string, patch: Partial<Member>) => {
    if (fbMode) {
      const existing = members.find(m => m.id === id);
      if (existing) fbSetMember({ ...existing, ...patch });
      return;
    }
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
    persist();
  }, [members, fbMode, persist]);

  const removeMember = useCallback((id: string) => {
    if (fbMode) { fbRemoveMember(id); return; }
    setMembers(prev => prev.filter(m => m.id !== id));
    persist();
  }, [fbMode, persist]);

  // ─── Subject mutations ───
  const addSubject = useCallback((name: string, color: string) => {
    if (!currentGroupId) return;
    const s: Subject = { id: genId(), name, color, groupId: currentGroupId };
    if (fbMode) { fbSetSubject(s); return; }
    setSubjects(prev => [...prev, s]);
    persist();
  }, [currentGroupId, fbMode, persist]);

  const updateSubject = useCallback((id: string, patch: Partial<Subject>) => {
    if (fbMode) {
      const existing = subjects.find(s => s.id === id);
      if (existing) fbSetSubject({ ...existing, ...patch });
      return;
    }
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
    persist();
  }, [subjects, fbMode, persist]);

  const removeSubject = useCallback((id: string) => {
    if (fbMode) { fbRemoveSubject(id); return; }
    setSubjects(prev => prev.filter(s => s.id !== id));
    persist();
  }, [fbMode, persist]);

  // ─── Task mutations ───
  const addTask = useCallback((t: Omit<Task, 'id'>) => {
    if (!currentGroupId) return;
    const task: Task = { ...t, groupId: currentGroupId, id: genId() };
    if (fbMode) { fbSetTask(task); return; }
    setTasks(prev => [...prev, task]);
    persist();
  }, [currentGroupId, fbMode, persist]);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    if (fbMode) {
      const existing = tasks.find(t => t.id === id);
      if (existing) fbSetTask({ ...existing, ...patch });
      return;
    }
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
    persist();
  }, [tasks, fbMode, persist]);

  const removeTask = useCallback((id: string) => {
    if (fbMode) { fbRemoveTask(id); return; }
    setTasks(prev => prev.filter(t => t.id !== id));
    persist();
  }, [fbMode, persist]);

  const value: Ctx = {
    groups, members, subjects, tasks,
    tab, setTab,
    currentGroupId, setCurrentGroupId, addGroup,
    addMember, updateMember, removeMember,
    addSubject, updateSubject, removeSubject,
    addTask, updateTask, removeTask,
    online,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
