/**
 * Database Types
 * TypeScript types for Supabase database schema
 * Auto-generated from: npm run db:generate
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          website: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          brand_color: string;
          accent_color: string | null;
          timezone: string;
          currency: string;
          locale: string;
          tax_rate: number;
          subscription_tier: string;
          subscription_status: string;
          trial_ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          brand_color?: string;
        };
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
      };
      team_members: {
        Row: {
          id: string;
          org_id: string;
          clerk_user_id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          role: 'owner' | 'admin' | 'manager' | 'sales' | 'viewer';
          permissions: Json;
          max_discount_percent: number;
          can_approve_discounts: boolean;
          status: 'active' | 'inactive' | 'pending';
          last_active_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          org_id: string;
          clerk_user_id: string;
          email: string;
          role?: 'owner' | 'admin' | 'manager' | 'sales' | 'viewer';
        };
        Update: Partial<Database['public']['Tables']['team_members']['Insert']>;
      };
      contacts: {
        Row: {
          id: string;
          org_id: string;
          company_id: string | null;
          first_name: string;
          last_name: string | null;
          email: string | null;
          phone: string | null;
          mobile: string | null;
          title: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          preferred_contact_method: string;
          do_not_contact: boolean;
          source: string | null;
          lead_score: number;
          tags: string[] | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          org_id: string;
          first_name: string;
          email?: string | null;
        };
        Update: Partial<Database['public']['Tables']['contacts']['Insert']>;
      };
      proposals: {
        Row: {
          id: string;
          org_id: string;
          proposal_number: string;
          contact_id: string | null;
          company_id: string | null;
          created_by: string;
          assigned_to: string | null;
          template_id: string | null;
          property_name: string | null;
          property_type: string | null;
          property_address: string | null;
          property_city: string | null;
          property_state: string | null;
          property_zip: string | null;
          total_sqft: number | null;
          net_sqft: number | null;
          surface_condition: 'good' | 'fair' | 'poor';
          measurements: Json;
          tier: 'economy' | 'standard' | 'premium';
          subtotal: number;
          discount_amount: number;
          tax_amount: number;
          total: number;
          deposit_amount: number;
          deposit_percent: number;
          title: string | null;
          introduction: string | null;
          scope_of_work: string | null;
          terms_and_conditions: string | null;
          custom_sections: Json;
          valid_days: number;
          valid_until: string | null;
          require_signature: boolean;
          require_deposit: boolean;
          status: 'draft' | 'pending_review' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
          sent_at: string | null;
          viewed_at: string | null;
          signed_at: string | null;
          version: number;
          parent_proposal_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          org_id: string;
          proposal_number: string;
          created_by: string;
        };
        Update: Partial<Database['public']['Tables']['proposals']['Insert']>;
      };
      discount_codes: {
        Row: {
          id: string;
          org_id: string;
          code: string;
          name: string;
          description: string | null;
          discount_type: 'percent' | 'fixed';
          discount_value: number;
          max_uses: number | null;
          max_uses_per_customer: number;
          current_uses: number;
          min_order_amount: number | null;
          max_discount_amount: number | null;
          allowed_services: string[] | null;
          allowed_tiers: string[] | null;
          allowed_customer_types: string[] | null;
          starts_at: string | null;
          expires_at: string | null;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          org_id: string;
          code: string;
          name: string;
          discount_type: 'percent' | 'fixed';
          discount_value: number;
        };
        Update: Partial<Database['public']['Tables']['discount_codes']['Insert']>;
      };
      deals: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          contact_id: string | null;
          company_id: string | null;
          proposal_id: string | null;
          stage_id: string;
          owner_id: string | null;
          value: number;
          probability: number;
          expected_close_date: string | null;
          source: string | null;
          lost_reason: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          org_id: string;
          name: string;
          stage_id: string;
        };
        Update: Partial<Database['public']['Tables']['deals']['Insert']>;
      };
      jobs: {
        Row: {
          id: string;
          org_id: string;
          proposal_id: string | null;
          contact_id: string | null;
          crew_id: string | null;
          title: string;
          description: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          latitude: number | null;
          longitude: number | null;
          scheduled_date: string | null;
          scheduled_start_time: string | null;
          scheduled_end_time: string | null;
          estimated_duration_hours: number | null;
          status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'weather_hold';
          started_at: string | null;
          completed_at: string | null;
          weather_suitable: boolean;
          weather_notes: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          org_id: string;
          title: string;
        };
        Update: Partial<Database['public']['Tables']['jobs']['Insert']>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      user_role: 'owner' | 'admin' | 'manager' | 'sales' | 'viewer';
    };
  };
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Common types
export type Organization = Tables<'organizations'>;
export type TeamMember = Tables<'team_members'>;
export type Contact = Tables<'contacts'>;
export type Proposal = Tables<'proposals'>;
export type DiscountCode = Tables<'discount_codes'>;
export type Deal = Tables<'deals'>;
export type Job = Tables<'jobs'>;
