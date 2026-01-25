/**
 * Integrations Page
 * Third-party integrations management
 */

import { useState } from 'react';
import { Link2, Check, X, ExternalLink, Settings, RefreshCw, Plug } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const integrations = [
  { id: 'quickbooks', name: 'QuickBooks', description: 'Sync invoices and payments', category: 'accounting', connected: true, logo: '📊' },
  { id: 'stripe', name: 'Stripe', description: 'Payment processing', category: 'payments', connected: true, logo: '💳' },
  { id: 'google_calendar', name: 'Google Calendar', description: 'Sync job scheduling', category: 'scheduling', connected: false, logo: '📅' },
  { id: 'slack', name: 'Slack', description: 'Team notifications', category: 'communication', connected: false, logo: '💬' },
  { id: 'zapier', name: 'Zapier', description: 'Automation workflows', category: 'automation', connected: false, logo: '⚡' },
  { id: 'google_drive', name: 'Google Drive', description: 'Document storage', category: 'storage', connected: true, logo: '📁' },
  { id: 'mailchimp', name: 'Mailchimp', description: 'Email marketing', category: 'marketing', connected: false, logo: '📧' },
  { id: 'hubspot', name: 'HubSpot', description: 'CRM sync', category: 'crm', connected: false, logo: '🎯' },
];

export default function Integrations() {
  const [filter, setFilter] = useState<'all' | 'connected' | 'available'>('all');

  const filteredIntegrations = integrations.filter((i) => {
    if (filter === 'connected') return i.connected;
    if (filter === 'available') return !i.connected;
    return true;
  });

  const handleConnect = (id: string) => {
    toast.success('Integration connected successfully');
  };

  const handleDisconnect = (id: string) => {
    toast.success('Integration disconnected');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Integrations</h1><p className="text-gray-500">Connect third-party services</p></div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {['all', 'connected', 'available'].map((f) => (
            <button key={f} onClick={() => setFilter(f as any)} className={cn('px-3 py-1.5 text-sm rounded-md capitalize', filter === f ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500')}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIntegrations.map((integration) => (
          <Card key={integration.id} className={cn('transition-all', integration.connected && 'border-green-200 dark:border-green-800')}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl">
                    {integration.logo}
                  </div>
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {integration.name}
                      {integration.connected && <Check className="h-4 w-4 text-green-500" />}
                    </h3>
                    <p className="text-sm text-gray-500">{integration.description}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 capitalize">
                  {integration.category}
                </span>
                {integration.connected ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost"><Settings className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDisconnect(integration.id)}><X className="h-4 w-4" /></Button>
                  </div>
                ) : (
                  <Button size="sm" onClick={() => handleConnect(integration.id)} leftIcon={<Plug className="h-3.5 w-3.5" />}>Connect</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Link2 className="h-5 w-5" />Custom Webhooks</CardTitle>
          <CardDescription>Connect your own services via webhooks</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" leftIcon={<ExternalLink className="h-4 w-4" />}>Configure Webhooks</Button>
        </CardContent>
      </Card>
    </div>
  );
}
