/**
 * API Service
 * REST API key management and webhooks
 */

import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export interface APIKey {
  id: string;
  org_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  scopes: string[];
  last_used_at?: string;
  expires_at?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface Webhook {
  id: string;
  org_id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  last_triggered_at?: string;
  failure_count: number;
  created_at: string;
}

export const AVAILABLE_SCOPES = [
  'proposals:read',
  'proposals:write',
  'clients:read',
  'clients:write',
  'jobs:read',
  'jobs:write',
  'analytics:read',
];

export const WEBHOOK_EVENTS = [
  'proposal.created',
  'proposal.sent',
  'proposal.viewed',
  'proposal.accepted',
  'proposal.rejected',
  'client.created',
  'job.scheduled',
  'job.completed',
  'payment.received',
];

// Generate API key
export async function generateAPIKey(
  orgId: string,
  userId: string,
  name: string,
  scopes: string[],
  expiresAt?: string
): Promise<{ key: string; apiKey: APIKey }> {
  const rawKey = `sk_live_${uuidv4().replace(/-/g, '')}`;
  const keyPrefix = rawKey.substring(0, 12);
  const keyHash = await hashKey(rawKey);

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      org_id: orgId,
      name,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      scopes,
      expires_at: expiresAt,
      is_active: true,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;

  return { key: rawKey, apiKey: data };
}

// Hash key (simple implementation)
async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Validate API key
export async function validateAPIKey(key: string): Promise<APIKey | null> {
  const keyHash = await hashKey(key);

  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;

  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return null;
  }

  // Update last used
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id);

  return data;
}

// Get API keys
export async function getAPIKeys(orgId: string): Promise<APIKey[]> {
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Revoke API key
export async function revokeAPIKey(keyId: string): Promise<void> {
  const { error } = await supabase
    .from('api_keys')
    .update({ is_active: false })
    .eq('id', keyId);

  if (error) throw error;
}

// Create webhook
export async function createWebhook(
  orgId: string,
  name: string,
  url: string,
  events: string[]
): Promise<Webhook> {
  const secret = `whsec_${uuidv4().replace(/-/g, '')}`;

  const { data, error } = await supabase
    .from('webhooks')
    .insert({
      org_id: orgId,
      name,
      url,
      events,
      secret,
      is_active: true,
      failure_count: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get webhooks
export async function getWebhooks(orgId: string): Promise<Webhook[]> {
  const { data, error } = await supabase
    .from('webhooks')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Trigger webhook
export async function triggerWebhook(
  orgId: string,
  event: string,
  payload: any
): Promise<void> {
  const { data: webhooks } = await supabase
    .from('webhooks')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .contains('events', [event]);

  if (!webhooks) return;

  for (const webhook of webhooks) {
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhook.secret,
          'X-Webhook-Event': event,
        },
        body: JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() }),
      });

      if (!response.ok) throw new Error('Webhook failed');

      await supabase
        .from('webhooks')
        .update({ last_triggered_at: new Date().toISOString(), failure_count: 0 })
        .eq('id', webhook.id);
    } catch (error) {
      await supabase
        .from('webhooks')
        .update({ failure_count: webhook.failure_count + 1 })
        .eq('id', webhook.id);
    }
  }
}

// Delete webhook
export async function deleteWebhook(webhookId: string): Promise<void> {
  const { error } = await supabase.from('webhooks').delete().eq('id', webhookId);
  if (error) throw error;
}

export default {
  generateAPIKey,
  validateAPIKey,
  getAPIKeys,
  revokeAPIKey,
  createWebhook,
  getWebhooks,
  triggerWebhook,
  deleteWebhook,
  AVAILABLE_SCOPES,
  WEBHOOK_EVENTS,
};
