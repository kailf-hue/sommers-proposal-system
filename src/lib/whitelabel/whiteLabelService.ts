/**
 * Sommer's Proposal System - White Label Service
 * Phase 45: Custom branding, domains, and white-label configuration
 */

import { supabase } from '../supabase';
import { entitlementsService } from '../entitlements/entitlementsService';

// ============================================================================
// TYPES
// ============================================================================

export interface WhiteLabelConfig {
  id: string;
  orgId: string;
  isEnabled: boolean;
  branding: BrandingConfig;
  customDomain: CustomDomainConfig | null;
  emailSettings: EmailBrandingConfig;
  proposalSettings: ProposalBrandingConfig;
  portalSettings: PortalConfig;
  footerSettings: FooterConfig;
  createdAt: string;
  updatedAt: string;
}

export interface BrandingConfig {
  companyName: string;
  tagline: string | null;
  logoUrl: string | null;
  logoLightUrl: string | null; // For dark backgrounds
  faviconUrl: string | null;
  colors: ColorPalette;
  fonts: FontConfig;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
}

export interface FontConfig {
  heading: string;
  body: string;
  customFontUrl: string | null;
}

export interface CustomDomainConfig {
  domain: string;
  status: 'pending' | 'verifying' | 'active' | 'failed';
  sslStatus: 'pending' | 'provisioning' | 'active' | 'failed';
  verificationRecord: DnsRecord;
  cnameRecord: DnsRecord;
  verifiedAt: string | null;
  lastCheckedAt: string | null;
}

export interface DnsRecord {
  type: 'TXT' | 'CNAME' | 'A';
  name: string;
  value: string;
}

export interface EmailBrandingConfig {
  fromName: string;
  fromEmail: string | null; // Custom domain email
  replyToEmail: string;
  emailLogoUrl: string | null;
  emailFooterHtml: string | null;
  hidePoweredBy: boolean;
}

export interface ProposalBrandingConfig {
  headerStyle: 'minimal' | 'standard' | 'bold';
  showCompanyLogo: boolean;
  showClientLogo: boolean;
  defaultTheme: 'light' | 'dark' | 'auto';
  coverPageStyle: 'modern' | 'classic' | 'minimal';
  accentPlacement: 'header' | 'sidebar' | 'both';
  customCss: string | null;
  hidePoweredBy: boolean;
}

export interface PortalConfig {
  portalTitle: string;
  welcomeMessage: string | null;
  customLoginBackground: string | null;
  showTestimonials: boolean;
  testimonials: Testimonial[];
  contactInfo: ContactInfo | null;
  socialLinks: SocialLink[];
  hidePoweredBy: boolean;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  company: string | null;
  imageUrl: string | null;
}

export interface ContactInfo {
  phone: string | null;
  email: string | null;
  address: string | null;
}

export interface SocialLink {
  platform: 'facebook' | 'twitter' | 'linkedin' | 'instagram' | 'youtube';
  url: string;
}

export interface FooterConfig {
  showFooter: boolean;
  companyInfo: string | null;
  links: { label: string; url: string }[];
  copyrightText: string | null;
  hidePoweredBy: boolean;
}

export interface DomainVerificationResult {
  verified: boolean;
  sslProvisioned: boolean;
  errors: string[];
}

// ============================================================================
// WHITE LABEL SERVICE
// ============================================================================

export const whiteLabelService = {
  // --------------------------------------------------------------------------
  // Configuration Management
  // --------------------------------------------------------------------------

  /**
   * Get white label config for an org
   */
  async getConfig(orgId: string): Promise<WhiteLabelConfig | null> {
    const { data, error } = await supabase
      .from('white_label_configs')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? transformConfig(data) : null;
  },

  /**
   * Get or create config
   */
  async getOrCreateConfig(orgId: string): Promise<WhiteLabelConfig> {
    const existing = await this.getConfig(orgId);
    if (existing) return existing;

    // Get org info for defaults
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single();

    const defaultConfig = this.getDefaultConfig(orgId, org?.name || 'Company');
    
    const { data, error } = await supabase
      .from('white_label_configs')
      .insert(defaultConfig)
      .select()
      .single();

    if (error) throw error;
    return transformConfig(data);
  },

  /**
   * Get default config
   */
  getDefaultConfig(orgId: string, companyName: string): Record<string, unknown> {
    return {
      org_id: orgId,
      is_enabled: false,
      branding: {
        companyName,
        tagline: null,
        logoUrl: null,
        logoLightUrl: null,
        faviconUrl: null,
        colors: {
          primary: '#C41E3A',
          secondary: '#1F2937',
          accent: '#3B82F6',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          background: '#FFFFFF',
          surface: '#F9FAFB',
          text: '#111827',
          textSecondary: '#6B7280',
        },
        fonts: {
          heading: 'Inter',
          body: 'Inter',
          customFontUrl: null,
        },
      },
      custom_domain: null,
      email_settings: {
        fromName: companyName,
        fromEmail: null,
        replyToEmail: '',
        emailLogoUrl: null,
        emailFooterHtml: null,
        hidePoweredBy: false,
      },
      proposal_settings: {
        headerStyle: 'standard',
        showCompanyLogo: true,
        showClientLogo: false,
        defaultTheme: 'light',
        coverPageStyle: 'modern',
        accentPlacement: 'header',
        customCss: null,
        hidePoweredBy: false,
      },
      portal_settings: {
        portalTitle: `${companyName} Client Portal`,
        welcomeMessage: null,
        customLoginBackground: null,
        showTestimonials: false,
        testimonials: [],
        contactInfo: null,
        socialLinks: [],
        hidePoweredBy: false,
      },
      footer_settings: {
        showFooter: true,
        companyInfo: null,
        links: [],
        copyrightText: null,
        hidePoweredBy: false,
      },
    };
  },

  /**
   * Update white label config
   */
  async updateConfig(
    orgId: string,
    updates: Partial<Omit<WhiteLabelConfig, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>>
  ): Promise<WhiteLabelConfig> {
    // Check plan for white label features
    const hasWhiteLabel = await entitlementsService.hasFeature(orgId, 'white_label');
    if (!hasWhiteLabel) {
      throw new Error('White label features require an Enterprise plan');
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.isEnabled !== undefined) updateData.is_enabled = updates.isEnabled;
    if (updates.branding) updateData.branding = updates.branding;
    if (updates.emailSettings) updateData.email_settings = updates.emailSettings;
    if (updates.proposalSettings) updateData.proposal_settings = updates.proposalSettings;
    if (updates.portalSettings) updateData.portal_settings = updates.portalSettings;
    if (updates.footerSettings) updateData.footer_settings = updates.footerSettings;

    const { data, error } = await supabase
      .from('white_label_configs')
      .update(updateData)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw error;
    return transformConfig(data);
  },

  /**
   * Enable white label
   */
  async enableWhiteLabel(orgId: string): Promise<void> {
    const hasWhiteLabel = await entitlementsService.hasFeature(orgId, 'white_label');
    if (!hasWhiteLabel) {
      throw new Error('White label features require an Enterprise plan');
    }

    await supabase
      .from('white_label_configs')
      .update({
        is_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId);
  },

  /**
   * Disable white label
   */
  async disableWhiteLabel(orgId: string): Promise<void> {
    await supabase
      .from('white_label_configs')
      .update({
        is_enabled: false,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId);
  },

  // --------------------------------------------------------------------------
  // Branding
  // --------------------------------------------------------------------------

  /**
   * Update branding config
   */
  async updateBranding(
    orgId: string,
    branding: Partial<BrandingConfig>
  ): Promise<BrandingConfig> {
    const config = await this.getOrCreateConfig(orgId);
    const updatedBranding = { ...config.branding, ...branding };

    await supabase
      .from('white_label_configs')
      .update({
        branding: updatedBranding,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId);

    return updatedBranding;
  },

  /**
   * Upload logo
   */
  async uploadLogo(
    orgId: string,
    file: File,
    type: 'logo' | 'logoLight' | 'favicon'
  ): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${orgId}/${type}-${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('brand-assets')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('brand-assets')
      .getPublicUrl(data.path);

    // Update config with new URL
    const fieldMap = {
      logo: 'logoUrl',
      logoLight: 'logoLightUrl',
      favicon: 'faviconUrl',
    };

    const config = await this.getOrCreateConfig(orgId);
    const updatedBranding = {
      ...config.branding,
      [fieldMap[type]]: publicUrl,
    };

    await supabase
      .from('white_label_configs')
      .update({
        branding: updatedBranding,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId);

    return publicUrl;
  },

  /**
   * Get CSS variables from config
   */
  getCssVariables(config: WhiteLabelConfig): string {
    const { colors, fonts } = config.branding;
    
    return `
      :root {
        --color-primary: ${colors.primary};
        --color-secondary: ${colors.secondary};
        --color-accent: ${colors.accent};
        --color-success: ${colors.success};
        --color-warning: ${colors.warning};
        --color-error: ${colors.error};
        --color-background: ${colors.background};
        --color-surface: ${colors.surface};
        --color-text: ${colors.text};
        --color-text-secondary: ${colors.textSecondary};
        --font-heading: ${fonts.heading}, sans-serif;
        --font-body: ${fonts.body}, sans-serif;
      }
    `;
  },

  // --------------------------------------------------------------------------
  // Custom Domains
  // --------------------------------------------------------------------------

  /**
   * Add custom domain
   */
  async addCustomDomain(orgId: string, domain: string): Promise<CustomDomainConfig> {
    const hasCustomDomain = await entitlementsService.hasFeature(orgId, 'custom_domain');
    if (!hasCustomDomain) {
      throw new Error('Custom domains require an Enterprise plan');
    }

    // Validate domain format
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(domain)) {
      throw new Error('Invalid domain format');
    }

    // Generate verification records
    const verificationToken = crypto.randomUUID();
    const domainConfig: CustomDomainConfig = {
      domain,
      status: 'pending',
      sslStatus: 'pending',
      verificationRecord: {
        type: 'TXT',
        name: `_sommers-verify.${domain}`,
        value: `sommers-verify=${verificationToken}`,
      },
      cnameRecord: {
        type: 'CNAME',
        name: domain,
        value: 'custom.sommersealcoating.com',
      },
      verifiedAt: null,
      lastCheckedAt: null,
    };

    await supabase
      .from('white_label_configs')
      .update({
        custom_domain: domainConfig,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId);

    return domainConfig;
  },

  /**
   * Verify custom domain
   */
  async verifyCustomDomain(orgId: string): Promise<DomainVerificationResult> {
    const config = await this.getConfig(orgId);
    if (!config?.customDomain) {
      throw new Error('No custom domain configured');
    }

    const errors: string[] = [];
    let verified = false;
    let sslProvisioned = false;

    try {
      // In production, this would use DNS lookup APIs
      // For now, simulate verification
      const txtRecordValid = await this.checkDnsRecord(
        config.customDomain.verificationRecord.name,
        config.customDomain.verificationRecord.value
      );

      if (!txtRecordValid) {
        errors.push('TXT verification record not found or incorrect');
      }

      const cnameValid = await this.checkDnsRecord(
        config.customDomain.cnameRecord.name,
        config.customDomain.cnameRecord.value
      );

      if (!cnameValid) {
        errors.push('CNAME record not found or incorrect');
      }

      verified = txtRecordValid && cnameValid;

      if (verified) {
        // Provision SSL certificate
        sslProvisioned = await this.provisionSsl(config.customDomain.domain);
        if (!sslProvisioned) {
          errors.push('SSL certificate provisioning failed');
        }
      }

      // Update domain status
      const updatedDomain: CustomDomainConfig = {
        ...config.customDomain,
        status: verified ? (sslProvisioned ? 'active' : 'verifying') : 'pending',
        sslStatus: sslProvisioned ? 'active' : verified ? 'provisioning' : 'pending',
        verifiedAt: verified ? new Date().toISOString() : null,
        lastCheckedAt: new Date().toISOString(),
      };

      await supabase
        .from('white_label_configs')
        .update({
          custom_domain: updatedDomain,
          updated_at: new Date().toISOString(),
        })
        .eq('org_id', orgId);

    } catch (error) {
      errors.push(`Verification error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    return { verified, sslProvisioned, errors };
  },

  /**
   * Check DNS record (mock implementation)
   */
  async checkDnsRecord(name: string, expectedValue: string): Promise<boolean> {
    // In production, use DNS lookup
    console.log(`Checking DNS record: ${name} = ${expectedValue}`);
    return Math.random() > 0.3; // Simulate 70% success rate
  },

  /**
   * Provision SSL (mock implementation)
   */
  async provisionSsl(domain: string): Promise<boolean> {
    // In production, integrate with Let's Encrypt / Cloudflare
    console.log(`Provisioning SSL for: ${domain}`);
    return Math.random() > 0.2; // Simulate 80% success rate
  },

  /**
   * Remove custom domain
   */
  async removeCustomDomain(orgId: string): Promise<void> {
    await supabase
      .from('white_label_configs')
      .update({
        custom_domain: null,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId);
  },

  // --------------------------------------------------------------------------
  // Email Branding
  // --------------------------------------------------------------------------

  /**
   * Update email settings
   */
  async updateEmailSettings(
    orgId: string,
    settings: Partial<EmailBrandingConfig>
  ): Promise<EmailBrandingConfig> {
    const config = await this.getOrCreateConfig(orgId);
    const updatedSettings = { ...config.emailSettings, ...settings };

    await supabase
      .from('white_label_configs')
      .update({
        email_settings: updatedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId);

    return updatedSettings;
  },

  /**
   * Verify custom email domain
   */
  async verifyEmailDomain(orgId: string, email: string): Promise<boolean> {
    // In production, verify domain ownership and set up email sending
    const domain = email.split('@')[1];
    console.log(`Verifying email domain: ${domain}`);
    return true;
  },

  // --------------------------------------------------------------------------
  // Proposal Branding
  // --------------------------------------------------------------------------

  /**
   * Update proposal settings
   */
  async updateProposalSettings(
    orgId: string,
    settings: Partial<ProposalBrandingConfig>
  ): Promise<ProposalBrandingConfig> {
    const config = await this.getOrCreateConfig(orgId);
    const updatedSettings = { ...config.proposalSettings, ...settings };

    await supabase
      .from('white_label_configs')
      .update({
        proposal_settings: updatedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId);

    return updatedSettings;
  },

  /**
   * Validate custom CSS
   */
  validateCustomCss(css: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for potentially dangerous rules
    const dangerousPatterns = [
      /javascript:/i,
      /expression\s*\(/i,
      /url\s*\(\s*['"]?data:/i,
      /@import/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(css)) {
        errors.push(`Potentially dangerous CSS pattern detected: ${pattern.source}`);
      }
    }

    // Check for syntax errors (basic)
    const braceCount = (css.match(/{/g) || []).length - (css.match(/}/g) || []).length;
    if (braceCount !== 0) {
      errors.push('Mismatched braces in CSS');
    }

    return { valid: errors.length === 0, errors };
  },

  // --------------------------------------------------------------------------
  // Portal Configuration
  // --------------------------------------------------------------------------

  /**
   * Update portal settings
   */
  async updatePortalSettings(
    orgId: string,
    settings: Partial<PortalConfig>
  ): Promise<PortalConfig> {
    const config = await this.getOrCreateConfig(orgId);
    const updatedSettings = { ...config.portalSettings, ...settings };

    await supabase
      .from('white_label_configs')
      .update({
        portal_settings: updatedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId);

    return updatedSettings;
  },

  /**
   * Add testimonial
   */
  async addTestimonial(
    orgId: string,
    testimonial: Omit<Testimonial, 'id'>
  ): Promise<Testimonial> {
    const config = await this.getOrCreateConfig(orgId);
    const newTestimonial: Testimonial = {
      ...testimonial,
      id: crypto.randomUUID(),
    };

    const updatedTestimonials = [...config.portalSettings.testimonials, newTestimonial];

    await supabase
      .from('white_label_configs')
      .update({
        portal_settings: { ...config.portalSettings, testimonials: updatedTestimonials },
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId);

    return newTestimonial;
  },

  /**
   * Remove testimonial
   */
  async removeTestimonial(orgId: string, testimonialId: string): Promise<void> {
    const config = await this.getOrCreateConfig(orgId);
    const updatedTestimonials = config.portalSettings.testimonials.filter(
      (t) => t.id !== testimonialId
    );

    await supabase
      .from('white_label_configs')
      .update({
        portal_settings: { ...config.portalSettings, testimonials: updatedTestimonials },
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId);
  },

  // --------------------------------------------------------------------------
  // Footer Configuration
  // --------------------------------------------------------------------------

  /**
   * Update footer settings
   */
  async updateFooterSettings(
    orgId: string,
    settings: Partial<FooterConfig>
  ): Promise<FooterConfig> {
    const config = await this.getOrCreateConfig(orgId);
    const updatedSettings = { ...config.footerSettings, ...settings };

    await supabase
      .from('white_label_configs')
      .update({
        footer_settings: updatedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId);

    return updatedSettings;
  },

  // --------------------------------------------------------------------------
  // Preview & Export
  // --------------------------------------------------------------------------

  /**
   * Generate preview URL
   */
  async getPreviewUrl(orgId: string): Promise<string> {
    const config = await this.getConfig(orgId);
    if (!config) throw new Error('No config found');

    // Generate temporary preview token
    const token = crypto.randomUUID();

    // Store token for preview access
    await supabase.from('preview_tokens').insert({
      token,
      org_id: orgId,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
    });

    const baseUrl = config.customDomain?.status === 'active'
      ? `https://${config.customDomain.domain}`
      : 'https://app.sommersealcoating.com';

    return `${baseUrl}/preview?token=${token}`;
  },

  /**
   * Export config as JSON
   */
  async exportConfig(orgId: string): Promise<string> {
    const config = await this.getConfig(orgId);
    if (!config) throw new Error('No config found');

    // Remove sensitive/internal fields
    const exportable = {
      branding: config.branding,
      emailSettings: {
        ...config.emailSettings,
        fromEmail: undefined, // Don't export email
      },
      proposalSettings: config.proposalSettings,
      portalSettings: config.portalSettings,
      footerSettings: config.footerSettings,
    };

    return JSON.stringify(exportable, null, 2);
  },

  /**
   * Import config from JSON
   */
  async importConfig(orgId: string, jsonConfig: string): Promise<void> {
    const imported = JSON.parse(jsonConfig);

    const config = await this.getOrCreateConfig(orgId);
    
    await supabase
      .from('white_label_configs')
      .update({
        branding: imported.branding || config.branding,
        proposal_settings: imported.proposalSettings || config.proposalSettings,
        portal_settings: imported.portalSettings || config.portalSettings,
        footer_settings: imported.footerSettings || config.footerSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('org_id', orgId);
  },
};

// ============================================================================
// HELPERS
// ============================================================================

function transformConfig(row: Record<string, unknown>): WhiteLabelConfig {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    isEnabled: row.is_enabled as boolean,
    branding: (row.branding || {}) as BrandingConfig,
    customDomain: row.custom_domain as CustomDomainConfig | null,
    emailSettings: (row.email_settings || {}) as EmailBrandingConfig,
    proposalSettings: (row.proposal_settings || {}) as ProposalBrandingConfig,
    portalSettings: (row.portal_settings || {}) as PortalConfig,
    footerSettings: (row.footer_settings || {}) as FooterConfig,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export default whiteLabelService;
