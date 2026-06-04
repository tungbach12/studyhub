import { useState, useRef } from 'react';
import { useApp } from '../../hooks/useApp';
import { PlusCircle, Trash2, Eraser, Upload, Loader2 } from 'lucide-react';
import MemberAvatar from '../ui/MemberAvatar';
import { uploadAvatar } from '../../lib/storage';

const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const HOURS = [
  '6-8', '8-10', '10-12', '12-14', '14-16', '16-18', '18-20', '20-22', '22-24',
];

export default function MembersPage() {
  const { members, addMember, updateMember, removeMember, online } = useApp();
  const [name, setName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [uploading, setUploading] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = name.trim();
    if (!t) return;
    addMember(t);
    setName('');
  };

  const saveEdit = (id: string) => {
    const t = editName.trim();
    if (!t) return;
    updateMember(id, { name: t });
    setEditId(null);
  };

  const handleAvatarClick = (memberId: string) => {
    setUploadTarget(memberId);
    fileRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;
    try {
      setUploading(uploadTarget);
      const url = await uploadAvatar(uploadTarget, file);
      updateMember(uploadTarget, { avatarUrl: url });
    } catch (err: any) {
      alert('Lỗi upload: ' + (err.message || 'unknown'));
    } finally {
      setUploading(null);
      setUploadTarget(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="page">
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={handleFileChange}
      />
      <div className="page-header">
        <h1>Thành viên nhóm</h1>
        <p>Thêm bạn học → điền lịch rảnh → tìm thời gian rảnh chung</p>
      </div>
      <form className="add-bar" onSubmit={submit}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Tên thành viên"
        />
        <button className="btn btn-primary" type="submit">
          <PlusCircle size={18} /> Thêm
        </button>
      </form>
      <div className="members-grid">
        {members.map(m => (
          <div key={m.id} className="member-card">
            <div className="member-header">
              {editId === m.id ? (
                <div className="edit-row">
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    autoFocus
                  />
                  <button type="button" onClick={() => saveEdit(m.id)} className="btn btn-sm btn-primary">
                    Lưu
                  </button>
                  <button type="button" onClick={() => setEditId(null)} className="btn btn-sm">
                    Hủy
                  </button>
                </div>
              ) : (
                <div className="name-row">
                  <div className="member-name-row">
                    <div className="member-avatar-wrap" onClick={() => handleAvatarClick(m.id)}>
                      {uploading === m.id ? (
                        <Loader2 size={32} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <MemberAvatar member={m} size={40} />
                      )}
                      <div className="member-avatar-overlay">
                        <Upload size={14} />
                      </div>
                    </div>
                    <span className="member-name">{m.name}</span>
                  </div>
                  <div className="member-actions">
                    <button type="button" onClick={() => { setEditId(m.id); setEditName(m.name); }} className="btn btn-sm">Sửa</button>
                    <button
                      type="button"
                      onClick={() => updateMember(m.id, { schedule: Array.from({ length: 63 }, () => false) })}
                      className="btn btn-sm btn-ghost"
                      title="Xóa toàn bộ lịch rảnh"
                    >
                      <Eraser size={15} />
                    </button>
                    <button type="button" onClick={() => removeMember(m.id)} className="btn btn-sm btn-danger"><Trash2 size={16} /></button>
                  </div>
                </div>
              )}
            </div>
            <p className="schedule-label">Tích chọn khung rảnh của {m.name}</p>
            <div className="schedule-grid">
              <div className="schedule-col-header">
                <div />
                {DAYS.map(d => (
                  <div key={d} className="day-label">{d}</div>
                ))}
              </div>
              {HOURS.map((h, row) => (
                <div key={h} className="schedule-row">
                  <div className="hour-label">{h}</div>
                  {DAYS.map((_, col) => {
                    const idx = col * 9 + row;
                    const on = m.schedule[idx];
                    return (
                      <button
                        key={col}
                        type="button"
                        className={`slot ${on ? 'on' : 'off'}`}
                        onClick={() => {
                          const copy = [...m.schedule];
                          copy[idx] = !copy[idx];
                          updateMember(m.id, { schedule: copy });
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <p className="legend">
              <span className="dot on" /> Rảnh &nbsp;
              <span className="dot off" /> Bận
            </p>
          </div>
        ))}
        {members.length === 0 && <div className="empty">Chưa có thành viên. Thêm ở mục này.</div>}
      </div>
    </div>
  );
}
