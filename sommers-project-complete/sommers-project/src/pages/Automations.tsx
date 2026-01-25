/**
 * Sommer's Proposal System - Automations Page
 * Configure automated workflows and triggers
 */

import { useState, useEffect } from 'react';
import {
  Zap,
  Plus,
  Search,
  Play,
  Pause,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Clock,
  Mail,
  MessageSquare,
  Bell,
  Webhook,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
  FileText,
  Eye,
  DollarSign,
  UserPlus,
  Calendar,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Badge,
  Skeleton,
  Switch,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  triggerType: string;
  triggerLabel: string;
  actions: { type: string; label: string }[];
  isActive: boolean;
  executionCount: number;
  lastExecuted: string | null;
  successRate: number;
  createdAt: string;
}

interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  triggerType: string;
  popularity: number;
}

interface ExecutionLog {
  id: string;
  ruleId: string;
  ruleName: string;
  status: 'completed' | 'failed' | 'partial';
  triggeredBy: string;
  executedAt: string;
  duration: number;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockRules: AutomationRule[] = [
  {
    id: '1',
    name: 'Follow-up Reminder',
    description: 'Send reminder 3 days after proposal sent if not viewed',
    triggerType: 'time_elapsed',
    triggerLabel: '3 days after proposal sent',
    actions: [{ type: 'send_email', label: 'Send reminder email' }],
    isActive: true,
    executionCount: 156,
    lastExecuted: '2026-01-23T10:30:00Z',
    successRate: 98,
    createdAt: '2025-11-01',
  },
  {
    id: '2',
    name: 'View Notification',
    description: 'Notify sales rep when proposal is viewed',
    triggerType: 'proposal_viewed',
    triggerLabel: 'When proposal is viewed',
    actions: [{ type: 'send_email', label: 'Email notification' }, { type: 'slack_notify', label: 'Slack message' }],
    isActive: true,
    executionCount: 423,
    lastExecuted: '2026-01-23T09:15:00Z',
    successRate: 100,
    createdAt: '2025-10-15',
  },
  {
    id: '3',
    name: 'Win Celebration',
    description: 'Send thank you and create onboarding task when signed',
    triggerType: 'proposal_signed',
    triggerLabel: 'When proposal is signed',
    actions: [{ type: 'send_email', label: 'Thank you email' }, { type: 'create_task', label: 'Create onboarding task' }],
    isActive: true,
    executionCount: 89,
    lastExecuted: '2026-01-22T16:45:00Z',
    successRate: 97,
    createdAt: '2025-09-20',
  },
  {
    id: '4',
    name: 'Lost Deal Follow-up',
    description: 'Request feedback when proposal is rejected',
    triggerType: 'proposal_rejected',
    triggerLabel: 'When proposal is rejected',
    actions: [{ type: 'send_email', label: 'Feedback request' }],
    isActive: false,
    executionCount: 34,
    lastExecuted: '2026-01-20T11:00:00Z',
    successRate: 95,
    createdAt: '2025-12-01',
  },
];

const mockTemplates: AutomationTemplate[] = [
  { id: '1', name: 'Basic Follow-Up Sequence', description: 'Send reminders at 3, 7, and 14 days', category: 'follow_up', triggerType: 'time_elapsed', popularity: 89 },
  { id: '2', name: 'View Alert', description: 'Get notified instantly when proposals are viewed', category: 'notification', triggerType: 'proposal_viewed', popularity: 76 },
  { id: '3', name: 'Welcome Sequence', description: 'Onboard new clients after signing', category: 'onboarding', triggerType: 'proposal_signed', popularity: 65 },
  { id: '4', name: 'Payment Reminder', description: 'Send payment reminders for due invoices', category: 'payment', triggerType: 'time_elapsed', popularity: 54 },
  { id: '5', name: 'Win/Loss Analysis', description: 'Track and analyze deal outcomes', category: 'analytics', triggerType: 'proposal_signed', popularity: 43 },
];

const mockLogs: ExecutionLog[] = [
  { id: '1', ruleId: '2', ruleName: 'View Notification', status: 'completed', triggeredBy: 'Acme Corp viewed proposal', executedAt: '2026-01-23T10:30:00Z', duration: 1.2 },
  { id: '2', ruleId: '1', ruleName: 'Follow-up Reminder', status: 'completed', triggeredBy: 'Timer: 3 days elapsed', executedAt: '2026-01-23T09:00:00Z', duration: 2.5 },
  { id: '3', ruleId: '3', ruleName: 'Win Celebration', status: 'completed', triggeredBy: 'Smith Properties signed', executedAt: '2026-01-22T16:45:00Z', duration: 3.1 },
  { id: '4', ruleId: '2', ruleName: 'View Notification', status: 'failed', triggeredBy: 'Downtown Mall viewed', executedAt: '2026-01-22T14:20:00Z', duration: 0.5 },
  { id: '5', ruleId: '1', ruleName: 'Follow-up Reminder', status: 'completed', triggeredBy: 'Timer: 3 days elapsed', executedAt: '2026-01-22T09:00:00Z', duration: 2.1 },
];

const triggerIcons: Record<string, React.ElementType> = {
  proposal_created: FileText,
  proposal_sent: Mail,
  proposal_viewed: Eye,
  proposal_signed: CheckCircle,
  proposal_rejected: XCircle,
  payment_received: DollarSign,
  client_created: UserPlus,
  time_elapsed: Clock,
  scheduled: Calendar,
};

const actionIcons: Record<string, React.ElementType> = {
  send_email: Mail,
  send_reminder: Bell,
  send_sms: MessageSquare,
  create_task: CheckCircle,
  webhook: Webhook,
  slack_notify: MessageSquare,
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function Automations() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [templates, setTemplates] = useState<AutomationTemplate[]>([]);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AutomationTemplate | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRules(mockRules);
      setTemplates(mockTemplates);
      setLogs(mockLogs);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const toggleRule = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === ruleId ? { ...r, isActive: !r.isActive } : r
      )
    );
  };

  const filteredRules = rules.filter(
    (rule) =>
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: rules.length,
    active: rules.filter((r) => r.isActive).length,
    totalExecutions: rules.reduce((sum, r) => sum + r.executionCount, 0),
    avgSuccessRate: Math.round(
      rules.reduce((sum, r) => sum + r.successRate, 0) / rules.length
    ),
  };

  if (isLoading) {
    return <AutomationsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-7 h-7 text-brand-red" />
            Automations
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Automate your workflow with triggers and actions
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Create Automation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Automations"
          value={stats.total}
          icon={Zap}
          color="blue"
        />
        <StatCard
          label="Active"
          value={stats.active}
          icon={Play}
          color="green"
        />
        <StatCard
          label="Total Executions"
          value={stats.totalExecutions.toLocaleString()}
          icon={Activity}
          color="purple"
        />
        <StatCard
          label="Success Rate"
          value={`${stats.avgSuccessRate}%`}
          icon={CheckCircle}
          color="amber"
        />
      </div>

      <Tabs defaultValue="rules">
        <TabsList>
          <TabsTrigger value="rules">My Automations</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="logs">Execution Log</TabsTrigger>
        </TabsList>

        {/* Rules Tab */}
        <TabsContent value="rules" className="mt-6 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search automations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-4">
            {filteredRules.map((rule) => (
              <RuleCard key={rule.id} rule={rule} onToggle={() => toggleRule(rule.id)} />
            ))}
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={() => {
                  setSelectedTemplate(template);
                  setShowCreateDialog(true);
                }}
              />
            ))}
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
              <CardDescription>Last 50 automation runs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {logs.map((log) => (
                  <LogItem key={log.id} log={log} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? `Create from: ${selectedTemplate.name}` : 'Create Automation'}
            </DialogTitle>
            <DialogDescription>
              Set up automated actions that trigger based on events
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <label className="text-sm font-medium">Automation Name</label>
              <Input
                placeholder="e.g., Follow-up Reminder"
                className="mt-1"
                defaultValue={selectedTemplate?.name || ''}
              />
            </div>

            <div>
              <label className="text-sm font-medium">When this happens (Trigger)</label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {Object.entries(triggerIcons).slice(0, 6).map(([key, Icon]) => (
                  <button
                    key={key}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border text-left transition-colors',
                      selectedTemplate?.triggerType === key
                        ? 'border-brand-red bg-brand-red/5'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    )}
                  >
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                      <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <span className="text-sm font-medium capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Do this (Actions)</label>
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium flex-1">Send Email</span>
                  <Button variant="ghost" size="sm">Configure</Button>
                </div>
                <Button variant="outline" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                  Add Action
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setSelectedTemplate(null);
            }}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowCreateDialog(false);
              setSelectedTemplate(null);
            }}>
              Create Automation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
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
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', colorClasses[color])}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RuleCard({ rule, onToggle }: { rule: AutomationRule; onToggle: () => void }) {
  const TriggerIcon = triggerIcons[rule.triggerType] || Zap;

  return (
    <Card className={cn(!rule.isActive && 'opacity-60')}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className={cn(
            'p-3 rounded-lg',
            rule.isActive
              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          )}>
            <TriggerIcon className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">{rule.name}</h3>
              <div className="flex items-center gap-3">
                <Switch checked={rule.isActive} onCheckedChange={onToggle} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{rule.description}</p>
            
            {/* Trigger & Actions */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Badge variant="outline" className="gap-1">
                <TriggerIcon className="w-3 h-3" />
                {rule.triggerLabel}
              </Badge>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              {rule.actions.map((action, i) => {
                const ActionIcon = actionIcons[action.type] || Zap;
                return (
                  <Badge key={i} variant="secondary" className="gap-1">
                    <ActionIcon className="w-3 h-3" />
                    {action.label}
                  </Badge>
                );
              })}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-4 text-xs text-gray-500">
              <span>{rule.executionCount.toLocaleString()} runs</span>
              <span>{rule.successRate}% success</span>
              {rule.lastExecuted && (
                <span>Last run: {new Date(rule.lastExecuted).toLocaleString()}</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TemplateCard({ template, onUse }: { template: AutomationTemplate; onUse: () => void }) {
  const TriggerIcon = triggerIcons[template.triggerType] || Zap;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <div className="p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
            <TriggerIcon className="w-5 h-5" />
          </div>
          <Badge variant="outline" className="capitalize">{template.category}</Badge>
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{template.description}</p>
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-gray-500">{template.popularity}% use this</span>
          <Button size="sm" onClick={onUse}>Use Template</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LogItem({ log }: { log: ExecutionLog }) {
  const statusConfig = {
    completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
    failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
    partial: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  };

  const config = statusConfig[log.status];
  const StatusIcon = config.icon;

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className={cn('p-2 rounded-lg', config.bg)}>
        <StatusIcon className={cn('w-4 h-4', config.color)} />
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-900 dark:text-white text-sm">{log.ruleName}</p>
        <p className="text-xs text-gray-500">{log.triggeredBy}</p>
      </div>
      <div className="text-right">
        <p className="text-xs text-gray-500">
          {new Date(log.executedAt).toLocaleString()}
        </p>
        <p className="text-xs text-gray-400">{log.duration}s</p>
      </div>
    </div>
  );
}

function AutomationsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-10 w-64" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    </div>
  );
}
