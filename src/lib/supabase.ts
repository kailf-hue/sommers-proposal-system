/**
 * Sommer's Proposal System - Supabase Client
 * Database connection and helper functions
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Database features disabled.');
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// ============================================================================
// STORAGE HELPERS
// ============================================================================

export const STORAGE_BUCKETS = {
  PROPOSAL_IMAGES: 'proposal-images',
  BRAND_ASSETS: 'brand-assets',
  SIGNATURES: 'signatures',
  GALLERY: 'gallery-photos',
  DOCUMENTS: 'documents',
} as const;

export async function uploadFile(
  bucket: keyof typeof STORAGE_BUCKETS,
  path: string,
  file: File
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS[bucket])
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKETS[bucket])
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

export async function deleteFile(
  bucket: keyof typeof STORAGE_BUCKETS,
  path: string
): Promise<boolean> {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS[bucket])
    .remove([path]);

  if (error) {
    console.error('Delete error:', error);
    return false;
  }

  return true;
}

// ============================================================================
// REALTIME HELPERS
// ============================================================================

export function subscribeToTable<T>(
  table: string,
  callback: (payload: T) => void,
  filter?: string
) {
  const channel = supabase
    .channel(`${table}-changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter,
      },
      (payload) => {
        callback(payload.new as T);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================================================
// RPC HELPERS
// ============================================================================

export async function callRpc<T>(
  functionName: string,
  params?: Record<string, unknown>
): Promise<T | null> {
  const { data, error } = await supabase.rpc(functionName, params);

  if (error) {
    console.error(`RPC ${functionName} error:`, error);
    return null;
  }

  return data as T;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export function handleSupabaseError(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return (error as { message: string }).message;
  }
  return 'An unexpected error occurred';
}

export default supabase;
