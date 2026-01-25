/**
 * Audit Service
 * GDPR compliance and audit logging
 */

import { supabase } from '@/lib/supabase';

export interface AuditLog {
  id: string;
  org_id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_data?: Record<string, any>;
  new_data?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface DataExportRequest {
  id: string;
  org_id: string;
  user_id: string;
  entity_type: string;
  entity_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  download_url?: string;
  expires_at?: string;
  created_at: string;
}

// Log action
export async function logAction(
  orgId: string,
  action: string,
  entityType: string,
  entityId?: string,
  data?: { old?: any; new?: any },
  userId?: string
): Promise<void> {
  const { error } = await supabase.from('audit_logs').insert({
    org_id: orgId,
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    old_data: data?.old,
    new_data: data?.new,
  });

  if (error) console.error('Failed to log action:', error);
}

// Get audit logs
export async function getAuditLogs(
  orgId: string,
  filters?: {
    entityType?: string;
    entityId?: string;
    userId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  },
  limit: number = 100
): Promise<AuditLog[]> {
  let query = supabase
    .from('audit_logs')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filters?.entityType) query = query.eq('entity_type', filters.entityType);
  if (filters?.entityId) query = query.eq('entity_id', filters.entityId);
  if (filters?.userId) query = query.eq('user_id', filters.userId);
  if (filters?.action) query = query.eq('action', filters.action);
  if (filters?.startDate) query = query.gte('created_at', filters.startDate);
  if (filters?.endDate) query = query.lte('created_at', filters.endDate);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Request data export (GDPR)
export async function requestDataExport(
  orgId: string,
  userId: string,
  entityType: string,
  entityId?: string
): Promise<DataExportRequest> {
  const { data, error } = await supabase
    .from('data_export_requests')
    .insert({
      org_id: orgId,
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  // Trigger export job (would be handled by a background worker)
  await processDataExport(data.id);

  return data;
}

// Process data export
async function processDataExport(requestId: string): Promise<void> {
  // Update status
  await supabase
    .from('data_export_requests')
    .update({ status: 'processing' })
    .eq('id', requestId);

  try {
    const { data: request } = await supabase
      .from('data_export_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (!request) return;

    // Gather data based on entity type
    let exportData: any = {};

    if (request.entity_type === 'contact' && request.entity_id) {
      const { data: contact } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', request.entity_id)
        .single();

      const { data: proposals } = await supabase
        .from('proposals')
        .select('*')
        .eq('contact_id', request.entity_id);

      exportData = { contact, proposals };
    }

    // Create export file
    const exportJson = JSON.stringify(exportData, null, 2);
    const blob = new Blob([exportJson], { type: 'application/json' });

    // TODO: Upload to storage and get URL

    // Update request
    await supabase
      .from('data_export_requests')
      .update({
        status: 'completed',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('id', requestId);
  } catch (error) {
    await supabase
      .from('data_export_requests')
      .update({ status: 'failed' })
      .eq('id', requestId);
  }
}

// Delete user data (GDPR right to erasure)
export async function deleteUserData(
  orgId: string,
  contactId: string,
  userId: string
): Promise<void> {
  // Log the deletion request
  await logAction(orgId, 'gdpr_deletion_request', 'contact', contactId, undefined, userId);

  // Anonymize contact data
  await supabase
    .from('contacts')
    .update({
      first_name: 'DELETED',
      last_name: null,
      email: null,
      phone: null,
      mobile: null,
      address: null,
      notes: 'Data deleted per GDPR request',
      updated_at: new Date().toISOString(),
    })
    .eq('id', contactId);

  // Log completion
  await logAction(orgId, 'gdpr_deletion_completed', 'contact', contactId, undefined, userId);
}

export default {
  logAction,
  getAuditLogs,
  requestDataExport,
  deleteUserData,
};
