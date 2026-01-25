/**
 * Sommer's Proposal System - API Settings Page
 * Developer portal for API keys and documentation
 */

import { useState, useEffect } from 'react';
import {
  Code,
  Key,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  Plus,
  ExternalLink,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Alert,
  AlertDescription,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================================
// TYPES
// ============================================================================

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  lastUsed: string | null;
  createdAt: string;
  expiresAt: string | null;
  scopes: string[];
  isActive: boolean;
}

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastDelivery: string | null;
  successRate: number;
}

interface ApiUsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgLatency: number;
  topEndpoints: { endpoint: string; count: number }[];
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockApiKeys: ApiKey[] = [
  {
    id: '1',
    name: 'Production API Key',
    prefix: 'sk_live_1234',
    lastUsed: '2026-01-23T10:30:00Z',
    createdAt: '2025-11-15',
    expiresAt: null,
    scopes: ['proposals:read', 'proposals:write', 'clients:read'],
    isActive: true,
  },
  {
    id: '2',
    name: 'Development Key',
    prefix: 'sk_test_5678',
    lastUsed: '2026-01-22T15:45:00Z',
    createdAt: '2025-12-01',
    expiresAt: '2026-06-01',
    scopes: ['proposals:read', 'clients:read'],
    isActive: true,
  },
];

const mockWebhooks: WebhookEndpoint[] = [
  {
    id: '1',
    url: 'https://example.com/webhooks/sommers',
    events: ['proposal.created', 'proposal.signed', 'payment.received'],
    isActive: true,
    lastDelivery: '2026-01-23T09:15:00Z',
    successRate: 98.5,
  },
  {
    id: '2',
    url: 'https://api.mycrm.com/hooks',
    events: ['client.created'],
    isActive: false,
    lastDelivery: '2026-01-20T12:00:00Z',
    successRate: 85.2,
  },
];

const mockUsageStats: ApiUsageStats = {
  totalRequests: 15420,
  successfulRequests: 15210,
  failedRequests: 210,
  avgLatency: 145,
  topEndpoints: [
    { endpoint: 'GET /proposals', count: 5230 },
    { endpoint: 'POST /proposals', count: 2150 },
    { endpoint: 'GET /clients', count: 3420 },
    { endpoint: 'PUT /proposals/:id', count: 1890 },
  ],
};

const availableScopes = [
  { id: 'proposals:read', name: 'Read Proposals', description: 'View proposals' },
  { id: 'proposals:write', name: 'Write Proposals', description: 'Create and update proposals' },
  { id: 'clients:read', name: 'Read Clients', description: 'View client data' },
  { id: 'clients:write', name: 'Write Clients', description: 'Create and update clients' },
  { id: 'payments:read', name: 'Read Payments', description: 'View payment data' },
  { id: 'webhooks:manage', name: 'Manage Webhooks', description: 'Configure webhooks' },
];

const availableEvents = [
  'proposal.created',
  'proposal.sent',
  'proposal.viewed',
  'proposal.signed',
  'proposal.rejected',
  'client.created',
  'client.updated',
  'payment.received',
  'payment.failed',
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function APISettings() {
  const { organization } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [usageStats, setUsageStats] = useState<ApiUsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateKeyDialog, setShowCreateKeyDialog] = useState(false);
  const [showCreateWebhookDialog, setShowCreateWebhookDialog] = useState(false);
  const [newKeyRevealed, setNewKeyRevealed] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setApiKeys(mockApiKeys);
      setWebhooks(mockWebhooks);
      setUsageStats(mockUsageStats);
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateKey = () => {
    const newKey = {
      id: Date.now().toString(),
      name: 'New API Key',
      prefix: 'sk_live_' + Math.random().toString(36).substring(7),
      lastUsed: null,
      createdAt: new Date().toISOString(),
      expiresAt: null,
      scopes: ['proposals:read'],
      isActive: true,
    };
    setApiKeys((prev) => [...prev, newKey]);
    setNewKeyRevealed('sk_live_' + Math.random().toString(36).substring(2, 34));
    setShowCreateKeyDialog(false);
  };

  const handleDeleteKey = (keyId: string) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
  };

  const handleToggleWebhook = (webhookId: string) => {
    setWebhooks((prev) =>
      prev.map((w) =>
        w.id === webhookId ? { ...w, isActive: !w.isActive } : w
      )
    );
  };

  if (isLoading) {
    return <APISettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Code className="w-7 h-7 text-brand-red" />
            API Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage API keys and webhooks for integrations
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.open('https://docs.sommersealcoating.com/api', '_blank')}
          rightIcon={<ExternalLink className="w-4 h-4" />}
        >
          API Documentation
        </Button>
      </div>

      {/* New Key Revealed Alert */}
      {newKeyRevealed && (
        <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                API Key Created Successfully
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Copy this key now. You won't be able to see it again.
              </p>
              <code className="mt-2 block p-2 bg-green-100 dark:bg-green-800 rounded text-sm font-mono">
                {newKeyRevealed}
              </code>
            </div>
            <Button
              size="sm"
              onClick={() => {
                copyToClipboard(newKeyRevealed, 'new-key');
                setNewKeyRevealed(null);
              }}
              leftIcon={<Copy className="w-4 h-4" />}
            >
              Copy & Close
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Usage Stats */}
      {usageStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Requests"
            value={usageStats.totalRequests.toLocaleString()}
            subtext="Last 30 days"
            icon={Activity}
            color="blue"
          />
          <StatCard
            label="Success Rate"
            value={`${((usageStats.successfulRequests / usageStats.totalRequests) * 100).toFixed(1)}%`}
            subtext={`${usageStats.failedRequests} failed`}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            label="Avg Latency"
            value={`${usageStats.avgLatency}ms`}
            subtext="Response time"
            icon={Clock}
            color="purple"
          />
          <StatCard
            label="Active Keys"
            value={apiKeys.filter((k) => k.isActive).length}
            subtext={`${apiKeys.length} total`}
            icon={Key}
            color="amber"
          />
        </div>
      )}

      <Tabs defaultValue="keys">
        <TabsList>
          <TabsTrigger value="keys" className="gap-2">
            <Key className="w-4 h-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="usage" className="gap-2">
            <Activity className="w-4 h-4" />
            Usage
          </TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="keys" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              API keys are used to authenticate requests to the Sommer's API.
            </p>
            <Button onClick={() => setShowCreateKeyDialog(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Create Key
            </Button>
          </div>

          <div className="space-y-4">
            {apiKeys.map((key) => (
              <ApiKeyCard
                key={key.id}
                apiKey={key}
                onCopy={(text) => copyToClipboard(text, key.id)}
                onDelete={() => handleDeleteKey(key.id)}
                isCopied={copiedId === key.id}
              />
            ))}
          </div>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Webhooks send real-time notifications to your endpoints when events occur.
            </p>
            <Button onClick={() => setShowCreateWebhookDialog(true)} leftIcon={<Plus className="w-4 h-4" />}>
              Add Endpoint
            </Button>
          </div>

          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <WebhookCard
                key={webhook.id}
                webhook={webhook}
                onToggle={() => handleToggleWebhook(webhook.id)}
              />
            ))}
          </div>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Endpoints</CardTitle>
              <CardDescription>Most frequently called API endpoints</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {usageStats?.topEndpoints.map((endpoint, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="flex-1">
                      <code className="text-sm font-mono text-gray-900 dark:text-white">
                        {endpoint.endpoint}
                      </code>
                      <div className="mt-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-red rounded-full"
                          style={{
                            width: `${(endpoint.count / usageStats.topEndpoints[0].count) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 w-20 text-right">
                      {endpoint.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Key Dialog */}
      <Dialog open={showCreateKeyDialog} onOpenChange={setShowCreateKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Generate a new API key with specific permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Key Name</label>
              <Input placeholder="e.g., Production Server" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Permissions</label>
              <div className="mt-2 space-y-2">
                {availableScopes.map((scope) => (
                  <label key={scope.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                    <input type="checkbox" className="rounded" />
                    <div>
                      <p className="text-sm font-medium">{scope.name}</p>
                      <p className="text-xs text-gray-500">{scope.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateKeyDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateKey}>Create Key</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Webhook Dialog */}
      <Dialog open={showCreateWebhookDialog} onOpenChange={setShowCreateWebhookDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Webhook Endpoint</DialogTitle>
            <DialogDescription>
              Configure a URL to receive event notifications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Endpoint URL</label>
              <Input placeholder="https://example.com/webhooks" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Events to send</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {availableEvents.map((event) => (
                  <label key={event} className="flex items-center gap-2 p-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <code>{event}</code>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateWebhookDialog(false)}>Cancel</Button>
            <Button onClick={() => setShowCreateWebhookDialog(false)}>Add Endpoint</Button>
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
  subtext,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  subtext: string;
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
            <p className="text-xs text-gray-400">{subtext}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ApiKeyCard({
  apiKey,
  onCopy,
  onDelete,
  isCopied,
}: {
  apiKey: ApiKey;
  onCopy: (text: string) => void;
  onDelete: () => void;
  isCopied: boolean;
}) {
  const [showKey, setShowKey] = useState(false);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={cn(
              'p-2 rounded-lg',
              apiKey.isActive
                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            )}>
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">{apiKey.name}</h3>
                <Badge variant={apiKey.isActive ? 'success' : 'secondary'}>
                  {apiKey.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                  {showKey ? apiKey.prefix + '••••••••••••••••' : apiKey.prefix + '••••'}
                </code>
                <button onClick={() => setShowKey(!showKey)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => onCopy(apiKey.prefix)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                  {isCopied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {apiKey.scopes.map((scope) => (
                  <Badge key={scope} variant="outline" className="text-xs">
                    {scope}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right text-xs text-gray-500">
              <p>Created: {new Date(apiKey.createdAt).toLocaleDateString()}</p>
              {apiKey.lastUsed && <p>Last used: {new Date(apiKey.lastUsed).toLocaleString()}</p>}
            </div>
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WebhookCard({
  webhook,
  onToggle,
}: {
  webhook: WebhookEndpoint;
  onToggle: () => void;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={cn(
              'p-2 rounded-lg',
              webhook.isActive
                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            )}>
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <code className="text-sm font-mono text-gray-900 dark:text-white">{webhook.url}</code>
              <div className="flex flex-wrap gap-1 mt-2">
                {webhook.events.map((event) => (
                  <Badge key={event} variant="secondary" className="text-xs">
                    {event}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className={cn(
                  'flex items-center gap-1',
                  webhook.successRate >= 95 ? 'text-green-600' : webhook.successRate >= 80 ? 'text-amber-600' : 'text-red-600'
                )}>
                  {webhook.successRate >= 95 ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {webhook.successRate}% success
                </span>
                {webhook.lastDelivery && (
                  <span>Last delivery: {new Date(webhook.lastDelivery).toLocaleString()}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={webhook.isActive} onCheckedChange={onToggle} />
            <Button variant="ghost" size="sm">
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function APISettingsSkeleton() {
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
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}
