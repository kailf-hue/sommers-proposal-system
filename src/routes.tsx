/**
 * Sommer's Proposal System - Application Routes
 * Complete route configuration for Phases 1-50
 */

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// ============================================================================
// LAZY LOADED PAGES
// ============================================================================

// Auth
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'));

// Dashboard
const Dashboard = lazy(() => import('@/pages/Dashboard'));

// Proposals (Phases 1-10)
const ProposalsList = lazy(() => import('@/pages/proposals/ProposalsList'));
const ProposalCreate = lazy(() => import('@/pages/proposals/ProposalCreate'));
const ProposalEdit = lazy(() => import('@/pages/proposals/ProposalEdit'));
const ProposalPreview = lazy(() => import('@/pages/proposals/ProposalPreview'));
const ProposalView = lazy(() => import('@/pages/proposals/ProposalView'));

// Clients (Phases 11-15)
const ClientsList = lazy(() => import('@/pages/clients/ClientsList'));
const ClientCreate = lazy(() => import('@/pages/clients/ClientCreate'));
const ClientEdit = lazy(() => import('@/pages/clients/ClientEdit'));
const ClientDetail = lazy(() => import('@/pages/clients/ClientDetail'));

// Payments (Phases 16-20)
const PaymentsList = lazy(() => import('@/pages/payments/PaymentsList'));
const PaymentDetail = lazy(() => import('@/pages/payments/PaymentDetail'));

// Analytics (Phases 21-25)
const Analytics = lazy(() => import('@/pages/Analytics'));

// Team (Phases 26-28)
const TeamSettings = lazy(() => import('@/pages/settings/TeamSettings'));

// SaaS Features (Phases 29-40)
const AIInsights = lazy(() => import('@/pages/AIInsights'));
const Branding = lazy(() => import('@/pages/Branding'));
const ContentBlocks = lazy(() => import('@/pages/ContentBlocks'));
const Automations = lazy(() => import('@/pages/Automations'));
const Billing = lazy(() => import('@/pages/Billing'));

// CRM & Pipeline (Phases 41-42)
const CRMDashboard = lazy(() => import('@/pages/CRMDashboard'));
const PipelineForecasting = lazy(() => import('@/pages/PipelineForecasting'));

// Advanced Analytics (Phase 43)
const AdvancedAnalytics = lazy(() => import('@/pages/AdvancedAnalytics'));

// E-Signature (Phase 44)
const ESignatureSettings = lazy(() => import('@/pages/ESignatureSettings'));

// White Label (Phase 45)
const WhiteLabelSettings = lazy(() => import('@/pages/WhiteLabelSettings'));

// API & Integrations (Phases 46-47)
const APISettings = lazy(() => import('@/pages/APISettings'));
const IntegrationsHub = lazy(() => import('@/pages/IntegrationsHub'));

// AI Pricing (Phases 48-49)
const AIPricing = lazy(() => import('@/pages/AIPricing'));

// Settings
const GeneralSettings = lazy(() => import('@/pages/settings/GeneralSettings'));
const ProfileSettings = lazy(() => import('@/pages/settings/ProfileSettings'));
const NotificationSettings = lazy(() => import('@/pages/settings/NotificationSettings'));

// Public Pages
const PublicProposal = lazy(() => import('@/pages/public/PublicProposal'));
const ProposalAccept = lazy(() => import('@/pages/public/ProposalAccept'));
const PaymentPage = lazy(() => import('@/pages/public/PaymentPage'));

// Error Pages
const NotFound = lazy(() => import('@/pages/errors/NotFound'));
const Unauthorized = lazy(() => import('@/pages/errors/Unauthorized'));

// ============================================================================
// ROUTE GUARDS
// ============================================================================

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// ============================================================================
// ROUTE CONFIGURATION
// ============================================================================

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <Routes>
        {/* ================================================================ */}
        {/* PUBLIC ROUTES */}
        {/* ================================================================ */}
        
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* Public Proposal/Payment Pages */}
        <Route path="/p/:proposalId" element={<PublicProposal />} />
        <Route path="/p/:proposalId/accept" element={<ProposalAccept />} />
        <Route path="/p/:proposalId/pay" element={<PaymentPage />} />

        {/* ================================================================ */}
        {/* PRIVATE ROUTES */}
        {/* ================================================================ */}
        
        <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          {/* Dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Proposals */}
          <Route path="/proposals" element={<ProposalsList />} />
          <Route path="/proposals/new" element={<ProposalCreate />} />
          <Route path="/proposals/:id" element={<ProposalDetail />} />
          <Route path="/proposals/:id/edit" element={<ProposalEdit />} />
          <Route path="/proposals/:id/preview" element={<ProposalPreview />} />

          {/* Clients */}
          <Route path="/clients" element={<ClientsList />} />
          <Route path="/clients/new" element={<ClientCreate />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/clients/:id/edit" element={<ClientEdit />} />

          {/* Payments */}
          <Route path="/payments" element={<PaymentsList />} />
          <Route path="/payments/:id" element={<PaymentDetail />} />

          {/* Analytics */}
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/analytics/advanced" element={<AdvancedAnalytics />} />

          {/* CRM & Pipeline (Phases 41-42) */}
          <Route path="/crm" element={<CRMDashboard />} />
          <Route path="/pipeline" element={<PipelineForecasting />} />

          {/* AI Features (Phases 29-40, 48-49) */}
          <Route path="/ai" element={<AIInsights />} />
          <Route path="/ai/pricing" element={<AIPricing />} />

          {/* Content & Branding */}
          <Route path="/content-blocks" element={<ContentBlocks />} />
          <Route path="/branding" element={<Branding />} />
          <Route path="/automations" element={<Automations />} />

          {/* Integrations (Phases 46-47) */}
          <Route path="/integrations" element={<IntegrationsHub />} />

          {/* Settings */}
          <Route path="/settings" element={<GeneralSettings />} />
          <Route path="/settings/profile" element={<ProfileSettings />} />
          <Route path="/settings/team" element={<TeamSettings />} />
          <Route path="/settings/notifications" element={<NotificationSettings />} />
          <Route path="/settings/billing" element={<Billing />} />
          <Route path="/settings/api" element={<APISettings />} />
          <Route path="/settings/esignature" element={<ESignatureSettings />} />
          <Route path="/settings/white-label" element={<WhiteLabelSettings />} />
        </Route>

        {/* ================================================================ */}
        {/* ERROR ROUTES */}
        {/* ================================================================ */}
        
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

// Placeholder component for proposal detail (redirects to edit for now)
function ProposalDetail() {
  return <Navigate to="edit" replace />;
}

// ============================================================================
// NAVIGATION CONFIG (for sidebar)
// ============================================================================

export const navigationConfig = {
  main: [
    { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    { name: 'Proposals', href: '/proposals', icon: 'FileText' },
    { name: 'Clients', href: '/clients', icon: 'Users' },
    { name: 'Payments', href: '/payments', icon: 'CreditCard' },
  ],
  analytics: [
    { name: 'Overview', href: '/analytics', icon: 'BarChart3' },
    { name: 'Advanced', href: '/analytics/advanced', icon: 'TrendingUp', plan: 'pro' },
    { name: 'CRM Dashboard', href: '/crm', icon: 'Target', plan: 'pro' },
    { name: 'Pipeline', href: '/pipeline', icon: 'GitBranch', plan: 'business' },
  ],
  tools: [
    { name: 'AI Assistant', href: '/ai', icon: 'Bot', plan: 'pro' },
    { name: 'AI Pricing', href: '/ai/pricing', icon: 'Brain', plan: 'business' },
    { name: 'Content Blocks', href: '/content-blocks', icon: 'Layers' },
    { name: 'Automations', href: '/automations', icon: 'Zap', plan: 'pro' },
    { name: 'Integrations', href: '/integrations', icon: 'Plug', plan: 'pro' },
  ],
  settings: [
    { name: 'General', href: '/settings', icon: 'Settings' },
    { name: 'Team', href: '/settings/team', icon: 'UserCog' },
    { name: 'Branding', href: '/branding', icon: 'Palette' },
    { name: 'Billing', href: '/settings/billing', icon: 'Receipt' },
    { name: 'API', href: '/settings/api', icon: 'Key', plan: 'business' },
    { name: 'E-Signature', href: '/settings/esignature', icon: 'PenTool', plan: 'pro' },
    { name: 'White Label', href: '/settings/white-label', icon: 'Award', plan: 'enterprise' },
  ],
};
