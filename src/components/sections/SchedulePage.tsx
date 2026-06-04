import { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import MemberAvatar from '../ui/MemberAvatar';

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
const HOURS = [
  { label: '06-08', start: 6, end: 8 },
  { label: '08-10', start: 8, end: 10 },
  { label: '10-12', start: 10, end: 12 },
  { label: '12-14', start: 12, end: 14 },
  { label: '14-16', start: 14, end: 16 },
  { label: '16-18', start: 16, end: 18 },
  { label: '18-20', start: 18, end: 20 },
  { label: '20-22', start: 20, end: 22 },
  { label: '22-24', start: 22, end: 24 },
];

const AVATAR_COLORS = [
  '#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#9333ea', '#0891b2',
];

export default function SchedulePage() {
  const { members } = useApp();
  const [view, setView] = useState<'all' | string>('all');

  const visibleMembers =
    view === 'all' ? members : members.filter(m => m.id === view);

  const cellFreeCount = (idx: number) =>
    members.filter(m => m.schedule[idx]).length;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Lịch học</h1>
        <p>Bảng tổng hợp lịch rảnh của cả nhóm</p>
      </div>

      <div className="sched-controls">
        <div className="view-toggle">
          <button
            className={`view-chip ${view === 'all' ? 'active' : ''}`}
            onClick={() => setView('all')}
          >
            Tất cả
          </button>
          {members.map((m, i) => (
            <button
              key={m.id}
              className={`view-chip ${view === m.id ? 'active' : ''}`}
              onClick={() => setView(m.id)}
            >
              {m.avatarUrl ? (
                <MemberAvatar member={m} size={26} className="view-avatar" />
              ) : (
                <span className="view-avatar" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                  {m.name.charAt(0).toUpperCase()}
                </span>
              )}
              {m.name}
            </button>
          ))}
        </div>
      </div>

      {view === 'all' ? (
        <div className="sched-heatmap">
          <div className="heatmap-grid">
            <div className="heatmap-corner" />
            <div className="heatmap-day-header">
              {DAYS.map(d => (
                <div key={d} className="heatmap-day">{d}</div>
              ))}
            </div>
            {HOURS.map(h => (
              <div key={h.label} className="heatmap-row">
                <div className="heatmap-hour">
                  <span className="hour-start">{h.start.toString().padStart(2, '0')}</span>
                  <span className="hour-sep">-</span>
                  <span className="hour-end">{h.end.toString().padStart(2, '0')}</span>
                </div>
                {DAYS.map((_, col) => {
                  const idx = col * 9 + HOURS.indexOf(h);
                  const count = cellFreeCount(idx);
                  const pct = members.length > 0 ? count / members.length : 0;
                  const level =
                    pct === 1 ? 'full' :
                    pct >= 0.66 ? 'high' :
                    pct >= 0.33 ? 'mid' :
                    pct > 0 ? 'low' : 'none';
                  const tooltip = `${DAYS[col]} ${h.label}: ${count}/${members.length} người rảnh`;
                  return (
                    <div
                      key={col}
                      className={`cell cell-lg ${level}`}
                      title={tooltip}
                    >
                      <span className="cell-count">{count > 0 ? `${count}` : ''}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="heatmap-legend">
            <span className="legend-item"><span className="legend-dot" style={{ background: '#22c55e' }} /> Tất cả rảnh</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: '#06b6d4' }} /> Nhiều người rảnh</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: '#eab308' }} /> Vừa</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: '#f97316' }} /> Ít</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: '#1e1e1e' }} /> Không ai rảnh</span>
          </div>
        </div>
      ) : (
        <div className="sched-members">
          {visibleMembers.map((m, i) => (
            <div key={m.id} className="member-schedule-card">
              <div className="member-sched-header">
                {m.avatarUrl ? (
                  <MemberAvatar member={m} size={30} className="member-sched-avatar" />
                ) : (
                  <span className="member-sched-avatar" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                    {m.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="member-sched-name">{m.name}</span>
                <span className="member-sched-free">
                  {m.schedule.filter(Boolean).length} / {m.schedule.length} khung rảnh
                </span>
              </div>
              <div className="member-sched-grid">
                <div className="member-sched-corner" />
                <div className="member-sched-day-header">
                  {DAYS.map(d => <div key={d} className="member-sched-day">{d}</div>)}
                </div>
                {HOURS.map((h, row) => (
                  <div key={h.label} className="member-sched-row">
                    <div className="member-sched-hour">
                      <span className="hour-start">{h.start.toString().padStart(2, '0')}</span>
                      <span className="hour-sep">-</span>
                      <span className="hour-end">{h.end.toString().padStart(2, '0')}</span>
                    </div>
                    {DAYS.map((_, col) => {
                      const idx = col * 9 + row;
                      const on = m.schedule[idx];
                      return (
                        <div
                          key={col}
                          className={`cell cell-lg ${on ? 'single-on' : 'single-off'}`}
                          title={`${DAYS[col]} ${h.label}: ${on ? 'Rảnh' : 'Bận'}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
