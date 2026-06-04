import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { getDb, hasFirebaseConfig } from './firebase';
import type { Member, Subject, Task } from '../types';

function assertDb() {
  const db = getDb();
  if (!db) throw new Error('Firebase not configured');
  return db;
}

// ─── Subscribe helpers ───

export function subscribeMembers(onData: (items: Member[]) => void): Unsubscribe | null {
  const db = getDb();
  if (!db) return null;
  return onSnapshot(collection(db, 'members'), snap => {
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

export function subscribeSubjects(onData: (items: Subject[]) => void): Unsubscribe | null {
  const db = getDb();
  if (!db) return null;
  return onSnapshot(collection(db, 'subjects'), snap => {
    const list: Subject[] = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() } as Subject));
    onData(list);
  });
}

export function subscribeTasks(onData: (items: Task[]) => void): Unsubscribe | null {
  const db = getDb();
  if (!db) return null;
  return onSnapshot(collection(db, 'tasks'), snap => {
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
  await setDoc(doc(db, 'subjects', subject.id), subject);
}

export async function removeSubject(id: string) {
  const db = assertDb();
  await deleteDoc(doc(db, 'subjects', id));
}

export async function setTask(task: Task) {
  const db = assertDb();
  await setDoc(doc(db, 'tasks', task.id), task);
}

export async function updateTaskField(id: string, patch: Partial<Task>) {
  const db = assertDb();
  const ref = doc(db, 'tasks', id);
  const { updateDoc } = await import('firebase/firestore');
  await updateDoc(ref, patch);
}

export async function removeTask(id: string) {
  const db = assertDb();
  await deleteDoc(doc(db, 'tasks', id));
}
