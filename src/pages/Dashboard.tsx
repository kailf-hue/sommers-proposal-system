/**
 * Sommer's Proposal System - Dashboard Page
 * Main dashboard with metrics, recent activity, and quick actions
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Cloud,
  Percent,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Avatar,
  Progress,
  Skeleton,
} from '@/components/ui';
import { cn, formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// ============================================================================
// TYPES
// ============================================================================

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: React.ElementType;
  href?: string;
}

interface RecentProposal {
  id: string;
  proposalNumber: string;
  clientName: string;
  total: number;
  status: string;
  createdAt: string;
}

interface UpcomingJob {
  id: string;
  title: string;
  clientName: string;
  scheduledDate: string;
  crewName: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockMetrics: MetricCard[] = [
  {
    title: 'Total Proposals',
    value: 156,
    change: 12.5,
    changeLabel: 'vs last month',
    icon: FileText,
    href: '/proposals',
  },
  {
    title: 'Active Clients',
    value: 89,
    change: 8.2,
    changeLabel: 'vs last month',
    icon: Users,
    href: '/clients',
  },
  {
    title: 'Revenue (MTD)',
    value: '$127,450',
    change: 23.1,
    changeLabel: 'vs last month',
    icon: DollarSign,
    href: '/analytics',
  },
  {
    title: 'Win Rate',
    value: '68%',
    change: 5.4,
    changeLabel: 'vs last month',
    icon: TrendingUp,
    href: '/analytics',
  },
];

const mockRecentProposals: RecentProposal[] = [
  { id: '1', proposalNumber: 'SOM-2026-0156', clientName: 'Acme Corporation', total: 12500, status: 'sent', createdAt: '2026-01-23T10:00:00Z' },
  { id: '2', proposalNumber: 'SOM-2026-0155', clientName: 'Smith Properties', total: 8750, status: 'viewed', createdAt: '2026-01-22T15:30:00Z' },
  { id: '3', proposalNumber: 'SOM-2026-0154', clientName: 'Downtown Mall LLC', total: 45000, status: 'accepted', createdAt: '2026-01-22T09:00:00Z' },
  { id: '4', proposalNumber: 'SOM-2026-0153', clientName: 'City School District', total: 28000, status: 'pending_review', createdAt: '2026-01-21T14:00:00Z' },
  { id: '5', proposalNumber: 'SOM-2026-0152', clientName: 'Green Valley HOA', total: 15600, status: 'rejected', createdAt: '2026-01-21T11:00:00Z' },
];

const mockUpcomingJobs: UpcomingJob[] = [
  { id: '1', title: 'Parking Lot Sealcoating', clientName: 'Acme Corporation', scheduledDate: '2026-01-25', crewName: 'Crew Alpha' },
  { id: '2', title: 'Crack Filling', clientName: 'Smith Properties', scheduledDate: '2026-01-26', crewName: 'Crew Beta' },
  { id: '3', title: 'Line Striping', clientName: 'Downtown Mall LLC', scheduledDate: '2026-01-27', crewName: 'Crew Alpha' },
];

const mockRevenueData = [
  { name: 'Jan', revenue: 45000, proposals: 12 },
  { name: 'Feb', revenue: 52000, proposals: 15 },
  { name: 'Mar', revenue: 48000, proposals: 14 },
  { name: 'Apr', revenue: 61000, proposals: 18 },
  { name: 'May', revenue: 55000, proposals: 16 },
  { name: 'Jun', revenue: 67000, proposals: 20 },
  { name: 'Jul', revenue: 72000, proposals: 22 },
  { name: 'Aug', revenue: 85000, proposals: 25 },
  { name: 'Sep', revenue: 78000, proposals: 23 },
  { name: 'Oct', revenue: 92000, proposals: 28 },
  { name: 'Nov', revenue: 88000, proposals: 26 },
  { name: 'Dec', revenue: 127450, proposals: 32 },
];

const mockPipelineData = [
  { name: 'Lead', value: 12, color: '#6B7280' },
  { name: 'Qualified', value: 8, color: '#3B82F6' },
  { name: 'Proposal', value: 15, color: '#8B5CF6' },
  { name: 'Negotiation', value: 6, color: '#F59E0B' },
  { name: 'Won', value: 24, color: '#22C55E' },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: FileText },
  pending_review: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-800', icon: FileText },
  viewed: { label: 'Viewed', color: 'bg-purple-100 text-purple-800', icon: Eye },
  accepted: { label: 'Accepted', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function Dashboard() {
  const { user, organization } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {greeting()}, {user?.firstName || 'there'}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Here's what's happening with your business today.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/proposals/new">
            <Button leftIcon={<Plus className="h-4 w-4" />}>New Proposal</Button>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockMetrics.map((metric) => (
          <MetricCardComponent key={metric.title} metric={metric} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue for the past year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockRevenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C41E3A" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#C41E3A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(value) => `$${value / 1000}k`} />
                  <Tooltip
                    contentStyle={{ background: '#1F2937', border: 'none', borderRadius: '8px', color: '#F9FAFB' }}
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#C41E3A" strokeWidth={2} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Status</CardTitle>
            <CardDescription>Current deal distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockPipelineData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {mockPipelineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1F2937', border: 'none', borderRadius: '8px', color: '#F9FAFB' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {mockPipelineData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Proposals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Proposals</CardTitle>
              <CardDescription>Latest proposal activity</CardDescription>
            </div>
            <Link to="/proposals">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentProposals.map((proposal) => {
                const status = statusConfig[proposal.status] || statusConfig.draft;
                const StatusIcon = status.icon;
                return (
                  <Link
                    key={proposal.id}
                    to={`/proposals/${proposal.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-lg', status.color)}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{proposal.clientName}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{proposal.proposalNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(proposal.total)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{formatRelativeTime(proposal.createdAt)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Jobs</CardTitle>
              <CardDescription>Scheduled work this week</CardDescription>
            </div>
            <Link to="/scheduling">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockUpcomingJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{job.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{job.clientName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(job.scheduledDate)}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{job.crewName}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <QuickActionCard
          href="/proposals/new"
          icon={FileText}
          title="New Proposal"
          description="Create a proposal"
          color="bg-brand-red"
        />
        <QuickActionCard
          href="/clients/new"
          icon={Users}
          title="Add Client"
          description="Add a new client"
          color="bg-blue-500"
        />
        <QuickActionCard
          href="/scheduling"
          icon={Calendar}
          title="Schedule Job"
          description="Book a job"
          color="bg-green-500"
        />
        <QuickActionCard
          href="/discounts"
          icon={Percent}
          title="Discounts"
          description="Manage discounts"
          color="bg-purple-500"
        />
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function MetricCardComponent({ metric }: { metric: MetricCard }) {
  const isPositive = metric.change >= 0;
  const Icon = metric.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="p-2 rounded-lg bg-brand-red/10">
            <Icon className="h-5 w-5 text-brand-red" />
          </div>
          <div className={cn(
            'flex items-center gap-1 text-sm font-medium',
            isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            {Math.abs(metric.change)}%
          </div>
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{metric.title}</p>
        </div>
        {metric.href && (
          <Link
            to={metric.href}
            className="inline-flex items-center gap-1 mt-3 text-sm text-brand-red hover:underline"
          >
            View details
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
  color,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <Link to={href}>
      <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer">
        <CardContent className="pt-6 text-center">
          <div className={cn('inline-flex p-3 rounded-xl text-white mb-3', color)}>
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-4 w-12" />
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
