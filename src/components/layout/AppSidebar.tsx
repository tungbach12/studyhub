import { useApp } from '../../hooks/useApp';
import { useState, useRef } from 'react';

const IconHome = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconUsers = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconCal = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconBook = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);
const IconTask = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);
const IconChevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const IconGraduation = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c2 1 6 2 10 0v-5" />
  </svg>
);
const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IconPencil = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
);

const tabs = [
  { id: 'dashboard' as const, label: 'Tổng quan', Icon: IconHome },
  { id: 'members' as const, label: 'Thành viên', Icon: IconUsers },
  { id: 'schedule' as const, label: 'Lịch học', Icon: IconCal },
  { id: 'subjects' as const, label: 'Môn học', Icon: IconBook },
  { id: 'tasks' as const, label: 'Nhiệm vụ', Icon: IconTask },
];

export default function AppSidebar() {
  const { tab, setTab, online, groups, currentGroupId, setCurrentGroupId, addGroup, updateGroup } = useApp();
  const [groupOpen, setGroupOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const fbMode = typeof import.meta !== 'undefined' && import.meta.env.VITE_FIREBASE_PROJECT_ID;

  const handleEdit = (g: typeof groups[0]) => {
    setEditingId(g.id);
    setEditName(g.name);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const saveEdit = (id: string) => {
    const t = editName.trim();
    if (t) updateGroup(id, { name: t });
    setEditingId(null);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand"><IconGraduation /> <span>StudyHub</span></div>

      <div className="sidebar-group">
        <button className="sidebar-group-btn" onClick={() => setGroupOpen(!groupOpen)} type="button">
          <span className="sidebar-group-label">{groups.find(g => g.id === currentGroupId)?.name ?? 'Chọn nhóm'}</span>
          <IconChevronDown />
        </button>
        {groupOpen && (
          <div className="sidebar-group-dropdown">
            {groups.map(g => (
              <div key={g.id} className={`sidebar-group-item ${g.id === currentGroupId ? 'active' : ''}`}>
                {editingId === g.id ? (
                  <input
                    ref={inputRef}
                    className="sidebar-group-inline-input"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onBlur={() => saveEdit(g.id)}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(g.id); if (e.key === 'Escape') setEditingId(null); }}
                  />
                ) : (
                  <>
                    <span className="sidebar-group-item-name" onClick={() => { setCurrentGroupId(g.id); setGroupOpen(false); }}>
                      {g.name}
                    </span>
                    <button type="button" className="sidebar-group-edit-btn" onClick={() => handleEdit(g)}>
                      <IconPencil />
                    </button>
                  </>
                )}
              </div>
            ))}
            <div className="sidebar-group-divider" />
            <form onSubmit={e => {
              e.preventDefault();
              const t = newName.trim();
              if (!t) return;
              addGroup(t);
              setNewName('');
              setGroupOpen(false);
            }}>
              <input
                className="sidebar-group-input"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Tên nhóm mới..."
                autoFocus
              />
            </form>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`sidebar-link ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
            type="button"
          >
            <Icon />
            <span>{label}</span>
            {tab === id && <IconChevron />}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className={`status-badge ${fbMode ? (online ? 'online' : 'syncing') : 'local'}`}>
          <span className="status-dot" />
          {fbMode ? (online ? 'Cloud' : 'Đồng bộ...') : 'Local'}
        </div>
      </div>
    </aside>
  );
}
