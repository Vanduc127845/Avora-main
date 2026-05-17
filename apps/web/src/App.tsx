import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAccessibility } from './store/accessibility.store';

import ProtectedRoute from './components/auth/ProtectedRoute';
import AvoraChatWidget from './components/ai/AvoraChatWidget';
import { Layout } from './components/layout';

const HomePage = lazy(() => import('./modules/home/pages/HomePage'));
const DashboardPage = lazy(() => import('./modules/dashboard/pages/DashboardPage'));
const ProfilePage = lazy(() => import('./modules/profile/pages/ProfilePage'));
const AssessmentPage = lazy(() => import('./modules/assessment/pages/AssessmentPage'));
const JobsPage = lazy(() => import('./modules/jobs/pages/JobsPage'));
const JobDetailPage = lazy(() => import('./modules/jobs/pages/JobDetailPage'));
const RoadmapsPage = lazy(() => import('./modules/roadmaps/pages/RoadmapsPage'));
const RoadmapDetailPage = lazy(() => import('./modules/roadmaps/pages/RoadmapDetailPage'));
const InterviewsPage = lazy(() => import('./modules/interviews/pages/InterviewsPage'));
const InterviewSessionPage = lazy(() => import('./modules/interviews/pages/InterviewSessionPage'));
const ConfidencePage = lazy(() => import('./modules/confidence/pages/ConfidencePage'));
const SimulationPage = lazy(() => import('./modules/simulation/pages/SimulationPage'));
const SettingsPage = lazy(() => import('./modules/settings/pages/SettingsPage'));
const LoginPage = lazy(() => import('./modules/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('./modules/auth/pages/RegisterPage'));
const AuthCallbackPage = lazy(() => import('./modules/auth/pages/AuthCallbackPage'));
const DocsPage = lazy(() => import('./modules/docs/pages/DocsPage'));
const PartnersPage = lazy(() => import('./modules/partners/pages/PartnersPage'));

function PageFallback() {
  return (
    <div className="flex min-h-[320px] items-center justify-center px-6 py-12" role="status" aria-live="polite">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-stone-200 border-t-primary-500" />
      <span className="sr-only">Loading page</span>
    </div>
  );
}

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
      <Suspense fallback={<PageFallback />}>
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
            <Route element={<Layout />}>
              <Route path="/home" element={<Navigate to="/dashboard" replace />} />
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
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
      <AvoraChatWidget />
    </div>
  );
}

export default App;
