import { useApp } from '../../hooks/useApp';
import { useState } from 'react';
import { PlusCircle, Trash2, Pencil } from 'lucide-react';

const COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f472b6', '#fb7185', '#38bdf8', '#a78bfa', '#f87171', '#34d399', '#facc15'];

export default function SubjectsPage() {
  const { subjects, addSubject, updateSubject, removeSubject } = useApp();
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = name.trim();
    if (!t) return;
    addSubject(t, color);
    setName('');
  };

  const saveEdit = (id: string) => {
    const t = editName.trim();
    if (!t) return;
    updateSubject(id, { name: t, color: editColor });
    setEditId(null);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Danh mục</h1>
        <p>Thêm danh mục để phân loại nhiệm vụ</p>
      </div>
      <form className="add-bar" onSubmit={handleSubmit}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Tên danh mục"
        />
        <div className="color-picks">
          {COLORS.map(c => (
            <button
              key={c}
              type="button"
              className={`swatch ${c === color ? 'sel' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <button className="btn btn-primary" type="submit">
          <PlusCircle size={16} /> Thêm môn
        </button>
      </form>
      {subjects.length > 0 && (
        <div className="subject-list">
          {subjects.map(s => (
            <div key={s.id} className="subject-row">
              {editId === s.id ? (
                <div className="edit-row" style={{ width: '100%' }}>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    autoFocus
                    style={{ flex: 1, minWidth: 0 }}
                  />
                  <div className="color-picks">
                    {COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        className={`swatch ${c === editColor ? 'sel' : ''}`}
                        style={{ background: c, width: 20, height: 20 }}
                        onClick={() => setEditColor(c)}
                      />
                    ))}
                  </div>
                  <button type="button" onClick={() => saveEdit(s.id)} className="btn btn-sm btn-primary">Lưu</button>
                  <button type="button" onClick={() => setEditId(null)} className="btn btn-sm">Hủy</button>
                </div>
              ) : (
                <>
                  <span className="subject-chip" style={{ background: s.color }}>{s.name}</span>
                  <button
                    type="button"
                    onClick={() => { setEditId(s.id); setEditName(s.name); setEditColor(s.color); }}
                    className="btn btn-sm"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSubject(s.id)}
                    className="btn btn-sm btn-danger"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      {subjects.length === 0 && (
        <div className="empty">Chưa có danh mục nào. Thêm danh mục để bắt đầu.</div>
      )}
    </div>
  );
}
