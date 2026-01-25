/**
 * Sommer's Proposal System - Dashboard Layout
 * Complete layout with sidebar navigation and top bar
 */

import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import {
  LayoutDashboard,
  FileText,
  Users,
  Kanban,
  Calendar,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Plus,
  ChevronDown,
  Building2,
  Percent,
  Video,
  Package,
  FileBarChart,
  CheckSquare,
  Globe,
  Code,
  Shield,
  Sparkles,
  Cloud,
  Calculator,
  Image,
  CreditCard,
  Plug,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Avatar, Badge, SearchInput } from '@/components/ui';

// ============================================================================
// NAVIGATION CONFIG
// ============================================================================

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  children?: NavItem[];
  permission?: string;
}

const mainNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Proposals', href: '/proposals', icon: FileText, badge: 'New' },
  { label: 'Clients', href: '/clients', icon: Users },
  { label: 'Pipeline', href: '/pipeline', icon: Kanban },
  { label: 'Scheduling', href: '/scheduling', icon: Calendar },
  { label: 'Discounts', href: '/discounts', icon: Percent },
];

const advancedNavItems: NavItem[] = [
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Reports', href: '/reports', icon: FileBarChart, permission: 'view_analytics' },
  { label: 'Video Proposals', href: '/video-proposals', icon: Video },
  { label: 'Inventory', href: '/inventory', icon: Package },
  { label: 'Approvals', href: '/approvals', icon: CheckSquare },
  { label: 'Integrations', href: '/integrations', icon: Plug },
];

const enhancementNavItems: NavItem[] = [
  { label: 'Weather', href: '/weather', icon: Cloud },
  { label: 'Materials', href: '/materials', icon: Calculator },
  { label: 'Gallery', href: '/gallery', icon: Image },
  { label: 'Payment Plans', href: '/payment-plans', icon: CreditCard },
];

const adminNavItems: NavItem[] = [
  { label: 'Team', href: '/team', icon: Users, permission: 'manage_team' },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'API', href: '/developer', icon: Code, permission: 'manage_settings' },
  { label: 'Compliance', href: '/compliance', icon: Shield, permission: 'manage_settings' },
  { label: 'AI Assistant', href: '/ai', icon: Sparkles },
];

// ============================================================================
// SIDEBAR COMPONENT
// ============================================================================

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { hasPermission, organization } = useAuth();
  const [expandedSections, setExpandedSections] = useState<string[]>(['main', 'advanced']);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const renderNavItem = (item: NavItem) => {
    if (item.permission && !hasPermission(item.permission)) return null;

    return (
      <Link
        key={item.href}
        to={item.href}
        onClick={onClose}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
          isActive(item.href)
            ? 'bg-brand-red/10 text-brand-red dark:bg-brand-red/20'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
        )}
      >
        <item.icon className="h-5 w-5" />
        <span className="flex-1">{item.label}</span>
        {item.badge && (
          <Badge variant="default" className="text-2xs">
            {item.badge}
          </Badge>
        )}
      </Link>
    );
  };

  const renderSection = (title: string, items: NavItem[], sectionKey: string) => {
    const filteredItems = items.filter(
      (item) => !item.permission || hasPermission(item.permission)
    );
    if (filteredItems.length === 0) return null;

    const isExpanded = expandedSections.includes(sectionKey);

    return (
      <div className="mb-4">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 dark:hover:text-gray-300"
        >
          {title}
          <ChevronDown className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')} />
        </button>
        {isExpanded && <nav className="space-y-1">{filteredItems.map(renderNavItem)}</nav>}
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red text-white font-display text-xl">
                S
              </div>
              <div className="flex flex-col">
                <span className="font-display text-lg text-gray-900 dark:text-white">
                  {organization?.name || "Sommer's"}
                </span>
                <span className="text-2xs text-gray-500 dark:text-gray-400">Proposal System</span>
              </div>
            </Link>
            <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Action */}
          <div className="p-4">
            <Link to="/proposals/new">
              <Button className="w-full" leftIcon={<Plus className="h-4 w-4" />}>
                New Proposal
              </Button>
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-3 pb-4">
            {renderSection('Main', mainNavItems, 'main')}
            {renderSection('Advanced', advancedNavItems, 'advanced')}
            {renderSection('Industry Tools', enhancementNavItems, 'enhancements')}
            {renderSection('Admin', adminNavItems, 'admin')}
          </div>

          {/* Help */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              to="/help"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <HelpCircle className="h-5 w-5" />
              <span>Help & Support</span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

// ============================================================================
// TOP BAR COMPONENT
// ============================================================================

interface TopBarProps {
  onMenuClick: () => void;
}

function TopBar({ onMenuClick }: TopBarProps) {
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const { user, organization } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/sign-in');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 lg:px-6">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Search */}
        <div className="hidden md:block w-64 lg:w-96">
          <SearchInput placeholder="Search proposals, clients..." />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Quick actions */}
        <Link to="/proposals/new" className="hidden sm:block">
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
            New Proposal
          </Button>
        </Link>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-brand-red rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 animate-scale-in">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                  No new notifications
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Avatar
              src={clerkUser?.imageUrl}
              alt={user?.firstName || 'User'}
              fallback={user?.firstName?.[0] || 'U'}
              size="sm"
            />
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user?.role || 'User'}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 animate-scale-in">
              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <p className="font-medium text-gray-900 dark:text-white">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
              <div className="p-2">
                <Link
                  to="/settings/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ============================================================================
// DASHBOARD LAYOUT
// ============================================================================

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
