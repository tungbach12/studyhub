import { useState, useRef } from 'react';
import { Upload, FileText, X, Image, Loader2, Check, AlertCircle, Plus } from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { parseTasksFromText, parseTasksFromImage } from '../../lib/ai';
import * as XLSX from 'xlsx';

interface RawTask {
  title: string;
  description?: string;
  assigneeName?: string;
  subjectName?: string;
  deadline?: string;
}

interface ReviewedTask extends RawTask {
  _selected: boolean;
  _key: number;
}

type Step = 'input' | 'processing' | 'review';

function matchName(name: string | undefined, list: { id: string; name: string }[]): string {
  if (!name) return '';
  const lower = name.toLowerCase();
  const found = list.find(m => m.name.toLowerCase().includes(lower) || lower.includes(m.name.toLowerCase()));
  return found?.id ?? '';
}

export default function ImportModal({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (tasks: { title: string; description: string; subjectId: string; assigneeId: string | null; deadline: string | null; status: 'todo' | 'draft' }[]) => void;
}) {
  const { members, subjects, addSubject } = useApp();
  const [step, setStep] = useState<Step>('input');
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [tasks, setTasks] = useState<ReviewedTask[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [allSelected, setAllSelected] = useState(true);

  const reset = () => {
    setStep('input');
    setText('');
    setFile(null);
    setError('');
    setTasks([]);
    setAllSelected(true);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = (f: File) => {
    setFile(f);
    setError('');
  };

  const process = async () => {
    setError('');
    setStep('processing');
    try {
      let rawTasks: RawTask[] = [];

      if (inputMode === 'text') {
        if (!text.trim()) { setError('Vui lòng nhập dữ liệu'); setStep('input'); return; }
        rawTasks = await parseTasksFromText(text);
      } else {
        if (!file) { setError('Vui lòng chọn file'); setStep('input'); return; }
        const ext = file.name.split('.').pop()?.toLowerCase();

        if (ext === 'xlsx' || ext === 'xls') {
          const buf = await file.arrayBuffer();
          const wb = XLSX.read(buf);
          const ws = wb.Sheets[wb.SheetNames[0]];
          const csv = XLSX.utils.sheet_to_csv(ws);
          rawTasks = await parseTasksFromText(csv);
        } else if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(ext || '')) {
          const b64 = await fileToBase64(file);
          rawTasks = await parseTasksFromImage(b64);
        } else {
          const text2 = await file.text();
          rawTasks = await parseTasksFromText(text2);
        }
      }

      const reviewed: ReviewedTask[] = rawTasks.map((t, i) => ({
        ...t,
        _selected: true,
        _key: i,
      }));
      setTasks(reviewed);
      setAllSelected(true);
      setStep('review');
    } catch (e: any) {
      setError(e.message || 'Lỗi xử lý');
      setStep('input');
    }
  };

  const toggleSelect = (key: number) => {
    setTasks(prev => prev.map(t => t._key === key ? { ...t, _selected: !t._selected } : t));
  };

  const toggleAll = () => {
    const next = !allSelected;
    setAllSelected(next);
    setTasks(prev => prev.map(t => ({ ...t, _selected: next })));
  };

  const removeTask = (key: number) => {
    setTasks(prev => prev.filter(t => t._key !== key));
  };

  const updateTask = (key: number, patch: Partial<ReviewedTask>) => {
    setTasks(prev => prev.map(t => t._key === key ? { ...t, ...patch } : t));
  };

  const confirmImport = (status: 'todo' | 'draft') => {
    const selected = tasks.filter(t => t._selected);
    const mapped = selected.map(t => ({
      title: t.title,
      description: t.description || '',
      subjectId: matchName(t.subjectName, subjects),
      assigneeId: matchName(t.assigneeName, members) || null,
      deadline: t.deadline || null,
      status,
    }));
    onImport(mapped);
    handleClose();
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal modal-import" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{step === 'review' ? 'Xem lại nhiệm vụ' : 'Import nhiệm vụ'}</h2>
          <button className="modal-close" onClick={handleClose} type="button"><X size={20} /></button>
        </div>

        {step === 'input' && (
          <div className="modal-form">
            <div className="import-tabs">
              <button type="button" className={`import-tab ${inputMode === 'text' ? 'active' : ''}`} onClick={() => setInputMode('text')}>
                <FileText size={16} /> Văn bản
              </button>
              <button type="button" className={`import-tab ${inputMode === 'file' ? 'active' : ''}`} onClick={() => setInputMode('file')}>
                <Image size={16} /> File
              </button>
            </div>

            {inputMode === 'text' ? (
              <textarea
                className="modal-input modal-textarea import-textarea"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Dán raw data vào đây...&#10;VD:&#10;1. Làm bài tập Toán rời rạc - An&#10;2. Hoàn thiện trang web - deadline 15/06"
                rows={8}
              />
            ) : (
              <div className="import-dropzone" onClick={() => fileRef.current?.click()}>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.png,.jpg,.jpeg,.webp,.txt,.csv"
                  hidden
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
                <Upload size={32} />
                <p>Nhấn để chọn file (xlsx, ảnh, txt, csv)</p>
                {file && <p className="import-filename">{file.name}</p>}
              </div>
            )}

            {error && <div className="import-error"><AlertCircle size={14} /> {error}</div>}

            <div className="modal-actions">
              <button type="button" className="btn" onClick={handleClose}>Hủy</button>
              <button type="button" className="btn btn-primary" onClick={process}>
                <Upload size={16} /> Xử lý với AI
              </button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="modal-form import-processing">
            <Loader2 className="spin" size={32} />
            <p>Đang xử lý với AI...</p>
          </div>
        )}

        {step === 'review' && (
          <div className="modal-form" style={{ gap: 0 }}>
            {tasks.length === 0 ? (
              <div className="import-empty">Không tìm thấy nhiệm vụ nào</div>
            ) : (
              <>
                <div className="import-review-bar">
                  <label className="import-check-all">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                    <span>Chọn tất cả ({tasks.filter(t => t._selected).length}/{tasks.length})</span>
                  </label>
                </div>

                {(() => {
                  const uncategorized = tasks.filter(t => !t.subjectName && t._selected);
                  if (uncategorized.length === 0) return null;
                  return <UncategorizedBar
                    count={uncategorized.length}
                    subjects={subjects}
                    onApply={(subjectName: string) => {
                      const existing = subjects.find(s => s.name === subjectName);
                      if (!existing) {
                        const colors = ['#6b5bff', '#ff6b6b', '#51cf66', '#ff922b', '#339af0', '#cc5de8', '#20c997', '#f06595'];
                        const color = colors[Object.keys(subjects).length % colors.length];
                        addSubject(subjectName, color);
                      }
                      setTasks(prev => prev.map(t =>
                        !t.subjectName && t._selected ? { ...t, subjectName } : t
                      ));
                    }}
                  />;
                })()}

                <div className="import-review-list">
                  {tasks.map(t => (
                    <div key={t._key} className={`import-review-row ${t._selected ? '' : 'dim'}`}>
                      <div className="import-review-check">
                        <input type="checkbox" checked={t._selected} onChange={() => toggleSelect(t._key)} />
                      </div>
                      <div className="import-review-fields">
                        <input
                          className="modal-input"
                          value={t.title}
                          onChange={e => updateTask(t._key, { title: e.target.value })}
                          placeholder="Tiêu đề"
                        />
                        <input
                          className="modal-input"
                          value={t.description || ''}
                          onChange={e => updateTask(t._key, { description: e.target.value })}
                          placeholder="Mô tả"
                        />
                        <div className="import-review-selects">
                          <select
                            className="modal-input"
                            value={matchName(t.assigneeName, members)}
                            onChange={e => updateTask(t._key, { assigneeName: members.find(m => m.id === e.target.value)?.name || '' })}
                          >
                            <option value="">Người làm</option>
                            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                          <select
                            className="modal-input"
                            value={matchName(t.subjectName, subjects)}
                            onChange={e => updateTask(t._key, { subjectName: subjects.find(s => s.id === e.target.value)?.name || '' })}
                          >
                            <option value="">Danh mục</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                          <input
                            className="modal-input"
                            type="date"
                            value={t.deadline || ''}
                            onChange={e => updateTask(t._key, { deadline: e.target.value })}
                          />
                        </div>
                      </div>
                      <button type="button" className="import-review-del" onClick={() => removeTask(t._key)}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {error && <div className="import-error"><AlertCircle size={14} /> {error}</div>}

            <div className="modal-actions import-actions">
              <button type="button" className="btn" onClick={handleClose}>Hủy</button>
              <button type="button" className="btn" onClick={() => confirmImport('draft')}>
                <FileText size={16} /> Lưu nháp
              </button>
              <button type="button" className="btn btn-primary" onClick={() => confirmImport('todo')}>
                <Check size={16} /> Import
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function UncategorizedBar({ count, subjects, onApply }: {
  count: number;
  subjects: { id: string; name: string }[];
  onApply: (name: string) => void;
}) {
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [selectedId, setSelectedId] = useState('');
  const [newName, setNewName] = useState('');

  const handleApply = () => {
    const name = mode === 'select' ? subjects.find(s => s.id === selectedId)?.name : newName.trim();
    if (!name) return;
    onApply(name);
  };

  return (
    <div className="import-uncategorized-bar">
      <span className="import-uncategorized-label">
        {count} nhiệm vụ chưa có danh mục
      </span>
      <div className="import-uncategorized-controls">
        <div className="import-uncategorized-tabs">
          <button type="button" className={`import-tab-sm ${mode === 'select' ? 'active' : ''}`} onClick={() => setMode('select')}>Chọn</button>
          <button type="button" className={`import-tab-sm ${mode === 'create' ? 'active' : ''}`} onClick={() => setMode('create')}>Tạo mới</button>
        </div>
        {mode === 'select' ? (
          <select className="modal-input" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
            <option value="">-- Chọn danh mục --</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        ) : (
          <input className="modal-input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nhập tên danh mục mới" />
        )}
        <button type="button" className="btn btn-primary btn-xs" onClick={handleApply} disabled={mode === 'select' ? !selectedId : !newName.trim()}>
          <Plus size={14} /> Áp dụng
        </button>
      </div>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
