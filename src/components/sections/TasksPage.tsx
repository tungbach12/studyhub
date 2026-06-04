import { useApp } from '../../hooks/useApp';
import { useState } from 'react';
import type { TaskStatus, Task } from '../../types';
import { PlusCircle, Trash2, CalendarDays, User, ArrowRight, ArrowLeft, X, Clock, CheckCircle2, Circle, Loader2 } from 'lucide-react';

const STATUSES: { key: TaskStatus; label: string; icon: typeof Circle }[] = [
  { key: 'todo', label: 'Cần làm', icon: Circle },
  { key: 'doing', label: 'Đang làm', icon: Loader2 },
  { key: 'done', label: 'Hoàn thành', icon: CheckCircle2 },
];

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: '#94a3b8',
  doing: '#818cf8',
  done: '#22c55e',
};

function TaskCard({
  task,
  subjects,
  members,
  onUpdate,
  onRemove,
}: {
  task: Task;
  subjects: ReturnType<typeof useApp>['subjects'];
  members: ReturnType<typeof useApp>['members'];
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onRemove: (id: string) => void;
}) {
  const sub = subjects.find(s => s.id === task.subjectId);
  const mem = members.find(m => m.id === task.assigneeId);
  const color = sub?.color ?? '#555';

  const statusIndex = STATUSES.findIndex(s => s.key === task.status);
  const prev = statusIndex > 0 ? STATUSES[statusIndex - 1] : null;
  const next = statusIndex < STATUSES.length - 1 ? STATUSES[statusIndex + 1] : null;

  return (
    <div className="task-card">
      <div className="task-card-color" style={{ background: task.status === 'done' ? '#22c55e' : color }} />
      <div className="task-card-body">
        <div className="task-card-header">
          <span className="task-card-subject" style={{ background: color }}>{sub?.name ?? 'Môn'}</span>
          <button type="button" onClick={() => onRemove(task.id)} className="task-card-delete"><Trash2 size={14} /></button>
        </div>
        <div className="task-card-title">{task.title}</div>
        {task.description && <div className="task-card-desc">{task.description}</div>}
        <div className="task-card-meta">
          {mem && (
            <span className="task-card-assignee">
              <span className="task-card-avatar">{mem.name.charAt(0).toUpperCase()}</span>
              {mem.name}
            </span>
          )}
          {task.deadline && (
            <span className="task-card-deadline">
              <CalendarDays size={12} />
              {task.deadline}
            </span>
          )}
        </div>
        <div className="task-card-actions">
          {prev && (
            <button type="button" className="task-card-btn prev" onClick={() => onUpdate(task.id, { status: prev.key })} title={prev.label}>
              <ArrowLeft size={14} /> {prev.label}
            </button>
          )}
          {next && (
            <button type="button" className="task-card-btn next" onClick={() => onUpdate(task.id, { status: next.key })} title={next.label}>
              {next.label} <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AddTaskModal({
  open,
  onClose,
  subjects,
  members,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  subjects: ReturnType<typeof useApp>['subjects'];
  members: ReturnType<typeof useApp>['members'];
  onAdd: (task: Omit<Task, 'id'>) => void;
}) {
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '');
  const [assigneeId, setAssigneeId] = useState(members[0]?.id ?? '');
  const [deadline, setDeadline] = useState('');
  const [desc, setDesc] = useState('');

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    onAdd({
      subjectId,
      title: t,
      description: desc,
      status: 'todo',
      assigneeId: assigneeId || null,
      deadline: deadline || null,
      createdAt: new Date().toISOString(),
    });
    setTitle('');
    setDesc('');
    setDeadline('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Thêm nhiệm vụ</h2>
          <button type="button" onClick={onClose} className="modal-close"><X size={18} /></button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <label className="modal-label">Tiêu đề <span className="req">*</span></label>
          <input className="modal-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="VD: Ôn tập chương 3" autoFocus />

          <label className="modal-label">Môn học</label>
          <select className="modal-input" value={subjectId} onChange={e => setSubjectId(e.target.value)}>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <label className="modal-label">Người phụ trách</label>
          <select className="modal-input" value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
            <option value="">(Chưa giao)</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>

          <label className="modal-label">Hạn chót</label>
          <input className="modal-input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />

          <label className="modal-label">Mô tả</label>
          <textarea className="modal-input modal-textarea" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ghi chú thêm..." rows={3} />

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn">Huỷ</button>
            <button type="submit" className="btn btn-primary"><PlusCircle size={16} /> Tạo nhiệm vụ</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  tasks,
  subjects,
  members,
  onUpdate,
  onRemove,
}: {
  status: TaskStatus;
  tasks: Task[];
} & Omit<Parameters<typeof TaskCard>[0], 'task'>) {
  const label = STATUSES.find(s => s.key === status)!.label;
  const Icon = STATUSES.find(s => s.key === status)!.icon;
  const color = STATUS_COLORS[status];

  return (
    <div className="kanban-col">
      <div className="kanban-col-header">
        <Icon size={16} style={{ color }} />
        <span className="kanban-col-title">{label}</span>
        <span className="kanban-col-count">{tasks.length}</span>
      </div>
      <div className="kanban-col-body">
        {tasks.map(t => (
          <TaskCard
            key={t.id}
            task={t}
            subjects={subjects}
            members={members}
            onUpdate={onUpdate}
            onRemove={onRemove}
          />
        ))}
        {tasks.length === 0 && (
          <div className="kanban-empty">{label === 'Cần làm' ? 'Chưa có nhiệm vụ nào. Nhấn "Thêm" để bắt đầu.' : 'Kéo thả hoặc dùng nút để chuyển task qua.'}</div>
        )}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { tasks, subjects, members, addTask, updateTask, removeTask } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);

  const visibleTasks = filterAssignee
    ? tasks.filter(t => t.assigneeId === filterAssignee)
    : tasks;

  const grouped = {
    todo: visibleTasks.filter(t => t.status === 'todo'),
    doing: visibleTasks.filter(t => t.status === 'doing'),
    done: visibleTasks.filter(t => t.status === 'done'),
  } as const;

  return (
    <div className="page">
      <div className="page-header-row">
        <div className="page-header">
          <h1>Nhiệm vụ</h1>
          <p>Bảng Kanban — kéo thả hoặc dùng nút để cập nhật trạng thái</p>
        </div>
        <button className="btn btn-primary add-task-btn" onClick={() => setModalOpen(true)}>
          <PlusCircle size={18} /> Thêm nhiệm vụ
        </button>
      </div>

      <div className="stat-row">
        <div className="stat-card"><div className="stat-value" style={{ color: '#94a3b8' }}>{tasks.length}</div><div className="stat-label">Tổng</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: '#818cf8' }}>{grouped.doing.length}</div><div className="stat-label">Đang làm</div></div>
        <div className="stat-card"><div className="stat-value" style={{ color: '#22c55e' }}>{grouped.done.length}</div><div className="stat-label">Hoàn thành</div></div>
      </div>

      <div className="assignee-filter">
        <button
          className={`assignee-chip${filterAssignee === null ? ' active' : ''}`}
          onClick={() => setFilterAssignee(null)}
        >
          <span className="assignee-avatar-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
          </span>
          Tất cả
          <span className="assignee-count">{tasks.length}</span>
        </button>
        {members.map(m => {
          const count = tasks.filter(t => t.assigneeId === m.id).length;
          return (
            <button
              key={m.id}
              className={`assignee-chip${filterAssignee === m.id ? ' active' : ''}`}
              onClick={() => setFilterAssignee(m.id === filterAssignee ? null : m.id)}
            >
              <span className="assignee-avatar">{m.name.charAt(0)}</span>
              {m.name}
              <span className="assignee-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="kanban-board">
        {(Object.keys(grouped) as TaskStatus[]).map(status => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={grouped[status]}
            subjects={subjects}
            members={members}
            onUpdate={updateTask}
            onRemove={removeTask}
          />
        ))}
      </div>

      <AddTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        subjects={subjects}
        members={members}
        onAdd={addTask}
      />
    </div>
  );
}
