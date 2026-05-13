import { Routes, Route, Navigate } from 'react-router-dom';
import { useAccessibility } from './store/accessibility.store';

import ProtectedRoute from './components/auth/ProtectedRoute';
import AvoraChatWidget from './components/ai/AvoraChatWidget';

import HomePage from './modules/home/pages/HomePage';
import DashboardPage from './modules/dashboard/pages/DashboardPage';
import ProfilePage from './modules/profile/pages/ProfilePage';
import AssessmentPage from './modules/assessment/pages/AssessmentPage';
import JobsPage from './modules/jobs/pages/JobsPage';
import JobDetailPage from './modules/jobs/pages/JobDetailPage';
import RoadmapsPage from './modules/roadmaps/pages/RoadmapsPage';
import RoadmapDetailPage from './modules/roadmaps/pages/RoadmapDetailPage';
import InterviewsPage from './modules/interviews/pages/InterviewsPage';
import InterviewSessionPage from './modules/interviews/pages/InterviewSessionPage';
import ConfidencePage from './modules/confidence/pages/ConfidencePage';
import SimulationPage from './modules/simulation/pages/SimulationPage';
import SettingsPage from './modules/settings/pages/SettingsPage';
import LoginPage from './modules/auth/pages/LoginPage';
import RegisterPage from './modules/auth/pages/RegisterPage';
import AuthCallbackPage from './modules/auth/pages/AuthCallbackPage';
import DocsPage from './modules/docs/pages/DocsPage';
import PartnersPage from './modules/partners/pages/PartnersPage';

function App() {
  const { settings } = useAccessibility();

  return (
    <div
      style={{
        fontSize: `${settings.fontSize}%`,
      }}
      className={`
        ${settings.highContrast ? 'high-contrast' : ''}
        ${settings.reducedMotion ? 'reduced-motion' : ''}
      `}
    >
      <Routes>
        {/* Public routes - accessible without login */}
        <Route path="/" element={<HomePage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/partners" element={<PartnersPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Protected routes - require authentication */}
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<ProfilePage editMode />} />
          <Route path="/assessment" element={<AssessmentPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/roadmaps" element={<RoadmapsPage />} />
          <Route path="/roadmaps/:id" element={<RoadmapDetailPage />} />
          <Route path="/interviews" element={<InterviewsPage />} />
          <Route path="/interviews/:id" element={<InterviewSessionPage />} />
          <Route path="/confidence" element={<ConfidencePage />} />
          <Route path="/simulation" element={<SimulationPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
      <AvoraChatWidget />
    </div>
  );
}

export default App;
