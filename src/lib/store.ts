const genId = (): string =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);

export const loadState = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (raw != null) return JSON.parse(raw) as T;
  } catch {
    // ignore
  }
  return fallback;
};

export const saveState = <T>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota
  }
};

export const seedData = {
  members: [
    { id: 'm1', name: 'An', schedule: Array.from({ length: 63 }, (_, i) => i < 42 && i % 3 !== 0) },
    { id: 'm2', name: 'Binh', schedule: Array.from({ length: 63 }, (_, i) => i < 36 && i % 3 === 0) },
    { id: 'm3', name: 'Chi', schedule: Array.from({ length: 63 }, (_, i) => i < 48) },
  ] as const,
  subjects: [
    { id: 's1', name: 'Toán rời rạc', color: '#818cf8' },
    { id: 's2', name: 'Lập trình hướng đối tượng', color: '#34d399' },
    { id: 's3', name: 'Cấu trúc máy tính', color: '#fbbf24' },
  ] as const,
  tasks: [] as const,
};
