-- ============================================================================
-- Sommer's Proposal System - Database Schema
-- Phases 41-50: Complete SaaS Platform Tables
-- ============================================================================

-- ============================================================================
-- PHASE 41: CRM DASHBOARD TABLES
-- ============================================================================

-- Client Activities
CREATE TABLE IF NOT EXISTS client_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES team_members(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_client_activities_org ON client_activities(org_id);
CREATE INDEX idx_client_activities_client ON client_activities(client_id);
CREATE INDEX idx_client_activities_timestamp ON client_activities(timestamp DESC);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  assignee_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'pending',
  related_type VARCHAR(50),
  related_id UUID,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_org ON tasks(org_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);

-- Client Segments
CREATE TABLE IF NOT EXISTS client_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  criteria JSONB DEFAULT '[]',
  color VARCHAR(20) DEFAULT '#3B82F6',
  client_count INT DEFAULT 0,
  avg_value DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_client_segments_org ON client_segments(org_id);

-- Add engagement_score to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS engagement_score INT DEFAULT 50;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20) DEFAULT 'low';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS lifetime_value DECIMAL(12,2) DEFAULT 0;

-- ============================================================================
-- PHASE 42: PIPELINE FORECASTING TABLES
-- ============================================================================

-- Pipeline Stages
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  probability INT DEFAULT 50,
  sort_order INT DEFAULT 0,
  color VARCHAR(20) DEFAULT '#3B82F6',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pipeline_stages_org ON pipeline_stages(org_id);

-- Default pipeline stages
INSERT INTO pipeline_stages (org_id, name, probability, sort_order, is_default) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Lead', 10, 1, TRUE),
  ('00000000-0000-0000-0000-000000000000', 'Qualified', 25, 2, TRUE),
  ('00000000-0000-0000-0000-000000000000', 'Proposal Sent', 50, 3, TRUE),
  ('00000000-0000-0000-0000-000000000000', 'Negotiation', 75, 4, TRUE),
  ('00000000-0000-0000-0000-000000000000', 'Verbal Commit', 90, 5, TRUE),
  ('00000000-0000-0000-0000-000000000000', 'Closed Won', 100, 6, TRUE),
  ('00000000-0000-0000-0000-000000000000', 'Closed Lost', 0, 7, TRUE)
ON CONFLICT DO NOTHING;

-- Add forecast fields to proposals
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES pipeline_stages(id);
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS probability INT;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS expected_close_date DATE;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS weighted_value DECIMAL(12,2);

-- Sales Quotas
CREATE TABLE IF NOT EXISTS sales_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  period_type VARCHAR(20) NOT NULL, -- monthly, quarterly, yearly
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_quotas_org_period ON sales_quotas(org_id, period_start, period_end);

-- ============================================================================
-- PHASE 43: ADVANCED ANALYTICS TABLES
-- ============================================================================

-- Analytics Snapshots (for historical data)
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  metrics JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_analytics_snapshots_org_date ON analytics_snapshots(org_id, snapshot_date);

-- Saved Reports
CREATE TABLE IF NOT EXISTS saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES team_members(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  report_type VARCHAR(50) NOT NULL,
  config JSONB NOT NULL,
  schedule JSONB,
  is_public BOOLEAN DEFAULT FALSE,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_saved_reports_org ON saved_reports(org_id);

-- ============================================================================
-- PHASE 44: E-SIGNATURE TABLES
-- ============================================================================

-- Signature Requests
CREATE TABLE IF NOT EXISTS signature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  document_hash VARCHAR(64) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  signature_type VARCHAR(20) DEFAULT 'typed',
  signers JSONB NOT NULL DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_signature_requests_org ON signature_requests(org_id);
CREATE INDEX idx_signature_requests_proposal ON signature_requests(proposal_id);
CREATE INDEX idx_signature_requests_status ON signature_requests(status);

-- Signature Audit Log
CREATE TABLE IF NOT EXISTS signature_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES signature_requests(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  performed_by VARCHAR(255) NOT NULL,
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  details JSONB DEFAULT '{}'
);

CREATE INDEX idx_signature_audit_request ON signature_audit_log(request_id);
CREATE INDEX idx_signature_audit_time ON signature_audit_log(performed_at);

-- Signature Certificates
CREATE TABLE IF NOT EXISTS signature_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES signature_requests(id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL REFERENCES proposals(id),
  document_hash VARCHAR(64) NOT NULL,
  certificate_hash VARCHAR(64) NOT NULL,
  signers JSONB NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_signature_certificates_request ON signature_certificates(request_id);

-- ============================================================================
-- PHASE 45: WHITE LABEL TABLES
-- ============================================================================

-- White Label Configs
CREATE TABLE IF NOT EXISTS white_label_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT FALSE,
  branding JSONB DEFAULT '{}',
  custom_domain JSONB,
  email_settings JSONB DEFAULT '{}',
  proposal_settings JSONB DEFAULT '{}',
  portal_settings JSONB DEFAULT '{}',
  footer_settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_white_label_org ON white_label_configs(org_id);

-- Preview Tokens
CREATE TABLE IF NOT EXISTS preview_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(255) NOT NULL UNIQUE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_preview_tokens_token ON preview_tokens(token);

-- ============================================================================
-- PHASE 46: PUBLIC API TABLES
-- ============================================================================

-- API Keys
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(20) NOT NULL,
  key_hash VARCHAR(64) NOT NULL,
  scopes JSONB DEFAULT '[]',
  rate_limit INT DEFAULT 1000,
  rate_limit_window INT DEFAULT 3600,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES team_members(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_keys_org ON api_keys(org_id);
CREATE INDEX idx_api_keys_prefix_hash ON api_keys(key_prefix, key_hash);

-- API Requests (for logging)
CREATE TABLE IF NOT EXISTS api_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  method VARCHAR(10) NOT NULL,
  endpoint VARCHAR(500) NOT NULL,
  status_code INT NOT NULL,
  response_time INT NOT NULL, -- milliseconds
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  request_body JSONB,
  response_body JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_requests_org ON api_requests(org_id);
CREATE INDEX idx_api_requests_key ON api_requests(api_key_id);
CREATE INDEX idx_api_requests_time ON api_requests(created_at DESC);

-- Partition api_requests by month for performance
-- CREATE TABLE api_requests_y2026m01 PARTITION OF api_requests
--   FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- ============================================================================
-- PHASE 47: INTEGRATIONS TABLES
-- ============================================================================

-- Integrations
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  config JSONB DEFAULT '{}',
  credentials JSONB, -- Encrypted
  last_sync_at TIMESTAMPTZ,
  sync_status VARCHAR(20) DEFAULT 'idle',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_integrations_org ON integrations(org_id);
CREATE INDEX idx_integrations_provider ON integrations(provider);
CREATE UNIQUE INDEX idx_integrations_org_provider ON integrations(org_id, provider);

-- Webhook Endpoints
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  url VARCHAR(2000) NOT NULL,
  events JSONB DEFAULT '[]',
  secret VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  failure_count INT DEFAULT 0,
  last_delivery_at TIMESTAMPTZ,
  last_delivery_status INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_endpoints_org ON webhook_endpoints(org_id);

-- Webhook Deliveries
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  response_status INT,
  response_body TEXT,
  delivered_at TIMESTAMPTZ,
  attempts INT DEFAULT 1,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhook_deliveries_endpoint ON webhook_deliveries(endpoint_id);
CREATE INDEX idx_webhook_deliveries_retry ON webhook_deliveries(next_retry_at) WHERE next_retry_at IS NOT NULL;

-- Zapier Webhooks
CREATE TABLE IF NOT EXISTS zapier_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  zap_id VARCHAR(255) NOT NULL,
  trigger_event VARCHAR(50) NOT NULL,
  webhook_url VARCHAR(2000) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_zapier_webhooks_org ON zapier_webhooks(org_id);
CREATE INDEX idx_zapier_webhooks_event ON zapier_webhooks(trigger_event);

-- Integration Mappings (for syncing external IDs)
CREATE TABLE IF NOT EXISTS integration_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  local_type VARCHAR(50) NOT NULL,
  local_id UUID NOT NULL,
  external_id VARCHAR(255) NOT NULL,
  metadata JSONB DEFAULT '{}',
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_integration_mappings_unique ON integration_mappings(integration_id, local_type, local_id);
CREATE INDEX idx_integration_mappings_external ON integration_mappings(integration_id, external_id);

-- ============================================================================
-- PHASE 48-49: AI PRICING TABLES
-- ============================================================================

-- Pricing Models
CREATE TABLE IF NOT EXISTS pricing_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  base_price DECIMAL(12,2) NOT NULL,
  variables JSONB DEFAULT '[]',
  rules JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  accuracy DECIMAL(5,2) DEFAULT 0,
  last_trained_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pricing_models_org ON pricing_models(org_id);
CREATE INDEX idx_pricing_models_service ON pricing_models(service_type);

-- Pricing Predictions (for ML feedback loop)
CREATE TABLE IF NOT EXISTS pricing_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  service_type VARCHAR(100) NOT NULL,
  input_features JSONB NOT NULL,
  predicted_price DECIMAL(12,2) NOT NULL,
  recommended_price DECIMAL(12,2) NOT NULL,
  actual_price DECIMAL(12,2),
  outcome VARCHAR(20), -- won, lost, pending
  confidence DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pricing_predictions_org ON pricing_predictions(org_id);
CREATE INDEX idx_pricing_predictions_outcome ON pricing_predictions(outcome);

-- Market Data (for competitive analysis)
CREATE TABLE IF NOT EXISTS market_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type VARCHAR(100) NOT NULL,
  region VARCHAR(100) NOT NULL,
  avg_price DECIMAL(12,2) NOT NULL,
  price_min DECIMAL(12,2),
  price_max DECIMAL(12,2),
  demand_level VARCHAR(20),
  competitor_count INT,
  data_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_market_data_service_region ON market_data(service_type, region);
CREATE INDEX idx_market_data_date ON market_data(data_date DESC);

-- ============================================================================
-- PHASE 50: FINAL OPTIMIZATIONS & INDEXES
-- ============================================================================

-- Ensure all foreign keys have indexes
CREATE INDEX IF NOT EXISTS idx_proposals_client ON proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_proposals_org ON proposals(org_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_created ON proposals(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(org_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_engagement ON clients(engagement_score);

CREATE INDEX IF NOT EXISTS idx_payments_proposal ON payments(proposal_id);
CREATE INDEX IF NOT EXISTS idx_payments_org ON payments(org_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_clients_search ON clients USING gin(to_tsvector('english', name || ' ' || COALESCE(email, '') || ' ' || COALESCE(company, '')));
CREATE INDEX IF NOT EXISTS idx_proposals_search ON proposals USING gin(to_tsvector('english', COALESCE(proposal_number, '') || ' ' || COALESCE(title, '')));

-- Statistics for query planner
ANALYZE clients;
ANALYZE proposals;
ANALYZE payments;
ANALYZE client_activities;
ANALYZE api_requests;

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Client Dashboard View
CREATE OR REPLACE VIEW client_dashboard_view AS
SELECT 
  c.id,
  c.org_id,
  c.name,
  c.email,
  c.engagement_score,
  c.risk_level,
  c.lifetime_value,
  COUNT(p.id) AS total_proposals,
  COUNT(CASE WHEN p.status = 'signed' THEN 1 END) AS won_proposals,
  COUNT(CASE WHEN p.status = 'rejected' THEN 1 END) AS lost_proposals,
  COALESCE(SUM(CASE WHEN p.status = 'signed' THEN p.total_amount END), 0) AS total_revenue,
  MAX(p.created_at) AS last_proposal_at
FROM clients c
LEFT JOIN proposals p ON p.client_id = c.id
GROUP BY c.id;

-- Pipeline Summary View
CREATE OR REPLACE VIEW pipeline_summary_view AS
SELECT 
  p.org_id,
  ps.name AS stage_name,
  ps.probability,
  COUNT(p.id) AS deal_count,
  COALESCE(SUM(p.total_amount), 0) AS total_value,
  COALESCE(SUM(p.total_amount * ps.probability / 100), 0) AS weighted_value
FROM proposals p
JOIN pipeline_stages ps ON p.stage_id = ps.id
WHERE p.status IN ('draft', 'sent', 'viewed')
GROUP BY p.org_id, ps.name, ps.probability, ps.sort_order
ORDER BY ps.sort_order;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE client_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;

-- Create policies (example for client_activities)
CREATE POLICY "org_isolation_client_activities" ON client_activities
  FOR ALL USING (org_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "org_isolation_tasks" ON tasks
  FOR ALL USING (org_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "org_isolation_signature_requests" ON signature_requests
  FOR ALL USING (org_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "org_isolation_api_keys" ON api_keys
  FOR ALL USING (org_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY "org_isolation_integrations" ON integrations
  FOR ALL USING (org_id = current_setting('app.current_org_id')::uuid);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT table_name FROM information_schema.columns 
    WHERE column_name = 'updated_at' 
    AND table_schema = 'public'
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%s_updated_at ON %s;
      CREATE TRIGGER update_%s_updated_at
        BEFORE UPDATE ON %s
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ', t, t, t, t);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Calculate weighted value on proposal update
CREATE OR REPLACE FUNCTION calculate_weighted_value()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stage_id IS NOT NULL THEN
    SELECT (NEW.total_amount * ps.probability / 100)
    INTO NEW.weighted_value
    FROM pipeline_stages ps
    WHERE ps.id = NEW.stage_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calc_weighted_value
  BEFORE INSERT OR UPDATE OF stage_id, total_amount ON proposals
  FOR EACH ROW EXECUTE FUNCTION calculate_weighted_value();

-- ============================================================================
-- SEED DATA FOR NEW ORGS
-- ============================================================================

-- Function to initialize new org with default data
CREATE OR REPLACE FUNCTION initialize_org_defaults(p_org_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Copy default pipeline stages
  INSERT INTO pipeline_stages (org_id, name, probability, sort_order)
  SELECT p_org_id, name, probability, sort_order
  FROM pipeline_stages
  WHERE org_id = '00000000-0000-0000-0000-000000000000';
  
  -- Create default client segments
  INSERT INTO client_segments (org_id, name, description, criteria, color)
  VALUES
    (p_org_id, 'VIP', 'High-value clients with LTV > $50K', '[{"field":"lifetime_value","operator":"greater_than","value":50000}]', '#C41E3A'),
    (p_org_id, 'Regular', 'Clients with LTV $10K-$50K', '[{"field":"lifetime_value","operator":"greater_than","value":10000}]', '#3B82F6'),
    (p_org_id, 'New', 'Clients with LTV < $10K', '[{"field":"lifetime_value","operator":"less_than","value":10000}]', '#10B981'),
    (p_org_id, 'At Risk', 'Low engagement clients', '[{"field":"engagement_score","operator":"less_than","value":40}]', '#F59E0B');
    
  -- Create default white label config
  INSERT INTO white_label_configs (org_id, is_enabled, branding)
  VALUES (p_org_id, FALSE, '{}');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SCHEMA VERSION
-- ============================================================================

CREATE TABLE IF NOT EXISTS schema_versions (
  version INT PRIMARY KEY,
  description TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO schema_versions (version, description) VALUES
  (50, 'Phases 41-50: Complete SaaS Platform Schema')
ON CONFLICT (version) DO NOTHING;
