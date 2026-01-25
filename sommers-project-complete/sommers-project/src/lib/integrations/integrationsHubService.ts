/**
 * Sommer's Proposal System - Integrations Hub Service
 * Phase 47: Third-party integrations (Zapier, QuickBooks, Slack, etc.)
 */

import { supabase } from '../supabase';
import { entitlementsService } from '../entitlements/entitlementsService';

// ============================================================================
// TYPES
// ============================================================================

export interface Integration {
  id: string;
  orgId: string;
  provider: IntegrationProvider;
  name: string;
  status: IntegrationStatus;
  config: IntegrationConfig;
  credentials: EncryptedCredentials | null;
  lastSyncAt: string | null;
  syncStatus: SyncStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export type IntegrationProvider =
  | 'zapier'
  | 'quickbooks'
  | 'xero'
  | 'slack'
  | 'google_calendar'
  | 'outlook'
  | 'hubspot'
  | 'salesforce'
  | 'mailchimp'
  | 'stripe'
  | 'square'
  | 'google_drive'
  | 'dropbox'
  | 'webhook';

export type IntegrationStatus = 'pending' | 'connected' | 'disconnected' | 'error';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'failed';

export interface IntegrationConfig {
  syncFrequency?: 'realtime' | 'hourly' | 'daily';
  syncDirection?: 'import' | 'export' | 'bidirectional';
  mappings?: FieldMapping[];
  filters?: SyncFilter[];
  options?: Record<string, unknown>;
}

export interface EncryptedCredentials {
  accessToken?: string;
  refreshToken?: string;
  apiKey?: string;
  expiresAt?: string;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transform?: 'none' | 'uppercase' | 'lowercase' | 'currency' | 'date';
}

export interface SyncFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: unknown;
}

export interface WebhookEndpoint {
  id: string;
  orgId: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  isActive: boolean;
  failureCount: number;
  lastDeliveryAt: string | null;
  lastDeliveryStatus: number | null;
  createdAt: string;
}

export type WebhookEvent =
  | 'proposal.created'
  | 'proposal.sent'
  | 'proposal.viewed'
  | 'proposal.signed'
  | 'proposal.rejected'
  | 'client.created'
  | 'client.updated'
  | 'payment.received'
  | 'payment.failed';

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  event: WebhookEvent;
  payload: Record<string, unknown>;
  responseStatus: number | null;
  responseBody: string | null;
  deliveredAt: string | null;
  attempts: number;
  nextRetryAt: string | null;
}

export interface IntegrationProviderInfo {
  id: IntegrationProvider;
  name: string;
  description: string;
  category: 'accounting' | 'crm' | 'communication' | 'calendar' | 'storage' | 'payment' | 'automation';
  iconUrl: string;
  features: string[];
  requiredPlan: 'pro' | 'business' | 'enterprise';
  authType: 'oauth2' | 'api_key' | 'webhook';
  setupInstructions: string;
}

export interface ZapierWebhook {
  id: string;
  orgId: string;
  zapId: string;
  triggerEvent: WebhookEvent;
  webhookUrl: string;
  isActive: boolean;
  createdAt: string;
}

export interface QuickBooksConfig {
  realmId: string;
  syncCustomers: boolean;
  syncInvoices: boolean;
  syncPayments: boolean;
  defaultIncomeAccount?: string;
  defaultTaxCode?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const INTEGRATION_PROVIDERS: IntegrationProviderInfo[] = [
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect with 5,000+ apps via automated workflows',
    category: 'automation',
    iconUrl: '/icons/zapier.svg',
    features: ['Automated workflows', 'Multi-step Zaps', 'Custom triggers'],
    requiredPlan: 'pro',
    authType: 'webhook',
    setupInstructions: 'Create a Zap and paste your webhook URL',
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Sync clients, invoices, and payments with QuickBooks Online',
    category: 'accounting',
    iconUrl: '/icons/quickbooks.svg',
    features: ['Customer sync', 'Invoice creation', 'Payment tracking'],
    requiredPlan: 'business',
    authType: 'oauth2',
    setupInstructions: 'Connect your QuickBooks account via OAuth',
  },
  {
    id: 'xero',
    name: 'Xero',
    description: 'Integrate with Xero accounting software',
    category: 'accounting',
    iconUrl: '/icons/xero.svg',
    features: ['Contact sync', 'Invoice sync', 'Payment reconciliation'],
    requiredPlan: 'business',
    authType: 'oauth2',
    setupInstructions: 'Connect your Xero account via OAuth',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Get notifications and updates in Slack',
    category: 'communication',
    iconUrl: '/icons/slack.svg',
    features: ['Real-time notifications', 'Channel integration', 'Custom alerts'],
    requiredPlan: 'pro',
    authType: 'oauth2',
    setupInstructions: 'Install the Slack app to your workspace',
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    description: 'Sync appointments and deadlines',
    category: 'calendar',
    iconUrl: '/icons/google-calendar.svg',
    features: ['Event sync', 'Reminder creation', 'Availability check'],
    requiredPlan: 'pro',
    authType: 'oauth2',
    setupInstructions: 'Connect your Google account',
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Sync contacts and deals with HubSpot CRM',
    category: 'crm',
    iconUrl: '/icons/hubspot.svg',
    features: ['Contact sync', 'Deal pipeline', 'Activity tracking'],
    requiredPlan: 'business',
    authType: 'oauth2',
    setupInstructions: 'Connect your HubSpot account',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Enterprise CRM integration',
    category: 'crm',
    iconUrl: '/icons/salesforce.svg',
    features: ['Lead sync', 'Opportunity management', 'Custom fields'],
    requiredPlan: 'enterprise',
    authType: 'oauth2',
    setupInstructions: 'Connect your Salesforce org',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing and invoicing',
    category: 'payment',
    iconUrl: '/icons/stripe.svg',
    features: ['Payment collection', 'Invoice sync', 'Subscription management'],
    requiredPlan: 'pro',
    authType: 'oauth2',
    setupInstructions: 'Connect your Stripe account',
  },
  {
    id: 'google_drive',
    name: 'Google Drive',
    description: 'Store and share proposal documents',
    category: 'storage',
    iconUrl: '/icons/google-drive.svg',
    features: ['Document backup', 'Folder sync', 'Shared access'],
    requiredPlan: 'pro',
    authType: 'oauth2',
    setupInstructions: 'Connect your Google account',
  },
  {
    id: 'webhook',
    name: 'Custom Webhook',
    description: 'Send data to any URL endpoint',
    category: 'automation',
    iconUrl: '/icons/webhook.svg',
    features: ['Custom payloads', 'Event filtering', 'Retry logic'],
    requiredPlan: 'business',
    authType: 'webhook',
    setupInstructions: 'Configure your webhook endpoint URL',
  },
];

const WEBHOOK_EVENTS: { event: WebhookEvent; description: string }[] = [
  { event: 'proposal.created', description: 'When a new proposal is created' },
  { event: 'proposal.sent', description: 'When a proposal is sent to client' },
  { event: 'proposal.viewed', description: 'When a client views a proposal' },
  { event: 'proposal.signed', description: 'When a proposal is signed' },
  { event: 'proposal.rejected', description: 'When a proposal is rejected' },
  { event: 'client.created', description: 'When a new client is added' },
  { event: 'client.updated', description: 'When client info is updated' },
  { event: 'payment.received', description: 'When a payment is received' },
  { event: 'payment.failed', description: 'When a payment fails' },
];

// ============================================================================
// INTEGRATIONS HUB SERVICE
// ============================================================================

export const integrationsHubService = {
  // --------------------------------------------------------------------------
  // Integration Management
  // --------------------------------------------------------------------------

  /**
   * Get available integration providers
   */
  async getAvailableProviders(orgId: string): Promise<IntegrationProviderInfo[]> {
    const plan = await entitlementsService.getEffectivePlan(orgId);
    const planOrder = { free: 0, pro: 1, business: 2, enterprise: 3 };
    const orgPlanLevel = planOrder[plan.id as keyof typeof planOrder] || 0;

    return INTEGRATION_PROVIDERS.filter((provider) => {
      const requiredLevel = planOrder[provider.requiredPlan];
      return orgPlanLevel >= requiredLevel;
    });
  },

  /**
   * Get all integrations for an org
   */
  async getIntegrations(orgId: string): Promise<Integration[]> {
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformIntegration);
  },

  /**
   * Get integration by ID
   */
  async getIntegration(integrationId: string): Promise<Integration | null> {
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? transformIntegration(data) : null;
  },

  /**
   * Get integration by provider
   */
  async getIntegrationByProvider(
    orgId: string,
    provider: IntegrationProvider
  ): Promise<Integration | null> {
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('org_id', orgId)
      .eq('provider', provider)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? transformIntegration(data) : null;
  },

  /**
   * Create integration
   */
  async createIntegration(
    orgId: string,
    provider: IntegrationProvider,
    config?: Partial<IntegrationConfig>
  ): Promise<Integration> {
    // Check plan access
    const providerInfo = INTEGRATION_PROVIDERS.find((p) => p.id === provider);
    if (!providerInfo) throw new Error('Unknown integration provider');

    const hasAccess = await this.checkProviderAccess(orgId, provider);
    if (!hasAccess) {
      throw new Error(`${providerInfo.name} requires a ${providerInfo.requiredPlan} plan`);
    }

    const { data, error } = await supabase
      .from('integrations')
      .insert({
        org_id: orgId,
        provider,
        name: providerInfo.name,
        status: 'pending',
        config: config || {},
        sync_status: 'idle',
      })
      .select()
      .single();

    if (error) throw error;
    return transformIntegration(data);
  },

  /**
   * Update integration
   */
  async updateIntegration(
    integrationId: string,
    updates: Partial<{
      config: IntegrationConfig;
      status: IntegrationStatus;
    }>
  ): Promise<Integration> {
    const { data, error } = await supabase
      .from('integrations')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', integrationId)
      .select()
      .single();

    if (error) throw error;
    return transformIntegration(data);
  },

  /**
   * Delete integration
   */
  async deleteIntegration(integrationId: string): Promise<void> {
    await supabase.from('integrations').delete().eq('id', integrationId);
  },

  /**
   * Check provider access
   */
  async checkProviderAccess(
    orgId: string,
    provider: IntegrationProvider
  ): Promise<boolean> {
    const providerInfo = INTEGRATION_PROVIDERS.find((p) => p.id === provider);
    if (!providerInfo) return false;

    const plan = await entitlementsService.getEffectivePlan(orgId);
    const planOrder = { free: 0, pro: 1, business: 2, enterprise: 3 };

    return (
      (planOrder[plan.id as keyof typeof planOrder] || 0) >=
      planOrder[providerInfo.requiredPlan]
    );
  },

  // --------------------------------------------------------------------------
  // OAuth Flow
  // --------------------------------------------------------------------------

  /**
   * Get OAuth authorization URL
   */
  getOAuthUrl(
    provider: IntegrationProvider,
    orgId: string,
    redirectUri: string
  ): string {
    const state = Buffer.from(JSON.stringify({ orgId, provider })).toString('base64');

    const oauthConfigs: Record<string, { authUrl: string; clientId: string; scopes: string }> = {
      quickbooks: {
        authUrl: 'https://appcenter.intuit.com/connect/oauth2',
        clientId: process.env.QUICKBOOKS_CLIENT_ID || '',
        scopes: 'com.intuit.quickbooks.accounting',
      },
      slack: {
        authUrl: 'https://slack.com/oauth/v2/authorize',
        clientId: process.env.SLACK_CLIENT_ID || '',
        scopes: 'chat:write,channels:read',
      },
      google_calendar: {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        scopes: 'https://www.googleapis.com/auth/calendar',
      },
      hubspot: {
        authUrl: 'https://app.hubspot.com/oauth/authorize',
        clientId: process.env.HUBSPOT_CLIENT_ID || '',
        scopes: 'contacts crm.objects.deals.read crm.objects.deals.write',
      },
    };

    const config = oauthConfigs[provider];
    if (!config) throw new Error(`OAuth not supported for ${provider}`);

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      scope: config.scopes,
      response_type: 'code',
      state,
    });

    return `${config.authUrl}?${params.toString()}`;
  },

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(
    provider: IntegrationProvider,
    code: string,
    state: string,
    redirectUri: string
  ): Promise<Integration> {
    // Decode state
    const { orgId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Exchange code for tokens (provider-specific)
    const tokens = await this.exchangeCodeForTokens(provider, code, redirectUri);

    // Get or create integration
    let integration = await this.getIntegrationByProvider(orgId, provider);
    if (!integration) {
      integration = await this.createIntegration(orgId, provider);
    }

    // Update with credentials
    await supabase
      .from('integrations')
      .update({
        status: 'connected',
        credentials: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', integration.id);

    return this.getIntegration(integration.id) as Promise<Integration>;
  },

  /**
   * Exchange OAuth code for tokens
   */
  async exchangeCodeForTokens(
    provider: IntegrationProvider,
    code: string,
    redirectUri: string
  ): Promise<{ accessToken: string; refreshToken?: string; expiresAt?: string }> {
    // In production, make actual OAuth token exchange
    console.log(`Exchanging code for ${provider}`, { code, redirectUri });

    // Mock response
    return {
      accessToken: `access_${provider}_${Date.now()}`,
      refreshToken: `refresh_${provider}_${Date.now()}`,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    };
  },

  /**
   * Refresh OAuth tokens
   */
  async refreshTokens(integrationId: string): Promise<void> {
    const integration = await this.getIntegration(integrationId);
    if (!integration?.credentials?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const tokens = await this.exchangeRefreshToken(
      integration.provider,
      integration.credentials.refreshToken
    );

    await supabase
      .from('integrations')
      .update({
        credentials: {
          ...integration.credentials,
          accessToken: tokens.accessToken,
          expiresAt: tokens.expiresAt,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', integrationId);
  },

  /**
   * Exchange refresh token
   */
  async exchangeRefreshToken(
    provider: IntegrationProvider,
    refreshToken: string
  ): Promise<{ accessToken: string; expiresAt: string }> {
    console.log(`Refreshing token for ${provider}`);

    return {
      accessToken: `access_${provider}_${Date.now()}`,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    };
  },

  // --------------------------------------------------------------------------
  // Webhooks
  // --------------------------------------------------------------------------

  /**
   * Create webhook endpoint
   */
  async createWebhookEndpoint(
    orgId: string,
    url: string,
    events: WebhookEvent[]
  ): Promise<WebhookEndpoint> {
    const secret = this.generateWebhookSecret();

    const { data, error } = await supabase
      .from('webhook_endpoints')
      .insert({
        org_id: orgId,
        url,
        events,
        secret,
        is_active: true,
        failure_count: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return transformWebhookEndpoint(data);
  },

  /**
   * Get webhook endpoints
   */
  async getWebhookEndpoints(orgId: string): Promise<WebhookEndpoint[]> {
    const { data, error } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformWebhookEndpoint);
  },

  /**
   * Update webhook endpoint
   */
  async updateWebhookEndpoint(
    endpointId: string,
    updates: Partial<{ url: string; events: WebhookEvent[]; isActive: boolean }>
  ): Promise<WebhookEndpoint> {
    const updateData: Record<string, unknown> = {};
    if (updates.url) updateData.url = updates.url;
    if (updates.events) updateData.events = updates.events;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await supabase
      .from('webhook_endpoints')
      .update(updateData)
      .eq('id', endpointId)
      .select()
      .single();

    if (error) throw error;
    return transformWebhookEndpoint(data);
  },

  /**
   * Delete webhook endpoint
   */
  async deleteWebhookEndpoint(endpointId: string): Promise<void> {
    await supabase.from('webhook_endpoints').delete().eq('id', endpointId);
  },

  /**
   * Trigger webhook
   */
  async triggerWebhook(
    orgId: string,
    event: WebhookEvent,
    payload: Record<string, unknown>
  ): Promise<void> {
    const endpoints = await this.getWebhookEndpoints(orgId);
    const activeEndpoints = endpoints.filter(
      (e) => e.isActive && e.events.includes(event)
    );

    for (const endpoint of activeEndpoints) {
      await this.deliverWebhook(endpoint, event, payload);
    }
  },

  /**
   * Deliver webhook
   */
  async deliverWebhook(
    endpoint: WebhookEndpoint,
    event: WebhookEvent,
    payload: Record<string, unknown>
  ): Promise<boolean> {
    const signature = await this.signWebhookPayload(
      JSON.stringify(payload),
      endpoint.secret
    );

    // Create delivery record
    const { data: delivery } = await supabase
      .from('webhook_deliveries')
      .insert({
        endpoint_id: endpoint.id,
        event,
        payload,
        attempts: 1,
      })
      .select()
      .single();

    try {
      // In production, make actual HTTP request
      console.log(`Delivering webhook to ${endpoint.url}`, {
        event,
        payload,
        signature,
      });

      // Mock successful delivery
      const responseStatus = 200;

      await supabase
        .from('webhook_deliveries')
        .update({
          response_status: responseStatus,
          delivered_at: new Date().toISOString(),
        })
        .eq('id', delivery?.id);

      await supabase
        .from('webhook_endpoints')
        .update({
          last_delivery_at: new Date().toISOString(),
          last_delivery_status: responseStatus,
          failure_count: 0,
        })
        .eq('id', endpoint.id);

      return true;
    } catch (error) {
      const failureCount = endpoint.failureCount + 1;

      await supabase
        .from('webhook_endpoints')
        .update({
          failure_count: failureCount,
          is_active: failureCount < 5, // Disable after 5 failures
        })
        .eq('id', endpoint.id);

      // Schedule retry
      if (failureCount < 5) {
        await supabase
          .from('webhook_deliveries')
          .update({
            next_retry_at: new Date(Date.now() + Math.pow(2, failureCount) * 60000).toISOString(),
          })
          .eq('id', delivery?.id);
      }

      return false;
    }
  },

  /**
   * Get webhook events
   */
  getWebhookEvents(): { event: WebhookEvent; description: string }[] {
    return WEBHOOK_EVENTS;
  },

  // --------------------------------------------------------------------------
  // Zapier Integration
  // --------------------------------------------------------------------------

  /**
   * Create Zapier webhook
   */
  async createZapierWebhook(
    orgId: string,
    zapId: string,
    triggerEvent: WebhookEvent,
    webhookUrl: string
  ): Promise<ZapierWebhook> {
    const { data, error } = await supabase
      .from('zapier_webhooks')
      .insert({
        org_id: orgId,
        zap_id: zapId,
        trigger_event: triggerEvent,
        webhook_url: webhookUrl,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      orgId: data.org_id,
      zapId: data.zap_id,
      triggerEvent: data.trigger_event,
      webhookUrl: data.webhook_url,
      isActive: data.is_active,
      createdAt: data.created_at,
    };
  },

  /**
   * Trigger Zapier webhooks
   */
  async triggerZapierWebhooks(
    orgId: string,
    event: WebhookEvent,
    data: Record<string, unknown>
  ): Promise<void> {
    const { data: webhooks } = await supabase
      .from('zapier_webhooks')
      .select('*')
      .eq('org_id', orgId)
      .eq('trigger_event', event)
      .eq('is_active', true);

    for (const webhook of webhooks || []) {
      try {
        console.log(`Triggering Zapier webhook: ${webhook.webhook_url}`, data);
        // In production, make HTTP POST to webhook.webhook_url
      } catch (error) {
        console.error('Zapier webhook failed:', error);
      }
    }
  },

  // --------------------------------------------------------------------------
  // QuickBooks Integration
  // --------------------------------------------------------------------------

  /**
   * Sync client to QuickBooks
   */
  async syncClientToQuickBooks(
    orgId: string,
    clientId: string
  ): Promise<{ quickbooksId: string }> {
    const integration = await this.getIntegrationByProvider(orgId, 'quickbooks');
    if (!integration || integration.status !== 'connected') {
      throw new Error('QuickBooks not connected');
    }

    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (!client) throw new Error('Client not found');

    // In production, create/update customer in QuickBooks
    console.log('Syncing client to QuickBooks:', client);

    const quickbooksId = `qb_customer_${Date.now()}`;

    // Store mapping
    await supabase
      .from('integration_mappings')
      .upsert({
        org_id: orgId,
        integration_id: integration.id,
        local_type: 'client',
        local_id: clientId,
        external_id: quickbooksId,
      });

    return { quickbooksId };
  },

  /**
   * Sync proposal to QuickBooks invoice
   */
  async syncProposalToQuickBooks(
    orgId: string,
    proposalId: string
  ): Promise<{ invoiceId: string }> {
    const integration = await this.getIntegrationByProvider(orgId, 'quickbooks');
    if (!integration || integration.status !== 'connected') {
      throw new Error('QuickBooks not connected');
    }

    const { data: proposal } = await supabase
      .from('proposals')
      .select('*, clients(*)')
      .eq('id', proposalId)
      .single();

    if (!proposal) throw new Error('Proposal not found');

    // In production, create invoice in QuickBooks
    console.log('Creating QuickBooks invoice for proposal:', proposal);

    const invoiceId = `qb_invoice_${Date.now()}`;

    await supabase
      .from('integration_mappings')
      .upsert({
        org_id: orgId,
        integration_id: integration.id,
        local_type: 'proposal',
        local_id: proposalId,
        external_id: invoiceId,
      });

    return { invoiceId };
  },

  // --------------------------------------------------------------------------
  // Sync Operations
  // --------------------------------------------------------------------------

  /**
   * Trigger sync for integration
   */
  async triggerSync(integrationId: string): Promise<void> {
    const integration = await this.getIntegration(integrationId);
    if (!integration) throw new Error('Integration not found');

    await supabase
      .from('integrations')
      .update({
        sync_status: 'syncing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', integrationId);

    try {
      // Perform provider-specific sync
      switch (integration.provider) {
        case 'quickbooks':
          await this.syncQuickBooks(integration);
          break;
        case 'slack':
          // Slack doesn't need periodic sync
          break;
        default:
          console.log(`No sync handler for ${integration.provider}`);
      }

      await supabase
        .from('integrations')
        .update({
          sync_status: 'success',
          last_sync_at: new Date().toISOString(),
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', integrationId);
    } catch (error) {
      await supabase
        .from('integrations')
        .update({
          sync_status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString(),
        })
        .eq('id', integrationId);

      throw error;
    }
  },

  /**
   * Sync QuickBooks data
   */
  async syncQuickBooks(integration: Integration): Promise<void> {
    console.log('Syncing QuickBooks data for org:', integration.orgId);
    // In production, fetch and sync data from QuickBooks API
  },

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  /**
   * Generate webhook secret
   */
  generateWebhookSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let secret = 'whsec_';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  },

  /**
   * Sign webhook payload
   */
  async signWebhookPayload(payload: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  },
};

// ============================================================================
// HELPERS
// ============================================================================

function transformIntegration(row: Record<string, unknown>): Integration {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    provider: row.provider as IntegrationProvider,
    name: row.name as string,
    status: row.status as IntegrationStatus,
    config: (row.config || {}) as IntegrationConfig,
    credentials: row.credentials as EncryptedCredentials | null,
    lastSyncAt: row.last_sync_at as string | null,
    syncStatus: row.sync_status as SyncStatus,
    errorMessage: row.error_message as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function transformWebhookEndpoint(row: Record<string, unknown>): WebhookEndpoint {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    url: row.url as string,
    events: (row.events || []) as WebhookEvent[],
    secret: row.secret as string,
    isActive: row.is_active as boolean,
    failureCount: row.failure_count as number,
    lastDeliveryAt: row.last_delivery_at as string | null,
    lastDeliveryStatus: row.last_delivery_status as number | null,
    createdAt: row.created_at as string,
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export default integrationsHubService;
