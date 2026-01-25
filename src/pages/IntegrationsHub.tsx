/**
 * Sommer's Proposal System - Integrations Hub Page
 * Phase 47: Third-party integrations management
 */

import { useState, useEffect } from 'react';
import {
  Plug,
  Plus,
  Settings,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Trash2,
  MoreVertical,
  Zap,
  FileText,
  CreditCard,
  MessageSquare,
  Calendar,
  Database,
  Cloud,
  Link2,
  Globe,
  Copy,
  Eye,
  EyeOff,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Checkbox,
  Label,
  Switch,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================================
// TYPES
// ============================================================================

interface Integration {
  id: string;
  provider: string;
  name: string;
  status: 'pending' | 'connected' | 'disconnected' | 'error';
  lastSyncAt: string | null;
  errorMessage: string | null;
}

interface IntegrationProvider {
  id: string;
  name: string;
  description: string;
  category: string;
  iconUrl: string;
  requiredPlan: string;
}

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastDeliveryAt: string | null;
  lastDeliveryStatus: number | null;
  secret: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockProviders: IntegrationProvider[] = [
  { id: 'zapier', name: 'Zapier', description: 'Connect with 5,000+ apps', category: 'automation', iconUrl: '/icons/zapier.svg', requiredPlan: 'pro' },
  { id: 'quickbooks', name: 'QuickBooks', description: 'Sync accounting data', category: 'accounting', iconUrl: '/icons/quickbooks.svg', requiredPlan: 'business' },
  { id: 'slack', name: 'Slack', description: 'Get notifications', category: 'communication', iconUrl: '/icons/slack.svg', requiredPlan: 'pro' },
  { id: 'google_calendar', name: 'Google Calendar', description: 'Sync appointments', category: 'calendar', iconUrl: '/icons/google-calendar.svg', requiredPlan: 'pro' },
  { id: 'hubspot', name: 'HubSpot', description: 'CRM integration', category: 'crm', iconUrl: '/icons/hubspot.svg', requiredPlan: 'business' },
  { id: 'stripe', name: 'Stripe', description: 'Payment processing', category: 'payment', iconUrl: '/icons/stripe.svg', requiredPlan: 'pro' },
  { id: 'google_drive', name: 'Google Drive', description: 'Document storage', category: 'storage', iconUrl: '/icons/google-drive.svg', requiredPlan: 'pro' },
  { id: 'xero', name: 'Xero', description: 'Accounting software', category: 'accounting', iconUrl: '/icons/xero.svg', requiredPlan: 'business' },
];

const mockIntegrations: Integration[] = [
  { id: '1', provider: 'stripe', name: 'Stripe', status: 'connected', lastSyncAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), errorMessage: null },
  { id: '2', provider: 'slack', name: 'Slack', status: 'connected', lastSyncAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), errorMessage: null },
  { id: '3', provider: 'quickbooks', name: 'QuickBooks', status: 'error', lastSyncAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), errorMessage: 'Token expired - please reconnect' },
];

const mockWebhooks: WebhookEndpoint[] = [
  { id: '1', url: 'https://hooks.zapier.com/hooks/catch/123456/abcdef', events: ['proposal.signed', 'payment.received'], isActive: true, lastDeliveryAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), lastDeliveryStatus: 200, secret: 'whsec_abc123xyz789' },
  { id: '2', url: 'https://api.mycrm.com/webhooks/sommers', events: ['client.created', 'proposal.sent'], isActive: true, lastDeliveryAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), lastDeliveryStatus: 200, secret: 'whsec_def456uvw012' },
];

const webhookEvents = [
  { event: 'proposal.created', description: 'When a proposal is created' },
  { event: 'proposal.sent', description: 'When a proposal is sent' },
  { event: 'proposal.viewed', description: 'When a proposal is viewed' },
  { event: 'proposal.signed', description: 'When a proposal is signed' },
  { event: 'proposal.rejected', description: 'When a proposal is rejected' },
  { event: 'client.created', description: 'When a client is created' },
  { event: 'client.updated', description: 'When a client is updated' },
  { event: 'payment.received', description: 'When payment is received' },
  { event: 'payment.failed', description: 'When payment fails' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function IntegrationsHub() {
  const { organization } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIntegrations(mockIntegrations);
      setWebhooks(mockWebhooks);
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const categories = Array.from(new Set(mockProviders.map(p => p.category)));
  const filteredProviders = selectedCategory
    ? mockProviders.filter(p => p.category === selectedCategory)
    : mockProviders;

  if (isLoading) {
    return <IntegrationsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Plug className="w-7 h-7 text-brand-red" />
            Integrations Hub
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Connect your favorite tools and automate workflows
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowWebhookDialog(true)} leftIcon={<Link2 className="w-4 h-4" />}>
            Add Webhook
          </Button>
          <Button onClick={() => setShowAddDialog(true)} leftIcon={<Plus className="w-4 h-4" />}>
            Add Integration
          </Button>
        </div>
      </div>

      {/* Connected Integrations */}
      {integrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connected Integrations</CardTitle>
            <CardDescription>{integrations.length} active connections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {integrations.map((integration) => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="available">
        <TabsList>
          <TabsTrigger value="available" className="gap-2">
            <Plug className="w-4 h-4" />
            Available Integrations
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2">
            <Link2 className="w-4 h-4" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        {/* Available Integrations */}
        <TabsContent value="available" className="mt-6">
          <div className="space-y-4">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>

            {/* Provider Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProviders.map((provider) => {
                const isConnected = integrations.some(i => i.provider === provider.id);
                return (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    isConnected={isConnected}
                    onConnect={() => console.log('Connect:', provider.id)}
                  />
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Webhooks */}
        <TabsContent value="webhooks" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Webhook Endpoints</CardTitle>
                  <CardDescription>Send real-time notifications to external services</CardDescription>
                </div>
                <Button onClick={() => setShowWebhookDialog(true)} size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                  Add Endpoint
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {webhooks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Link2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No webhooks configured</p>
                  <Button variant="outline" className="mt-4" onClick={() => setShowWebhookDialog(true)}>
                    Add your first webhook
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {webhooks.map((webhook) => (
                    <WebhookCard key={webhook.id} webhook={webhook} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Integration Dialog */}
      <AddIntegrationDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        providers={mockProviders}
        connectedProviders={integrations.map(i => i.provider)}
      />

      {/* Add Webhook Dialog */}
      <AddWebhookDialog
        open={showWebhookDialog}
        onClose={() => setShowWebhookDialog(false)}
        events={webhookEvents}
      />
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function IntegrationCard({ integration }: { integration: Integration }) {
  const statusConfig = {
    connected: { icon: Check, color: 'text-green-600 bg-green-100', label: 'Connected' },
    pending: { icon: RefreshCw, color: 'text-amber-600 bg-amber-100', label: 'Pending' },
    disconnected: { icon: X, color: 'text-gray-600 bg-gray-100', label: 'Disconnected' },
    error: { icon: AlertTriangle, color: 'text-red-600 bg-red-100', label: 'Error' },
  };

  const config = statusConfig[integration.status];
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center border dark:border-gray-600">
          <ProviderIcon provider={integration.provider} />
        </div>
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">{integration.name}</h4>
          <div className="flex items-center gap-2 text-sm">
            <span className={cn('flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', config.color)}>
              <Icon className="w-3 h-3" />
              {config.label}
            </span>
            {integration.lastSyncAt && (
              <span className="text-gray-500">
                Last sync: {formatRelativeTime(integration.lastSyncAt)}
              </span>
            )}
          </div>
          {integration.errorMessage && (
            <p className="text-xs text-red-600 mt-1">{integration.errorMessage}</p>
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
            <Settings className="w-4 h-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Sync Now
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 text-red-600">
            <Trash2 className="w-4 h-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function ProviderCard({
  provider,
  isConnected,
  onConnect,
}: {
  provider: IntegrationProvider;
  isConnected: boolean;
  onConnect: () => void;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <ProviderIcon provider={provider.id} />
          </div>
          {isConnected && (
            <Badge className="bg-green-100 text-green-700">Connected</Badge>
          )}
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white">{provider.name}</h3>
        <p className="text-sm text-gray-500 mb-4">{provider.description}</p>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {provider.requiredPlan.charAt(0).toUpperCase() + provider.requiredPlan.slice(1)}+
          </Badge>
          <Button
            variant={isConnected ? 'outline' : 'default'}
            size="sm"
            onClick={onConnect}
          >
            {isConnected ? 'Settings' : 'Connect'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function WebhookCard({ webhook }: { webhook: WebhookEndpoint }) {
  const [showSecret, setShowSecret] = useState(false);

  return (
    <div className="p-4 rounded-lg border dark:border-gray-700">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate">
              {webhook.url}
            </code>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => navigator.clipboard.writeText(webhook.url)}>
              <Copy className="w-3 h-3" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {webhook.events.map((event) => (
              <Badge key={event} variant="secondary" className="text-xs">
                {event}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={webhook.isActive} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="gap-2">
                <Settings className="w-4 h-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Test
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-red-600">
                <Trash2 className="w-4 h-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4 text-gray-500">
          <span>
            Last delivery: {webhook.lastDeliveryAt ? formatRelativeTime(webhook.lastDeliveryAt) : 'Never'}
          </span>
          {webhook.lastDeliveryStatus && (
            <span className={cn(
              webhook.lastDeliveryStatus === 200 ? 'text-green-600' : 'text-red-600'
            )}>
              Status: {webhook.lastDeliveryStatus}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => setShowSecret(!showSecret)}
        >
          {showSecret ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
          {showSecret ? webhook.secret : '••••••••'}
        </Button>
      </div>
    </div>
  );
}

function ProviderIcon({ provider }: { provider: string }) {
  const icons: Record<string, React.ElementType> = {
    zapier: Zap,
    quickbooks: FileText,
    slack: MessageSquare,
    google_calendar: Calendar,
    hubspot: Database,
    stripe: CreditCard,
    google_drive: Cloud,
    xero: FileText,
  };

  const Icon = icons[provider] || Globe;
  return <Icon className="w-6 h-6 text-gray-600" />;
}

function AddIntegrationDialog({
  open,
  onClose,
  providers,
  connectedProviders,
}: {
  open: boolean;
  onClose: () => void;
  providers: IntegrationProvider[];
  connectedProviders: string[];
}) {
  const availableProviders = providers.filter(p => !connectedProviders.includes(p.id));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Integration</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4 max-h-96 overflow-y-auto">
          {availableProviders.map((provider) => (
            <button
              key={provider.id}
              className="flex items-start gap-3 p-4 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors"
              onClick={() => {
                console.log('Connect:', provider.id);
                onClose();
              }}
            >
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                <ProviderIcon provider={provider.id} />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{provider.name}</h4>
                <p className="text-sm text-gray-500">{provider.description}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddWebhookDialog({
  open,
  onClose,
  events,
}: {
  open: boolean;
  onClose: () => void;
  events: { event: string; description: string }[];
}) {
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Webhook Endpoint</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Endpoint URL</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-server.com/webhook"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="mb-2 block">Events</Label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {events.map(({ event, description }) => (
                <label
                  key={event}
                  className="flex items-center gap-2 p-2 rounded border dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Checkbox
                    checked={selectedEvents.includes(event)}
                    onCheckedChange={() => toggleEvent(event)}
                  />
                  <div>
                    <p className="text-sm font-medium">{event}</p>
                    <p className="text-xs text-gray-500">{description}</p>
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
          <Button onClick={() => { console.log('Create webhook:', { url, selectedEvents }); onClose(); }}>
            Create Webhook
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IntegrationsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>
      <Skeleton className="h-64" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}
