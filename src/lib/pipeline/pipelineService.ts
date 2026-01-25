/**
 * Pipeline Service
 * CRM deal pipeline management
 */

import { supabase } from '@/lib/supabase';

export interface DealStage {
  id: string;
  org_id: string;
  name: string;
  position: number;
  probability: number;
  color: string;
  is_won: boolean;
  is_lost: boolean;
}

export interface Deal {
  id: string;
  org_id: string;
  name: string;
  contact_id?: string;
  company_id?: string;
  proposal_id?: string;
  stage_id: string;
  owner_id?: string;
  value: number;
  probability: number;
  expected_close_date?: string;
  source?: string;
  lost_reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DealWithRelations extends Deal {
  stage?: DealStage;
  contact?: { first_name: string; last_name?: string; email?: string };
  company?: { name: string };
  owner?: { first_name: string; last_name?: string };
}

// Get pipeline stages
export async function getStages(orgId: string): Promise<DealStage[]> {
  const { data, error } = await supabase
    .from('deal_stages')
    .select('*')
    .eq('org_id', orgId)
    .order('position');

  if (error) throw error;
  return data || [];
}

// Create default stages
export async function createDefaultStages(orgId: string): Promise<void> {
  const defaultStages = [
    { name: 'Lead', position: 1, probability: 10, color: '#6B7280' },
    { name: 'Qualified', position: 2, probability: 25, color: '#3B82F6' },
    { name: 'Proposal Sent', position: 3, probability: 50, color: '#8B5CF6' },
    { name: 'Negotiation', position: 4, probability: 75, color: '#F59E0B' },
    { name: 'Won', position: 5, probability: 100, color: '#22C55E', is_won: true },
    { name: 'Lost', position: 6, probability: 0, color: '#EF4444', is_lost: true },
  ];

  const { error } = await supabase.from('deal_stages').insert(
    defaultStages.map((s) => ({ org_id: orgId, ...s }))
  );

  if (error) throw error;
}

// Get deals
export async function getDeals(orgId: string, stageId?: string): Promise<DealWithRelations[]> {
  let query = supabase
    .from('deals')
    .select(`
      *,
      stage:deal_stages(*),
      contact:contacts(first_name, last_name, email),
      company:companies(name),
      owner:team_members(first_name, last_name)
    `)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (stageId) {
    query = query.eq('stage_id', stageId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Create deal
export async function createDeal(orgId: string, data: Partial<Deal>): Promise<Deal> {
  const { data: deal, error } = await supabase
    .from('deals')
    .insert({
      org_id: orgId,
      name: data.name || 'New Deal',
      value: data.value || 0,
      probability: data.probability || 0,
      ...data,
    })
    .select()
    .single();

  if (error) throw error;
  return deal;
}

// Update deal
export async function updateDeal(dealId: string, data: Partial<Deal>): Promise<Deal> {
  const { data: deal, error } = await supabase
    .from('deals')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', dealId)
    .select()
    .single();

  if (error) throw error;
  return deal;
}

// Move deal to stage
export async function moveDealToStage(dealId: string, stageId: string): Promise<Deal> {
  const { data: stage } = await supabase
    .from('deal_stages')
    .select('probability, is_won, is_lost')
    .eq('id', stageId)
    .single();

  return updateDeal(dealId, {
    stage_id: stageId,
    probability: stage?.probability || 0,
  });
}

// Delete deal
export async function deleteDeal(dealId: string): Promise<void> {
  const { error } = await supabase.from('deals').delete().eq('id', dealId);
  if (error) throw error;
}

// Get pipeline summary
export async function getPipelineSummary(orgId: string) {
  const stages = await getStages(orgId);
  const deals = await getDeals(orgId);

  return stages.map((stage) => {
    const stageDeals = deals.filter((d) => d.stage_id === stage.id);
    return {
      stage,
      count: stageDeals.length,
      value: stageDeals.reduce((sum, d) => sum + d.value, 0),
      weightedValue: stageDeals.reduce((sum, d) => sum + d.value * (d.probability / 100), 0),
    };
  });
}

export default {
  getStages,
  createDefaultStages,
  getDeals,
  createDeal,
  updateDeal,
  moveDealToStage,
  deleteDeal,
  getPipelineSummary,
};
