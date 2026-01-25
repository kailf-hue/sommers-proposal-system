/**
 * Branding Service
 * Organization branding and white-label settings
 */

import { supabase, uploadFile } from '@/lib/supabase';

export interface BrandingSettings {
  id: string;
  org_id: string;
  logo_url?: string;
  favicon_url?: string;
  primary_color: string;
  secondary_color?: string;
  accent_color?: string;
  font_heading?: string;
  font_body?: string;
  email_header_html?: string;
  email_footer_html?: string;
  proposal_header_html?: string;
  proposal_footer_html?: string;
  custom_css?: string;
  updated_at: string;
}

export interface WhiteLabelConfig {
  id: string;
  org_id: string;
  custom_domain?: string;
  domain_verified: boolean;
  remove_branding: boolean;
  custom_email_domain?: string;
  email_domain_verified: boolean;
  created_at: string;
  updated_at: string;
}

// Get branding settings
export async function getBrandingSettings(orgId: string): Promise<BrandingSettings | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, brand_color, accent_color, logo_url')
    .eq('id', orgId)
    .single();

  if (error) return null;
  
  return {
    id: data.id,
    org_id: orgId,
    logo_url: data.logo_url,
    primary_color: data.brand_color || '#C41E3A',
    secondary_color: data.accent_color,
    updated_at: new Date().toISOString(),
  };
}

// Update branding settings
export async function updateBrandingSettings(
  orgId: string,
  settings: Partial<BrandingSettings>
): Promise<void> {
  const { error } = await supabase
    .from('organizations')
    .update({
      brand_color: settings.primary_color,
      accent_color: settings.secondary_color,
      logo_url: settings.logo_url,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orgId);

  if (error) throw error;
}

// Upload logo
export async function uploadLogo(orgId: string, file: File): Promise<string> {
  const url = await uploadFile('brand-assets', `${orgId}/logo`, file);
  await updateBrandingSettings(orgId, { logo_url: url });
  return url;
}

// Generate CSS variables
export function generateCSSVariables(settings: BrandingSettings): string {
  return `
    :root {
      --brand-primary: ${settings.primary_color};
      --brand-secondary: ${settings.secondary_color || settings.primary_color};
      --brand-accent: ${settings.accent_color || settings.primary_color};
      --font-heading: ${settings.font_heading || 'inherit'};
      --font-body: ${settings.font_body || 'inherit'};
    }
  `;
}

// Get white-label config
export async function getWhiteLabelConfig(orgId: string): Promise<WhiteLabelConfig | null> {
  const { data, error } = await supabase
    .from('white_label_configs')
    .select('*')
    .eq('org_id', orgId)
    .single();

  if (error) return null;
  return data;
}

// Update white-label config
export async function updateWhiteLabelConfig(
  orgId: string,
  config: Partial<WhiteLabelConfig>
): Promise<void> {
  const { error } = await supabase
    .from('white_label_configs')
    .upsert({
      org_id: orgId,
      ...config,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'org_id' });

  if (error) throw error;
}

export default {
  getBrandingSettings,
  updateBrandingSettings,
  uploadLogo,
  generateCSSVariables,
  getWhiteLabelConfig,
  updateWhiteLabelConfig,
};
