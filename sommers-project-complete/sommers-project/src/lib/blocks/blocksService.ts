/**
 * Sommer's Proposal System - Blocks Service
 * Phases 37-38: Block registry, templates, and proposal blocks
 */

import { supabase } from '../supabase';
import { entitlementsService } from '../entitlements/entitlementsService';

// ============================================================================
// TYPES
// ============================================================================

export interface Block {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: BlockCategory;
  icon: string | null;
  componentName: string;
  defaultProps: Record<string, unknown>;
  schema: BlockSchema;
  minPlan: string;
  industries: string[];
  tags: string[];
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BlockCategory = 
  | 'content'
  | 'media'
  | 'pricing'
  | 'legal'
  | 'interactive';

export interface BlockSchema {
  [key: string]: {
    type: string;
    required?: boolean;
    min?: number;
    max?: number;
    options?: string[];
    default?: unknown;
  };
}

export interface BlockTemplate {
  id: string;
  orgId: string;
  blockCode: string;
  name: string;
  description: string | null;
  props: Record<string, unknown>;
  isShared: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalBlock {
  id: string;
  proposalId: string;
  blockCode: string;
  props: Record<string, unknown>;
  sortOrder: number;
  parentId: string | null;
  columnIndex: number | null;
  createdAt: string;
  updatedAt: string;
  // Resolved block definition
  block?: Block;
}

export interface ViewerTheme {
  id: string;
  orgId: string | null;
  name: string;
  description: string | null;
  config: ThemeConfig;
  isDefault: boolean;
  isSystem: boolean;
  createdAt: string;
}

export interface ThemeConfig {
  fontFamily: string;
  primaryColor: string;
  bgColor: string;
  animations: boolean;
  borderRadius?: string;
  spacing?: string;
}

export interface InteractiveConfig {
  id: string;
  proposalId: string;
  enablePricingSelection: boolean;
  enableAddons: boolean;
  enableChat: boolean;
  enableScheduling: boolean;
  animationsEnabled: boolean;
  themeId: string | null;
  customCss: string | null;
  createdAt: string;
}

// ============================================================================
// BLOCKS SERVICE
// ============================================================================

export const blocksService = {
  // --------------------------------------------------------------------------
  // Block Registry
  // --------------------------------------------------------------------------

  /**
   * Get all available blocks
   */
  async getBlocks(options?: {
    category?: BlockCategory;
    industryId?: string;
    planId?: string;
  }): Promise<Block[]> {
    let query = supabase
      .from('block_registry')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('name');

    if (options?.category) {
      query = query.eq('category', options.category);
    }

    const { data, error } = await query;
    if (error) throw error;

    let blocks = (data || []).map(transformBlock);

    // Filter by industry
    if (options?.industryId) {
      blocks = blocks.filter(
        (b) => b.industries.length === 0 || b.industries.includes(options.industryId!)
      );
    }

    // Filter by plan
    if (options?.planId) {
      const planOrder = ['free', 'pro', 'business', 'enterprise'];
      const planIndex = planOrder.indexOf(options.planId);
      blocks = blocks.filter((b) => {
        const minPlanIndex = planOrder.indexOf(b.minPlan);
        return planIndex >= minPlanIndex;
      });
    }

    return blocks;
  },

  /**
   * Get blocks available for an org
   */
  async getBlocksForOrg(
    orgId: string,
    industryId?: string
  ): Promise<Block[]> {
    const plan = await entitlementsService.getEffectivePlan(orgId);
    return this.getBlocks({
      industryId,
      planId: plan.id,
    });
  },

  /**
   * Get a specific block by code
   */
  async getBlock(code: string): Promise<Block | null> {
    const { data, error } = await supabase
      .from('block_registry')
      .select('*')
      .eq('code', code)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? transformBlock(data) : null;
  },

  /**
   * Get blocks grouped by category
   */
  async getBlocksByCategory(
    orgId: string,
    industryId?: string
  ): Promise<Record<BlockCategory, Block[]>> {
    const blocks = await this.getBlocksForOrg(orgId, industryId);
    
    const grouped: Record<BlockCategory, Block[]> = {
      content: [],
      media: [],
      pricing: [],
      legal: [],
      interactive: [],
    };

    for (const block of blocks) {
      if (grouped[block.category]) {
        grouped[block.category].push(block);
      }
    }

    return grouped;
  },

  // --------------------------------------------------------------------------
  // Block Templates
  // --------------------------------------------------------------------------

  /**
   * Get saved block templates for an org
   */
  async getTemplates(
    orgId: string,
    blockCode?: string
  ): Promise<BlockTemplate[]> {
    let query = supabase
      .from('block_templates')
      .select('*')
      .or(`org_id.eq.${orgId},is_shared.eq.true`)
      .order('name');

    if (blockCode) {
      query = query.eq('block_code', blockCode);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(transformBlockTemplate);
  },

  /**
   * Save a block template
   */
  async saveTemplate(
    orgId: string,
    template: {
      blockCode: string;
      name: string;
      description?: string;
      props: Record<string, unknown>;
      isShared?: boolean;
      createdBy?: string;
    }
  ): Promise<BlockTemplate> {
    const { data, error } = await supabase
      .from('block_templates')
      .insert({
        org_id: orgId,
        block_code: template.blockCode,
        name: template.name,
        description: template.description,
        props: template.props,
        is_shared: template.isShared ?? false,
        created_by: template.createdBy,
      })
      .select()
      .single();

    if (error) throw error;
    return transformBlockTemplate(data);
  },

  /**
   * Update a block template
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<BlockTemplate>
  ): Promise<BlockTemplate> {
    const { data, error } = await supabase
      .from('block_templates')
      .update({
        name: updates.name,
        description: updates.description,
        props: updates.props,
        is_shared: updates.isShared,
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId)
      .select()
      .single();

    if (error) throw error;
    return transformBlockTemplate(data);
  },

  /**
   * Delete a block template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    const { error } = await supabase
      .from('block_templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;
  },

  // --------------------------------------------------------------------------
  // Proposal Blocks
  // --------------------------------------------------------------------------

  /**
   * Get blocks for a proposal
   */
  async getProposalBlocks(proposalId: string): Promise<ProposalBlock[]> {
    const { data, error } = await supabase
      .from('proposal_blocks')
      .select(`
        *,
        block_registry (*)
      `)
      .eq('proposal_id', proposalId)
      .order('sort_order');

    if (error) throw error;

    return (data || []).map((row) => ({
      ...transformProposalBlock(row),
      block: row.block_registry ? transformBlock(row.block_registry) : undefined,
    }));
  },

  /**
   * Add a block to a proposal
   */
  async addProposalBlock(
    proposalId: string,
    block: {
      blockCode: string;
      props?: Record<string, unknown>;
      sortOrder?: number;
      parentId?: string;
      columnIndex?: number;
    }
  ): Promise<ProposalBlock> {
    // Get max sort order if not provided
    let sortOrder = block.sortOrder;
    if (sortOrder === undefined) {
      const { data: existing } = await supabase
        .from('proposal_blocks')
        .select('sort_order')
        .eq('proposal_id', proposalId)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

      sortOrder = existing ? existing.sort_order + 1 : 0;
    }

    const { data, error } = await supabase
      .from('proposal_blocks')
      .insert({
        proposal_id: proposalId,
        block_code: block.blockCode,
        props: block.props || {},
        sort_order: sortOrder,
        parent_id: block.parentId,
        column_index: block.columnIndex,
      })
      .select()
      .single();

    if (error) throw error;
    return transformProposalBlock(data);
  },

  /**
   * Update a proposal block
   */
  async updateProposalBlock(
    blockId: string,
    updates: {
      props?: Record<string, unknown>;
      sortOrder?: number;
    }
  ): Promise<ProposalBlock> {
    const { data, error } = await supabase
      .from('proposal_blocks')
      .update({
        props: updates.props,
        sort_order: updates.sortOrder,
        updated_at: new Date().toISOString(),
      })
      .eq('id', blockId)
      .select()
      .single();

    if (error) throw error;
    return transformProposalBlock(data);
  },

  /**
   * Remove a block from a proposal
   */
  async removeProposalBlock(blockId: string): Promise<void> {
    const { error } = await supabase
      .from('proposal_blocks')
      .delete()
      .eq('id', blockId);

    if (error) throw error;
  },

  /**
   * Reorder proposal blocks
   */
  async reorderProposalBlocks(
    proposalId: string,
    blockIds: string[]
  ): Promise<void> {
    const updates = blockIds.map((id, index) => ({
      id,
      proposal_id: proposalId,
      sort_order: index,
      updated_at: new Date().toISOString(),
    }));

    // Upsert all blocks with new sort orders
    const { error } = await supabase
      .from('proposal_blocks')
      .upsert(updates, { onConflict: 'id' });

    if (error) throw error;
  },

  /**
   * Clone blocks from one proposal to another
   */
  async cloneProposalBlocks(
    sourceProposalId: string,
    targetProposalId: string
  ): Promise<ProposalBlock[]> {
    const sourceBlocks = await this.getProposalBlocks(sourceProposalId);
    
    const newBlocks: ProposalBlock[] = [];
    const idMap = new Map<string, string>();

    // First pass: create blocks without parent references
    for (const block of sourceBlocks) {
      const newBlock = await this.addProposalBlock(targetProposalId, {
        blockCode: block.blockCode,
        props: block.props,
        sortOrder: block.sortOrder,
        columnIndex: block.columnIndex ?? undefined,
      });
      idMap.set(block.id, newBlock.id);
      newBlocks.push(newBlock);
    }

    // Second pass: update parent references
    for (const block of sourceBlocks) {
      if (block.parentId && idMap.has(block.parentId)) {
        const newBlockId = idMap.get(block.id)!;
        const newParentId = idMap.get(block.parentId)!;
        
        await supabase
          .from('proposal_blocks')
          .update({ parent_id: newParentId })
          .eq('id', newBlockId);
      }
    }

    return newBlocks;
  },

  // --------------------------------------------------------------------------
  // Viewer Themes
  // --------------------------------------------------------------------------

  /**
   * Get available themes
   */
  async getThemes(orgId?: string): Promise<ViewerTheme[]> {
    let query = supabase
      .from('viewer_themes')
      .select('*')
      .order('name');

    if (orgId) {
      query = query.or(`org_id.is.null,org_id.eq.${orgId}`);
    } else {
      query = query.is('org_id', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(transformViewerTheme);
  },

  /**
   * Get default theme
   */
  async getDefaultTheme(): Promise<ViewerTheme | null> {
    const { data, error } = await supabase
      .from('viewer_themes')
      .select('*')
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? transformViewerTheme(data) : null;
  },

  /**
   * Create a custom theme
   */
  async createTheme(
    orgId: string,
    theme: {
      name: string;
      description?: string;
      config: ThemeConfig;
    }
  ): Promise<ViewerTheme> {
    const { data, error } = await supabase
      .from('viewer_themes')
      .insert({
        org_id: orgId,
        name: theme.name,
        description: theme.description,
        config: theme.config,
        is_system: false,
      })
      .select()
      .single();

    if (error) throw error;
    return transformViewerTheme(data);
  },

  // --------------------------------------------------------------------------
  // Interactive Config
  // --------------------------------------------------------------------------

  /**
   * Get interactive config for a proposal
   */
  async getInteractiveConfig(proposalId: string): Promise<InteractiveConfig | null> {
    const { data, error } = await supabase
      .from('interactive_config')
      .select('*')
      .eq('proposal_id', proposalId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? transformInteractiveConfig(data) : null;
  },

  /**
   * Set interactive config for a proposal
   */
  async setInteractiveConfig(
    proposalId: string,
    config: Partial<InteractiveConfig>
  ): Promise<InteractiveConfig> {
    const { data, error } = await supabase
      .from('interactive_config')
      .upsert(
        {
          proposal_id: proposalId,
          enable_pricing_selection: config.enablePricingSelection ?? false,
          enable_addons: config.enableAddons ?? false,
          enable_chat: config.enableChat ?? false,
          enable_scheduling: config.enableScheduling ?? false,
          animations_enabled: config.animationsEnabled ?? true,
          theme_id: config.themeId,
          custom_css: config.customCss,
        },
        { onConflict: 'proposal_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return transformInteractiveConfig(data);
  },

  // --------------------------------------------------------------------------
  // Block Validation
  // --------------------------------------------------------------------------

  /**
   * Validate block props against schema
   */
  validateBlockProps(
    block: Block,
    props: Record<string, unknown>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [key, schema] of Object.entries(block.schema)) {
      const value = props[key];

      // Check required
      if (schema.required && (value === undefined || value === null)) {
        errors.push(`${key} is required`);
        continue;
      }

      if (value === undefined || value === null) continue;

      // Type checking
      switch (schema.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push(`${key} must be a string`);
          }
          break;
        case 'number':
          if (typeof value !== 'number') {
            errors.push(`${key} must be a number`);
          } else {
            if (schema.min !== undefined && value < schema.min) {
              errors.push(`${key} must be at least ${schema.min}`);
            }
            if (schema.max !== undefined && value > schema.max) {
              errors.push(`${key} must be at most ${schema.max}`);
            }
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`${key} must be a boolean`);
          }
          break;
        case 'array':
          if (!Array.isArray(value)) {
            errors.push(`${key} must be an array`);
          }
          break;
        case 'url':
          if (typeof value !== 'string' || !isValidUrl(value)) {
            errors.push(`${key} must be a valid URL`);
          }
          break;
      }
    }

    return { valid: errors.length === 0, errors };
  },
};

// ============================================================================
// HELPERS
// ============================================================================

function transformBlock(row: Record<string, unknown>): Block {
  return {
    id: row.id as string,
    code: row.code as string,
    name: row.name as string,
    description: row.description as string | null,
    category: row.category as BlockCategory,
    icon: row.icon as string | null,
    componentName: row.component_name as string,
    defaultProps: (row.default_props || {}) as Record<string, unknown>,
    schema: (row.schema || {}) as BlockSchema,
    minPlan: row.min_plan as string,
    industries: (row.industries || []) as string[],
    tags: (row.tags || []) as string[],
    isSystem: row.is_system as boolean,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function transformBlockTemplate(row: Record<string, unknown>): BlockTemplate {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    blockCode: row.block_code as string,
    name: row.name as string,
    description: row.description as string | null,
    props: (row.props || {}) as Record<string, unknown>,
    isShared: row.is_shared as boolean,
    createdBy: row.created_by as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function transformProposalBlock(row: Record<string, unknown>): ProposalBlock {
  return {
    id: row.id as string,
    proposalId: row.proposal_id as string,
    blockCode: row.block_code as string,
    props: (row.props || {}) as Record<string, unknown>,
    sortOrder: row.sort_order as number,
    parentId: row.parent_id as string | null,
    columnIndex: row.column_index as number | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function transformViewerTheme(row: Record<string, unknown>): ViewerTheme {
  return {
    id: row.id as string,
    orgId: row.org_id as string | null,
    name: row.name as string,
    description: row.description as string | null,
    config: row.config as ThemeConfig,
    isDefault: row.is_default as boolean,
    isSystem: row.is_system as boolean,
    createdAt: row.created_at as string,
  };
}

function transformInteractiveConfig(row: Record<string, unknown>): InteractiveConfig {
  return {
    id: row.id as string,
    proposalId: row.proposal_id as string,
    enablePricingSelection: row.enable_pricing_selection as boolean,
    enableAddons: row.enable_addons as boolean,
    enableChat: row.enable_chat as boolean,
    enableScheduling: row.enable_scheduling as boolean,
    animationsEnabled: row.animations_enabled as boolean,
    themeId: row.theme_id as string | null,
    customCss: row.custom_css as string | null,
    createdAt: row.created_at as string,
  };
}

function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export default blocksService;
