/**
 * Sommer's Proposal System - Billing Service
 * Phase 31: Stripe billing, subscriptions, and invoices
 */

import { supabase } from '../supabase';
import { entitlementsService } from '../entitlements/entitlementsService';

// ============================================================================
// TYPES
// ============================================================================

export interface Subscription {
  id: string;
  orgId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid';

export interface Invoice {
  id: string;
  orgId: string;
  stripeInvoiceId: string | null;
  amountDue: number;
  amountPaid: number;
  status: InvoiceStatus;
  pdfUrl: string | null;
  hostedInvoiceUrl: string | null;
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
}

export type InvoiceStatus =
  | 'draft'
  | 'open'
  | 'paid'
  | 'void'
  | 'uncollectible';

export interface BillingEvent {
  id: string;
  orgId: string;
  stripeEventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  processedAt: string;
}

export interface CheckoutSession {
  url: string;
  sessionId: string;
}

export interface BillingPortalSession {
  url: string;
}

// ============================================================================
// CONFIG
// ============================================================================

// Stripe price IDs (would come from env in production)
const STRIPE_PRICES = {
  pro_monthly: process.env.VITE_STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
  pro_yearly: process.env.VITE_STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly',
  business_monthly: process.env.VITE_STRIPE_PRICE_BUSINESS_MONTHLY || 'price_business_monthly',
  business_yearly: process.env.VITE_STRIPE_PRICE_BUSINESS_YEARLY || 'price_business_yearly',
  enterprise_monthly: process.env.VITE_STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly',
  enterprise_yearly: process.env.VITE_STRIPE_PRICE_ENTERPRISE_YEARLY || 'price_enterprise_yearly',
};

// ============================================================================
// BILLING SERVICE
// ============================================================================

export const billingService = {
  // --------------------------------------------------------------------------
  // Subscription Management
  // --------------------------------------------------------------------------

  /**
   * Get subscription for an org
   */
  async getSubscription(orgId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? transformSubscription(data) : null;
  },

  /**
   * Create or update subscription from Stripe webhook
   */
  async upsertSubscription(
    orgId: string,
    subscriptionData: Partial<Subscription>
  ): Promise<Subscription> {
    // Check if org is comped - don't update if so
    const isComped = await entitlementsService.isComped(orgId);
    
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert(
        {
          org_id: orgId,
          stripe_customer_id: subscriptionData.stripeCustomerId,
          stripe_subscription_id: subscriptionData.stripeSubscriptionId,
          // Don't override plan for comped orgs
          plan_id: isComped ? undefined : subscriptionData.planId,
          status: subscriptionData.status || 'active',
          current_period_start: subscriptionData.currentPeriodStart,
          current_period_end: subscriptionData.currentPeriodEnd,
          cancel_at_period_end: subscriptionData.cancelAtPeriodEnd ?? false,
          trial_end: subscriptionData.trialEnd,
          metadata: subscriptionData.metadata || {},
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'org_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return transformSubscription(data);
  },

  /**
   * Cancel subscription
   */
  async cancelSubscription(
    orgId: string,
    immediately: boolean = false
  ): Promise<void> {
    // This would call Stripe API to cancel
    // For now, just update the database
    await supabase
      .from('subscriptions')
      .update({
        status: immediately ? 'canceled' : 'active',
        cancel_at_period_end: !immediately,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId);
  },

  // --------------------------------------------------------------------------
  // Checkout & Portal
  // --------------------------------------------------------------------------

  /**
   * Create Stripe Checkout session for subscription
   */
  async createCheckoutSession(
    orgId: string,
    planId: string,
    billingPeriod: 'monthly' | 'yearly',
    options?: {
      successUrl?: string;
      cancelUrl?: string;
      trialDays?: number;
    }
  ): Promise<CheckoutSession> {
    // Get price ID
    const priceKey = `${planId}_${billingPeriod}` as keyof typeof STRIPE_PRICES;
    const priceId = STRIPE_PRICES[priceKey];

    if (!priceId) {
      throw new Error(`No price configured for ${planId} ${billingPeriod}`);
    }

    // In production, this would call Stripe API
    // For now, simulate the response
    const sessionId = `cs_${Date.now()}_${orgId}`;
    
    // Call backend API to create actual Stripe session
    const response = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgId,
        priceId,
        successUrl: options?.successUrl || `${window.location.origin}/settings/billing?success=true`,
        cancelUrl: options?.cancelUrl || `${window.location.origin}/settings/billing?canceled=true`,
        trialDays: options?.trialDays,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    return response.json();
  },

  /**
   * Create Stripe Billing Portal session
   */
  async createPortalSession(
    orgId: string,
    returnUrl?: string
  ): Promise<BillingPortalSession> {
    // Get customer ID
    const subscription = await this.getSubscription(orgId);
    if (!subscription?.stripeCustomerId) {
      throw new Error('No billing account found');
    }

    // Call backend API
    const response = await fetch('/api/billing/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: subscription.stripeCustomerId,
        returnUrl: returnUrl || `${window.location.origin}/settings/billing`,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create portal session');
    }

    return response.json();
  },

  // --------------------------------------------------------------------------
  // Invoices
  // --------------------------------------------------------------------------

  /**
   * Get invoices for an org
   */
  async getInvoices(
    orgId: string,
    options?: { limit?: number; status?: InvoiceStatus }
  ): Promise<Invoice[]> {
    let query = supabase
      .from('invoices')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(transformInvoice);
  },

  /**
   * Get a specific invoice
   */
  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? transformInvoice(data) : null;
  },

  /**
   * Create invoice record from Stripe webhook
   */
  async createInvoice(invoiceData: Partial<Invoice> & { orgId: string }): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        org_id: invoiceData.orgId,
        stripe_invoice_id: invoiceData.stripeInvoiceId,
        amount_due: invoiceData.amountDue || 0,
        amount_paid: invoiceData.amountPaid || 0,
        status: invoiceData.status || 'draft',
        pdf_url: invoiceData.pdfUrl,
        hosted_invoice_url: invoiceData.hostedInvoiceUrl,
        due_date: invoiceData.dueDate,
        paid_at: invoiceData.paidAt,
      })
      .select()
      .single();

    if (error) throw error;
    return transformInvoice(data);
  },

  // --------------------------------------------------------------------------
  // Webhook Processing
  // --------------------------------------------------------------------------

  /**
   * Process Stripe webhook event
   */
  async processWebhook(
    eventId: string,
    eventType: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    // Check if already processed
    const { data: existing } = await supabase
      .from('billing_events')
      .select('id')
      .eq('stripe_event_id', eventId)
      .single();

    if (existing) {
      console.log('Webhook already processed:', eventId);
      return;
    }

    // Extract org ID from payload
    const orgId = extractOrgIdFromPayload(payload);
    if (!orgId) {
      console.error('Could not extract org ID from webhook payload');
      return;
    }

    // Log the event
    await supabase.from('billing_events').insert({
      org_id: orgId,
      stripe_event_id: eventId,
      event_type: eventType,
      payload,
      processed_at: new Date().toISOString(),
    });

    // Handle specific events
    switch (eventType) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(orgId, payload);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(orgId, payload);
        break;

      case 'invoice.paid':
        await this.handleInvoicePaid(orgId, payload);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(orgId, payload);
        break;

      default:
        console.log('Unhandled webhook event type:', eventType);
    }
  },

  /**
   * Handle subscription update
   */
  async handleSubscriptionUpdate(
    orgId: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const subscription = payload.data?.object as Record<string, unknown>;
    if (!subscription) return;

    // Check if comped - don't downgrade comped orgs
    const isComped = await entitlementsService.isComped(orgId);

    const planId = mapStripePriceToplan(subscription.items?.data?.[0]?.price?.id);

    await this.upsertSubscription(orgId, {
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id as string,
      planId: isComped ? undefined : planId,
      status: subscription.status as SubscriptionStatus,
      currentPeriodStart: subscription.current_period_start
        ? new Date((subscription.current_period_start as number) * 1000).toISOString()
        : null,
      currentPeriodEnd: subscription.current_period_end
        ? new Date((subscription.current_period_end as number) * 1000).toISOString()
        : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end as boolean,
      trialEnd: subscription.trial_end
        ? new Date((subscription.trial_end as number) * 1000).toISOString()
        : null,
    });
  },

  /**
   * Handle subscription deleted
   */
  async handleSubscriptionDeleted(
    orgId: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    // Check if comped - comped orgs stay on their plan
    const isComped = await entitlementsService.isComped(orgId);
    if (isComped) return;

    await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        plan_id: 'free', // Downgrade to free
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId);
  },

  /**
   * Handle invoice paid
   */
  async handleInvoicePaid(
    orgId: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const invoice = payload.data?.object as Record<string, unknown>;
    if (!invoice) return;

    await this.createInvoice({
      orgId,
      stripeInvoiceId: invoice.id as string,
      amountDue: invoice.amount_due as number,
      amountPaid: invoice.amount_paid as number,
      status: 'paid',
      pdfUrl: invoice.invoice_pdf as string,
      hostedInvoiceUrl: invoice.hosted_invoice_url as string,
      paidAt: new Date().toISOString(),
    });
  },

  /**
   * Handle payment failed
   */
  async handlePaymentFailed(
    orgId: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    // Update subscription status
    await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId);

    // Could also send notification to org admins here
  },

  // --------------------------------------------------------------------------
  // Billing Info
  // --------------------------------------------------------------------------

  /**
   * Get billing overview for display
   */
  async getBillingOverview(orgId: string): Promise<{
    subscription: Subscription | null;
    plan: { name: string; displayName: string; price: number };
    isComped: boolean;
    invoices: Invoice[];
    nextBillingDate: string | null;
    cancelAtPeriodEnd: boolean;
  }> {
    const [subscription, plan, isComped, invoices] = await Promise.all([
      this.getSubscription(orgId),
      entitlementsService.getEffectivePlan(orgId),
      entitlementsService.isComped(orgId),
      this.getInvoices(orgId, { limit: 5 }),
    ]);

    return {
      subscription,
      plan: {
        name: plan.name,
        displayName: plan.displayName,
        price: plan.priceMonthly,
      },
      isComped,
      invoices,
      nextBillingDate: subscription?.currentPeriodEnd || null,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
    };
  },
};

// ============================================================================
// HELPERS
// ============================================================================

function transformSubscription(row: Record<string, unknown>): Subscription {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    stripeCustomerId: row.stripe_customer_id as string | null,
    stripeSubscriptionId: row.stripe_subscription_id as string | null,
    planId: row.plan_id as string,
    status: row.status as SubscriptionStatus,
    currentPeriodStart: row.current_period_start as string | null,
    currentPeriodEnd: row.current_period_end as string | null,
    cancelAtPeriodEnd: row.cancel_at_period_end as boolean,
    trialEnd: row.trial_end as string | null,
    metadata: row.metadata as Record<string, unknown>,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function transformInvoice(row: Record<string, unknown>): Invoice {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    stripeInvoiceId: row.stripe_invoice_id as string | null,
    amountDue: row.amount_due as number,
    amountPaid: row.amount_paid as number,
    status: row.status as InvoiceStatus,
    pdfUrl: row.pdf_url as string | null,
    hostedInvoiceUrl: row.hosted_invoice_url as string | null,
    dueDate: row.due_date as string | null,
    paidAt: row.paid_at as string | null,
    createdAt: row.created_at as string,
  };
}

function extractOrgIdFromPayload(payload: Record<string, unknown>): string | null {
  // Try to get org ID from metadata
  const obj = payload.data?.object as Record<string, unknown>;
  if (!obj) return null;

  // Check subscription metadata
  if (obj.metadata?.org_id) {
    return obj.metadata.org_id as string;
  }

  // Check customer metadata
  if (obj.customer_metadata?.org_id) {
    return obj.customer_metadata.org_id as string;
  }

  return null;
}

function mapStripePriceToplan(priceId: string): string {
  // Map Stripe price IDs to plan IDs
  const priceMap: Record<string, string> = {
    [STRIPE_PRICES.pro_monthly]: 'pro',
    [STRIPE_PRICES.pro_yearly]: 'pro',
    [STRIPE_PRICES.business_monthly]: 'business',
    [STRIPE_PRICES.business_yearly]: 'business',
    [STRIPE_PRICES.enterprise_monthly]: 'enterprise',
    [STRIPE_PRICES.enterprise_yearly]: 'enterprise',
  };

  return priceMap[priceId] || 'free';
}

// ============================================================================
// EXPORT
// ============================================================================

export default billingService;
