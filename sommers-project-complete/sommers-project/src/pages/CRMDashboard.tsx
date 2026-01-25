/**
 * Sommer's Proposal System - CRM Dashboard Page
 * Phase 41: Client insights, activity tracking, and relationship management
 */

import { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Clock,
  DollarSign,
  UserPlus,
  Mail,
  Eye,
  FileCheck,
  CreditCard,
  Calendar,
  Phone,
  MessageSquare,
  Star,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  RefreshCw,
  Filter,
  MoreVertical,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Skeleton,
  Avatar,
  AvatarFallback,
  Progress,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui';
import { cn, formatCurrency, formatRelativeTime } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
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

interface CRMOverview {
  totalClients: number;
  activeClients: number;
  newClientsThisMonth: number;
  clientGrowthRate: number;
  averageLifetimeValue: number;
  totalRevenue: number;
  repeatClientRate: number;
}

interface ActivityItem {
  id: string;
  type: string;
  clientName: string;
  description: string;
  createdAt: string;
}

interface TopClient {
  id: string;
  name: string;
  email: string;
  totalRevenue: number;
  proposalCount: number;
  healthScore: number;
  tags: string[];
}

interface Task {
  id: string;
  title: string;
  clientName?: string;
  assigneeName: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
}

interface ClientSegment {
  name: string;
  clientCount: number;
  totalValue: number;
  color: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockOverview: CRMOverview = {
  totalClients: 342,
  activeClients: 156,
  newClientsThisMonth: 23,
  clientGrowthRate: 12.5,
  averageLifetimeValue: 18500,
  totalRevenue: 2847500,
  repeatClientRate: 42,
};

const mockActivity: ActivityItem[] = [
  { id: '1', type: 'proposal_signed', clientName: 'Acme Corp', description: 'Signed proposal SOM-2026-0156', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: '2', type: 'proposal_viewed', clientName: 'Smith Properties', description: 'Viewed proposal 3 times', createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
  { id: '3', type: 'payment_received', clientName: 'Downtown Mall LLC', description: 'Payment of $12,500 received', createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
  { id: '4', type: 'proposal_sent', clientName: 'Johnson Realty', description: 'Proposal SOM-2026-0158 sent', createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
  { id: '5', type: 'meeting_scheduled', clientName: 'Tech Park Inc', description: 'Site visit scheduled for Jan 28', createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
  { id: '6', type: 'email_opened', clientName: 'Harbor View Plaza', description: 'Opened follow-up email', createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
];

const mockTopClients: TopClient[] = [
  { id: '1', name: 'Acme Corporation', email: 'contact@acme.com', totalRevenue: 125000, proposalCount: 8, healthScore: 92, tags: ['VIP', 'Annual Contract'] },
  { id: '2', name: 'Smith Properties', email: 'info@smithprop.com', totalRevenue: 98500, proposalCount: 6, healthScore: 85, tags: ['Repeat Client'] },
  { id: '3', name: 'Downtown Mall LLC', email: 'mgmt@dtmall.com', totalRevenue: 87200, proposalCount: 4, healthScore: 78, tags: ['Enterprise'] },
  { id: '4', name: 'Tech Park Inc', email: 'facilities@techpark.com', totalRevenue: 65000, proposalCount: 5, healthScore: 88, tags: ['Growing'] },
  { id: '5', name: 'Harbor View Plaza', email: 'pm@harborview.com', totalRevenue: 54300, proposalCount: 3, healthScore: 72, tags: [] },
];

const mockTasks: Task[] = [
  { id: '1', title: 'Follow up with Acme Corp', clientName: 'Acme Corp', assigneeName: 'John Smith', dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), priority: 'high', status: 'pending' },
  { id: '2', title: 'Site visit - Smith Properties', clientName: 'Smith Properties', assigneeName: 'Sarah Johnson', dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), priority: 'medium', status: 'pending' },
  { id: '3', title: 'Send revised proposal', clientName: 'Downtown Mall', assigneeName: 'John Smith', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), priority: 'high', status: 'in_progress' },
  { id: '4', title: 'Schedule project kickoff', clientName: 'Tech Park Inc', assigneeName: 'Mike Brown', dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), priority: 'medium', status: 'pending' },
];

const mockSegments: ClientSegment[] = [
  { name: 'VIP Clients', clientCount: 24, totalValue: 850000, color: '#F59E0B' },
  { name: 'Regular Clients', clientCount: 89, totalValue: 1200000, color: '#10B981' },
  { name: 'New Clients', clientCount: 67, totalValue: 450000, color: '#3B82F6' },
  { name: 'Prospects', clientCount: 162, totalValue: 0, color: '#8B5CF6' },
];

const mockEngagementData = [
  { date: 'Jan 18', emails: 15, views: 12, meetings: 3 },
  { date: 'Jan 19', emails: 18, views: 15, meetings: 2 },
  { date: 'Jan 20', emails: 12, views: 18, meetings: 4 },
  { date: 'Jan 21', emails: 22, views: 20, meetings: 3 },
  { date: 'Jan 22', emails: 16, views: 14, meetings: 5 },
  { date: 'Jan 23', emails: 20, views: 22, meetings: 4 },
  { date: 'Jan 24', emails: 24, views: 25, meetings: 6 },
];

const mockHealthDistribution = [
  { name: 'Excellent', value: 45, color: '#22C55E' },
  { name: 'Good', value: 78, color: '#3B82F6' },
  { name: 'Fair', value: 42, color: '#F59E0B' },
  { name: 'At Risk', value: 18, color: '#EF4444' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function CRMDashboard() {
  const { organization } = useAuth();
  const [overview, setOverview] = useState<CRMOverview | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [segments, setSegments] = useState<ClientSegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOverview(mockOverview);
      setActivity(mockActivity);
      setTopClients(mockTopClients);
      setTasks(mockTasks);
      setSegments(mockSegments);
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  if (isLoading) {
    return <CRMDashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-brand-red" />
            CRM Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Client insights and relationship management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            leftIcon={<RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />}
          >
            Refresh
          </Button>
          <Button onClick={() => window.location.href = '/clients/new'} leftIcon={<UserPlus className="w-4 h-4" />}>
            Add Client
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Clients"
            value={overview.totalClients}
            change={overview.clientGrowthRate}
            icon={Users}
            color="blue"
          />
          <StatCard
            label="Active Clients"
            value={overview.activeClients}
            subtext={`${Math.round((overview.activeClients / overview.totalClients) * 100)}% of total`}
            icon={Activity}
            color="green"
          />
          <StatCard
            label="Avg. Lifetime Value"
            value={formatCurrency(overview.averageLifetimeValue)}
            icon={DollarSign}
            color="purple"
          />
          <StatCard
            label="Repeat Client Rate"
            value={`${overview.repeatClientRate}%`}
            icon={Target}
            color="amber"
          />
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-brand-red" />
                Recent Activity
              </CardTitle>
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activity.map((item) => (
                <ActivityItemCard key={item.id} activity={item} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-red" />
                Upcoming Tasks
              </CardTitle>
              <Badge variant="secondary">{tasks.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Trends</CardTitle>
            <CardDescription>Client interactions over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockEngagementData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Area type="monotone" dataKey="emails" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} name="Emails Opened" />
                  <Area type="monotone" dataKey="views" stackId="2" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} name="Proposals Viewed" />
                  <Area type="monotone" dataKey="meetings" stackId="3" stroke="#10B981" fill="#10B981" fillOpacity={0.2} name="Meetings" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Health Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Client Health Distribution</CardTitle>
            <CardDescription>Overview of client relationship health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div className="h-48 w-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mockHealthDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {mockHealthDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {mockHealthDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Clients & Segments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clients */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                Top Clients
              </CardTitle>
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topClients.map((client, index) => (
                <TopClientCard key={client.id} client={client} rank={index + 1} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Client Segments */}
        <Card>
          <CardHeader>
            <CardTitle>Client Segments</CardTitle>
            <CardDescription>Breakdown by customer value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {segments.map((segment) => (
                <SegmentCard key={segment.name} segment={segment} total={overview?.totalClients || 0} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatCard({
  label,
  value,
  change,
  subtext,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  change?: number;
  subtext?: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'amber';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <div className={cn('p-2 rounded-lg', colorClasses[color])}>
            <Icon className="w-5 h-5" />
          </div>
          {change !== undefined && (
            <div className={cn(
              'flex items-center gap-1 text-sm font-medium',
              change >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {subtext || label}
        </p>
      </CardContent>
    </Card>
  );
}

function ActivityItemCard({ activity }: { activity: ActivityItem }) {
  const iconConfig: Record<string, { icon: React.ElementType; color: string }> = {
    proposal_signed: { icon: FileCheck, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
    proposal_viewed: { icon: Eye, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
    payment_received: { icon: CreditCard, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
    proposal_sent: { icon: Mail, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
    meeting_scheduled: { icon: Calendar, color: 'text-pink-600 bg-pink-100 dark:bg-pink-900/30' },
    email_opened: { icon: Mail, color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30' },
    call_logged: { icon: Phone, color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30' },
    note_added: { icon: MessageSquare, color: 'text-gray-600 bg-gray-100 dark:bg-gray-800' },
  };

  const config = iconConfig[activity.type] || iconConfig.note_added;
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3">
      <div className={cn('p-2 rounded-lg', config.color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {activity.clientName}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {activity.description}
        </p>
      </div>
      <span className="text-xs text-gray-400 whitespace-nowrap">
        {formatRelativeTime(activity.createdAt)}
      </span>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const priorityColors = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-amber-100 text-amber-700',
    urgent: 'bg-red-100 text-red-700',
  };

  const dueDate = new Date(task.dueDate);
  const isOverdue = dueDate < new Date();
  const isToday = dueDate.toDateString() === new Date().toDateString();

  return (
    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</h4>
        <Badge variant="secondary" className={cn('text-xs', priorityColors[task.priority])}>
          {task.priority}
        </Badge>
      </div>
      {task.clientName && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{task.clientName}</p>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{task.assigneeName}</span>
        <span className={cn(
          'text-xs',
          isOverdue ? 'text-red-600' : isToday ? 'text-amber-600' : 'text-gray-500'
        )}>
          {isOverdue ? 'Overdue' : isToday ? 'Today' : dueDate.toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

function TopClientCard({ client, rank }: { client: TopClient; rank: number }) {
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-semibold text-gray-500">
        {rank}
      </div>
      <Avatar className="w-10 h-10">
        <AvatarFallback className="bg-brand-red/10 text-brand-red">
          {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-white truncate">{client.name}</p>
        <p className="text-xs text-gray-500">{formatCurrency(client.totalRevenue)} • {client.proposalCount} proposals</p>
      </div>
      <div className={cn('px-2 py-1 rounded text-xs font-medium', getHealthColor(client.healthScore))}>
        {client.healthScore}
      </div>
    </div>
  );
}

function SegmentCard({ segment, total }: { segment: ClientSegment; total: number }) {
  const percentage = total > 0 ? (segment.clientCount / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
          <span className="text-sm font-medium text-gray-900 dark:text-white">{segment.name}</span>
        </div>
        <span className="text-sm text-gray-500">{segment.clientCount} clients</span>
      </div>
      <Progress value={percentage} className="h-2" />
      <p className="text-xs text-gray-500 mt-1">{formatCurrency(segment.totalValue)} total value</p>
    </div>
  );
}

function CRMDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <Skeleton className="col-span-2 h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}
