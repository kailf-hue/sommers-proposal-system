/**
 * Sommer's Proposal System - Providers Service
 * Phase 32: Provider abstraction layer for AI, Weather, etc.
 */

import { supabase } from '../supabase';
import { entitlementsService } from '../entitlements/entitlementsService';

// ============================================================================
// TYPES
// ============================================================================

export type ProviderType = 'ai' | 'weather' | 'email' | 'sms';

export interface ProviderConfig {
  id: string;
  orgId: string;
  providerType: ProviderType;
  providerName: string;
  isActive: boolean;
  priority: number;
  apiKeyEncrypted: string | null;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AIProvider {
  name: string;
  displayName: string;
  type: 'public' | 'premium' | 'byok';
  models: string[];
  rateLimit: number; // requests per minute
  minPlan: string;
}

export interface WeatherProvider {
  name: string;
  displayName: string;
  type: 'public' | 'premium';
  features: string[];
  minPlan: string;
}

export interface ProviderResponse<T> {
  provider: string;
  data: T;
  latency: number;
  cached: boolean;
}

// ============================================================================
// PROVIDER DEFINITIONS
// ============================================================================

export const AI_PROVIDERS: Record<string, AIProvider> = {
  huggingface: {
    name: 'huggingface',
    displayName: 'HuggingFace (Free)',
    type: 'public',
    models: ['mistral-7b', 'llama-2-7b'],
    rateLimit: 10,
    minPlan: 'free',
  },
  anthropic: {
    name: 'anthropic',
    displayName: 'Claude (Premium)',
    type: 'premium',
    models: ['claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus'],
    rateLimit: 60,
    minPlan: 'business',
  },
  openai: {
    name: 'openai',
    displayName: 'OpenAI (Premium)',
    type: 'premium',
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    rateLimit: 60,
    minPlan: 'business',
  },
  byok: {
    name: 'byok',
    displayName: 'Bring Your Own Key',
    type: 'byok',
    models: ['custom'],
    rateLimit: 100,
    minPlan: 'pro',
  },
};

export const WEATHER_PROVIDERS: Record<string, WeatherProvider> = {
  openweather: {
    name: 'openweather',
    displayName: 'OpenWeatherMap (Free)',
    type: 'public',
    features: ['current', 'forecast_5day', 'basic_alerts'],
    minPlan: 'free',
  },
  tomorrow: {
    name: 'tomorrow',
    displayName: 'Tomorrow.io (Premium)',
    type: 'premium',
    features: ['current', 'forecast_15day', 'hourly', 'historical', 'alerts', 'air_quality'],
    minPlan: 'pro',
  },
};

// ============================================================================
// PROVIDERS SERVICE
// ============================================================================

export const providersService = {
  // --------------------------------------------------------------------------
  // Provider Resolution
  // --------------------------------------------------------------------------

  /**
   * Get the appropriate AI provider for an org
   */
  async getAIProvider(orgId: string): Promise<string> {
    // Check for custom provider config
    const { data: customConfig } = await supabase
      .from('provider_configs')
      .select('*')
      .eq('org_id', orgId)
      .eq('provider_type', 'ai')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(1)
      .single();

    if (customConfig) {
      return customConfig.provider_name;
    }

    // Fall back to plan default
    const plan = await entitlementsService.getEffectivePlan(orgId);
    
    const { data: planProvider } = await supabase
      .from('plan_providers')
      .select('default_provider')
      .eq('plan_id', plan.id)
      .eq('provider_type', 'ai')
      .single();

    return planProvider?.default_provider || 'huggingface';
  },

  /**
   * Get the appropriate Weather provider for an org
   */
  async getWeatherProvider(orgId: string): Promise<string> {
    // Check for custom provider config
    const { data: customConfig } = await supabase
      .from('provider_configs')
      .select('*')
      .eq('org_id', orgId)
      .eq('provider_type', 'weather')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .limit(1)
      .single();

    if (customConfig) {
      return customConfig.provider_name;
    }

    // Fall back to plan default
    const plan = await entitlementsService.getEffectivePlan(orgId);
    
    const { data: planProvider } = await supabase
      .from('plan_providers')
      .select('default_provider')
      .eq('plan_id', plan.id)
      .eq('provider_type', 'weather')
      .single();

    return planProvider?.default_provider || 'openweather';
  },

  // --------------------------------------------------------------------------
  // AI Provider Methods
  // --------------------------------------------------------------------------

  /**
   * Call AI provider
   */
  async callAI(
    orgId: string,
    prompt: string,
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      systemPrompt?: string;
    }
  ): Promise<ProviderResponse<string>> {
    const startTime = Date.now();
    const providerName = await this.getAIProvider(orgId);
    const provider = AI_PROVIDERS[providerName];

    if (!provider) {
      throw new Error(`Unknown AI provider: ${providerName}`);
    }

    // Check plan access
    const plan = await entitlementsService.getEffectivePlan(orgId);
    const planOrder = ['free', 'pro', 'business', 'enterprise'];
    if (planOrder.indexOf(plan.id) < planOrder.indexOf(provider.minPlan)) {
      // Fall back to free provider
      return this.callHuggingFace(prompt, options);
    }

    // Route to appropriate provider
    let result: string;
    switch (providerName) {
      case 'huggingface':
        result = await this.callHuggingFaceInternal(prompt, options);
        break;
      case 'anthropic':
        result = await this.callAnthropicInternal(orgId, prompt, options);
        break;
      case 'openai':
        result = await this.callOpenAIInternal(orgId, prompt, options);
        break;
      case 'byok':
        result = await this.callBYOKInternal(orgId, prompt, options);
        break;
      default:
        result = await this.callHuggingFaceInternal(prompt, options);
    }

    return {
      provider: providerName,
      data: result,
      latency: Date.now() - startTime,
      cached: false,
    };
  },

  /**
   * HuggingFace (public/free)
   */
  async callHuggingFace(
    prompt: string,
    options?: { model?: string; maxTokens?: number }
  ): Promise<ProviderResponse<string>> {
    const startTime = Date.now();
    const result = await this.callHuggingFaceInternal(prompt, options);
    
    return {
      provider: 'huggingface',
      data: result,
      latency: Date.now() - startTime,
      cached: false,
    };
  },

  async callHuggingFaceInternal(
    prompt: string,
    options?: { model?: string; maxTokens?: number }
  ): Promise<string> {
    const model = options?.model || 'mistralai/Mistral-7B-Instruct-v0.2';
    
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.VITE_HUGGINGFACE_API_KEY || ''}`,
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: options?.maxTokens || 500,
            temperature: 0.7,
            return_full_text: false,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data[0]?.generated_text || '';
  },

  /**
   * Anthropic (premium)
   */
  async callAnthropicInternal(
    orgId: string,
    prompt: string,
    options?: { model?: string; maxTokens?: number; systemPrompt?: string }
  ): Promise<string> {
    // Get API key (either from config or env)
    const config = await this.getProviderConfig(orgId, 'ai', 'anthropic');
    const apiKey = config?.apiKeyEncrypted || process.env.VITE_ANTHROPIC_API_KEY;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: options?.model || 'claude-3-haiku-20240307',
        max_tokens: options?.maxTokens || 1024,
        system: options?.systemPrompt || 'You are a helpful assistant for a proposal management system.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content?.[0]?.text || '';
  },

  /**
   * OpenAI (premium)
   */
  async callOpenAIInternal(
    orgId: string,
    prompt: string,
    options?: { model?: string; maxTokens?: number; systemPrompt?: string }
  ): Promise<string> {
    const config = await this.getProviderConfig(orgId, 'ai', 'openai');
    const apiKey = config?.apiKeyEncrypted || process.env.VITE_OPENAI_API_KEY;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || 'gpt-3.5-turbo',
        max_tokens: options?.maxTokens || 1024,
        messages: [
          { role: 'system', content: options?.systemPrompt || 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  },

  /**
   * BYOK (Bring Your Own Key)
   */
  async callBYOKInternal(
    orgId: string,
    prompt: string,
    options?: { model?: string; maxTokens?: number }
  ): Promise<string> {
    const config = await this.getProviderConfig(orgId, 'ai', 'byok');
    if (!config?.apiKeyEncrypted || !config.config?.endpoint) {
      throw new Error('BYOK not configured');
    }

    const response = await fetch(config.config.endpoint as string, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKeyEncrypted}`,
      },
      body: JSON.stringify({
        prompt,
        max_tokens: options?.maxTokens || 1024,
      }),
    });

    if (!response.ok) {
      throw new Error(`BYOK API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.text || data.content || '';
  },

  // --------------------------------------------------------------------------
  // Weather Provider Methods
  // --------------------------------------------------------------------------

  /**
   * Get weather data
   */
  async getWeather(
    orgId: string,
    location: { lat: number; lon: number } | string
  ): Promise<ProviderResponse<WeatherData>> {
    const startTime = Date.now();
    const providerName = await this.getWeatherProvider(orgId);

    let result: WeatherData;
    switch (providerName) {
      case 'tomorrow':
        result = await this.callTomorrowIO(orgId, location);
        break;
      case 'openweather':
      default:
        result = await this.callOpenWeather(location);
    }

    return {
      provider: providerName,
      data: result,
      latency: Date.now() - startTime,
      cached: false,
    };
  },

  /**
   * OpenWeatherMap (free)
   */
  async callOpenWeather(
    location: { lat: number; lon: number } | string
  ): Promise<WeatherData> {
    const apiKey = process.env.VITE_OPENWEATHER_API_KEY;
    let url: string;

    if (typeof location === 'string') {
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=imperial`;
    } else {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${apiKey}&units=imperial`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OpenWeather API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      windSpeed: data.wind.speed,
      precipitation: data.rain?.['1h'] || 0,
      conditions: data.weather[0].main,
    };
  },

  /**
   * Tomorrow.io (premium)
   */
  async callTomorrowIO(
    orgId: string,
    location: { lat: number; lon: number } | string
  ): Promise<WeatherData> {
    const config = await this.getProviderConfig(orgId, 'weather', 'tomorrow');
    const apiKey = config?.apiKeyEncrypted || process.env.VITE_TOMORROW_API_KEY;

    let locationStr: string;
    if (typeof location === 'string') {
      locationStr = location;
    } else {
      locationStr = `${location.lat},${location.lon}`;
    }

    const response = await fetch(
      `https://api.tomorrow.io/v4/weather/realtime?location=${encodeURIComponent(locationStr)}&apikey=${apiKey}&units=imperial`
    );

    if (!response.ok) {
      throw new Error(`Tomorrow.io API error: ${response.statusText}`);
    }

    const data = await response.json();
    const values = data.data.values;

    return {
      temperature: values.temperature,
      feelsLike: values.temperatureApparent,
      humidity: values.humidity,
      description: getWeatherDescription(values.weatherCode),
      icon: getWeatherIcon(values.weatherCode),
      windSpeed: values.windSpeed,
      precipitation: values.precipitationIntensity || 0,
      conditions: getWeatherCondition(values.weatherCode),
    };
  },

  // --------------------------------------------------------------------------
  // Provider Configuration
  // --------------------------------------------------------------------------

  /**
   * Get provider config for an org
   */
  async getProviderConfig(
    orgId: string,
    providerType: ProviderType,
    providerName: string
  ): Promise<ProviderConfig | null> {
    const { data, error } = await supabase
      .from('provider_configs')
      .select('*')
      .eq('org_id', orgId)
      .eq('provider_type', providerType)
      .eq('provider_name', providerName)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? transformProviderConfig(data) : null;
  },

  /**
   * Set provider config
   */
  async setProviderConfig(
    orgId: string,
    providerType: ProviderType,
    providerName: string,
    config: {
      isActive?: boolean;
      priority?: number;
      apiKey?: string;
      options?: Record<string, unknown>;
    }
  ): Promise<ProviderConfig> {
    const { data, error } = await supabase
      .from('provider_configs')
      .upsert(
        {
          org_id: orgId,
          provider_type: providerType,
          provider_name: providerName,
          is_active: config.isActive ?? true,
          priority: config.priority ?? 0,
          api_key_encrypted: config.apiKey, // In production, encrypt this
          config: config.options || {},
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'org_id,provider_type,provider_name' }
      )
      .select()
      .single();

    if (error) throw error;
    return transformProviderConfig(data);
  },

  /**
   * Get all provider configs for an org
   */
  async getAllProviderConfigs(orgId: string): Promise<ProviderConfig[]> {
    const { data, error } = await supabase
      .from('provider_configs')
      .select('*')
      .eq('org_id', orgId)
      .order('provider_type')
      .order('priority', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformProviderConfig);
  },

  /**
   * Get available providers for an org based on plan
   */
  async getAvailableProviders(
    orgId: string,
    providerType: ProviderType
  ): Promise<{ name: string; displayName: string; available: boolean; reason?: string }[]> {
    const plan = await entitlementsService.getEffectivePlan(orgId);
    const planOrder = ['free', 'pro', 'business', 'enterprise'];
    const planIndex = planOrder.indexOf(plan.id);

    const providers = providerType === 'ai' ? AI_PROVIDERS : WEATHER_PROVIDERS;

    return Object.entries(providers).map(([name, provider]) => {
      const minPlanIndex = planOrder.indexOf(provider.minPlan);
      const available = planIndex >= minPlanIndex;

      return {
        name,
        displayName: provider.displayName,
        available,
        reason: available ? undefined : `Requires ${provider.minPlan} plan or higher`,
      };
    });
  },
};

// ============================================================================
// TYPES
// ============================================================================

interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  windSpeed: number;
  precipitation: number;
  conditions: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function transformProviderConfig(row: Record<string, unknown>): ProviderConfig {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    providerType: row.provider_type as ProviderType,
    providerName: row.provider_name as string,
    isActive: row.is_active as boolean,
    priority: row.priority as number,
    apiKeyEncrypted: row.api_key_encrypted as string | null,
    config: row.config as Record<string, unknown>,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Unknown',
    1000: 'Clear',
    1100: 'Mostly Clear',
    1101: 'Partly Cloudy',
    1102: 'Mostly Cloudy',
    1001: 'Cloudy',
    2000: 'Fog',
    4000: 'Drizzle',
    4001: 'Rain',
    4200: 'Light Rain',
    4201: 'Heavy Rain',
    5000: 'Snow',
    5001: 'Flurries',
    5100: 'Light Snow',
    5101: 'Heavy Snow',
    8000: 'Thunderstorm',
  };
  return descriptions[code] || 'Unknown';
}

function getWeatherIcon(code: number): string {
  const icons: Record<number, string> = {
    1000: '01d',
    1100: '02d',
    1101: '03d',
    1102: '04d',
    1001: '04d',
    2000: '50d',
    4000: '09d',
    4001: '10d',
    4200: '09d',
    4201: '10d',
    5000: '13d',
    5001: '13d',
    5100: '13d',
    5101: '13d',
    8000: '11d',
  };
  return icons[code] || '01d';
}

function getWeatherCondition(code: number): string {
  if (code >= 8000) return 'Thunderstorm';
  if (code >= 5000) return 'Snow';
  if (code >= 4000) return 'Rain';
  if (code >= 2000) return 'Fog';
  if (code >= 1100) return 'Clouds';
  return 'Clear';
}

// ============================================================================
// EXPORT
// ============================================================================

export default providersService;
