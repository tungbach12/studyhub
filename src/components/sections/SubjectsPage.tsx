import { useApp } from '../../hooks/useApp';
import { useState } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';

const COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f472b6', '#fb7185', '#38bdf8', '#a78bfa', '#f87171', '#34d399', '#facc15'];

export default function SubjectsPage() {
  const { subjects, addSubject, removeSubject } = useApp();
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = name.trim();
    if (!t) return;
    addSubject(t, color);
    setName('');
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Môn học</h1>
        <p>Thêm môn học để phân loại nhiệm vụ</p>
      </div>
      <form className="add-bar" onSubmit={handleSubmit}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Tên môn học"
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
              <span className="subject-chip" style={{ background: s.color }}>{s.name}</span>
              <button
                type="button"
                onClick={() => removeSubject(s.id)}
                className="btn btn-sm btn-danger"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
      {subjects.length === 0 && (
        <div className="empty">Chưa có môn học nào. Thêm môn học để bắt đầu.</div>
      )}
    </div>
  );
}
