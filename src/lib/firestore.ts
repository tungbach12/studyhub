import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDb } from './firebase';
import type { Member, Subject, Task, Group } from '../types';

function assertDb() {
  const db = getDb();
  if (!db) throw new Error('Firebase not configured');
  return db;
}

// ─── Groups ───

export function subscribeGroups(onData: (items: Group[]) => void): Unsubscribe | null {
  const db = getDb();
  if (!db) return null;
  return onSnapshot(collection(db, 'groups'), snap => {
    const list: Group[] = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() } as Group));
    onData(list);
  });
}

export async function setGroup(group: Group) {
  const db = assertDb();
  await setDoc(doc(db, 'groups', group.id), { name: group.name, createdAt: group.createdAt });
}

export async function removeGroup(id: string) {
  const db = assertDb();
  await deleteDoc(doc(db, 'groups', id));
}

// ─── Subscribe helpers (filtered by groupId) ───

export function subscribeMembers(groupId: string, onData: (items: Member[]) => void): Unsubscribe | null {
  const db = getDb();
  if (!db || !groupId) return null;
  const q = query(collection(db, 'members'), where('groupId', '==', groupId));
  return onSnapshot(q, snap => {
    const list: Member[] = [];
    snap.forEach(d => {
      const m = { id: d.id, ...d.data() } as Member;
      if (!m.schedule || m.schedule.length < 63) {
        m.schedule = Array.from({ length: 63 }, (_, i) => m.schedule?.[i] ?? true);
      }
      list.push(m);
    });
    onData(list);
  });
}

export function subscribeSubjects(groupId: string, onData: (items: Subject[]) => void): Unsubscribe | null {
  const db = getDb();
  if (!db || !groupId) return null;
  const q = query(collection(db, 'subjects'), where('groupId', '==', groupId));
  return onSnapshot(q, snap => {
    const list: Subject[] = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() } as Subject));
    onData(list);
  });
}

export function subscribeTasks(groupId: string, onData: (items: Task[]) => void): Unsubscribe | null {
  const db = getDb();
  if (!db || !groupId) return null;
  const q = query(collection(db, 'tasks'), where('groupId', '==', groupId));
  return onSnapshot(q, snap => {
    const list: Task[] = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() } as Task));
    onData(list);
  });
}

// ─── Mutations ───

export async function setMember(member: Member) {
  const db = assertDb();
  const clean = {
    ...member,
    schedule: member.schedule?.length === 63 ? member.schedule : Array.from({ length: 63 }, (_, i) => member.schedule?.[i] ?? true),
  };
  await setDoc(doc(db, 'members', member.id), clean);
}

export async function removeMember(id: string) {
  const db = assertDb();
  await deleteDoc(doc(db, 'members', id));
}

export async function setSubject(subject: Subject) {
  const db = assertDb();
  await setDoc(doc(db, 'subjects', subject.id), { name: subject.name, color: subject.color, groupId: subject.groupId });
}

export async function removeSubject(id: string) {
  const db = assertDb();
  await deleteDoc(doc(db, 'subjects', id));
}

export async function setTask(task: Task) {
  const db = assertDb();
  await setDoc(doc(db, 'tasks', task.id), {
    subjectId: task.subjectId,
    title: task.title,
    description: task.description,
    status: task.status,
    assigneeId: task.assigneeId,
    deadline: task.deadline,
    createdAt: task.createdAt,
    groupId: task.groupId,
  });
}

export async function removeTask(id: string) {
  const db = assertDb();
  await deleteDoc(doc(db, 'tasks', id));
}
