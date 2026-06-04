import AppSidebar from './components/layout/AppSidebar';
import DashboardPage from './components/sections/DashboardPage';
import MembersPage from './components/sections/MembersPage';
import SchedulePage from './components/sections/SchedulePage';
import SubjectsPage from './components/sections/SubjectsPage';
import TasksPage from './components/sections/TasksPage';
import { useApp } from './hooks/useApp';
import { useState } from 'react';

const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

export default function App() {
  const { tab, groups, currentGroupId } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const groupName = groups.find(g => g.id === currentGroupId)?.name ?? '';

  return (
    <div className="app">
      <div className={`mobile-sidebar ${mobileOpen ? 'show' : ''}`} onClick={() => setMobileOpen(false)}>
        <div className="mobile-sidebar-panel" onClick={e => e.stopPropagation()}>
          <AppSidebar onClose={() => setMobileOpen(false)} />
        </div>
      </div>

      <div className="sidebar-desktop">
        <AppSidebar />
      </div>

      <main className="main">
        <div className="mobile-topbar">
          <button className="mobile-hamburger" onClick={() => setMobileOpen(true)} type="button">
            <IconMenu />
          </button>
          <span className="mobile-group-name">{groupName}</span>
        </div>

        {tab === 'dashboard' && <DashboardPage />}
        {tab === 'members' && <MembersPage />}
        {tab === 'schedule' && <SchedulePage />}
        {tab === 'subjects' && <SubjectsPage />}
        {tab === 'tasks' && <TasksPage />}
      </main>
    </div>
  );
}
