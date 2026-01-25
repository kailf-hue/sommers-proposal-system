/**
 * Sommer's Proposal System - Industries Service
 * Phases 33-36: Multi-industry support, service catalog, dynamic wizard, calculators
 */

import { supabase } from '../supabase';
import { entitlementsService } from '../entitlements/entitlementsService';

// ============================================================================
// TYPES
// ============================================================================

export interface Industry {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  icon: string | null;
  color: string;
  isActive: boolean;
  config: IndustryConfig;
  legalClauses: LegalClause[];
  createdAt: string;
  updatedAt: string;
}

export interface IndustryConfig {
  wizardSteps: string[];
  measurementUnits: { primary: string; secondary: string };
  weatherSensitive: boolean;
  seasonal: boolean;
  defaultServices: string[];
}

export interface LegalClause {
  id: string;
  title: string;
  content: string;
  required: boolean;
}

export interface Service {
  id: string;
  industryId: string;
  categoryId: string | null;
  orgId: string | null;
  code: string;
  name: string;
  description: string | null;
  unitType: string;
  unitLabel: string;
  defaultPrice: number | null;
  priceMin: number | null;
  priceMax: number | null;
  cost: number | null;
  isTaxable: boolean;
  taxRate: number | null;
  requiresMeasurement: boolean;
  measurementFields: MeasurementField[];
  pricingFormula: string | null;
  multipliers: Record<string, number>;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MeasurementField {
  key: string;
  label: string;
  type: 'number' | 'select' | 'text';
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
}

export interface ServiceCategory {
  id: string;
  industryId: string;
  name: string;
  displayName: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
}

export interface ServiceGroup {
  id: string;
  orgId: string | null;
  industryId: string;
  name: string;
  description: string | null;
  discountType: 'percentage' | 'fixed' | null;
  discountValue: number | null;
  services: Service[];
}

export interface WizardStep {
  id: string;
  industryId: string;
  stepKey: string;
  name: string;
  description: string | null;
  componentName: string;
  fields: WizardField[];
  validations: Record<string, unknown>;
  sortOrder: number;
  isRequired: boolean;
  conditions: Record<string, unknown>;
}

export interface WizardField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: Record<string, unknown>;
}

export interface Calculator {
  id: string;
  industryId: string;
  code: string;
  name: string;
  description: string | null;
  inputSchema: CalculatorInput[];
  formula: string;
  outputSchema: CalculatorOutput[];
  uiConfig: Record<string, unknown>;
  isActive: boolean;
}

export interface CalculatorInput {
  key: string;
  label: string;
  type: 'number' | 'select' | 'boolean';
  required: boolean;
  defaultValue?: unknown;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
}

export interface CalculatorOutput {
  key: string;
  label: string;
  type: 'number' | 'currency' | 'text';
  format?: string;
}

// ============================================================================
// INDUSTRIES SERVICE
// ============================================================================

export const industriesService = {
  // --------------------------------------------------------------------------
  // Industries
  // --------------------------------------------------------------------------

  /**
   * Get all active industries
   */
  async getIndustries(): Promise<Industry[]> {
    const { data, error } = await supabase
      .from('industries')
      .select('*')
      .eq('is_active', true)
      .order('display_name');

    if (error) throw error;
    return (data || []).map(transformIndustry);
  },

  /**
   * Get a specific industry
   */
  async getIndustry(industryId: string): Promise<Industry | null> {
    const { data, error } = await supabase
      .from('industries')
      .select('*')
      .eq('id', industryId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? transformIndustry(data) : null;
  },

  /**
   * Get industries for an org
   */
  async getOrgIndustries(orgId: string): Promise<Industry[]> {
    const { data, error } = await supabase
      .from('org_industries')
      .select(`
        industry_id,
        is_primary,
        custom_config,
        industries (*)
      `)
      .eq('org_id', orgId);

    if (error) throw error;

    return (data || []).map((row) => ({
      ...transformIndustry(row.industries),
      isPrimary: row.is_primary,
      customConfig: row.custom_config,
    }));
  },

  /**
   * Set industries for an org
   */
  async setOrgIndustries(
    orgId: string,
    industryIds: string[],
    primaryId?: string
  ): Promise<void> {
    // Check plan limits
    const limits = await entitlementsService.getLimits(orgId);
    if (limits.industries !== -1 && industryIds.length > limits.industries) {
      throw new Error(`Your plan allows up to ${limits.industries} industry(s)`);
    }

    // Delete existing
    await supabase.from('org_industries').delete().eq('org_id', orgId);

    // Insert new
    const rows = industryIds.map((id) => ({
      org_id: orgId,
      industry_id: id,
      is_primary: id === primaryId,
    }));

    const { error } = await supabase.from('org_industries').insert(rows);
    if (error) throw error;
  },

  // --------------------------------------------------------------------------
  // Services Catalog
  // --------------------------------------------------------------------------

  /**
   * Get services for an industry
   */
  async getServices(
    industryId: string,
    orgId?: string
  ): Promise<Service[]> {
    let query = supabase
      .from('services_catalog')
      .select('*')
      .eq('industry_id', industryId)
      .eq('is_active', true);

    // Include global services and org-specific
    if (orgId) {
      query = query.or(`org_id.is.null,org_id.eq.${orgId}`);
    } else {
      query = query.is('org_id', null);
    }

    const { data, error } = await query.order('name');
    if (error) throw error;
    return (data || []).map(transformService);
  },

  /**
   * Get a specific service
   */
  async getService(serviceId: string): Promise<Service | null> {
    const { data, error } = await supabase
      .from('services_catalog')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? transformService(data) : null;
  },

  /**
   * Create a custom service for an org
   */
  async createService(
    orgId: string,
    industryId: string,
    service: Partial<Service>
  ): Promise<Service> {
    const { data, error } = await supabase
      .from('services_catalog')
      .insert({
        org_id: orgId,
        industry_id: industryId,
        code: service.code || generateServiceCode(),
        name: service.name,
        description: service.description,
        unit_type: service.unitType || 'unit',
        unit_label: service.unitLabel || 'Unit',
        default_price: service.defaultPrice,
        price_min: service.priceMin,
        price_max: service.priceMax,
        cost: service.cost,
        is_taxable: service.isTaxable ?? true,
        tax_rate: service.taxRate,
        requires_measurement: service.requiresMeasurement ?? false,
        measurement_fields: service.measurementFields || [],
        pricing_formula: service.pricingFormula,
        multipliers: service.multipliers || {},
        metadata: service.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;
    return transformService(data);
  },

  /**
   * Update a service
   */
  async updateService(
    serviceId: string,
    updates: Partial<Service>
  ): Promise<Service> {
    const { data, error } = await supabase
      .from('services_catalog')
      .update({
        name: updates.name,
        description: updates.description,
        default_price: updates.defaultPrice,
        price_min: updates.priceMin,
        price_max: updates.priceMax,
        cost: updates.cost,
        is_taxable: updates.isTaxable,
        tax_rate: updates.taxRate,
        multipliers: updates.multipliers,
        updated_at: new Date().toISOString(),
      })
      .eq('id', serviceId)
      .select()
      .single();

    if (error) throw error;
    return transformService(data);
  },

  /**
   * Delete a custom service
   */
  async deleteService(serviceId: string): Promise<void> {
    const { error } = await supabase
      .from('services_catalog')
      .delete()
      .eq('id', serviceId)
      .not('org_id', 'is', null); // Only allow deleting org-specific services

    if (error) throw error;
  },

  // --------------------------------------------------------------------------
  // Service Categories
  // --------------------------------------------------------------------------

  /**
   * Get categories for an industry
   */
  async getCategories(industryId: string): Promise<ServiceCategory[]> {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .eq('industry_id', industryId)
      .order('sort_order');

    if (error) throw error;
    return (data || []).map(transformCategory);
  },

  // --------------------------------------------------------------------------
  // Service Groups (Bundles)
  // --------------------------------------------------------------------------

  /**
   * Get service groups for an industry
   */
  async getServiceGroups(
    industryId: string,
    orgId?: string
  ): Promise<ServiceGroup[]> {
    let query = supabase
      .from('service_groups')
      .select(`
        *,
        service_group_items (
          service_id,
          is_required,
          sort_order,
          services_catalog (*)
        )
      `)
      .eq('industry_id', industryId);

    if (orgId) {
      query = query.or(`org_id.is.null,org_id.eq.${orgId}`);
    } else {
      query = query.is('org_id', null);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.id,
      orgId: row.org_id,
      industryId: row.industry_id,
      name: row.name,
      description: row.description,
      discountType: row.discount_type,
      discountValue: row.discount_value,
      services: (row.service_group_items || [])
        .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
        .map((item: { services_catalog: Record<string, unknown> }) => transformService(item.services_catalog)),
    }));
  },

  // --------------------------------------------------------------------------
  // Wizard Configuration
  // --------------------------------------------------------------------------

  /**
   * Get wizard steps for an industry
   */
  async getWizardSteps(industryId: string): Promise<WizardStep[]> {
    const { data, error } = await supabase
      .from('wizard_steps')
      .select('*')
      .eq('industry_id', industryId)
      .order('sort_order');

    if (error) throw error;
    return (data || []).map(transformWizardStep);
  },

  /**
   * Get default wizard configuration for an industry
   */
  async getDefaultWizardConfig(industryId: string): Promise<WizardStep[]> {
    // If no custom steps, return industry defaults
    const steps = await this.getWizardSteps(industryId);
    if (steps.length > 0) return steps;

    // Return default steps based on industry config
    const industry = await this.getIndustry(industryId);
    if (!industry) return [];

    return industry.config.wizardSteps.map((stepKey, index) => ({
      id: `default_${stepKey}`,
      industryId,
      stepKey,
      name: stepKey.charAt(0).toUpperCase() + stepKey.slice(1).replace('_', ' '),
      description: null,
      componentName: `${stepKey.charAt(0).toUpperCase() + stepKey.slice(1)}Step`,
      fields: [],
      validations: {},
      sortOrder: index,
      isRequired: true,
      conditions: {},
    }));
  },

  // --------------------------------------------------------------------------
  // Calculators
  // --------------------------------------------------------------------------

  /**
   * Get calculators for an industry
   */
  async getCalculators(industryId: string): Promise<Calculator[]> {
    const { data, error } = await supabase
      .from('calculators')
      .select('*')
      .eq('industry_id', industryId)
      .eq('is_active', true);

    if (error) throw error;
    return (data || []).map(transformCalculator);
  },

  /**
   * Get a specific calculator
   */
  async getCalculator(calculatorId: string): Promise<Calculator | null> {
    const { data, error } = await supabase
      .from('calculators')
      .select('*')
      .eq('id', calculatorId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? transformCalculator(data) : null;
  },

  /**
   * Run a calculator
   */
  async runCalculator(
    calculatorId: string,
    inputs: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const calculator = await this.getCalculator(calculatorId);
    if (!calculator) throw new Error('Calculator not found');

    // Validate inputs
    for (const input of calculator.inputSchema) {
      if (input.required && inputs[input.key] === undefined) {
        throw new Error(`Missing required input: ${input.label}`);
      }
    }

    // Run formula (in production, use a safe eval or formula engine)
    const result = evaluateFormula(calculator.formula, inputs);
    return result;
  },

  // --------------------------------------------------------------------------
  // Calculator Presets
  // --------------------------------------------------------------------------

  /**
   * Get saved presets for a calculator
   */
  async getCalculatorPresets(
    orgId: string,
    calculatorId: string
  ): Promise<{ id: string; name: string; inputs: Record<string, unknown> }[]> {
    const { data, error } = await supabase
      .from('calculator_presets')
      .select('id, name, inputs')
      .eq('org_id', orgId)
      .eq('calculator_id', calculatorId);

    if (error) throw error;
    return data || [];
  },

  /**
   * Save a calculator preset
   */
  async saveCalculatorPreset(
    orgId: string,
    calculatorId: string,
    name: string,
    inputs: Record<string, unknown>
  ): Promise<void> {
    const { error } = await supabase.from('calculator_presets').insert({
      org_id: orgId,
      calculator_id: calculatorId,
      name,
      inputs,
    });

    if (error) throw error;
  },

  // --------------------------------------------------------------------------
  // Price Calculation
  // --------------------------------------------------------------------------

  /**
   * Calculate price for a service with inputs
   */
  calculateServicePrice(
    service: Service,
    inputs: Record<string, unknown>
  ): { basePrice: number; adjustedPrice: number; breakdown: PriceBreakdown[] } {
    const basePrice = service.defaultPrice || 0;
    const breakdown: PriceBreakdown[] = [];
    let adjustedPrice = basePrice;

    // Apply measurement-based calculation
    if (service.requiresMeasurement && service.measurementFields.length > 0) {
      const primaryField = service.measurementFields[0];
      const measurement = inputs[primaryField.key] as number;
      
      if (measurement) {
        adjustedPrice = basePrice * measurement;
        breakdown.push({
          label: `${measurement} ${service.unitLabel} × $${basePrice}/${service.unitLabel}`,
          amount: adjustedPrice,
        });
      }
    }

    // Apply multipliers
    for (const [key, multiplier] of Object.entries(service.multipliers)) {
      if (inputs[key]) {
        const adjustment = adjustedPrice * (multiplier - 1);
        adjustedPrice *= multiplier;
        breakdown.push({
          label: `${key} adjustment (${((multiplier - 1) * 100).toFixed(0)}%)`,
          amount: adjustment,
        });
      }
    }

    // Apply formula if present
    if (service.pricingFormula) {
      try {
        const formulaResult = evaluateFormula(service.pricingFormula, {
          ...inputs,
          base: basePrice,
          adjusted: adjustedPrice,
        });
        if (formulaResult.total !== undefined) {
          adjustedPrice = formulaResult.total;
        }
      } catch (e) {
        console.error('Formula evaluation error:', e);
      }
    }

    return { basePrice, adjustedPrice, breakdown };
  },
};

// ============================================================================
// TYPES
// ============================================================================

interface PriceBreakdown {
  label: string;
  amount: number;
}

// ============================================================================
// HELPERS
// ============================================================================

function transformIndustry(row: Record<string, unknown>): Industry {
  return {
    id: row.id as string,
    name: row.name as string,
    displayName: row.display_name as string,
    description: row.description as string | null,
    icon: row.icon as string | null,
    color: row.color as string,
    isActive: row.is_active as boolean,
    config: row.config as IndustryConfig,
    legalClauses: (row.legal_clauses || []) as LegalClause[],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function transformService(row: Record<string, unknown>): Service {
  return {
    id: row.id as string,
    industryId: row.industry_id as string,
    categoryId: row.category_id as string | null,
    orgId: row.org_id as string | null,
    code: row.code as string,
    name: row.name as string,
    description: row.description as string | null,
    unitType: row.unit_type as string,
    unitLabel: row.unit_label as string,
    defaultPrice: row.default_price as number | null,
    priceMin: row.price_min as number | null,
    priceMax: row.price_max as number | null,
    cost: row.cost as number | null,
    isTaxable: row.is_taxable as boolean,
    taxRate: row.tax_rate as number | null,
    requiresMeasurement: row.requires_measurement as boolean,
    measurementFields: (row.measurement_fields || []) as MeasurementField[],
    pricingFormula: row.pricing_formula as string | null,
    multipliers: (row.multipliers || {}) as Record<string, number>,
    isActive: row.is_active as boolean,
    metadata: (row.metadata || {}) as Record<string, unknown>,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function transformCategory(row: Record<string, unknown>): ServiceCategory {
  return {
    id: row.id as string,
    industryId: row.industry_id as string,
    name: row.name as string,
    displayName: row.display_name as string,
    description: row.description as string | null,
    icon: row.icon as string | null,
    sortOrder: row.sort_order as number,
  };
}

function transformWizardStep(row: Record<string, unknown>): WizardStep {
  return {
    id: row.id as string,
    industryId: row.industry_id as string,
    stepKey: row.step_key as string,
    name: row.name as string,
    description: row.description as string | null,
    componentName: row.component_name as string,
    fields: (row.fields || []) as WizardField[],
    validations: (row.validations || {}) as Record<string, unknown>,
    sortOrder: row.sort_order as number,
    isRequired: row.is_required as boolean,
    conditions: (row.conditions || {}) as Record<string, unknown>,
  };
}

function transformCalculator(row: Record<string, unknown>): Calculator {
  return {
    id: row.id as string,
    industryId: row.industry_id as string,
    code: row.code as string,
    name: row.name as string,
    description: row.description as string | null,
    inputSchema: (row.input_schema || []) as CalculatorInput[],
    formula: row.formula as string,
    outputSchema: (row.output_schema || []) as CalculatorOutput[],
    uiConfig: (row.ui_config || {}) as Record<string, unknown>,
    isActive: row.is_active as boolean,
  };
}

function generateServiceCode(): string {
  return `SVC_${Date.now().toString(36).toUpperCase()}`;
}

function evaluateFormula(
  formula: string,
  inputs: Record<string, unknown>
): Record<string, unknown> {
  // Simple formula evaluation (in production, use a proper formula engine)
  // This is a basic implementation for demonstration
  
  try {
    // Replace variable references with values
    let evaluated = formula;
    for (const [key, value] of Object.entries(inputs)) {
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      evaluated = evaluated.replace(regex, String(value));
    }

    // Evaluate math expressions (very basic, not safe for production)
    const mathResult = Function(`"use strict"; return (${evaluated})`)();
    return { total: mathResult };
  } catch (e) {
    console.error('Formula evaluation failed:', e);
    return {};
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default industriesService;
