-- ============================================================================
-- SOMMER'S PROPOSAL SYSTEM - SAAS EXPANSION SCHEMA
-- Phases 29-40: Entitlements, Usage, Billing, Multi-Industry, Editor, Automation
-- ============================================================================

-- ============================================================================
-- PHASE 29: ENTITLEMENTS & FEATURE FLAGS
-- ============================================================================

-- Plan definitions (single source of truth)
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly INTEGER NOT NULL DEFAULT 0, -- cents
  price_yearly INTEGER NOT NULL DEFAULT 0,  -- cents
  features JSONB NOT NULL DEFAULT '{}',
  limits JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default plans
INSERT INTO plans (id, name, display_name, description, price_monthly, price_yearly, features, limits, sort_order) VALUES
('free', 'free', 'Free', 'Basic features for small businesses', 0, 0, 
  '{"proposals": true, "clients": true, "templates": true, "basic_analytics": true, "email_support": true}',
  '{"proposals_per_month": 10, "clients": 50, "team_members": 1, "storage_mb": 100, "ai_calls_per_month": 20, "industries": 1}',
  1),
('pro', 'pro', 'Pro', 'Advanced features for growing teams', 2900, 29000,
  '{"proposals": true, "clients": true, "templates": true, "advanced_analytics": true, "priority_support": true, "custom_branding": true, "integrations": true, "ai_assistant": true}',
  '{"proposals_per_month": 100, "clients": 500, "team_members": 5, "storage_mb": 5000, "ai_calls_per_month": 500, "industries": 1}',
  2),
('business', 'business', 'Business', 'Full suite for established businesses', 7900, 79000,
  '{"proposals": true, "clients": true, "templates": true, "advanced_analytics": true, "priority_support": true, "custom_branding": true, "integrations": true, "ai_assistant": true, "automation": true, "api_access": true, "white_label": true}',
  '{"proposals_per_month": 500, "clients": 2500, "team_members": 25, "storage_mb": 25000, "ai_calls_per_month": 2500, "industries": 3}',
  3),
('enterprise', 'enterprise', 'Enterprise', 'Unlimited everything with dedicated support', 19900, 199000,
  '{"proposals": true, "clients": true, "templates": true, "advanced_analytics": true, "dedicated_support": true, "custom_branding": true, "integrations": true, "ai_assistant": true, "automation": true, "api_access": true, "white_label": true, "custom_domain": true, "sso": true, "audit_logs": true}',
  '{"proposals_per_month": -1, "clients": -1, "team_members": -1, "storage_mb": -1, "ai_calls_per_month": -1, "industries": -1}',
  4)
ON CONFLICT (id) DO NOTHING;

-- Organization entitlements (override billing)
CREATE TABLE IF NOT EXISTS org_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL UNIQUE,
  plan_override TEXT REFERENCES plans(id),
  is_comped BOOLEAN DEFAULT FALSE,
  comped_until TIMESTAMPTZ, -- null = forever
  reason TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature flags per org
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, feature_key)
);

-- ============================================================================
-- PHASE 30: USAGE LEDGER & QUOTAS
-- ============================================================================

-- Usage events (append-only ledger)
CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  user_id TEXT,
  event_type TEXT NOT NULL, -- 'proposal_created', 'ai_call', 'email_sent', 'storage_upload', etc.
  quantity INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_usage_events_org_type_time 
ON usage_events(org_id, event_type, timestamp DESC);

-- Usage rollups (daily/monthly aggregates)
CREATE TABLE IF NOT EXISTS usage_rollups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  period_type TEXT NOT NULL, -- 'daily', 'monthly'
  period_start DATE NOT NULL,
  event_type TEXT NOT NULL,
  total_quantity INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, period_type, period_start, event_type)
);

-- Current usage snapshots (for quick quota checks)
CREATE TABLE IF NOT EXISTS usage_current (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL UNIQUE,
  proposals_this_month INTEGER DEFAULT 0,
  ai_calls_this_month INTEGER DEFAULT 0,
  emails_this_month INTEGER DEFAULT 0,
  storage_used_bytes BIGINT DEFAULT 0,
  team_members_count INTEGER DEFAULT 1,
  period_start DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)::DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PHASE 31: STRIPE BILLING
-- ============================================================================

-- Stripe subscription data
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_id TEXT REFERENCES plans(id),
  status TEXT DEFAULT 'active', -- 'active', 'canceled', 'past_due', 'trialing'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  trial_end TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Billing events log
CREATE TABLE IF NOT EXISTS billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  stripe_event_id TEXT UNIQUE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  stripe_invoice_id TEXT UNIQUE,
  amount_due INTEGER NOT NULL, -- cents
  amount_paid INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  pdf_url TEXT,
  hosted_invoice_url TEXT,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PHASE 32: PROVIDER ABSTRACTION
-- ============================================================================

-- Provider configurations
CREATE TABLE IF NOT EXISTS provider_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  provider_type TEXT NOT NULL, -- 'ai', 'weather', 'email', 'sms'
  provider_name TEXT NOT NULL, -- 'huggingface', 'anthropic', 'openweather', 'tomorrow'
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  api_key_encrypted TEXT, -- BYOK option
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, provider_type, provider_name)
);

-- Default provider mappings per plan
CREATE TABLE IF NOT EXISTS plan_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id TEXT REFERENCES plans(id),
  provider_type TEXT NOT NULL,
  default_provider TEXT NOT NULL,
  fallback_provider TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan_id, provider_type)
);

INSERT INTO plan_providers (plan_id, provider_type, default_provider, fallback_provider) VALUES
('free', 'ai', 'huggingface', NULL),
('free', 'weather', 'openweather', NULL),
('pro', 'ai', 'huggingface', 'anthropic'),
('pro', 'weather', 'openweather', 'tomorrow'),
('business', 'ai', 'anthropic', 'huggingface'),
('business', 'weather', 'tomorrow', 'openweather'),
('enterprise', 'ai', 'anthropic', 'openai'),
('enterprise', 'weather', 'tomorrow', 'openweather')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PHASE 33: INDUSTRY ENGINE
-- ============================================================================

-- Industries configuration
CREATE TABLE IF NOT EXISTS industries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#C41E3A',
  is_active BOOLEAN DEFAULT TRUE,
  config JSONB NOT NULL DEFAULT '{}', -- wizard steps, enabled features, etc.
  legal_clauses JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default industries
INSERT INTO industries (id, name, display_name, description, icon, config) VALUES
('asphalt', 'asphalt', 'Asphalt & Sealcoating', 'Asphalt maintenance, sealcoating, crack filling, striping', 'road', '{
  "wizard_steps": ["contact", "property", "measurements", "services", "pricing", "review"],
  "measurement_units": {"primary": "sqft", "secondary": "lf"},
  "weather_sensitive": true,
  "seasonal": true,
  "default_services": ["sealcoating", "crack_filling", "line_striping", "pothole_repair"]
}'),
('hvac', 'hvac', 'HVAC Services', 'Heating, ventilation, air conditioning installation and repair', 'thermometer', '{
  "wizard_steps": ["contact", "property", "system_info", "services", "parts", "pricing", "review"],
  "measurement_units": {"primary": "unit", "secondary": "hour"},
  "weather_sensitive": false,
  "seasonal": true,
  "default_services": ["diagnostic", "repair", "installation", "maintenance"]
}'),
('cleaning', 'cleaning', 'Cleaning Services', 'Commercial and residential cleaning', 'sparkles', '{
  "wizard_steps": ["contact", "property", "rooms", "services", "frequency", "pricing", "review"],
  "measurement_units": {"primary": "sqft", "secondary": "room"},
  "weather_sensitive": false,
  "seasonal": false,
  "default_services": ["general_cleaning", "deep_cleaning", "carpet_cleaning", "window_cleaning"]
}'),
('landscaping', 'landscaping', 'Landscaping', 'Lawn care, garden design, outdoor maintenance', 'leaf', '{
  "wizard_steps": ["contact", "property", "measurements", "services", "materials", "pricing", "review"],
  "measurement_units": {"primary": "sqft", "secondary": "yard"},
  "weather_sensitive": true,
  "seasonal": true,
  "default_services": ["lawn_care", "mulching", "planting", "hardscaping", "irrigation"]
}')
ON CONFLICT (id) DO NOTHING;

-- Organization industry assignments
CREATE TABLE IF NOT EXISTS org_industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  industry_id TEXT REFERENCES industries(id),
  is_primary BOOLEAN DEFAULT FALSE,
  custom_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, industry_id)
);

-- ============================================================================
-- PHASE 34: SERVICE CATALOG
-- ============================================================================

-- Service categories
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id TEXT REFERENCES industries(id),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services catalog (universal model)
CREATE TABLE IF NOT EXISTS services_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id TEXT REFERENCES industries(id),
  category_id UUID REFERENCES service_categories(id),
  org_id TEXT, -- null = global template, non-null = org-specific
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit_type TEXT NOT NULL, -- 'sqft', 'lf', 'unit', 'hour', 'each'
  unit_label TEXT NOT NULL,
  default_price DECIMAL(10,2),
  price_min DECIMAL(10,2),
  price_max DECIMAL(10,2),
  cost DECIMAL(10,2), -- for margin calculations
  is_taxable BOOLEAN DEFAULT TRUE,
  tax_rate DECIMAL(5,4),
  requires_measurement BOOLEAN DEFAULT TRUE,
  measurement_fields JSONB DEFAULT '[]',
  pricing_formula TEXT, -- optional formula: "base + (sqft * rate)"
  multipliers JSONB DEFAULT '{}', -- condition multipliers
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, industry_id, code)
);

-- Service groups (bundles)
CREATE TABLE IF NOT EXISTS service_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT,
  industry_id TEXT REFERENCES industries(id),
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT, -- 'percentage', 'fixed'
  discount_value DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service group items
CREATE TABLE IF NOT EXISTS service_group_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES service_groups(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services_catalog(id),
  is_required BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0
);

-- Service tags
CREATE TABLE IF NOT EXISTS service_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6B7280',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service-tag associations
CREATE TABLE IF NOT EXISTS service_tag_assignments (
  service_id UUID REFERENCES services_catalog(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES service_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (service_id, tag_id)
);

-- ============================================================================
-- PHASE 35 & 36: WIZARD CONFIG & CALCULATORS
-- ============================================================================

-- Wizard step definitions per industry
CREATE TABLE IF NOT EXISTS wizard_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id TEXT REFERENCES industries(id),
  step_key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  component_name TEXT NOT NULL, -- React component to render
  fields JSONB NOT NULL DEFAULT '[]', -- field definitions
  validations JSONB DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT TRUE,
  conditions JSONB DEFAULT '{}', -- when to show/hide
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(industry_id, step_key)
);

-- Calculator plugins registry
CREATE TABLE IF NOT EXISTS calculators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id TEXT REFERENCES industries(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  input_schema JSONB NOT NULL, -- defines required inputs
  formula TEXT NOT NULL, -- calculation formula or function name
  output_schema JSONB NOT NULL, -- defines outputs
  ui_config JSONB DEFAULT '{}', -- how to render in UI
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(industry_id, code)
);

-- Calculator presets (saved configurations)
CREATE TABLE IF NOT EXISTS calculator_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  calculator_id UUID REFERENCES calculators(id),
  name TEXT NOT NULL,
  inputs JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PHASE 37 & 38: BLOCK REGISTRY & EDITOR
-- ============================================================================

-- Block definitions
CREATE TABLE IF NOT EXISTS block_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'content', 'media', 'pricing', 'legal', 'interactive'
  icon TEXT,
  component_name TEXT NOT NULL,
  default_props JSONB DEFAULT '{}',
  schema JSONB NOT NULL, -- prop types and validations
  min_plan TEXT DEFAULT 'free',
  industries TEXT[] DEFAULT '{}', -- empty = all industries
  tags TEXT[] DEFAULT '{}',
  is_system BOOLEAN DEFAULT FALSE, -- cannot be deleted
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default blocks
INSERT INTO block_registry (code, name, description, category, component_name, schema, min_plan, is_system) VALUES
('text', 'Text', 'Rich text content', 'content', 'TextBlock', '{"content": {"type": "richtext", "required": true}}', 'free', true),
('heading', 'Heading', 'Section heading', 'content', 'HeadingBlock', '{"level": {"type": "number", "min": 1, "max": 6}, "text": {"type": "string"}}', 'free', true),
('image', 'Image', 'Single image with caption', 'media', 'ImageBlock', '{"src": {"type": "url"}, "alt": {"type": "string"}, "caption": {"type": "string"}}', 'free', true),
('image_gallery', 'Image Gallery', 'Multiple images in grid', 'media', 'ImageGalleryBlock', '{"images": {"type": "array"}, "columns": {"type": "number"}}', 'pro', true),
('video', 'Video', 'Embedded video', 'media', 'VideoBlock', '{"url": {"type": "url"}, "provider": {"type": "string"}}', 'pro', true),
('pricing_table', 'Pricing Table', 'Service pricing breakdown', 'pricing', 'PricingTableBlock', '{"items": {"type": "array"}, "showTotals": {"type": "boolean"}}', 'free', true),
('pricing_options', 'Pricing Options', 'Tiered pricing selection', 'pricing', 'PricingOptionsBlock', '{"tiers": {"type": "array"}, "allowSelection": {"type": "boolean"}}', 'pro', true),
('signature', 'Signature', 'E-signature capture', 'legal', 'SignatureBlock', '{"required": {"type": "boolean"}, "label": {"type": "string"}}', 'free', true),
('terms', 'Terms & Conditions', 'Legal terms acceptance', 'legal', 'TermsBlock', '{"content": {"type": "richtext"}, "requireAccept": {"type": "boolean"}}', 'free', true),
('before_after', 'Before/After', 'Image comparison slider', 'interactive', 'BeforeAfterBlock', '{"before": {"type": "url"}, "after": {"type": "url"}}', 'pro', true),
('calculator', 'Calculator', 'Interactive calculator', 'interactive', 'CalculatorBlock', '{"calculatorId": {"type": "uuid"}}', 'business', true),
('payment', 'Payment', 'Payment button/form', 'interactive', 'PaymentBlock', '{"amount": {"type": "number"}, "allowPartial": {"type": "boolean"}}', 'pro', true),
('divider', 'Divider', 'Visual separator', 'content', 'DividerBlock', '{"style": {"type": "string"}}', 'free', true),
('spacer', 'Spacer', 'Vertical space', 'content', 'SpacerBlock', '{"height": {"type": "number"}}', 'free', true),
('columns', 'Columns', 'Multi-column layout', 'content', 'ColumnsBlock', '{"columns": {"type": "number"}, "children": {"type": "array"}}', 'pro', true)
ON CONFLICT (code) DO NOTHING;

-- Saved block templates (reusable)
CREATE TABLE IF NOT EXISTS block_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  block_code TEXT REFERENCES block_registry(code),
  name TEXT NOT NULL,
  description TEXT,
  props JSONB NOT NULL,
  is_shared BOOLEAN DEFAULT FALSE,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proposal block instances
CREATE TABLE IF NOT EXISTS proposal_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL, -- references proposals table
  block_code TEXT REFERENCES block_registry(code),
  props JSONB NOT NULL DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  parent_id UUID REFERENCES proposal_blocks(id), -- for nested blocks
  column_index INTEGER, -- for columns
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proposal_blocks_proposal ON proposal_blocks(proposal_id);

-- ============================================================================
-- PHASE 39: INTERACTIVE VIEWER CONFIG
-- ============================================================================

-- Viewer themes
CREATE TABLE IF NOT EXISTS viewer_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL, -- colors, fonts, spacing, animations
  is_default BOOLEAN DEFAULT FALSE,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default themes
INSERT INTO viewer_themes (name, description, config, is_default, is_system) VALUES
('Modern Clean', 'Clean, minimal design', '{"fontFamily": "Inter", "primaryColor": "#C41E3A", "bgColor": "#FFFFFF", "animations": true}', true, true),
('Bold Industrial', 'Strong, industrial aesthetic', '{"fontFamily": "Bebas Neue", "primaryColor": "#1F2937", "bgColor": "#F3F4F6", "animations": true}', false, true),
('Elegant Pro', 'Sophisticated, premium look', '{"fontFamily": "Playfair Display", "primaryColor": "#7C3AED", "bgColor": "#FAFAFA", "animations": true}', false, true)
ON CONFLICT DO NOTHING;

-- Interactive elements configuration
CREATE TABLE IF NOT EXISTS interactive_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL,
  enable_pricing_selection BOOLEAN DEFAULT FALSE,
  enable_addons BOOLEAN DEFAULT FALSE,
  enable_chat BOOLEAN DEFAULT FALSE,
  enable_scheduling BOOLEAN DEFAULT FALSE,
  animations_enabled BOOLEAN DEFAULT TRUE,
  theme_id UUID REFERENCES viewer_themes(id),
  custom_css TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PHASE 40: AUTOMATION ENGINE
-- ============================================================================

-- Automation rules
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  trigger_type TEXT NOT NULL, -- 'proposal_sent', 'proposal_viewed', 'proposal_signed', 'time_elapsed', etc.
  trigger_config JSONB NOT NULL DEFAULT '{}',
  conditions JSONB DEFAULT '[]', -- array of conditions
  actions JSONB NOT NULL, -- array of actions
  max_executions INTEGER, -- null = unlimited
  execution_count INTEGER DEFAULT 0,
  cooldown_minutes INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation action types
CREATE TABLE IF NOT EXISTS automation_action_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'email', 'sms', 'task', 'webhook', 'internal'
  config_schema JSONB NOT NULL,
  min_plan TEXT DEFAULT 'pro',
  is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO automation_action_types (id, name, description, category, config_schema, min_plan) VALUES
('send_email', 'Send Email', 'Send an email to client or team', 'email', '{"template_id": "string", "to": "string", "subject": "string"}', 'free'),
('send_reminder', 'Send Reminder', 'Send a reminder email', 'email', '{"delay_days": "number", "template_id": "string"}', 'free'),
('send_sms', 'Send SMS', 'Send SMS notification', 'sms', '{"to": "string", "message": "string"}', 'pro'),
('create_task', 'Create Task', 'Create a follow-up task', 'task', '{"title": "string", "assignee": "string", "due_days": "number"}', 'pro'),
('update_status', 'Update Status', 'Change proposal/deal status', 'internal', '{"status": "string"}', 'free'),
('add_tag', 'Add Tag', 'Add tag to client/proposal', 'internal', '{"tag": "string"}', 'free'),
('webhook', 'Webhook', 'Call external URL', 'webhook', '{"url": "string", "method": "string", "headers": "object"}', 'business'),
('slack_notify', 'Slack Notification', 'Send Slack message', 'webhook', '{"channel": "string", "message": "string"}', 'business')
ON CONFLICT (id) DO NOTHING;

-- Automation execution log
CREATE TABLE IF NOT EXISTS automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES automation_rules(id),
  trigger_event JSONB NOT NULL,
  actions_executed JSONB NOT NULL,
  status TEXT DEFAULT 'completed', -- 'completed', 'failed', 'partial'
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation templates (pre-built sequences)
CREATE TABLE IF NOT EXISTS automation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'follow_up', 'onboarding', 'win_back', etc.
  industry_id TEXT REFERENCES industries(id),
  rules JSONB NOT NULL, -- array of rule definitions
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default automation templates
INSERT INTO automation_templates (name, description, category, rules) VALUES
('Basic Follow-Up', 'Send reminder 3 days after proposal sent', 'follow_up', '[
  {"trigger_type": "time_elapsed", "trigger_config": {"event": "proposal_sent", "delay_days": 3}, "actions": [{"type": "send_reminder", "config": {"template_id": "proposal_followup"}}]}
]'),
('View Notification', 'Notify when proposal is viewed', 'notification', '[
  {"trigger_type": "proposal_viewed", "actions": [{"type": "send_email", "config": {"to": "owner", "template_id": "proposal_viewed_alert"}}]}
]'),
('Win Celebration', 'Send thank you and create onboarding task', 'win', '[
  {"trigger_type": "proposal_signed", "actions": [
    {"type": "send_email", "config": {"to": "client", "template_id": "thank_you"}},
    {"type": "create_task", "config": {"title": "Schedule kickoff call", "due_days": 1}}
  ]}
]')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_org_entitlements_org ON org_entitlements(org_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_current_org ON usage_current(org_id);
CREATE INDEX IF NOT EXISTS idx_org_industries_org ON org_industries(org_id);
CREATE INDEX IF NOT EXISTS idx_services_catalog_industry ON services_catalog(industry_id);
CREATE INDEX IF NOT EXISTS idx_services_catalog_org ON services_catalog(org_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_org ON automation_rules(org_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON automation_rules(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE org_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_current ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

-- Org admins can read their entitlements
CREATE POLICY "org_entitlements_select" ON org_entitlements
  FOR SELECT USING (org_id = current_setting('app.current_org_id', TRUE));

-- Usage policies
CREATE POLICY "usage_events_insert" ON usage_events
  FOR INSERT WITH CHECK (org_id = current_setting('app.current_org_id', TRUE));

CREATE POLICY "usage_events_select" ON usage_events
  FOR SELECT USING (org_id = current_setting('app.current_org_id', TRUE));

CREATE POLICY "usage_current_all" ON usage_current
  FOR ALL USING (org_id = current_setting('app.current_org_id', TRUE));

-- Subscription policies
CREATE POLICY "subscriptions_select" ON subscriptions
  FOR SELECT USING (org_id = current_setting('app.current_org_id', TRUE));

-- Industry policies
CREATE POLICY "org_industries_all" ON org_industries
  FOR ALL USING (org_id = current_setting('app.current_org_id', TRUE));

-- Automation policies  
CREATE POLICY "automation_rules_all" ON automation_rules
  FOR ALL USING (org_id = current_setting('app.current_org_id', TRUE));
