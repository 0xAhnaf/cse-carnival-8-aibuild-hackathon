import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout.jsx'
import AIAssistantPage from './pages/AIAssistantPage.jsx'
import AnnouncementsPage from './pages/AnnouncementsPage.jsx'
import AssignmentsPage from './pages/AssignmentsPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import EventsPage from './pages/EventsPage.jsx'
import RoomsPage from './pages/RoomsPage.jsx'
import SchedulesPage from './pages/SchedulesPage.jsx'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="schedules" element={<SchedulesPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route path="assistant" element={<AIAssistantPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
