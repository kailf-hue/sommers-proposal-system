/**
 * Developer Page
 * API keys and webhook management
 */

import { useState } from 'react';
import { Key, Plus, Copy, Eye, EyeOff, Trash2, RefreshCw, Link2, AlertCircle, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const apiKeys = [
  { id: '1', name: 'Production API', keyPrefix: 'sk_live_abc123', scopes: ['proposals:read', 'proposals:write', 'clients:read'], lastUsed: '2024-01-20', createdAt: '2024-01-01' },
  { id: '2', name: 'Development API', keyPrefix: 'sk_test_xyz789', scopes: ['proposals:read'], lastUsed: '2024-01-18', createdAt: '2024-01-10' },
];

const webhooks = [
  { id: '1', name: 'Zapier Integration', url: 'https://hooks.zapier.com/...', events: ['proposal.accepted', 'payment.received'], isActive: true, lastTriggered: '2024-01-20' },
  { id: '2', name: 'Slack Notifications', url: 'https://hooks.slack.com/...', events: ['proposal.sent', 'proposal.viewed'], isActive: true, lastTriggered: '2024-01-19' },
];

const allScopes = ['proposals:read', 'proposals:write', 'clients:read', 'clients:write', 'jobs:read', 'jobs:write', 'analytics:read'];
const allEvents = ['proposal.created', 'proposal.sent', 'proposal.viewed', 'proposal.accepted', 'proposal.rejected', 'payment.received', 'job.scheduled', 'job.completed'];

export default function Developer() {
  const [activeTab, setActiveTab] = useState<'keys' | 'webhooks'>('keys');
  const [showKey, setShowKey] = useState<string | null>(null);

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('API key copied to clipboard');
  };

  const handleDeleteKey = (id: string) => {
    toast.success('API key deleted');
  };

  const handleDeleteWebhook = (id: string) => {
    toast.success('Webhook deleted');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Developer</h1><p className="text-gray-500">API keys and webhooks</p></div>
      </div>

      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        <button onClick={() => setActiveTab('keys')} className={cn('px-4 py-2 text-sm font-medium rounded-md', activeTab === 'keys' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500')}>API Keys</button>
        <button onClick={() => setActiveTab('webhooks')} className={cn('px-4 py-2 text-sm font-medium rounded-md', activeTab === 'webhooks' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500')}>Webhooks</button>
      </div>

      {activeTab === 'keys' ? (
        <div className="space-y-4">
          <div className="flex justify-end"><Button leftIcon={<Plus className="h-4 w-4" />}>Create API Key</Button></div>
          
          {apiKeys.map((key) => (
            <Card key={key.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-brand-red/10 flex items-center justify-center"><Key className="h-5 w-5 text-brand-red" /></div>
                    <div>
                      <h3 className="font-semibold">{key.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-mono">
                          {showKey === key.id ? `${key.keyPrefix}...xxxx` : `${key.keyPrefix.slice(0, 8)}...`}
                        </code>
                        <button onClick={() => setShowKey(showKey === key.id ? null : key.id)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                          {showKey === key.id ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                        </button>
                        <button onClick={() => handleCopyKey(key.keyPrefix)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                          <Copy className="h-4 w-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteKey(key.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                    <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-1">
                  {key.scopes.map((scope) => (
                    <span key={scope} className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 font-mono">{scope}</span>
                  ))}
                </div>
                <div className="mt-3 text-sm text-gray-500">Last used: {key.lastUsed} · Created: {key.createdAt}</div>
              </CardContent>
            </Card>
          ))}

          <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">Keep your API keys secure</p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">Never share your API keys in public repositories or client-side code.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end"><Button leftIcon={<Plus className="h-4 w-4" />}>Create Webhook</Button></div>
          
          {webhooks.map((webhook) => (
            <Card key={webhook.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', webhook.isActive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800')}>
                      <Link2 className={cn('h-5 w-5', webhook.isActive ? 'text-green-600' : 'text-gray-400')} />
                    </div>
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        {webhook.name}
                        {webhook.isActive && <span className="h-2 w-2 rounded-full bg-green-500" />}
                      </h3>
                      <code className="text-sm text-gray-500 font-mono">{webhook.url}</code>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteWebhook(webhook.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                    <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-1">
                  {webhook.events.map((event) => (
                    <span key={event} className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">{event}</span>
                  ))}
                </div>
                <div className="mt-3 text-sm text-gray-500">Last triggered: {webhook.lastTriggered}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">API Documentation</CardTitle><CardDescription>Learn how to integrate with our REST API</CardDescription></CardHeader>
        <CardContent>
          <Button variant="outline" leftIcon={<Link2 className="h-4 w-4" />}>View Documentation</Button>
        </CardContent>
      </Card>
    </div>
  );
}
