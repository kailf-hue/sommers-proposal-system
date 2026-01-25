/**
 * Sommer's Proposal System - Auth Context
 * Authentication and authorization context with RBAC
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useUser, useOrganization } from '@clerk/clerk-react';
import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export type UserRole = 'owner' | 'admin' | 'manager' | 'sales' | 'viewer';

export interface TeamMember {
  id: string;
  orgId: string;
  clerkUserId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  role: UserRole;
  permissions: Record<string, boolean>;
  maxDiscountPercent: number;
  canApproveDiscounts: boolean;
  status: 'active' | 'inactive' | 'pending';
  lastActiveAt: string | null;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  brandColor: string;
  accentColor: string | null;
  timezone: string;
  currency: string;
  taxRate: number;
  subscriptionTier: string;
  subscriptionStatus: string;
}

export interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: TeamMember | null;
  organization: Organization | null;
  
  // Role checks
  isOwner: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isSales: boolean;
  isViewer: boolean;
  
  // Permission checks
  hasPermission: (permission: string) => boolean;
  canManageTeam: boolean;
  canManageSettings: boolean;
  canApproveDiscounts: boolean;
  canEditProposals: boolean;
  canDeleteProposals: boolean;
  canViewAnalytics: boolean;
  canExportData: boolean;
  maxDiscountPercent: number;
}

// ============================================================================
// PERMISSIONS MAP
// ============================================================================

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  owner: [
    'manage_team',
    'manage_settings',
    'manage_billing',
    'approve_discounts',
    'delete_organization',
    'view_analytics',
    'export_data',
    'create_proposals',
    'edit_proposals',
    'delete_proposals',
    'manage_templates',
    'manage_integrations',
  ],
  admin: [
    'manage_team',
    'manage_settings',
    'approve_discounts',
    'view_analytics',
    'export_data',
    'create_proposals',
    'edit_proposals',
    'delete_proposals',
    'manage_templates',
    'manage_integrations',
  ],
  manager: [
    'approve_discounts',
    'view_analytics',
    'export_data',
    'create_proposals',
    'edit_proposals',
    'delete_proposals',
    'manage_templates',
  ],
  sales: [
    'create_proposals',
    'edit_own_proposals',
    'view_analytics',
  ],
  viewer: [
    'view_proposals',
    'view_analytics',
  ],
};

const DEFAULT_DISCOUNT_LIMITS: Record<UserRole, number> = {
  owner: 100,
  admin: 50,
  manager: 25,
  sales: 10,
  viewer: 0,
};

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthState | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { organization: clerkOrg, isLoaded: orgLoaded } = useOrganization();
  
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch team member data from Supabase
  useEffect(() => {
    async function fetchUserData() {
      if (!clerkUser || !clerkOrg) {
        setTeamMember(null);
        setOrganization(null);
        setIsLoading(false);
        return;
      }

      try {
        // Fetch team member
        const { data: memberData, error: memberError } = await supabase
          .from('team_members')
          .select('*')
          .eq('clerk_user_id', clerkUser.id)
          .single();

        if (memberError && memberError.code !== 'PGRST116') {
          console.error('Error fetching team member:', memberError);
        }

        // Fetch organization
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', memberData?.org_id)
          .single();

        if (orgError && orgError.code !== 'PGRST116') {
          console.error('Error fetching organization:', orgError);
        }

        if (memberData) {
          setTeamMember({
            id: memberData.id,
            orgId: memberData.org_id,
            clerkUserId: memberData.clerk_user_id,
            email: memberData.email,
            firstName: memberData.first_name,
            lastName: memberData.last_name,
            avatarUrl: memberData.avatar_url,
            phone: memberData.phone,
            role: memberData.role as UserRole,
            permissions: memberData.permissions || {},
            maxDiscountPercent: memberData.max_discount_percent || DEFAULT_DISCOUNT_LIMITS[memberData.role as UserRole],
            canApproveDiscounts: memberData.can_approve_discounts || false,
            status: memberData.status,
            lastActiveAt: memberData.last_active_at,
            createdAt: memberData.created_at,
          });
        }

        if (orgData) {
          setOrganization({
            id: orgData.id,
            name: orgData.name,
            slug: orgData.slug,
            logoUrl: orgData.logo_url,
            brandColor: orgData.brand_color || '#C41E3A',
            accentColor: orgData.accent_color,
            timezone: orgData.timezone || 'America/New_York',
            currency: orgData.currency || 'USD',
            taxRate: parseFloat(orgData.tax_rate) || 0.08,
            subscriptionTier: orgData.subscription_tier || 'starter',
            subscriptionStatus: orgData.subscription_status || 'active',
          });
        }

        // Update last active
        if (memberData) {
          await supabase
            .from('team_members')
            .update({ last_active_at: new Date().toISOString() })
            .eq('id', memberData.id);
        }
      } catch (error) {
        console.error('Error in fetchUserData:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (userLoaded && orgLoaded) {
      fetchUserData();
    }
  }, [clerkUser, clerkOrg, userLoaded, orgLoaded]);

  // Compute auth state
  const role = teamMember?.role || 'viewer';
  const permissions = teamMember?.permissions || {};
  const rolePermissions = ROLE_PERMISSIONS[role] || [];

  const hasPermission = (permission: string): boolean => {
    return rolePermissions.includes(permission) || permissions[permission] === true;
  };

  const authState: AuthState = {
    isLoading: isLoading || !userLoaded || !orgLoaded,
    isAuthenticated: !!clerkUser && !!teamMember,
    user: teamMember,
    organization,
    
    // Role checks
    isOwner: role === 'owner',
    isAdmin: role === 'admin' || role === 'owner',
    isManager: role === 'manager' || role === 'admin' || role === 'owner',
    isSales: role === 'sales' || role === 'manager' || role === 'admin' || role === 'owner',
    isViewer: true, // All roles can view
    
    // Permission checks
    hasPermission,
    canManageTeam: hasPermission('manage_team'),
    canManageSettings: hasPermission('manage_settings'),
    canApproveDiscounts: teamMember?.canApproveDiscounts || hasPermission('approve_discounts'),
    canEditProposals: hasPermission('edit_proposals') || hasPermission('edit_own_proposals'),
    canDeleteProposals: hasPermission('delete_proposals'),
    canViewAnalytics: hasPermission('view_analytics'),
    canExportData: hasPermission('export_data'),
    maxDiscountPercent: teamMember?.maxDiscountPercent || DEFAULT_DISCOUNT_LIMITS[role],
  };

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  
  if (!context) {
    // Return a default state if not in provider (e.g., during SSR or before mount)
    return {
      isLoading: true,
      isAuthenticated: false,
      user: null,
      organization: null,
      isOwner: false,
      isAdmin: false,
      isManager: false,
      isSales: false,
      isViewer: false,
      hasPermission: () => false,
      canManageTeam: false,
      canManageSettings: false,
      canApproveDiscounts: false,
      canEditProposals: false,
      canDeleteProposals: false,
      canViewAnalytics: false,
      canExportData: false,
      maxDiscountPercent: 0,
    };
  }
  
  return context;
}

export function useRequireAuth(requiredRole?: UserRole): AuthState {
  const auth = useAuth();
  
  // In a real app, you'd redirect to login if not authenticated
  // or show an error if role doesn't match
  
  return auth;
}

// ============================================================================
// PERMISSION GATE COMPONENT
// ============================================================================

interface PermissionGateProps {
  permission?: string;
  role?: UserRole;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({ permission, role, fallback = null, children }: PermissionGateProps) {
  const auth = useAuth();
  
  if (auth.isLoading) {
    return null;
  }
  
  // Check permission
  if (permission && !auth.hasPermission(permission)) {
    return <>{fallback}</>;
  }
  
  // Check role
  if (role) {
    const roleHierarchy: UserRole[] = ['viewer', 'sales', 'manager', 'admin', 'owner'];
    const requiredIndex = roleHierarchy.indexOf(role);
    const userIndex = roleHierarchy.indexOf(auth.user?.role || 'viewer');
    
    if (userIndex < requiredIndex) {
      return <>{fallback}</>;
    }
  }
  
  return <>{children}</>;
}

export default AuthContext;
