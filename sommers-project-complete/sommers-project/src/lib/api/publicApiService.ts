/**
 * Sommer's Proposal System - Public API Service
 * Phase 46: RESTful API for external integrations
 */

import { supabase } from '../supabase';
import { entitlementsService } from '../entitlements/entitlementsService';
import { usageService } from '../usage/usageService';

// ============================================================================
// TYPES
// ============================================================================

export interface ApiKey {
  id: string;
  orgId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  scopes: ApiScope[];
  rateLimit: number;
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  createdBy: string;
}

export type ApiScope =
  | 'proposals:read'
  | 'proposals:write'
  | 'clients:read'
  | 'clients:write'
  | 'payments:read'
  | 'payments:write'
  | 'analytics:read'
  | 'webhooks:manage'
  | 'team:read'
  | 'settings:read';

export interface ApiRequest {
  id: string;
  orgId: string;
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  ipAddress: string;
  userAgent: string;
  requestBody: Record<string, unknown> | null;
  responseBody: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  description: string;
  requiredScopes: ApiScope[];
  rateLimit: number;
  parameters?: ApiParameter[];
  requestBody?: ApiSchema;
  responseBody?: ApiSchema;
}

export interface ApiParameter {
  name: string;
  in: 'path' | 'query' | 'header';
  type: string;
  required: boolean;
  description: string;
}

export interface ApiSchema {
  type: string;
  properties?: Record<string, { type: string; description?: string }>;
  example?: unknown;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    perPage?: number;
    total?: number;
    rateLimit?: RateLimitInfo;
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const API_VERSION = 'v1';

const AVAILABLE_SCOPES: { scope: ApiScope; description: string }[] = [
  { scope: 'proposals:read', description: 'Read proposal data' },
  { scope: 'proposals:write', description: 'Create and update proposals' },
  { scope: 'clients:read', description: 'Read client data' },
  { scope: 'clients:write', description: 'Create and update clients' },
  { scope: 'payments:read', description: 'Read payment information' },
  { scope: 'payments:write', description: 'Process payments' },
  { scope: 'analytics:read', description: 'Access analytics data' },
  { scope: 'webhooks:manage', description: 'Manage webhook endpoints' },
  { scope: 'team:read', description: 'Read team member data' },
  { scope: 'settings:read', description: 'Read organization settings' },
];

const API_ENDPOINTS: ApiEndpoint[] = [
  // Proposals
  {
    path: '/proposals',
    method: 'GET',
    description: 'List all proposals',
    requiredScopes: ['proposals:read'],
    rateLimit: 100,
    parameters: [
      { name: 'page', in: 'query', type: 'integer', required: false, description: 'Page number' },
      { name: 'per_page', in: 'query', type: 'integer', required: false, description: 'Items per page (max 100)' },
      { name: 'status', in: 'query', type: 'string', required: false, description: 'Filter by status' },
      { name: 'client_id', in: 'query', type: 'string', required: false, description: 'Filter by client' },
    ],
  },
  {
    path: '/proposals/:id',
    method: 'GET',
    description: 'Get a specific proposal',
    requiredScopes: ['proposals:read'],
    rateLimit: 100,
    parameters: [
      { name: 'id', in: 'path', type: 'string', required: true, description: 'Proposal ID' },
    ],
  },
  {
    path: '/proposals',
    method: 'POST',
    description: 'Create a new proposal',
    requiredScopes: ['proposals:write'],
    rateLimit: 50,
    requestBody: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: 'Client ID' },
        title: { type: 'string', description: 'Proposal title' },
        items: { type: 'array', description: 'Line items' },
      },
    },
  },
  {
    path: '/proposals/:id',
    method: 'PUT',
    description: 'Update a proposal',
    requiredScopes: ['proposals:write'],
    rateLimit: 50,
  },
  {
    path: '/proposals/:id',
    method: 'DELETE',
    description: 'Delete a proposal',
    requiredScopes: ['proposals:write'],
    rateLimit: 20,
  },
  // Clients
  {
    path: '/clients',
    method: 'GET',
    description: 'List all clients',
    requiredScopes: ['clients:read'],
    rateLimit: 100,
  },
  {
    path: '/clients/:id',
    method: 'GET',
    description: 'Get a specific client',
    requiredScopes: ['clients:read'],
    rateLimit: 100,
  },
  {
    path: '/clients',
    method: 'POST',
    description: 'Create a new client',
    requiredScopes: ['clients:write'],
    rateLimit: 50,
  },
  {
    path: '/clients/:id',
    method: 'PUT',
    description: 'Update a client',
    requiredScopes: ['clients:write'],
    rateLimit: 50,
  },
  // Payments
  {
    path: '/payments',
    method: 'GET',
    description: 'List all payments',
    requiredScopes: ['payments:read'],
    rateLimit: 100,
  },
  {
    path: '/payments/:id',
    method: 'GET',
    description: 'Get a specific payment',
    requiredScopes: ['payments:read'],
    rateLimit: 100,
  },
  // Analytics
  {
    path: '/analytics/overview',
    method: 'GET',
    description: 'Get analytics overview',
    requiredScopes: ['analytics:read'],
    rateLimit: 50,
  },
  {
    path: '/analytics/pipeline',
    method: 'GET',
    description: 'Get pipeline analytics',
    requiredScopes: ['analytics:read'],
    rateLimit: 50,
  },
  // Webhooks
  {
    path: '/webhooks',
    method: 'GET',
    description: 'List webhook endpoints',
    requiredScopes: ['webhooks:manage'],
    rateLimit: 100,
  },
  {
    path: '/webhooks',
    method: 'POST',
    description: 'Create a webhook endpoint',
    requiredScopes: ['webhooks:manage'],
    rateLimit: 20,
  },
  {
    path: '/webhooks/:id',
    method: 'DELETE',
    description: 'Delete a webhook endpoint',
    requiredScopes: ['webhooks:manage'],
    rateLimit: 20,
  },
];

// ============================================================================
// PUBLIC API SERVICE
// ============================================================================

export const publicApiService = {
  // --------------------------------------------------------------------------
  // API Keys
  // --------------------------------------------------------------------------

  /**
   * Create an API key
   */
  async createApiKey(
    orgId: string,
    options: {
      name: string;
      scopes: ApiScope[];
      expiresAt?: string;
      createdBy: string;
    }
  ): Promise<{ apiKey: ApiKey; secretKey: string }> {
    // Check plan for API access
    const hasApiAccess = await entitlementsService.hasFeature(orgId, 'api_access');
    if (!hasApiAccess) {
      throw new Error('API access requires a Business or Enterprise plan');
    }

    // Check key limit
    const { count } = await supabase
      .from('api_keys')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('is_active', true);

    const plan = await entitlementsService.getEffectivePlan(orgId);
    const keyLimit = plan.id === 'enterprise' ? 20 : 5;

    if ((count || 0) >= keyLimit) {
      throw new Error(`API key limit reached (${keyLimit} keys)`);
    }

    // Generate key
    const secretKey = this.generateApiKey();
    const keyPrefix = secretKey.substring(0, 8);
    const keyHash = await this.hashApiKey(secretKey);

    // Determine rate limit based on plan
    const rateLimit = plan.id === 'enterprise' ? 10000 : 1000;

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        org_id: orgId,
        name: options.name,
        key_prefix: keyPrefix,
        key_hash: keyHash,
        scopes: options.scopes,
        rate_limit: rateLimit,
        is_active: true,
        expires_at: options.expiresAt,
        created_by: options.createdBy,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      apiKey: transformApiKey(data),
      secretKey, // Only returned once!
    };
  },

  /**
   * List API keys for an org
   */
  async listApiKeys(orgId: string): Promise<ApiKey[]> {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformApiKey);
  },

  /**
   * Get API key by ID
   */
  async getApiKey(keyId: string): Promise<ApiKey | null> {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', keyId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? transformApiKey(data) : null;
  },

  /**
   * Validate API key and return org info
   */
  async validateApiKey(
    secretKey: string
  ): Promise<{ valid: boolean; apiKey?: ApiKey; orgId?: string }> {
    const keyPrefix = secretKey.substring(0, 8);
    const keyHash = await this.hashApiKey(secretKey);

    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_prefix', keyPrefix)
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return { valid: false };
    }

    // Check expiration
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { valid: false };
    }

    // Update last used
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data.id);

    return {
      valid: true,
      apiKey: transformApiKey(data),
      orgId: data.org_id,
    };
  },

  /**
   * Revoke an API key
   */
  async revokeApiKey(keyId: string): Promise<void> {
    await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', keyId);
  },

  /**
   * Update API key
   */
  async updateApiKey(
    keyId: string,
    updates: { name?: string; scopes?: ApiScope[] }
  ): Promise<ApiKey> {
    const updateData: Record<string, unknown> = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.scopes) updateData.scopes = updates.scopes;

    const { data, error } = await supabase
      .from('api_keys')
      .update(updateData)
      .eq('id', keyId)
      .select()
      .single();

    if (error) throw error;
    return transformApiKey(data);
  },

  // --------------------------------------------------------------------------
  // Rate Limiting
  // --------------------------------------------------------------------------

  /**
   * Check rate limit
   */
  async checkRateLimit(
    apiKeyId: string,
    endpoint: string
  ): Promise<RateLimitInfo> {
    const apiKey = await this.getApiKey(apiKeyId);
    if (!apiKey) throw new Error('API key not found');

    const windowStart = new Date();
    windowStart.setMinutes(0, 0, 0); // Start of current hour

    const { count } = await supabase
      .from('api_requests')
      .select('*', { count: 'exact', head: true })
      .eq('api_key_id', apiKeyId)
      .gte('created_at', windowStart.toISOString());

    const used = count || 0;
    const remaining = Math.max(0, apiKey.rateLimit - used);

    const resetAt = new Date(windowStart);
    resetAt.setHours(resetAt.getHours() + 1);

    return {
      limit: apiKey.rateLimit,
      remaining,
      resetAt: resetAt.toISOString(),
    };
  },

  /**
   * Check if request is allowed
   */
  async isRequestAllowed(apiKeyId: string, endpoint: string): Promise<boolean> {
    const rateLimitInfo = await this.checkRateLimit(apiKeyId, endpoint);
    return rateLimitInfo.remaining > 0;
  },

  // --------------------------------------------------------------------------
  // Request Logging
  // --------------------------------------------------------------------------

  /**
   * Log API request
   */
  async logRequest(
    request: Omit<ApiRequest, 'id' | 'createdAt'>
  ): Promise<void> {
    await supabase.from('api_requests').insert({
      org_id: request.orgId,
      api_key_id: request.apiKeyId,
      endpoint: request.endpoint,
      method: request.method,
      status_code: request.statusCode,
      response_time: request.responseTime,
      ip_address: request.ipAddress,
      user_agent: request.userAgent,
      request_body: request.requestBody,
      response_body: request.responseBody,
      error_message: request.errorMessage,
    });

    // Track API usage
    await usageService.trackUsage(request.orgId, 'api_calls', 1);
  },

  /**
   * Get request history
   */
  async getRequestHistory(
    orgId: string,
    options?: {
      apiKeyId?: string;
      endpoint?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ): Promise<ApiRequest[]> {
    let query = supabase
      .from('api_requests')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (options?.apiKeyId) query = query.eq('api_key_id', options.apiKeyId);
    if (options?.endpoint) query = query.eq('endpoint', options.endpoint);
    if (options?.startDate) query = query.gte('created_at', options.startDate);
    if (options?.endDate) query = query.lte('created_at', options.endDate);
    if (options?.limit) query = query.limit(options.limit);

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(transformApiRequest);
  },

  /**
   * Get API usage stats
   */
  async getUsageStats(
    orgId: string,
    days: number = 30
  ): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
    requestsByEndpoint: { endpoint: string; count: number }[];
    requestsByDay: { date: string; count: number }[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: requests } = await supabase
      .from('api_requests')
      .select('endpoint, status_code, response_time, created_at')
      .eq('org_id', orgId)
      .gte('created_at', startDate.toISOString());

    if (!requests || requests.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgResponseTime: 0,
        requestsByEndpoint: [],
        requestsByDay: [],
      };
    }

    const totalRequests = requests.length;
    const successfulRequests = requests.filter((r) => r.status_code < 400).length;
    const failedRequests = totalRequests - successfulRequests;
    const avgResponseTime =
      requests.reduce((sum, r) => sum + (r.response_time || 0), 0) / totalRequests;

    // Group by endpoint
    const endpointCounts = new Map<string, number>();
    for (const req of requests) {
      endpointCounts.set(req.endpoint, (endpointCounts.get(req.endpoint) || 0) + 1);
    }
    const requestsByEndpoint = Array.from(endpointCounts.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count);

    // Group by day
    const dayCounts = new Map<string, number>();
    for (const req of requests) {
      const date = req.created_at.split('T')[0];
      dayCounts.set(date, (dayCounts.get(date) || 0) + 1);
    }
    const requestsByDay = Array.from(dayCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      avgResponseTime: Math.round(avgResponseTime),
      requestsByEndpoint,
      requestsByDay,
    };
  },

  // --------------------------------------------------------------------------
  // Scope Management
  // --------------------------------------------------------------------------

  /**
   * Get available scopes
   */
  getAvailableScopes(): { scope: ApiScope; description: string }[] {
    return AVAILABLE_SCOPES;
  },

  /**
   * Check if API key has scope
   */
  hasScope(apiKey: ApiKey, requiredScope: ApiScope): boolean {
    return apiKey.scopes.includes(requiredScope);
  },

  /**
   * Check if API key has any of the scopes
   */
  hasAnyScope(apiKey: ApiKey, requiredScopes: ApiScope[]): boolean {
    return requiredScopes.some((scope) => apiKey.scopes.includes(scope));
  },

  // --------------------------------------------------------------------------
  // Documentation
  // --------------------------------------------------------------------------

  /**
   * Get API endpoints documentation
   */
  getEndpoints(): ApiEndpoint[] {
    return API_ENDPOINTS;
  },

  /**
   * Get OpenAPI spec
   */
  getOpenApiSpec(): Record<string, unknown> {
    return {
      openapi: '3.0.0',
      info: {
        title: 'Sommer\'s Proposal System API',
        version: API_VERSION,
        description: 'REST API for integrating with the Sommer\'s Proposal System',
      },
      servers: [
        {
          url: 'https://api.sommersealcoating.com/v1',
          description: 'Production server',
        },
      ],
      security: [
        {
          ApiKeyAuth: [],
        },
      ],
      paths: this.buildOpenApiPaths(),
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
          },
        },
        schemas: this.buildOpenApiSchemas(),
      },
    };
  },

  /**
   * Build OpenAPI paths
   */
  buildOpenApiPaths(): Record<string, unknown> {
    const paths: Record<string, unknown> = {};

    for (const endpoint of API_ENDPOINTS) {
      const path = endpoint.path.replace(/:(\w+)/g, '{$1}');
      if (!paths[path]) paths[path] = {};

      (paths[path] as Record<string, unknown>)[endpoint.method.toLowerCase()] = {
        summary: endpoint.description,
        security: [{ ApiKeyAuth: [] }],
        parameters: endpoint.parameters?.map((p) => ({
          name: p.name,
          in: p.in,
          required: p.required,
          schema: { type: p.type },
          description: p.description,
        })),
        requestBody: endpoint.requestBody
          ? {
              content: {
                'application/json': {
                  schema: endpoint.requestBody,
                },
              },
            }
          : undefined,
        responses: {
          200: { description: 'Successful response' },
          400: { description: 'Bad request' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          404: { description: 'Not found' },
          429: { description: 'Rate limit exceeded' },
          500: { description: 'Internal server error' },
        },
      };
    }

    return paths;
  },

  /**
   * Build OpenAPI schemas
   */
  buildOpenApiSchemas(): Record<string, unknown> {
    return {
      Proposal: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          proposal_number: { type: 'string' },
          client_id: { type: 'string' },
          status: { type: 'string', enum: ['draft', 'sent', 'viewed', 'signed', 'rejected'] },
          total_amount: { type: 'number' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Client: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          address: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Payment: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          proposal_id: { type: 'string' },
          amount: { type: 'number' },
          status: { type: 'string' },
          paid_at: { type: 'string', format: 'date-time' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          message: { type: 'string' },
        },
      },
    };
  },

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  /**
   * Generate API key
   */
  generateApiKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'sk_live_';
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  },

  /**
   * Hash API key
   */
  async hashApiKey(key: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Build API response
   */
  buildResponse<T>(
    success: boolean,
    data?: T,
    error?: { code: string; message: string },
    meta?: ApiResponse['meta']
  ): ApiResponse<T> {
    const response: ApiResponse<T> = { success };
    if (data) response.data = data;
    if (error) response.error = error;
    if (meta) response.meta = meta;
    return response;
  },

  /**
   * Format error response
   */
  formatError(code: string, message: string): ApiResponse {
    return {
      success: false,
      error: { code, message },
    };
  },
};

// ============================================================================
// HELPERS
// ============================================================================

function transformApiKey(row: Record<string, unknown>): ApiKey {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    name: row.name as string,
    keyPrefix: row.key_prefix as string,
    keyHash: row.key_hash as string,
    scopes: (row.scopes || []) as ApiScope[],
    rateLimit: row.rate_limit as number,
    isActive: row.is_active as boolean,
    lastUsedAt: row.last_used_at as string | null,
    expiresAt: row.expires_at as string | null,
    createdAt: row.created_at as string,
    createdBy: row.created_by as string,
  };
}

function transformApiRequest(row: Record<string, unknown>): ApiRequest {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    apiKeyId: row.api_key_id as string,
    endpoint: row.endpoint as string,
    method: row.method as string,
    statusCode: row.status_code as number,
    responseTime: row.response_time as number,
    ipAddress: row.ip_address as string,
    userAgent: row.user_agent as string,
    requestBody: row.request_body as Record<string, unknown> | null,
    responseBody: row.response_body as Record<string, unknown> | null,
    errorMessage: row.error_message as string | null,
    createdAt: row.created_at as string,
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export default publicApiService;
