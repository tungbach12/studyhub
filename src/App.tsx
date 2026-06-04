import AppSidebar from './components/layout/AppSidebar';
import DashboardPage from './components/sections/DashboardPage';
import MembersPage from './components/sections/MembersPage';
import SchedulePage from './components/sections/SchedulePage';
import CommonTimePage from './components/sections/CommonTimePage';
import SubjectsPage from './components/sections/SubjectsPage';
import TasksPage from './components/sections/TasksPage';
import { useApp } from './hooks/useApp';

export default function App() {
  const { tab } = useApp();
  return (
    <div className="app">
      <AppSidebar />
      <main className="main">
        {tab === 'dashboard' && <DashboardPage />}
        {tab === 'members' && <MembersPage />}
        {tab === 'schedule' && <SchedulePage />}
        {tab === 'subjects' && <SubjectsPage />}
        {tab === 'tasks' && <TasksPage />}
      </main>
    </div>
  );
}
