/**
 * Auth Service
 * Authentication and authorization utilities
 */

import { supabase } from '../supabase';

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'owner' | 'admin' | 'manager' | 'sales' | 'viewer';
  organization_id: string;
  avatar_url?: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  primary_color?: string;
  created_at: string;
}

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
}

// Role-based permissions matrix
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  owner: [
    { resource: '*', action: 'create' },
    { resource: '*', action: 'read' },
    { resource: '*', action: 'update' },
    { resource: '*', action: 'delete' },
  ],
  admin: [
    { resource: 'proposals', action: 'create' },
    { resource: 'proposals', action: 'read' },
    { resource: 'proposals', action: 'update' },
    { resource: 'proposals', action: 'delete' },
    { resource: 'clients', action: 'create' },
    { resource: 'clients', action: 'read' },
    { resource: 'clients', action: 'update' },
    { resource: 'clients', action: 'delete' },
    { resource: 'team', action: 'read' },
    { resource: 'team', action: 'update' },
    { resource: 'analytics', action: 'read' },
    { resource: 'settings', action: 'read' },
    { resource: 'settings', action: 'update' },
  ],
  manager: [
    { resource: 'proposals', action: 'create' },
    { resource: 'proposals', action: 'read' },
    { resource: 'proposals', action: 'update' },
    { resource: 'clients', action: 'create' },
    { resource: 'clients', action: 'read' },
    { resource: 'clients', action: 'update' },
    { resource: 'team', action: 'read' },
    { resource: 'analytics', action: 'read' },
  ],
  sales: [
    { resource: 'proposals', action: 'create' },
    { resource: 'proposals', action: 'read' },
    { resource: 'proposals', action: 'update' },
    { resource: 'clients', action: 'create' },
    { resource: 'clients', action: 'read' },
    { resource: 'clients', action: 'update' },
  ],
  viewer: [
    { resource: 'proposals', action: 'read' },
    { resource: 'clients', action: 'read' },
  ],
};

/**
 * Check if user has permission for an action
 */
export function hasPermission(
  userRole: string,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete'
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  
  return permissions.some(
    (p) =>
      (p.resource === '*' || p.resource === resource) &&
      p.action === action
  );
}

/**
 * Get current user from Supabase
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile } = await supabase
    .from('team_members')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!profile) return null;

  return {
    id: user.id,
    email: user.email || '',
    first_name: profile.first_name,
    last_name: profile.last_name,
    role: profile.role,
    organization_id: profile.organization_id,
    avatar_url: profile.avatar_url,
    created_at: profile.created_at,
  };
}

/**
 * Get user's organization
 */
export async function getUserOrganization(
  organizationId: string
): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single();

  if (error || !data) return null;

  return data;
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign up new user
 */
export async function signUp(
  email: string,
  password: string,
  metadata?: { first_name?: string; last_name?: string }
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Reset password
 */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
}

/**
 * Invite team member
 */
export async function inviteTeamMember(
  email: string,
  role: User['role'],
  organizationId: string
) {
  // Create invitation record
  const { data, error } = await supabase
    .from('team_invitations')
    .insert({
      email,
      role,
      organization_id: organizationId,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    })
    .select()
    .single();

  if (error) throw error;

  // Send invitation email via API
  await fetch('/api/email/invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invitationId: data.id }),
  });

  return data;
}

/**
 * Accept team invitation
 */
export async function acceptInvitation(token: string, password: string) {
  // Verify invitation
  const { data: invitation, error: invError } = await supabase
    .from('team_invitations')
    .select('*')
    .eq('token', token)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .single();

  if (invError || !invitation) {
    throw new Error('Invalid or expired invitation');
  }

  // Create user account
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: invitation.email,
    password,
  });

  if (authError) throw authError;

  // Create team member profile
  const { error: profileError } = await supabase
    .from('team_members')
    .insert({
      user_id: authData.user?.id,
      organization_id: invitation.organization_id,
      email: invitation.email,
      role: invitation.role,
    });

  if (profileError) throw profileError;

  // Mark invitation as accepted
  await supabase
    .from('team_invitations')
    .update({ status: 'accepted' })
    .eq('id', invitation.id);

  return authData;
}
