/**
 * Clients Service
 * Contact and company management
 */

import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface Contact {
  id: string;
  org_id: string;
  company_id?: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  title?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  preferred_contact_method: string;
  do_not_contact: boolean;
  source?: string;
  lead_score: number;
  tags?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  org_id: string;
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  annual_revenue?: number;
  employee_count?: number;
  lifetime_value: number;
  loyalty_tier?: string;
  loyalty_points: number;
  tags?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactWithCompany extends Contact {
  company?: Company;
}

export interface ContactFilters {
  search?: string;
  companyId?: string;
  source?: string;
  tags?: string[];
  minScore?: number;
}

// ============================================================================
// CONTACTS
// ============================================================================

export async function getContacts(
  orgId: string,
  filters?: ContactFilters
): Promise<ContactWithCompany[]> {
  let query = supabase
    .from('contacts')
    .select(`
      *,
      company:companies(*)
    `)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  if (filters?.search) {
    query = query.or(
      `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
    );
  }
  if (filters?.companyId) {
    query = query.eq('company_id', filters.companyId);
  }
  if (filters?.source) {
    query = query.eq('source', filters.source);
  }
  if (filters?.minScore) {
    query = query.gte('lead_score', filters.minScore);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getContact(contactId: string): Promise<ContactWithCompany | null> {
  const { data, error } = await supabase
    .from('contacts')
    .select(`
      *,
      company:companies(*)
    `)
    .eq('id', contactId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function createContact(
  orgId: string,
  data: Partial<Contact>
): Promise<Contact> {
  const { data: contact, error } = await supabase
    .from('contacts')
    .insert({
      org_id: orgId,
      first_name: data.first_name || 'Unknown',
      ...data,
    })
    .select()
    .single();

  if (error) throw error;
  return contact;
}

export async function updateContact(
  contactId: string,
  data: Partial<Contact>
): Promise<Contact> {
  const { data: contact, error } = await supabase
    .from('contacts')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contactId)
    .select()
    .single();

  if (error) throw error;
  return contact;
}

export async function deleteContact(contactId: string): Promise<void> {
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId);

  if (error) throw error;
}

// ============================================================================
// COMPANIES
// ============================================================================

export async function getCompanies(
  orgId: string,
  search?: string
): Promise<Company[]> {
  let query = supabase
    .from('companies')
    .select('*')
    .eq('org_id', orgId)
    .order('name');

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getCompany(companyId: string): Promise<Company | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function createCompany(
  orgId: string,
  data: Partial<Company>
): Promise<Company> {
  const { data: company, error } = await supabase
    .from('companies')
    .insert({
      org_id: orgId,
      name: data.name || 'New Company',
      lifetime_value: 0,
      loyalty_points: 0,
      ...data,
    })
    .select()
    .single();

  if (error) throw error;
  return company;
}

export async function updateCompany(
  companyId: string,
  data: Partial<Company>
): Promise<Company> {
  const { data: company, error } = await supabase
    .from('companies')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', companyId)
    .select()
    .single();

  if (error) throw error;
  return company;
}

export async function deleteCompany(companyId: string): Promise<void> {
  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', companyId);

  if (error) throw error;
}

// ============================================================================
// ACTIVITY TRACKING
// ============================================================================

export async function logContactActivity(
  contactId: string,
  activityType: string,
  description: string,
  metadata?: Record<string, any>
): Promise<void> {
  const { error } = await supabase.from('contact_activities').insert({
    contact_id: contactId,
    activity_type: activityType,
    description,
    metadata,
    created_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export async function getContactActivities(
  contactId: string,
  limit: number = 20
) {
  const { data, error } = await supabase
    .from('contact_activities')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// ============================================================================
// LEAD SCORING
// ============================================================================

export async function updateLeadScore(contactId: string): Promise<number> {
  // Get contact data
  const contact = await getContact(contactId);
  if (!contact) return 0;

  let score = 0;

  // Email provided: +10
  if (contact.email) score += 10;
  
  // Phone provided: +10
  if (contact.phone || contact.mobile) score += 10;
  
  // Company linked: +15
  if (contact.company_id) score += 15;
  
  // Has notes: +5
  if (contact.notes) score += 5;

  // Get proposal history
  const { count: proposalCount } = await supabase
    .from('proposals')
    .select('*', { count: 'exact', head: true })
    .eq('contact_id', contactId);

  // Previous proposals: +20 each (max 60)
  score += Math.min((proposalCount || 0) * 20, 60);

  // Update score
  await updateContact(contactId, { lead_score: score });

  return score;
}

// ============================================================================
// IMPORT/EXPORT
// ============================================================================

export async function importContactsFromCSV(
  orgId: string,
  csvData: string
): Promise<{ imported: number; errors: string[] }> {
  const lines = csvData.split('\n');
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  
  let imported = 0;
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    if (values.length !== headers.length) continue;

    const contactData: Record<string, string> = {};
    headers.forEach((h, idx) => {
      contactData[h] = values[idx];
    });

    try {
      await createContact(orgId, {
        first_name: contactData.first_name || contactData.name?.split(' ')[0] || 'Unknown',
        last_name: contactData.last_name || contactData.name?.split(' ').slice(1).join(' '),
        email: contactData.email,
        phone: contactData.phone,
        address: contactData.address,
        city: contactData.city,
        state: contactData.state,
        zip: contactData.zip,
        source: 'csv_import',
      });
      imported++;
    } catch (err) {
      errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return { imported, errors };
}

export async function exportContactsToCSV(orgId: string): Promise<string> {
  const contacts = await getContacts(orgId);
  
  const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Address', 'City', 'State', 'ZIP'];
  const rows = contacts.map((c) => [
    c.first_name,
    c.last_name || '',
    c.email || '',
    c.phone || '',
    c.company?.name || '',
    c.address || '',
    c.city || '',
    c.state || '',
    c.zip || '',
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export default {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  getCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  logContactActivity,
  getContactActivities,
  updateLeadScore,
  importContactsFromCSV,
  exportContactsToCSV,
};
