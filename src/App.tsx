/**
 * Sommer's Proposal System - App Router Configuration
 * Main application routing with all pages and layouts
 */

import { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingScreen from '@/components/ui/LoadingScreen';

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Proposals = lazy(() => import('@/pages/Proposals'));
const NewProposal = lazy(() => import('@/pages/NewProposal'));
const ProposalView = lazy(() => import('@/pages/ProposalView'));
const ProposalEdit = lazy(() => import('@/pages/ProposalEdit'));
const Clients = lazy(() => import('@/pages/Clients'));
const ClientDetail = lazy(() => import('@/pages/ClientDetail'));
const Templates = lazy(() => import('@/pages/Templates'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const Settings = lazy(() => import('@/pages/Settings'));
const Team = lazy(() => import('@/pages/Team'));
const Pipeline = lazy(() => import('@/pages/Pipeline'));
const Scheduling = lazy(() => import('@/pages/Scheduling'));
const Integrations = lazy(() => import('@/pages/Integrations'));
const VideoProposals = lazy(() => import('@/pages/VideoProposals'));
const Inventory = lazy(() => import('@/pages/Inventory'));
const Reports = lazy(() => import('@/pages/Reports'));
const AIInsights = lazy(() => import('@/pages/AIInsights'));

// Discount pages
const DiscountsPage = lazy(() => import('@/pages/DiscountsPage'));
const DiscountCodesPage = lazy(() => import('@/pages/discounts/DiscountCodesPage'));
const LoyaltyProgramPage = lazy(() => import('@/pages/discounts/LoyaltyProgramPage'));
const SeasonalCampaignsPage = lazy(() => import('@/pages/discounts/SeasonalCampaignsPage'));
const DiscountApprovalsPage = lazy(() => import('@/pages/discounts/DiscountApprovalsPage'));

// Auth pages
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));

// Client portal (public)
const ClientPortal = lazy(() => import('@/pages/portal/ClientPortal'));
const ProposalPublicView = lazy(() => import('@/pages/portal/ProposalPublicView'));

// Error pages
const NotFound = lazy(() => import('@/pages/errors/NotFound'));

// ============================================================================
// PROTECTED ROUTE WRAPPER
// ============================================================================

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardLayout>
      <Suspense fallback={<LoadingScreen />}>
        <Outlet />
      </Suspense>
    </DashboardLayout>
  );
}

// ============================================================================
// PUBLIC ROUTE WRAPPER
// ============================================================================

function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  );
}

// ============================================================================
// ROUTER CONFIGURATION
// ============================================================================

const router = createBrowserRouter([
  // Public routes (auth)
  {
    element: <PublicRoute />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
    ],
  },

  // Client portal (public)
  {
    path: '/portal',
    children: [
      { index: true, element: <ClientPortal /> },
      { path: 'proposal/:proposalId', element: <ProposalPublicView /> },
    ],
  },

  // Protected routes (dashboard)
  {
    element: <ProtectedRoute />,
    children: [
      // Main
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: <Dashboard /> },

      // Proposals
      { path: '/proposals', element: <Proposals /> },
      { path: '/proposals/new', element: <NewProposal /> },
      { path: '/proposals/:id', element: <ProposalView /> },
      { path: '/proposals/:id/edit', element: <ProposalEdit /> },

      // Clients
      { path: '/clients', element: <Clients /> },
      { path: '/clients/:id', element: <ClientDetail /> },

      // Templates
      { path: '/templates', element: <Templates /> },

      // Analytics & Reports
      { path: '/analytics', element: <Analytics /> },
      { path: '/reports', element: <Reports /> },
      { path: '/ai-insights', element: <AIInsights /> },

      // CRM & Pipeline
      { path: '/pipeline', element: <Pipeline /> },

      // Scheduling
      { path: '/scheduling', element: <Scheduling /> },

      // Inventory
      { path: '/inventory', element: <Inventory /> },

      // Video Proposals
      { path: '/video-proposals', element: <VideoProposals /> },

      // ===== DISCOUNTS ROUTES =====
      {
        path: '/discounts',
        children: [
          { index: true, element: <DiscountsPage /> },
          { path: 'codes', element: <DiscountCodesPage /> },
          { path: 'loyalty', element: <LoyaltyProgramPage /> },
          { path: 'seasonal', element: <SeasonalCampaignsPage /> },
          { path: 'approvals', element: <DiscountApprovalsPage /> },
        ],
      },

      // Team & Settings
      { path: '/team', element: <Team /> },
      { path: '/settings', element: <Settings /> },
      { path: '/integrations', element: <Integrations /> },
    ],
  },

  // 404
  { path: '*', element: <NotFound /> },
]);

// ============================================================================
// APP COMPONENT
// ============================================================================

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#f9fafb',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#f9fafb',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f9fafb',
            },
          },
        }}
      />
    </AuthProvider>
  );
}

// ============================================================================
// SIDEBAR NAVIGATION CONFIG (for DashboardLayout)
// ============================================================================

export const sidebarNavigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    name: 'Proposals',
    href: '/proposals',
    icon: 'FileText',
    badge: 'proposalCount',
  },
  {
    name: 'Clients',
    href: '/clients',
    icon: 'Users',
  },
  {
    name: 'Pipeline',
    href: '/pipeline',
    icon: 'Kanban',
  },
  {
    name: 'Scheduling',
    href: '/scheduling',
    icon: 'Calendar',
  },
  {
    name: 'Templates',
    href: '/templates',
    icon: 'LayoutTemplate',
  },
  // ===== DISCOUNTS IN SIDEBAR =====
  {
    name: 'Discounts',
    href: '/discounts',
    icon: 'Tag',
    badge: 'pendingApprovals',
    children: [
      { name: 'All Discounts', href: '/discounts' },
      { name: 'Promo Codes', href: '/discounts/codes' },
      { name: 'Loyalty Program', href: '/discounts/loyalty' },
      { name: 'Seasonal', href: '/discounts/seasonal' },
      { name: 'Approvals', href: '/discounts/approvals', badge: 'pendingApprovals' },
    ],
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: 'Package',
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: 'BarChart3',
    children: [
      { name: 'Overview', href: '/analytics' },
      { name: 'Reports', href: '/reports' },
      { name: 'AI Insights', href: '/ai-insights' },
    ],
  },
  {
    name: 'Team',
    href: '/team',
    icon: 'UserCog',
  },
  {
    name: 'Integrations',
    href: '/integrations',
    icon: 'Plug',
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: 'Settings',
  },
];
