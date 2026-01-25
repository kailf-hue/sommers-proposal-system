/**
 * Templates Service
 * Proposal templates and content blocks
 */

import { supabase } from '@/lib/supabase';

export interface ProposalTemplate {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  category?: string;
  introduction?: string;
  scope_of_work?: string;
  terms_and_conditions?: string;
  custom_sections?: Record<string, any>;
  default_services?: string[];
  default_tier?: string;
  default_valid_days?: number;
  is_active: boolean;
  use_count: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentBlock {
  id: string;
  org_id: string;
  name: string;
  category: string;
  content: string;
  variables?: string[];
  is_active: boolean;
  use_count: number;
  created_at: string;
}

// Get templates
export async function getTemplates(orgId: string): Promise<ProposalTemplate[]> {
  const { data, error } = await supabase
    .from('proposal_templates')
    .select('*')
    .eq('org_id', orgId)
    .order('name');

  if (error) throw error;
  return data || [];
}

// Get template
export async function getTemplate(templateId: string): Promise<ProposalTemplate | null> {
  const { data, error } = await supabase
    .from('proposal_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (error) return null;
  return data;
}

// Create template
export async function createTemplate(
  orgId: string,
  userId: string,
  data: Partial<ProposalTemplate>
): Promise<ProposalTemplate> {
  const { data: template, error } = await supabase
    .from('proposal_templates')
    .insert({
      org_id: orgId,
      created_by: userId,
      name: data.name || 'New Template',
      is_active: true,
      use_count: 0,
      ...data,
    })
    .select()
    .single();

  if (error) throw error;
  return template;
}

// Update template
export async function updateTemplate(
  templateId: string,
  data: Partial<ProposalTemplate>
): Promise<ProposalTemplate> {
  const { data: template, error } = await supabase
    .from('proposal_templates')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', templateId)
    .select()
    .single();

  if (error) throw error;
  return template;
}

// Delete template
export async function deleteTemplate(templateId: string): Promise<void> {
  const { error } = await supabase.from('proposal_templates').delete().eq('id', templateId);
  if (error) throw error;
}

// Increment template use count
export async function incrementTemplateUse(templateId: string): Promise<void> {
  await supabase.rpc('increment_template_use', { template_id: templateId });
}

// Get content blocks
export async function getContentBlocks(orgId: string, category?: string): Promise<ContentBlock[]> {
  let query = supabase
    .from('content_blocks')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('name');

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Create content block
export async function createContentBlock(
  orgId: string,
  data: Partial<ContentBlock>
): Promise<ContentBlock> {
  const { data: block, error } = await supabase
    .from('content_blocks')
    .insert({
      org_id: orgId,
      name: data.name || 'New Block',
      category: data.category || 'general',
      content: data.content || '',
      is_active: true,
      use_count: 0,
      ...data,
    })
    .select()
    .single();

  if (error) throw error;
  return block;
}

// Replace variables in content
export function processContentVariables(
  content: string,
  variables: Record<string, string>
): string {
  let processed = content;
  Object.entries(variables).forEach(([key, value]) => {
    processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  return processed;
}

export default {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  incrementTemplateUse,
  getContentBlocks,
  createContentBlock,
  processContentVariables,
};
