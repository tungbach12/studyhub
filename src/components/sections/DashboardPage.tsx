import { useApp } from '../../hooks/useApp';
import { ArrowRight, Circle, CheckCircle2, Loader2, Users, BookOpen, Clock, ListTodo } from 'lucide-react';

const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const HOURS = ['6-8', '8-10', '10-12', '12-14', '14-16', '16-18', '18-20', '20-22', '22-24'];

export default function DashboardPage() {
  const { members, subjects, tasks, setTab } = useApp();

  const totalTasks = tasks.length;
  const doingTasks = tasks.filter(t => t.status === 'doing').length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;

  const memberWorkload = members.map(m => {
    const assigned = tasks.filter(t => t.assigneeId === m.id);
    return {
      member: m,
      todo: assigned.filter(t => t.status === 'todo').length,
      doing: assigned.filter(t => t.status === 'doing').length,
      done: assigned.filter(t => t.status === 'done').length,
      total: assigned.length,
    };
  });

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const allFree = Array.from({ length: 63 }, (_, i) => members.every(m => m.schedule[i]));
  const commonTimeSlots = allFree
    .map((free, i) => ({ free, day: Math.floor(i / 9), hour: i % 9 }))
    .filter(s => s.free)
    .slice(0, 6);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Tổng quan</h1>
        <p>Theo dõi tiến độ nhóm và lịch rảnh chung</p>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#94a3b8' }}>{totalTasks}</div>
          <div className="stat-label">Tổng nhiệm vụ</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#818cf8' }}>{doingTasks}</div>
          <div className="stat-label">Đang làm</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#22c55e' }}>{doneTasks}</div>
          <div className="stat-label">Hoàn thành</div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-card">
          <div className="dash-card-header">
            <Users size={16} />
            <span>Khối lượng công việc</span>
          </div>
          <div className="dash-card-body">
            {memberWorkload.length === 0 && <div className="dash-empty">Chưa có thành viên</div>}
            {memberWorkload.map(w => {
              const pct = w.total > 0 ? Math.round((w.done / w.total) * 100) : 0;
              return (
                <div key={w.member.id} className="workload-row">
                  <div className="workload-info">
                    <span className="workload-avatar">{w.member.name.charAt(0)}</span>
                    <span className="workload-name">{w.member.name}</span>
                    <span className="workload-count">{w.total} tasks</span>
                  </div>
                  <div className="workload-bars">
                    {w.todo > 0 && <span className="wl-bar todo" style={{ flex: w.todo }} title={`Cần làm: ${w.todo}`} />}
                    {w.doing > 0 && <span className="wl-bar doing" style={{ flex: w.doing }} title={`Đang làm: ${w.doing}`} />}
                    {w.done > 0 && <span className="wl-bar done" style={{ flex: w.done }} title={`Hoàn thành: ${w.done}`} />}
                    {w.total === 0 && <span className="wl-bar empty" />}
                  </div>
                  <div className="workload-detail">
                    <span style={{ color: '#94a3b8' }}>{w.todo}</span>
                    <span style={{ color: '#818cf8' }}>{w.doing}</span>
                    <span style={{ color: '#22c55e' }}>{w.done}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <Clock size={16} />
            <span>Lịch rảnh chung</span>
            {commonTimeSlots.length > 0 && <span className="dash-badge">{commonTimeSlots.length} khung</span>}
          </div>
          <div className="dash-card-body">
            {commonTimeSlots.length === 0 && (
              <div className="dash-empty">
                Chưa có khung rảnh chung
                <button className="btn btn-sm" onClick={() => setTab('schedule')} style={{ marginTop: 8 }}>
                  Xem chi tiết <ArrowRight size={14} />
                </button>
              </div>
            )}
            {commonTimeSlots.map(s => (
              <div key={`${s.day}-${s.hour}`} className="combo-card success" style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => setTab('schedule')}>
                <span className="combo-day">{DAYS[s.day]}</span>
                <span className="combo-time">{HOURS[s.hour]}</span>
                <span className="combo-badge success">Rảnh</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dash-card dash-card-wide">
          <div className="dash-card-header">
            <ListTodo size={16} />
            <span>Nhiệm vụ gần đây</span>
            <button className="btn btn-sm" onClick={() => setTab('tasks')}>
              Xem tất cả <ArrowRight size={14} />
            </button>
          </div>
          <div className="dash-card-body">
            {recentTasks.length === 0 && <div className="dash-empty">Chưa có nhiệm vụ nào</div>}
            {recentTasks.map(t => {
              const sub = subjects.find(s => s.id === t.subjectId);
              const mem = members.find(m => m.id === t.assigneeId);
              const StatusIcon = t.status === 'done' ? CheckCircle2 : t.status === 'doing' ? Loader2 : Circle;
              const statusColor = t.status === 'done' ? '#22c55e' : t.status === 'doing' ? '#818cf8' : '#94a3b8';
              return (
                <div key={t.id} className="dash-task-row" onClick={() => setTab('tasks')}>
                  <StatusIcon size={14} style={{ color: statusColor, flexShrink: 0 }} />
                  <div className="dash-task-info">
                    <span className="dash-task-title">{t.title}</span>
                    <div className="dash-task-meta">
                      {sub && <span className="subject-chip sm" style={{ background: sub.color }}>{sub.name}</span>}
                      {mem && <span>{mem.name}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
