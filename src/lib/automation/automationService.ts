/**
 * Sommer's Proposal System - Automation Service
 * Phase 40: Automation rules, triggers, actions, and workflow engine
 */

import { supabase } from '../supabase';
import { entitlementsService } from '../entitlements/entitlementsService';

// ============================================================================
// TYPES
// ============================================================================

export interface AutomationRule {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  triggerType: TriggerType;
  triggerConfig: Record<string, unknown>;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  maxExecutions: number | null;
  executionCount: number;
  cooldownMinutes: number;
  lastExecutedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TriggerType =
  | 'proposal_created'
  | 'proposal_sent'
  | 'proposal_viewed'
  | 'proposal_signed'
  | 'proposal_rejected'
  | 'proposal_expired'
  | 'payment_received'
  | 'client_created'
  | 'time_elapsed'
  | 'scheduled'
  | 'manual';

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: unknown;
}

export interface AutomationAction {
  type: ActionType;
  config: Record<string, unknown>;
  delay?: number; // minutes
}

export type ActionType =
  | 'send_email'
  | 'send_reminder'
  | 'send_sms'
  | 'create_task'
  | 'update_status'
  | 'add_tag'
  | 'remove_tag'
  | 'webhook'
  | 'slack_notify'
  | 'assign_user';

export interface AutomationActionType {
  id: string;
  name: string;
  description: string | null;
  category: 'email' | 'sms' | 'task' | 'webhook' | 'internal';
  configSchema: Record<string, unknown>;
  minPlan: string;
  isActive: boolean;
}

export interface AutomationExecution {
  id: string;
  ruleId: string;
  triggerEvent: Record<string, unknown>;
  actionsExecuted: ExecutedAction[];
  status: 'completed' | 'failed' | 'partial';
  errorMessage: string | null;
  executedAt: string;
}

export interface ExecutedAction {
  type: ActionType;
  success: boolean;
  result?: Record<string, unknown>;
  error?: string;
}

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  industryId: string | null;
  rules: Partial<AutomationRule>[];
  isActive: boolean;
  createdAt: string;
}

export interface TriggerEvent {
  type: TriggerType;
  orgId: string;
  entityId: string;
  entityType: 'proposal' | 'client' | 'payment';
  data: Record<string, unknown>;
  timestamp: string;
}

// ============================================================================
// AUTOMATION SERVICE
// ============================================================================

export const automationService = {
  // --------------------------------------------------------------------------
  // Rules Management
  // --------------------------------------------------------------------------

  /**
   * Get automation rules for an org
   */
  async getRules(
    orgId: string,
    options?: { isActive?: boolean; triggerType?: TriggerType }
  ): Promise<AutomationRule[]> {
    let query = supabase
      .from('automation_rules')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (options?.isActive !== undefined) {
      query = query.eq('is_active', options.isActive);
    }
    if (options?.triggerType) {
      query = query.eq('trigger_type', options.triggerType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(transformRule);
  },

  /**
   * Get a specific rule
   */
  async getRule(ruleId: string): Promise<AutomationRule | null> {
    const { data, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('id', ruleId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? transformRule(data) : null;
  },

  /**
   * Create a new automation rule
   */
  async createRule(
    orgId: string,
    rule: {
      name: string;
      description?: string;
      triggerType: TriggerType;
      triggerConfig?: Record<string, unknown>;
      conditions?: AutomationCondition[];
      actions: AutomationAction[];
      maxExecutions?: number;
      cooldownMinutes?: number;
      createdBy?: string;
    }
  ): Promise<AutomationRule> {
    // Check plan access for automation
    const hasAutomation = await entitlementsService.hasFeature(orgId, 'automation');
    if (!hasAutomation) {
      throw new Error('Automation requires Business plan or higher');
    }

    const { data, error } = await supabase
      .from('automation_rules')
      .insert({
        org_id: orgId,
        name: rule.name,
        description: rule.description,
        is_active: true,
        trigger_type: rule.triggerType,
        trigger_config: rule.triggerConfig || {},
        conditions: rule.conditions || [],
        actions: rule.actions,
        max_executions: rule.maxExecutions,
        cooldown_minutes: rule.cooldownMinutes || 0,
        created_by: rule.createdBy,
      })
      .select()
      .single();

    if (error) throw error;
    return transformRule(data);
  },

  /**
   * Update an automation rule
   */
  async updateRule(
    ruleId: string,
    updates: Partial<AutomationRule>
  ): Promise<AutomationRule> {
    const { data, error } = await supabase
      .from('automation_rules')
      .update({
        name: updates.name,
        description: updates.description,
        is_active: updates.isActive,
        trigger_type: updates.triggerType,
        trigger_config: updates.triggerConfig,
        conditions: updates.conditions,
        actions: updates.actions,
        max_executions: updates.maxExecutions,
        cooldown_minutes: updates.cooldownMinutes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ruleId)
      .select()
      .single();

    if (error) throw error;
    return transformRule(data);
  },

  /**
   * Delete an automation rule
   */
  async deleteRule(ruleId: string): Promise<void> {
    const { error } = await supabase
      .from('automation_rules')
      .delete()
      .eq('id', ruleId);

    if (error) throw error;
  },

  /**
   * Toggle rule active status
   */
  async toggleRule(ruleId: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from('automation_rules')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', ruleId);

    if (error) throw error;
  },

  // --------------------------------------------------------------------------
  // Trigger Processing
  // --------------------------------------------------------------------------

  /**
   * Process a trigger event
   */
  async processTrigger(event: TriggerEvent): Promise<AutomationExecution[]> {
    // Get all active rules that match this trigger
    const { data: rules, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('org_id', event.orgId)
      .eq('trigger_type', event.type)
      .eq('is_active', true);

    if (error) throw error;
    if (!rules || rules.length === 0) return [];

    const executions: AutomationExecution[] = [];

    for (const ruleRow of rules) {
      const rule = transformRule(ruleRow);

      // Check max executions
      if (rule.maxExecutions && rule.executionCount >= rule.maxExecutions) {
        continue;
      }

      // Check cooldown
      if (rule.lastExecutedAt && rule.cooldownMinutes > 0) {
        const lastExec = new Date(rule.lastExecutedAt);
        const cooldownEnd = new Date(lastExec.getTime() + rule.cooldownMinutes * 60 * 1000);
        if (new Date() < cooldownEnd) {
          continue;
        }
      }

      // Evaluate conditions
      if (!this.evaluateConditions(rule.conditions, event.data)) {
        continue;
      }

      // Execute actions
      const execution = await this.executeRule(rule, event);
      executions.push(execution);
    }

    return executions;
  },

  /**
   * Evaluate conditions against event data
   */
  evaluateConditions(
    conditions: AutomationCondition[],
    data: Record<string, unknown>
  ): boolean {
    if (conditions.length === 0) return true;

    return conditions.every((condition) => {
      const fieldValue = getNestedValue(data, condition.field);

      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'not_equals':
          return fieldValue !== condition.value;
        case 'contains':
          return String(fieldValue).includes(String(condition.value));
        case 'greater_than':
          return Number(fieldValue) > Number(condition.value);
        case 'less_than':
          return Number(fieldValue) < Number(condition.value);
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(fieldValue);
        case 'not_in':
          return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
        default:
          return false;
      }
    });
  },

  /**
   * Execute a rule's actions
   */
  async executeRule(
    rule: AutomationRule,
    event: TriggerEvent
  ): Promise<AutomationExecution> {
    const executedActions: ExecutedAction[] = [];
    let overallStatus: 'completed' | 'failed' | 'partial' = 'completed';
    let errorMessage: string | null = null;

    for (const action of rule.actions) {
      // Handle delay
      if (action.delay && action.delay > 0) {
        // In production, this would be queued for delayed execution
        // For now, we'll schedule it
        await this.scheduleDelayedAction(rule.id, action, event, action.delay);
        executedActions.push({
          type: action.type,
          success: true,
          result: { scheduled: true, delayMinutes: action.delay },
        });
        continue;
      }

      try {
        const result = await this.executeAction(action, event);
        executedActions.push({
          type: action.type,
          success: true,
          result,
        });
      } catch (e) {
        const error = e instanceof Error ? e.message : 'Unknown error';
        executedActions.push({
          type: action.type,
          success: false,
          error,
        });
        overallStatus = 'partial';
        if (!errorMessage) errorMessage = error;
      }
    }

    // Check if all failed
    if (executedActions.every((a) => !a.success)) {
      overallStatus = 'failed';
    }

    // Log execution
    const { data: execData } = await supabase
      .from('automation_executions')
      .insert({
        rule_id: rule.id,
        trigger_event: event,
        actions_executed: executedActions,
        status: overallStatus,
        error_message: errorMessage,
      })
      .select()
      .single();

    // Update rule execution count
    await supabase
      .from('automation_rules')
      .update({
        execution_count: rule.executionCount + 1,
        last_executed_at: new Date().toISOString(),
      })
      .eq('id', rule.id);

    return transformExecution(execData);
  },

  /**
   * Execute a single action
   */
  async executeAction(
    action: AutomationAction,
    event: TriggerEvent
  ): Promise<Record<string, unknown>> {
    switch (action.type) {
      case 'send_email':
        return this.executeSendEmail(action.config, event);
      case 'send_reminder':
        return this.executeSendReminder(action.config, event);
      case 'send_sms':
        return this.executeSendSMS(action.config, event);
      case 'create_task':
        return this.executeCreateTask(action.config, event);
      case 'update_status':
        return this.executeUpdateStatus(action.config, event);
      case 'add_tag':
        return this.executeAddTag(action.config, event);
      case 'remove_tag':
        return this.executeRemoveTag(action.config, event);
      case 'webhook':
        return this.executeWebhook(action.config, event);
      case 'slack_notify':
        return this.executeSlackNotify(action.config, event);
      case 'assign_user':
        return this.executeAssignUser(action.config, event);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  },

  // --------------------------------------------------------------------------
  // Action Implementations
  // --------------------------------------------------------------------------

  async executeSendEmail(
    config: Record<string, unknown>,
    event: TriggerEvent
  ): Promise<Record<string, unknown>> {
    // Import email service dynamically to avoid circular dependency
    const { emailService } = await import('../email/emailService');
    
    const to = resolveTemplate(config.to as string, event.data);
    const subject = resolveTemplate(config.subject as string, event.data);
    const templateId = config.template_id as string;

    await emailService.send({
      to,
      subject,
      templateId,
      data: event.data,
    });

    return { to, subject, templateId };
  },

  async executeSendReminder(
    config: Record<string, unknown>,
    event: TriggerEvent
  ): Promise<Record<string, unknown>> {
    // Similar to send_email but with reminder template
    return this.executeSendEmail(
      { ...config, template_id: config.template_id || 'reminder' },
      event
    );
  },

  async executeSendSMS(
    config: Record<string, unknown>,
    event: TriggerEvent
  ): Promise<Record<string, unknown>> {
    const to = resolveTemplate(config.to as string, event.data);
    const message = resolveTemplate(config.message as string, event.data);

    // In production, integrate with SMS provider (Twilio, etc.)
    console.log('SMS would be sent:', { to, message });

    return { to, message, sent: true };
  },

  async executeCreateTask(
    config: Record<string, unknown>,
    event: TriggerEvent
  ): Promise<Record<string, unknown>> {
    const title = resolveTemplate(config.title as string, event.data);
    const assignee = config.assignee as string;
    const dueDays = config.due_days as number;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (dueDays || 1));

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        org_id: event.orgId,
        title,
        assignee_id: assignee,
        due_date: dueDate.toISOString(),
        status: 'pending',
        related_type: event.entityType,
        related_id: event.entityId,
        created_by: 'automation',
      })
      .select()
      .single();

    if (error) throw error;
    return { taskId: data.id, title, dueDate: dueDate.toISOString() };
  },

  async executeUpdateStatus(
    config: Record<string, unknown>,
    event: TriggerEvent
  ): Promise<Record<string, unknown>> {
    const newStatus = config.status as string;
    const table = event.entityType === 'proposal' ? 'proposals' : 'clients';

    const { error } = await supabase
      .from(table)
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', event.entityId);

    if (error) throw error;
    return { entityId: event.entityId, newStatus };
  },

  async executeAddTag(
    config: Record<string, unknown>,
    event: TriggerEvent
  ): Promise<Record<string, unknown>> {
    const tag = config.tag as string;
    const table = event.entityType === 'proposal' ? 'proposals' : 'clients';

    // Get current tags
    const { data: entity } = await supabase
      .from(table)
      .select('tags')
      .eq('id', event.entityId)
      .single();

    const currentTags = (entity?.tags || []) as string[];
    if (!currentTags.includes(tag)) {
      currentTags.push(tag);
      await supabase
        .from(table)
        .update({ tags: currentTags })
        .eq('id', event.entityId);
    }

    return { entityId: event.entityId, tag, added: true };
  },

  async executeRemoveTag(
    config: Record<string, unknown>,
    event: TriggerEvent
  ): Promise<Record<string, unknown>> {
    const tag = config.tag as string;
    const table = event.entityType === 'proposal' ? 'proposals' : 'clients';

    const { data: entity } = await supabase
      .from(table)
      .select('tags')
      .eq('id', event.entityId)
      .single();

    const currentTags = ((entity?.tags || []) as string[]).filter((t) => t !== tag);
    await supabase
      .from(table)
      .update({ tags: currentTags })
      .eq('id', event.entityId);

    return { entityId: event.entityId, tag, removed: true };
  },

  async executeWebhook(
    config: Record<string, unknown>,
    event: TriggerEvent
  ): Promise<Record<string, unknown>> {
    const url = config.url as string;
    const method = (config.method as string) || 'POST';
    const headers = (config.headers || {}) as Record<string, string>;

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify({
        event: event.type,
        entityId: event.entityId,
        entityType: event.entityType,
        data: event.data,
        timestamp: event.timestamp,
      }),
    });

    return {
      url,
      status: response.status,
      success: response.ok,
    };
  },

  async executeSlackNotify(
    config: Record<string, unknown>,
    event: TriggerEvent
  ): Promise<Record<string, unknown>> {
    const webhookUrl = config.webhook_url as string;
    const channel = config.channel as string;
    const message = resolveTemplate(config.message as string, event.data);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel,
        text: message,
        username: 'Sommer\'s Proposal System',
      }),
    });

    return { channel, sent: response.ok };
  },

  async executeAssignUser(
    config: Record<string, unknown>,
    event: TriggerEvent
  ): Promise<Record<string, unknown>> {
    const userId = config.user_id as string;
    const table = event.entityType === 'proposal' ? 'proposals' : 'clients';

    const { error } = await supabase
      .from(table)
      .update({ assigned_to: userId, updated_at: new Date().toISOString() })
      .eq('id', event.entityId);

    if (error) throw error;
    return { entityId: event.entityId, assignedTo: userId };
  },

  /**
   * Schedule a delayed action
   */
  async scheduleDelayedAction(
    ruleId: string,
    action: AutomationAction,
    event: TriggerEvent,
    delayMinutes: number
  ): Promise<void> {
    const executeAt = new Date();
    executeAt.setMinutes(executeAt.getMinutes() + delayMinutes);

    await supabase.from('scheduled_actions').insert({
      rule_id: ruleId,
      action,
      event,
      execute_at: executeAt.toISOString(),
      status: 'pending',
    });
  },

  // --------------------------------------------------------------------------
  // Executions History
  // --------------------------------------------------------------------------

  /**
   * Get execution history for a rule
   */
  async getExecutions(
    ruleId: string,
    limit: number = 50
  ): Promise<AutomationExecution[]> {
    const { data, error } = await supabase
      .from('automation_executions')
      .select('*')
      .eq('rule_id', ruleId)
      .order('executed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(transformExecution);
  },

  /**
   * Get all executions for an org
   */
  async getOrgExecutions(
    orgId: string,
    options?: { limit?: number; status?: string }
  ): Promise<AutomationExecution[]> {
    let query = supabase
      .from('automation_executions')
      .select(`
        *,
        automation_rules!inner (org_id)
      `)
      .eq('automation_rules.org_id', orgId)
      .order('executed_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(transformExecution);
  },

  // --------------------------------------------------------------------------
  // Templates
  // --------------------------------------------------------------------------

  /**
   * Get automation templates
   */
  async getTemplates(
    industryId?: string
  ): Promise<AutomationTemplate[]> {
    let query = supabase
      .from('automation_templates')
      .select('*')
      .eq('is_active', true);

    if (industryId) {
      query = query.or(`industry_id.is.null,industry_id.eq.${industryId}`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(transformTemplate);
  },

  /**
   * Create rules from a template
   */
  async createFromTemplate(
    orgId: string,
    templateId: string,
    createdBy?: string
  ): Promise<AutomationRule[]> {
    const { data: template } = await supabase
      .from('automation_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (!template) throw new Error('Template not found');

    const rules: AutomationRule[] = [];
    for (const ruleDef of template.rules as Partial<AutomationRule>[]) {
      const rule = await this.createRule(orgId, {
        name: ruleDef.name || 'Unnamed Rule',
        description: ruleDef.description || undefined,
        triggerType: ruleDef.triggerType || 'manual',
        triggerConfig: ruleDef.triggerConfig,
        conditions: ruleDef.conditions,
        actions: ruleDef.actions || [],
        maxExecutions: ruleDef.maxExecutions || undefined,
        cooldownMinutes: ruleDef.cooldownMinutes,
        createdBy,
      });
      rules.push(rule);
    }

    return rules;
  },

  // --------------------------------------------------------------------------
  // Action Types
  // --------------------------------------------------------------------------

  /**
   * Get available action types
   */
  async getActionTypes(orgId: string): Promise<AutomationActionType[]> {
    const plan = await entitlementsService.getEffectivePlan(orgId);
    const planOrder = ['free', 'pro', 'business', 'enterprise'];
    const planIndex = planOrder.indexOf(plan.id);

    const { data, error } = await supabase
      .from('automation_action_types')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    // Filter by plan
    return (data || [])
      .filter((a) => planOrder.indexOf(a.min_plan) <= planIndex)
      .map(transformActionType);
  },
};

// ============================================================================
// HELPERS
// ============================================================================

function transformRule(row: Record<string, unknown>): AutomationRule {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    name: row.name as string,
    description: row.description as string | null,
    isActive: row.is_active as boolean,
    triggerType: row.trigger_type as TriggerType,
    triggerConfig: (row.trigger_config || {}) as Record<string, unknown>,
    conditions: (row.conditions || []) as AutomationCondition[],
    actions: (row.actions || []) as AutomationAction[],
    maxExecutions: row.max_executions as number | null,
    executionCount: row.execution_count as number,
    cooldownMinutes: row.cooldown_minutes as number,
    lastExecutedAt: row.last_executed_at as string | null,
    createdBy: row.created_by as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function transformExecution(row: Record<string, unknown>): AutomationExecution {
  return {
    id: row.id as string,
    ruleId: row.rule_id as string,
    triggerEvent: row.trigger_event as Record<string, unknown>,
    actionsExecuted: (row.actions_executed || []) as ExecutedAction[],
    status: row.status as 'completed' | 'failed' | 'partial',
    errorMessage: row.error_message as string | null,
    executedAt: row.executed_at as string,
  };
}

function transformTemplate(row: Record<string, unknown>): AutomationTemplate {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | null,
    category: row.category as string,
    industryId: row.industry_id as string | null,
    rules: (row.rules || []) as Partial<AutomationRule>[],
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
  };
}

function transformActionType(row: Record<string, unknown>): AutomationActionType {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | null,
    category: row.category as 'email' | 'sms' | 'task' | 'webhook' | 'internal',
    configSchema: row.config_schema as Record<string, unknown>,
    minPlan: row.min_plan as string,
    isActive: row.is_active as boolean,
  };
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current, key) => {
    return current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined;
  }, obj as unknown);
}

function resolveTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, path) => {
    const value = getNestedValue(data, path);
    return value !== undefined ? String(value) : '';
  });
}

// ============================================================================
// EXPORT
// ============================================================================

export default automationService;
