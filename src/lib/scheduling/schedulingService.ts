/**
 * Scheduling Service
 * Job scheduling and crew management
 */

import { supabase } from '@/lib/supabase';

export interface Job {
  id: string;
  org_id: string;
  proposal_id?: string;
  contact_id?: string;
  crew_id?: string;
  title: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  scheduled_date?: string;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  estimated_duration_hours?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'weather_hold';
  started_at?: string;
  completed_at?: string;
  weather_suitable: boolean;
  weather_notes?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Crew {
  id: string;
  org_id: string;
  name: string;
  color: string;
  lead_member_id?: string;
  member_ids: string[];
  is_active: boolean;
  created_at: string;
}

export interface JobWithRelations extends Job {
  crew?: Crew;
  contact?: { first_name: string; last_name?: string; phone?: string };
  proposal?: { proposal_number: string; property_name?: string };
}

// Get jobs for date range
export async function getJobs(
  orgId: string,
  startDate: string,
  endDate: string
): Promise<JobWithRelations[]> {
  const { data, error } = await supabase
    .from('jobs')
    .select(`
      *,
      crew:crews(*),
      contact:contacts(first_name, last_name, phone),
      proposal:proposals(proposal_number, property_name)
    `)
    .eq('org_id', orgId)
    .gte('scheduled_date', startDate)
    .lte('scheduled_date', endDate)
    .order('scheduled_date')
    .order('scheduled_start_time');

  if (error) throw error;
  return data || [];
}

// Create job
export async function createJob(orgId: string, data: Partial<Job>): Promise<Job> {
  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      org_id: orgId,
      title: data.title || 'New Job',
      status: 'scheduled',
      weather_suitable: true,
      ...data,
    })
    .select()
    .single();

  if (error) throw error;
  return job;
}

// Update job
export async function updateJob(jobId: string, data: Partial<Job>): Promise<Job> {
  const { data: job, error } = await supabase
    .from('jobs')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', jobId)
    .select()
    .single();

  if (error) throw error;
  return job;
}

// Delete job
export async function deleteJob(jobId: string): Promise<void> {
  const { error } = await supabase.from('jobs').delete().eq('id', jobId);
  if (error) throw error;
}

// Get crews
export async function getCrews(orgId: string): Promise<Crew[]> {
  const { data, error } = await supabase
    .from('crews')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

// Create crew
export async function createCrew(orgId: string, data: Partial<Crew>): Promise<Crew> {
  const { data: crew, error } = await supabase
    .from('crews')
    .insert({
      org_id: orgId,
      name: data.name || 'New Crew',
      color: data.color || '#3B82F6',
      member_ids: data.member_ids || [],
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return crew;
}

// Check crew availability
export async function checkCrewAvailability(
  crewId: string,
  date: string,
  excludeJobId?: string
): Promise<{ available: boolean; conflicts: Job[] }> {
  let query = supabase
    .from('jobs')
    .select('*')
    .eq('crew_id', crewId)
    .eq('scheduled_date', date)
    .neq('status', 'cancelled');

  if (excludeJobId) {
    query = query.neq('id', excludeJobId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return {
    available: !data || data.length === 0,
    conflicts: data || [],
  };
}

// Start job
export async function startJob(jobId: string): Promise<Job> {
  return updateJob(jobId, {
    status: 'in_progress',
    started_at: new Date().toISOString(),
  });
}

// Complete job
export async function completeJob(jobId: string, notes?: string): Promise<Job> {
  return updateJob(jobId, {
    status: 'completed',
    completed_at: new Date().toISOString(),
    notes,
  });
}

// Weather hold
export async function weatherHoldJob(jobId: string, reason: string): Promise<Job> {
  return updateJob(jobId, {
    status: 'weather_hold',
    weather_suitable: false,
    weather_notes: reason,
  });
}

export default {
  getJobs,
  createJob,
  updateJob,
  deleteJob,
  getCrews,
  createCrew,
  checkCrewAvailability,
  startJob,
  completeJob,
  weatherHoldJob,
};
