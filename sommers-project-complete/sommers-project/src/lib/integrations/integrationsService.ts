/**
 * Integrations Service
 * Third-party integrations management
 */

import { supabase } from '@/lib/supabase';

export interface Integration {
  id: string;
  org_id: string;
  provider: string;
  name: string;
  is_connected: boolean;
  config?: Record<string, any>;
  credentials?: Record<string, any>;
  last_sync_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export const AVAILABLE_INTEGRATIONS = [
  { provider: 'quickbooks', name: 'QuickBooks', category: 'accounting' },
  { provider: 'stripe', name: 'Stripe', category: 'payments' },
  { provider: 'google_calendar', name: 'Google Calendar', category: 'scheduling' },
  { provider: 'slack', name: 'Slack', category: 'communication' },
  { provider: 'zapier', name: 'Zapier', category: 'automation' },
  { provider: 'google_drive', name: 'Google Drive', category: 'storage' },
];

// Get integrations
export async function getIntegrations(orgId: string): Promise<Integration[]> {
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('org_id', orgId)
    .order('name');

  if (error) throw error;
  return data || [];
}

// Connect integration
export async function connectIntegration(
  orgId: string,
  provider: string,
  credentials: Record<string, any>
): Promise<Integration> {
  const providerInfo = AVAILABLE_INTEGRATIONS.find((i) => i.provider === provider);
  
  const { data, error } = await supabase
    .from('integrations')
    .upsert({
      org_id: orgId,
      provider,
      name: providerInfo?.name || provider,
      is_connected: true,
      credentials,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'org_id,provider' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Disconnect integration
export async function disconnectIntegration(integrationId: string): Promise<void> {
  const { error } = await supabase
    .from('integrations')
    .update({
      is_connected: false,
      credentials: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', integrationId);

  if (error) throw error;
}

// Update integration config
export async function updateIntegrationConfig(
  integrationId: string,
  config: Record<string, any>
): Promise<void> {
  const { error } = await supabase
    .from('integrations')
    .update({ config, updated_at: new Date().toISOString() })
    .eq('id', integrationId);

  if (error) throw error;
}

// Record sync
export async function recordSync(
  integrationId: string,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  const { error } = await supabase
    .from('integrations')
    .update({
      last_sync_at: new Date().toISOString(),
      error_message: success ? null : errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', integrationId);

  if (error) throw error;
}

// Sync to QuickBooks
export async function syncToQuickBooks(orgId: string, invoice: any): Promise<void> {
  const integrations = await getIntegrations(orgId);
  const qb = integrations.find((i) => i.provider === 'quickbooks' && i.is_connected);
  
  if (!qb) {
    throw new Error('QuickBooks not connected');
  }

  // TODO: Implement actual QuickBooks API call
  console.log('Syncing to QuickBooks:', invoice);
}

// Send to Slack
export async function sendToSlack(orgId: string, message: string, channel?: string): Promise<void> {
  const integrations = await getIntegrations(orgId);
  const slack = integrations.find((i) => i.provider === 'slack' && i.is_connected);
  
  if (!slack?.credentials?.webhook_url) {
    throw new Error('Slack not connected');
  }

  await fetch(slack.credentials.webhook_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message, channel }),
  });
}

export default {
  getIntegrations,
  connectIntegration,
  disconnectIntegration,
  updateIntegrationConfig,
  recordSync,
  syncToQuickBooks,
  sendToSlack,
  AVAILABLE_INTEGRATIONS,
};
