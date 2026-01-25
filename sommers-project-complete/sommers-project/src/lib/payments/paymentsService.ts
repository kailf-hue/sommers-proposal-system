/**
 * Payments Service
 * Stripe payment processing and payment plans
 */

import { supabase } from '@/lib/supabase';

export interface PaymentPlanTemplate {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  installments: number;
  interval_days: number;
  first_payment_percent: number;
  is_active: boolean;
}

export interface PaymentPlan {
  id: string;
  org_id: string;
  proposal_id: string;
  template_id?: string;
  total_amount: number;
  paid_amount: number;
  status: 'active' | 'completed' | 'cancelled' | 'defaulted';
  created_at: string;
}

export interface PaymentInstallment {
  id: string;
  plan_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  paid_at?: string;
  stripe_payment_intent_id?: string;
  status: 'pending' | 'paid' | 'overdue' | 'failed';
}

// Get payment plan templates
export async function getPaymentPlanTemplates(orgId: string): Promise<PaymentPlanTemplate[]> {
  const { data, error } = await supabase
    .from('payment_plan_templates')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('installments');

  if (error) throw error;
  return data || [];
}

// Create payment plan
export async function createPaymentPlan(
  orgId: string,
  proposalId: string,
  totalAmount: number,
  templateId?: string
): Promise<PaymentPlan> {
  const { data: plan, error } = await supabase
    .from('payment_plans')
    .insert({
      org_id: orgId,
      proposal_id: proposalId,
      template_id: templateId,
      total_amount: totalAmount,
      paid_amount: 0,
      status: 'active',
    })
    .select()
    .single();

  if (error) throw error;
  return plan;
}

// Create installments
export async function createInstallments(
  planId: string,
  totalAmount: number,
  numInstallments: number,
  firstPaymentPercent: number,
  intervalDays: number
): Promise<PaymentInstallment[]> {
  const firstAmount = totalAmount * (firstPaymentPercent / 100);
  const remainingAmount = totalAmount - firstAmount;
  const installmentAmount = remainingAmount / (numInstallments - 1);

  const installments: Omit<PaymentInstallment, 'id'>[] = [];
  let dueDate = new Date();

  for (let i = 1; i <= numInstallments; i++) {
    installments.push({
      plan_id: planId,
      installment_number: i,
      amount: i === 1 ? firstAmount : installmentAmount,
      due_date: dueDate.toISOString(),
      status: 'pending',
    });
    dueDate.setDate(dueDate.getDate() + intervalDays);
  }

  const { data, error } = await supabase
    .from('payment_plan_installments')
    .insert(installments)
    .select();

  if (error) throw error;
  return data;
}

// Create Stripe payment intent
export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd',
  metadata?: Record<string, string>
): Promise<{ clientSecret: string }> {
  const response = await fetch('/api/payments/create-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, currency, metadata }),
  });

  if (!response.ok) throw new Error('Failed to create payment intent');
  return response.json();
}

// Record payment
export async function recordPayment(
  installmentId: string,
  stripePaymentIntentId: string
): Promise<void> {
  // Update installment
  const { data: installment } = await supabase
    .from('payment_plan_installments')
    .update({
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id: stripePaymentIntentId,
      status: 'paid',
    })
    .eq('id', installmentId)
    .select('plan_id, amount')
    .single();

  if (!installment) return;

  // Update plan paid amount
  await supabase.rpc('increment_plan_paid_amount', {
    plan_id: installment.plan_id,
    amount: installment.amount,
  });

  // Check if plan is complete
  const { data: plan } = await supabase
    .from('payment_plans')
    .select('total_amount, paid_amount')
    .eq('id', installment.plan_id)
    .single();

  if (plan && plan.paid_amount >= plan.total_amount) {
    await supabase
      .from('payment_plans')
      .update({ status: 'completed' })
      .eq('id', installment.plan_id);
  }
}

// Get overdue installments
export async function getOverdueInstallments(orgId: string): Promise<PaymentInstallment[]> {
  const { data, error } = await supabase
    .from('payment_plan_installments')
    .select(`*, plan:payment_plans!inner(org_id)`)
    .eq('plan.org_id', orgId)
    .eq('status', 'pending')
    .lt('due_date', new Date().toISOString());

  if (error) throw error;
  return data || [];
}

export default {
  getPaymentPlanTemplates,
  createPaymentPlan,
  createInstallments,
  createPaymentIntent,
  recordPayment,
  getOverdueInstallments,
};
