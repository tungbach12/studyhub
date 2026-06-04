import { useApp } from '../../hooks/useApp';

const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const HOURS = ['6-8', '8-10', '10-12', '12-14', '14-16', '16-18', '18-20', '20-22', '22-24'] as const;

export default function CommonTimePage() {
  const { members } = useApp();

  const allFree = Array.from({ length: 7 * 9 }, (_, i) =>
    members.reduce((acc, m) => acc + (m.schedule[i] ? 1 : 0), 0)
  );

  const bestSlots = Array.from({ length: 7 * 9 }, (_, i) => i).filter(i => allFree[i] === members.length && members.length > 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Thời gian rảnh chung</h1>
        <p>Tìm các khung phù hợp nhất cho cả nhóm họp/học</p>
      </div>
      {bestSlots.length > 0 ? (
        <div className="combo-list">
          <h2>AI đề xuất khung dành riêng cho cả nhóm</h2>
          <div className="combo-cards">
            {bestSlots.map(i => {
              const day = Math.floor(i / 9);
              const row = i % 9;
              return (
                <div key={i} className="combo-card success">
                  <div className="combo-day">{DAYS[day]}</div>
                  <div className="combo-time">{HOURS[row]}</div>
                  <div className="combo-badge success">{members.length}/{members.length} người rảnh</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="empty">Chưa có khung nào mà cả nhóm đều rảnh. Điều chỉnh lịch thành viên ở mục Thành viên.</div>
      )}
      <div className="stats-block">
        <h3>Phân tích theo từng ngày</h3>
        <div className="schedule-all">
          {DAYS.map((d, col) => {
            const count = members.filter(m => HOURS.some((_, rr) => m.schedule[col * 9 + rr])).length;
            return (
              <div key={d} className="day-stat-row">
                <div className="day-label">{d}</div>
                <div className="bar"><div className="fill" style={{ width: `${members.length > 0 ? Math.round((count / members.length) * 100) : 0}%` }} /></div>
                <div className="count">{count}/{members.length} người có lịch rảnh trong ngày</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
