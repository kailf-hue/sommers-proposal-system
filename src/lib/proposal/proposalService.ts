/**
 * Proposal Service
 * Core proposal management logic
 */

import { supabase, uploadFile, deleteFile } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Proposal = Database['public']['Tables']['proposals']['Row'];
type ProposalInsert = Database['public']['Tables']['proposals']['Insert'];
type ProposalUpdate = Database['public']['Tables']['proposals']['Update'];

// ============================================================================
// TYPES
// ============================================================================

export interface ProposalWithRelations extends Proposal {
  contact?: {
    id: string;
    first_name: string;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  };
  company?: {
    id: string;
    name: string;
  };
  line_items?: ProposalLineItem[];
  images?: ProposalImage[];
  signatures?: ProposalSignature[];
}

export interface ProposalLineItem {
  id: string;
  proposal_id: string;
  service_id: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
  tier: 'economy' | 'standard' | 'premium' | 'all';
  position: number;
}

export interface ProposalImage {
  id: string;
  proposal_id: string;
  url: string;
  caption?: string;
  position: number;
  type: 'property' | 'before' | 'after' | 'diagram';
}

export interface ProposalSignature {
  id: string;
  proposal_id: string;
  signer_name: string;
  signer_email: string;
  signer_title?: string;
  signature_data: string;
  ip_address?: string;
  user_agent?: string;
  signed_at: string;
}

export interface ProposalFilters {
  status?: string[];
  dateFrom?: string;
  dateTo?: string;
  assignedTo?: string;
  search?: string;
  tier?: string[];
  minTotal?: number;
  maxTotal?: number;
}

// ============================================================================
// GENERATE PROPOSAL NUMBER
// ============================================================================

export async function generateProposalNumber(orgId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = 'SOM';

  // Get the last proposal number for this year
  const { data, error } = await supabase
    .from('proposals')
    .select('proposal_number')
    .eq('org_id', orgId)
    .like('proposal_number', `${prefix}-${year}-%`)
    .order('created_at', { ascending: false })
    .limit(1);

  let nextNumber = 1;

  if (data && data.length > 0) {
    const lastNumber = data[0].proposal_number.split('-')[2];
    nextNumber = parseInt(lastNumber, 10) + 1;
  }

  return `${prefix}-${year}-${nextNumber.toString().padStart(4, '0')}`;
}

// ============================================================================
// CREATE PROPOSAL
// ============================================================================

export async function createProposal(
  orgId: string,
  userId: string,
  data: Partial<ProposalInsert>
): Promise<Proposal> {
  const proposalNumber = await generateProposalNumber(orgId);

  const { data: proposal, error } = await supabase
    .from('proposals')
    .insert({
      org_id: orgId,
      proposal_number: proposalNumber,
      created_by: userId,
      status: 'draft',
      tier: 'standard',
      valid_days: 30,
      deposit_percent: 50,
      ...data,
    })
    .select()
    .single();

  if (error) throw error;
  return proposal;
}

// ============================================================================
// GET PROPOSALS
// ============================================================================

export async function getProposals(
  orgId: string,
  filters?: ProposalFilters
): Promise<ProposalWithRelations[]> {
  let query = supabase
    .from('proposals')
    .select(`
      *,
      contact:contacts(id, first_name, last_name, email, phone),
      company:companies(id, name)
    `)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.status?.length) {
    query = query.in('status', filters.status);
  }
  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }
  if (filters?.assignedTo) {
    query = query.eq('assigned_to', filters.assignedTo);
  }
  if (filters?.tier?.length) {
    query = query.in('tier', filters.tier);
  }
  if (filters?.minTotal) {
    query = query.gte('total', filters.minTotal);
  }
  if (filters?.maxTotal) {
    query = query.lte('total', filters.maxTotal);
  }
  if (filters?.search) {
    query = query.or(`proposal_number.ilike.%${filters.search}%,property_name.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ============================================================================
// GET SINGLE PROPOSAL
// ============================================================================

export async function getProposal(
  proposalId: string
): Promise<ProposalWithRelations | null> {
  const { data, error } = await supabase
    .from('proposals')
    .select(`
      *,
      contact:contacts(id, first_name, last_name, email, phone),
      company:companies(id, name),
      line_items:proposal_line_items(*),
      images:proposal_images(*),
      signatures:proposal_signatures(*)
    `)
    .eq('id', proposalId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

// ============================================================================
// UPDATE PROPOSAL
// ============================================================================

export async function updateProposal(
  proposalId: string,
  data: ProposalUpdate
): Promise<Proposal> {
  const { data: proposal, error } = await supabase
    .from('proposals')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', proposalId)
    .select()
    .single();

  if (error) throw error;
  return proposal;
}

// ============================================================================
// DELETE PROPOSAL
// ============================================================================

export async function deleteProposal(proposalId: string): Promise<void> {
  // Delete related images from storage
  const { data: images } = await supabase
    .from('proposal_images')
    .select('url')
    .eq('proposal_id', proposalId);

  if (images) {
    for (const image of images) {
      await deleteFile(image.url);
    }
  }

  const { error } = await supabase
    .from('proposals')
    .delete()
    .eq('id', proposalId);

  if (error) throw error;
}

// ============================================================================
// LINE ITEMS
// ============================================================================

export async function addLineItem(
  proposalId: string,
  item: Omit<ProposalLineItem, 'id' | 'proposal_id'>
): Promise<ProposalLineItem> {
  const { data, error } = await supabase
    .from('proposal_line_items')
    .insert({
      proposal_id: proposalId,
      ...item,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLineItem(
  itemId: string,
  data: Partial<ProposalLineItem>
): Promise<ProposalLineItem> {
  const { data: item, error } = await supabase
    .from('proposal_line_items')
    .update(data)
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return item;
}

export async function deleteLineItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('proposal_line_items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
}

// ============================================================================
// IMAGES
// ============================================================================

export async function addProposalImage(
  proposalId: string,
  file: File,
  type: ProposalImage['type'],
  caption?: string
): Promise<ProposalImage> {
  // Upload to storage
  const url = await uploadFile('proposal-images', proposalId, file);

  // Get max position
  const { data: existing } = await supabase
    .from('proposal_images')
    .select('position')
    .eq('proposal_id', proposalId)
    .order('position', { ascending: false })
    .limit(1);

  const position = (existing?.[0]?.position || 0) + 1;

  // Create record
  const { data, error } = await supabase
    .from('proposal_images')
    .insert({
      proposal_id: proposalId,
      url,
      type,
      caption,
      position,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProposalImage(imageId: string): Promise<void> {
  const { data: image } = await supabase
    .from('proposal_images')
    .select('url')
    .eq('id', imageId)
    .single();

  if (image) {
    await deleteFile(image.url);
  }

  const { error } = await supabase
    .from('proposal_images')
    .delete()
    .eq('id', imageId);

  if (error) throw error;
}

// ============================================================================
// SEND PROPOSAL
// ============================================================================

export async function sendProposal(
  proposalId: string,
  email: string
): Promise<void> {
  // Update status
  await updateProposal(proposalId, {
    status: 'sent',
    sent_at: new Date().toISOString(),
    valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // Send email via API
  const proposal = await getProposal(proposalId);
  if (!proposal) throw new Error('Proposal not found');

  await fetch('/api/email/send-proposal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: email,
      proposalId,
      proposalNumber: proposal.proposal_number,
      clientName: proposal.contact?.first_name || 'Customer',
      total: proposal.total,
      viewUrl: `${window.location.origin}/p/${proposalId}`,
    }),
  });
}

// ============================================================================
// RECORD VIEW
// ============================================================================

export async function recordProposalView(
  proposalId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  // Update proposal
  await supabase
    .from('proposals')
    .update({
      status: 'viewed',
      viewed_at: new Date().toISOString(),
    })
    .eq('id', proposalId)
    .eq('status', 'sent');

  // Record view event
  await supabase.from('proposal_views').insert({
    proposal_id: proposalId,
    ip_address: ipAddress,
    user_agent: userAgent,
    viewed_at: new Date().toISOString(),
  });
}

// ============================================================================
// SIGN PROPOSAL
// ============================================================================

export async function signProposal(
  proposalId: string,
  signature: Omit<ProposalSignature, 'id' | 'proposal_id' | 'signed_at'>
): Promise<void> {
  // Create signature record
  await supabase.from('proposal_signatures').insert({
    proposal_id: proposalId,
    ...signature,
    signed_at: new Date().toISOString(),
  });

  // Update proposal status
  await updateProposal(proposalId, {
    status: 'accepted',
    signed_at: new Date().toISOString(),
  });
}

// ============================================================================
// DUPLICATE PROPOSAL
// ============================================================================

export async function duplicateProposal(
  proposalId: string,
  userId: string
): Promise<Proposal> {
  const original = await getProposal(proposalId);
  if (!original) throw new Error('Proposal not found');

  // Create new proposal
  const newProposal = await createProposal(original.org_id, userId, {
    contact_id: original.contact_id,
    company_id: original.company_id,
    template_id: original.template_id,
    property_name: original.property_name,
    property_type: original.property_type,
    property_address: original.property_address,
    property_city: original.property_city,
    property_state: original.property_state,
    property_zip: original.property_zip,
    total_sqft: original.total_sqft,
    net_sqft: original.net_sqft,
    surface_condition: original.surface_condition,
    measurements: original.measurements,
    tier: original.tier,
    title: `Copy of ${original.title || original.proposal_number}`,
    introduction: original.introduction,
    scope_of_work: original.scope_of_work,
    terms_and_conditions: original.terms_and_conditions,
    custom_sections: original.custom_sections,
    valid_days: original.valid_days,
    deposit_percent: original.deposit_percent,
  });

  // Copy line items
  if (original.line_items) {
    for (const item of original.line_items) {
      await addLineItem(newProposal.id, {
        service_id: item.service_id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        total: item.total,
        tier: item.tier,
        position: item.position,
      });
    }
  }

  return newProposal;
}

export default {
  generateProposalNumber,
  createProposal,
  getProposals,
  getProposal,
  updateProposal,
  deleteProposal,
  addLineItem,
  updateLineItem,
  deleteLineItem,
  addProposalImage,
  deleteProposalImage,
  sendProposal,
  recordProposalView,
  signProposal,
  duplicateProposal,
};
