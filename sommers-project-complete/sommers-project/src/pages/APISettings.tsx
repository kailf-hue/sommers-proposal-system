/**
 * Sommer's Proposal System - API Settings Page
 * Phase 46: API key management and documentation
 */

import { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Shield,
  Clock,
  Activity,
  AlertTriangle,
  Check,
  ExternalLink,
  Book,
  Code,
  MoreVertical,
  Settings,
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Input,
  Label,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Progress,
} from '@/components/ui';
import { cn, formatRelativeTime, formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

// ============================================================================
// TYPES
// ============================================================================

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  rateLimit: number;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface ApiUsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  requestsByDay: { date: string; count: number }[];
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockApiKeys: ApiKey[] = [
  {
    id: '1',
    name: 'Production API Key',
    keyPrefix: 'sk_live_',
    scopes: ['proposals:read', 'proposals:write', 'clients:read', 'clients:write'],
    rateLimit: 1000,
    lastUsedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    expiresAt: null,
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    name: 'Zapier Integration',
    keyPrefix: 'sk_live_',
    scopes: ['proposals:read', 'webhooks:manage'],
    rateLimit: 500,
    lastUsedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    name: 'QuickBooks Sync',
    keyPrefix: 'sk_live_',
    scopes: ['clients:read', 'payments:read'],
    rateLimit: 200,
    lastUsedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: null,
    isActive: false,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockUsageStats: ApiUsageStats = {
  totalRequests: 12847,
  successfulRequests: 12456,
  failedRequests: 391,
  avgResponseTime: 145,
  requestsByDay: [
    { date: '2026-01-18', count: 1823 },
    { date: '2026-01-19', count: 2156 },
    { date: '2026-01-20', count: 1945 },
    { date: '2026-01-21', count: 2087 },
    { date: '2026-01-22', count: 1756 },
    { date: '2026-01-23', count: 1892 },
    { date: '2026-01-24', count: 1188 },
  ],
};

const availableScopes = [
  { id: 'proposals:read', label: 'Read Proposals', description: 'View proposal data' },
  { id: 'proposals:write', label: 'Write Proposals', description: 'Create and update proposals' },
  { id: 'clients:read', label: 'Read Clients', description: 'View client data' },
  { id: 'clients:write', label: 'Write Clients', description: 'Create and update clients' },
  { id: 'payments:read', label: 'Read Payments', description: 'View payment data' },
  { id: 'payments:write', label: 'Write Payments', description: 'Process payments' },
  { id: 'analytics:read', label: 'Read Analytics', description: 'Access analytics data' },
  { id: 'webhooks:manage', label: 'Manage Webhooks', description: 'Create and delete webhooks' },
  { id: 'team:read', label: 'Read Team', description: 'View team members' },
  { id: 'settings:read', label: 'Read Settings', description: 'View org settings' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function APISettings() {
  const { organization } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [usageStats, setUsageStats] = useState<ApiUsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyResult, setNewKeyResult] = useState<{ key: ApiKey; rawKey: string } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setApiKeys(mockApiKeys);
      setUsageStats(mockUsageStats);
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <APISettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Key className="w-7 h-7 text-brand-red" />
            API Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage API keys and view usage statistics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" leftIcon={<Book className="w-4 h-4" />}>
            <a href="https://docs.sommersealcoating.com/api" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
              API Docs <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Create API Key
          </Button>
        </div>
      </div>

      {/* Usage Overview */}
      {usageStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Requests"
            value={usageStats.totalRequests.toLocaleString()}
            subtext="Last 7 days"
            icon={Activity}
          />
          <StatCard
            label="Success Rate"
            value={`${Math.round((usageStats.successfulRequests / usageStats.totalRequests) * 100)}%`}
            subtext={`${usageStats.failedRequests} failed`}
            icon={Check}
            positive
          />
          <StatCard
            label="Avg Response Time"
            value={`${usageStats.avgResponseTime}ms`}
            subtext="P95: 320ms"
            icon={Clock}
          />
          <StatCard
            label="Active Keys"
            value={apiKeys.filter((k) => k.isActive).length}
            subtext={`of ${apiKeys.length} total`}
            icon={Key}
          />
        </div>
      )}

      <Tabs defaultValue="keys">
        <TabsList>
          <TabsTrigger value="keys" className="gap-2">
            <Key className="w-4 h-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="usage" className="gap-2">
            <Activity className="w-4 h-4" />
            Usage
          </TabsTrigger>
          <TabsTrigger value="docs" className="gap-2">
            <Code className="w-4 h-4" />
            Quick Start
          </TabsTrigger>
        </TabsList>

        {/* API Keys */}
        <TabsContent value="keys" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Create and manage API keys for external integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {apiKeys.length === 0 ? (
                <div className="text-center py-8">
                  <Key className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No API keys created yet</p>
                  <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                    Create your first API key
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {apiKeys.map((key) => (
                    <ApiKeyCard
                      key={key.id}
                      apiKey={key}
                      onRevoke={() => setApiKeys((keys) => keys.map((k) =>
                        k.id === key.id ? { ...k, isActive: false } : k
                      ))}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Stats */}
        <TabsContent value="usage" className="mt-6">
          {usageStats && (
            <Card>
              <CardHeader>
                <CardTitle>API Usage</CardTitle>
                <CardDescription>Request volume over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={usageStats.requestsByDay}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                      <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short' })} />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => [value.toLocaleString(), 'Requests']}
                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                      />
                      <Area type="monotone" dataKey="count" stroke="#C41E3A" fill="#C41E3A" fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Quick Start Docs */}
        <TabsContent value="docs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Start Guide</CardTitle>
              <CardDescription>Get started with the API in minutes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Authentication</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Include your API key in the Authorization header:
                </p>
                <CodeBlock code={`curl -H "Authorization: Bearer sk_live_your_key_here" \\
     https://api.sommersealcoating.com/v1/proposals`} />
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">List Proposals</h4>
                <CodeBlock code={`GET /v1/proposals

Response:
{
  "data": [
    {
      "id": "prop_abc123",
      "proposal_number": "SOM-2026-0156",
      "client_id": "cli_xyz789",
      "status": "sent",
      "total_amount": 4500.00
    }
  ],
  "total": 47,
  "has_more": true
}`} />
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Create a Client</h4>
                <CodeBlock code={`POST /v1/clients
Content-Type: application/json

{
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "555-123-4567",
  "company": "Smith Properties"
}`} />
              </div>

              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-start gap-2">
                  <Book className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-200">Full Documentation</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      View complete API reference with all endpoints, parameters, and examples at{' '}
                      <a href="https://docs.sommersealcoating.com/api" target="_blank" rel="noopener noreferrer" className="underline">
                        docs.sommersealcoating.com/api
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create API Key Dialog */}
      <CreateApiKeyDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        scopes={availableScopes}
        onCreated={(result) => {
          setApiKeys((keys) => [result.key, ...keys]);
          setNewKeyResult(result);
          setShowCreateDialog(false);
        }}
      />

      {/* New Key Created Dialog */}
      {newKeyResult && (
        <NewKeyDialog
          rawKey={newKeyResult.rawKey}
          onClose={() => setNewKeyResult(null)}
        />
      )}
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
  positive = false,
}: {
  label: string;
  value: string | number;
  subtext: string;
  icon: React.ElementType;
  positive?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
            <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </div>
          {positive && <Badge className="bg-green-100 text-green-700">Healthy</Badge>}
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xs text-gray-400 mt-1">{subtext}</p>
      </CardContent>
    </Card>
  );
}

function ApiKeyCard({
  apiKey,
  onRevoke,
}: {
  apiKey: ApiKey;
  onRevoke: () => void;
}) {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className={cn(
      'p-4 rounded-lg border dark:border-gray-700',
      !apiKey.isActive && 'opacity-60'
    )}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900 dark:text-white">{apiKey.name}</h4>
            <Badge variant={apiKey.isActive ? 'success' : 'secondary'}>
              {apiKey.isActive ? 'Active' : 'Revoked'}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <code className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              {showKey ? `${apiKey.keyPrefix}${'•'.repeat(24)}` : `${apiKey.keyPrefix}${'•'.repeat(8)}`}
            </code>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowKey(!showKey)}>
              {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </Button>
          </div>
          <div className="flex flex-wrap gap-1 mt-3">
            {apiKey.scopes.slice(0, 4).map((scope) => (
              <Badge key={scope} variant="outline" className="text-xs">
                {scope}
              </Badge>
            ))}
            {apiKey.scopes.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{apiKey.scopes.length - 4} more
              </Badge>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2">
              <Settings className="w-4 h-4" />
              Edit
            </DropdownMenuItem>
            {apiKey.isActive && (
              <DropdownMenuItem className="gap-2 text-red-600" onClick={onRevoke}>
                <Trash2 className="w-4 h-4" />
                Revoke
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
        <span>Rate limit: {apiKey.rateLimit.toLocaleString()}/hour</span>
        {apiKey.lastUsedAt && (
          <span>Last used: {formatRelativeTime(apiKey.lastUsedAt)}</span>
        )}
        {apiKey.expiresAt && (
          <span className={new Date(apiKey.expiresAt) < new Date() ? 'text-red-500' : ''}>
            Expires: {new Date(apiKey.expiresAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}

function CreateApiKeyDialog({
  open,
  onClose,
  scopes,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  scopes: { id: string; label: string; description: string }[];
  onCreated: (result: { key: ApiKey; rawKey: string }) => void;
}) {
  const [name, setName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [expiration, setExpiration] = useState('never');

  const toggleScope = (scopeId: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scopeId) ? prev.filter((s) => s !== scopeId) : [...prev, scopeId]
    );
  };

  const handleCreate = () => {
    const newKey: ApiKey = {
      id: crypto.randomUUID(),
      name,
      keyPrefix: 'sk_live_',
      scopes: selectedScopes,
      rateLimit: 1000,
      lastUsedAt: null,
      expiresAt: expiration === 'never' ? null : new Date(Date.now() + parseInt(expiration) * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    onCreated({
      key: newKey,
      rawKey: `sk_live_${Array(32).fill(0).map(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]).join('')}`,
    });

    setName('');
    setSelectedScopes([]);
    setExpiration('never');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create API Key</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Key Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Production API Key"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Expiration</Label>
            <Select value={expiration} onValueChange={setExpiration}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never expires</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">6 months</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block">Permissions</Label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {scopes.map((scope) => (
                <label
                  key={scope.id}
                  className={cn(
                    'flex items-start gap-2 p-2 rounded border cursor-pointer',
                    selectedScopes.includes(scope.id)
                      ? 'border-brand-red bg-brand-red/5'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  )}
                >
                  <Checkbox
                    checked={selectedScopes.includes(scope.id)}
                    onCheckedChange={() => toggleScope(scope.id)}
                  />
                  <div>
                    <p className="text-sm font-medium">{scope.label}</p>
                    <p className="text-xs text-gray-500">{scope.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name || selectedScopes.length === 0}>
            Create Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewKeyDialog({
  rawKey,
  onClose,
}: {
  rawKey: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <Check className="w-5 h-5" />
            API Key Created
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Important:</strong> Copy this key now. You won't be able to see it again.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-3 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono overflow-x-auto">
              {rawKey}
            </code>
            <Button variant="outline" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg text-sm overflow-x-auto">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 text-gray-400 hover:text-white"
        onClick={handleCopy}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </Button>
    </div>
  );
}

function APISettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-10 w-96" />
      <Skeleton className="h-96" />
    </div>
  );
}
