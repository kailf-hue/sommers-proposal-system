-- ============================================================================
-- SOMMER'S PROPOSAL SYSTEM - ADVANCED DISCOUNT SYSTEM
-- ============================================================================
-- Features:
-- 1. Discount Codes (promo codes)
-- 2. Automatic Discounts (rule-based)
-- 3. Loyalty Discounts (repeat customers)
-- 4. Bulk/Volume Discounts (tiered)
-- 5. Seasonal Discounts (time-limited)
-- 6. Discount Approval Workflow
-- ============================================================================

-- ============================================================================
-- DISCOUNT CODES TABLE (Promo Codes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Code Details
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Discount Value
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  max_discount_amount DECIMAL(10,2), -- Cap for percentage discounts
  
  -- Restrictions
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_uses_total INTEGER, -- NULL = unlimited
  max_uses_per_customer INTEGER DEFAULT 1,
  
  -- Applicable Services (NULL = all services)
  applicable_services TEXT[], -- Array of service types
  applicable_tiers TEXT[], -- Array of tiers: economy, standard, premium
  
  -- Customer Restrictions
  new_customers_only BOOLEAN DEFAULT false,
  existing_customers_only BOOLEAN DEFAULT false,
  specific_customer_ids UUID[], -- Specific customers only
  
  -- Validity Period
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Tracking
  times_used INTEGER DEFAULT 0,
  total_discount_given DECIMAL(12,2) DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique code per org
  UNIQUE(org_id, code)
);

CREATE INDEX idx_discount_codes_org ON discount_codes(org_id);
CREATE INDEX idx_discount_codes_code ON discount_codes(code);
CREATE INDEX idx_discount_codes_active ON discount_codes(is_active, starts_at, expires_at);

-- ============================================================================
-- DISCOUNT CODE USAGE TABLE (Track redemptions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS discount_code_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  discount_code_id UUID REFERENCES discount_codes(id) ON DELETE CASCADE,
  
  -- Usage Details
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
  client_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  client_email VARCHAR(255),
  
  -- Discount Applied
  order_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  
  -- Metadata
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  applied_by UUID REFERENCES users(id)
);

CREATE INDEX idx_discount_usage_code ON discount_code_usage(discount_code_id);
CREATE INDEX idx_discount_usage_client ON discount_code_usage(client_id);
CREATE INDEX idx_discount_usage_email ON discount_code_usage(client_email);

-- ============================================================================
-- AUTOMATIC DISCOUNT RULES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS automatic_discount_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Rule Details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 0, -- Higher = applied first
  
  -- Rule Type
  rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN (
    'order_minimum',      -- Orders over $X
    'service_quantity',   -- X+ sqft of sealcoating
    'service_combo',      -- Multiple services together
    'first_order',        -- First-time customer
    'repeat_customer',    -- Returning customer
    'referral',           -- Referred by existing customer
    'seasonal',           -- Date-based
    'day_of_week',        -- Specific days
    'bulk_volume'         -- Tiered volume pricing
  )),
  
  -- Conditions (JSONB for flexibility)
  conditions JSONB NOT NULL DEFAULT '{}',
  /*
  Examples:
  order_minimum: { "min_amount": 5000 }
  service_quantity: { "service": "sealcoating", "min_sqft": 10000 }
  service_combo: { "required_services": ["sealcoating", "crack_filling"] }
  seasonal: { "start_month": 3, "end_month": 5 } // March-May
  day_of_week: { "days": [1, 2, 3] } // Mon-Wed
  bulk_volume: { "tiers": [{"min": 5000, "discount": 5}, {"min": 10000, "discount": 10}] }
  */
  
  -- Discount Value
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  max_discount_amount DECIMAL(10,2),
  
  -- Stacking Rules
  stackable BOOLEAN DEFAULT false, -- Can combine with other discounts
  stack_with_codes BOOLEAN DEFAULT true, -- Can combine with promo codes
  
  -- Validity
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  
  -- Tracking
  times_applied INTEGER DEFAULT 0,
  total_discount_given DECIMAL(12,2) DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_auto_rules_org ON automatic_discount_rules(org_id);
CREATE INDEX idx_auto_rules_active ON automatic_discount_rules(is_active, priority);
CREATE INDEX idx_auto_rules_type ON automatic_discount_rules(rule_type);

-- ============================================================================
-- LOYALTY PROGRAM TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS loyalty_program (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Program Settings
  name VARCHAR(255) NOT NULL DEFAULT 'Loyalty Rewards',
  is_active BOOLEAN DEFAULT true,
  
  -- Points System
  points_per_dollar DECIMAL(5,2) DEFAULT 1.0, -- 1 point per $1 spent
  points_for_signup INTEGER DEFAULT 0,
  points_for_referral INTEGER DEFAULT 500,
  
  -- Redemption
  points_to_dollar_ratio DECIMAL(10,4) DEFAULT 0.01, -- 100 points = $1
  min_points_to_redeem INTEGER DEFAULT 500,
  max_redemption_percent DECIMAL(5,2) DEFAULT 50, -- Max 50% of order
  
  -- Tiers (JSONB array)
  tiers JSONB DEFAULT '[
    {"name": "Bronze", "min_points": 0, "discount_percent": 0, "perks": []},
    {"name": "Silver", "min_points": 1000, "discount_percent": 5, "perks": ["priority_scheduling"]},
    {"name": "Gold", "min_points": 5000, "discount_percent": 10, "perks": ["priority_scheduling", "free_inspection"]},
    {"name": "Platinum", "min_points": 10000, "discount_percent": 15, "perks": ["priority_scheduling", "free_inspection", "dedicated_rep"]}
  ]',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id)
);

-- ============================================================================
-- CUSTOMER LOYALTY TABLE (Per-customer loyalty data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS customer_loyalty (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  
  -- Points
  total_points_earned INTEGER DEFAULT 0,
  total_points_redeemed INTEGER DEFAULT 0,
  current_points INTEGER DEFAULT 0,
  
  -- Lifetime Stats
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,
  first_order_date TIMESTAMPTZ,
  last_order_date TIMESTAMPTZ,
  
  -- Current Tier (computed or cached)
  current_tier VARCHAR(50) DEFAULT 'Bronze',
  tier_discount_percent DECIMAL(5,2) DEFAULT 0,
  
  -- Referral
  referred_by UUID REFERENCES contacts(id),
  referral_code VARCHAR(20) UNIQUE,
  referrals_count INTEGER DEFAULT 0,
  
  -- Metadata
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, client_id)
);

CREATE INDEX idx_customer_loyalty_client ON customer_loyalty(client_id);
CREATE INDEX idx_customer_loyalty_tier ON customer_loyalty(current_tier);
CREATE INDEX idx_customer_loyalty_referral ON customer_loyalty(referral_code);

-- ============================================================================
-- LOYALTY TRANSACTIONS TABLE (Point history)
-- ============================================================================
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  customer_loyalty_id UUID REFERENCES customer_loyalty(id) ON DELETE CASCADE,
  
  -- Transaction Type
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'earn_purchase',    -- Earned from purchase
    'earn_signup',      -- Signup bonus
    'earn_referral',    -- Referral bonus
    'earn_bonus',       -- Manual bonus
    'redeem',           -- Redeemed for discount
    'expire',           -- Points expired
    'adjust'            -- Manual adjustment
  )),
  
  -- Points
  points INTEGER NOT NULL, -- Positive for earn, negative for redeem/expire
  balance_after INTEGER NOT NULL,
  
  -- Reference
  proposal_id UUID REFERENCES proposals(id),
  description TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_loyalty_tx_customer ON loyalty_transactions(customer_loyalty_id);
CREATE INDEX idx_loyalty_tx_type ON loyalty_transactions(type);

-- ============================================================================
-- BULK/VOLUME DISCOUNT TIERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS volume_discount_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Tier Details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Measurement Type
  measurement_type VARCHAR(50) NOT NULL CHECK (measurement_type IN (
    'total_sqft',       -- Total square footage
    'total_amount',     -- Total order amount
    'service_quantity', -- Quantity of specific service
    'annual_volume'     -- Annual spending
  )),
  
  -- Service Filter (NULL = all)
  service_type VARCHAR(50),
  
  -- Tiers (JSONB array)
  tiers JSONB NOT NULL DEFAULT '[]',
  /*
  Example:
  [
    {"min": 1000, "max": 4999, "discount_percent": 0, "discount_fixed": 0},
    {"min": 5000, "max": 9999, "discount_percent": 5, "discount_fixed": 0},
    {"min": 10000, "max": 24999, "discount_percent": 10, "discount_fixed": 0},
    {"min": 25000, "max": 49999, "discount_percent": 15, "discount_fixed": 0},
    {"min": 50000, "max": null, "discount_percent": 20, "discount_fixed": 0}
  ]
  */
  
  -- Stacking
  stackable BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_volume_tiers_org ON volume_discount_tiers(org_id);
CREATE INDEX idx_volume_tiers_active ON volume_discount_tiers(is_active);

-- ============================================================================
-- SEASONAL DISCOUNTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS seasonal_discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Campaign Details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  banner_text VARCHAR(500), -- "Spring Special! 15% off all services"
  banner_color VARCHAR(20) DEFAULT '#22C55E',
  
  -- Schedule
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Recurrence (for annual campaigns)
  is_recurring BOOLEAN DEFAULT false,
  recurrence_type VARCHAR(20) CHECK (recurrence_type IN ('yearly', 'monthly', 'weekly')),
  
  -- Discount
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  max_discount_amount DECIMAL(10,2),
  
  -- Restrictions
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  applicable_services TEXT[],
  
  -- Marketing
  promo_code VARCHAR(50), -- Optional associated code
  show_countdown BOOLEAN DEFAULT true,
  show_banner BOOLEAN DEFAULT true,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Tracking
  views INTEGER DEFAULT 0,
  times_applied INTEGER DEFAULT 0,
  total_discount_given DECIMAL(12,2) DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_seasonal_org ON seasonal_discounts(org_id);
CREATE INDEX idx_seasonal_dates ON seasonal_discounts(starts_at, expires_at);
CREATE INDEX idx_seasonal_active ON seasonal_discounts(is_active);

-- ============================================================================
-- DISCOUNT APPROVAL WORKFLOW TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS discount_approval_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Approval Thresholds
  require_approval BOOLEAN DEFAULT true,
  
  -- By Discount Percent
  approval_threshold_percent DECIMAL(5,2) DEFAULT 15, -- Require approval for >15%
  
  -- By Discount Amount
  approval_threshold_amount DECIMAL(10,2) DEFAULT 500, -- Require approval for >$500
  
  -- By Order Value
  approval_for_orders_over DECIMAL(10,2), -- Require approval for large orders
  
  -- Role-based Limits (JSONB)
  role_limits JSONB DEFAULT '{
    "sales": {"max_percent": 10, "max_amount": 200},
    "manager": {"max_percent": 25, "max_amount": 1000},
    "admin": {"max_percent": 50, "max_amount": 5000},
    "owner": {"max_percent": 100, "max_amount": null}
  }',
  
  -- Approval Chain
  default_approvers UUID[], -- User IDs
  escalation_after_hours INTEGER DEFAULT 24,
  auto_reject_after_hours INTEGER DEFAULT 72,
  
  -- Notifications
  notify_on_request BOOLEAN DEFAULT true,
  notify_on_approval BOOLEAN DEFAULT true,
  notify_on_rejection BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id)
);

-- ============================================================================
-- DISCOUNT APPROVAL REQUESTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS discount_approval_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Proposal Reference
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  proposal_number VARCHAR(50),
  proposal_total DECIMAL(12,2),
  
  -- Requester
  requested_by UUID REFERENCES users(id),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Discount Details
  discount_type VARCHAR(20) NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL, -- Calculated amount
  discount_percent_of_total DECIMAL(5,2), -- As % of proposal total
  
  -- Justification
  reason TEXT NOT NULL,
  supporting_notes TEXT,
  
  -- Client Context
  client_name VARCHAR(255),
  client_id UUID REFERENCES contacts(id),
  is_repeat_customer BOOLEAN DEFAULT false,
  client_lifetime_value DECIMAL(12,2),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'expired', 'cancelled'
  )),
  
  -- Approval Details
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  
  -- Counter-offer (if partially approved)
  counter_discount_type VARCHAR(20),
  counter_discount_value DECIMAL(10,2),
  
  -- Escalation
  escalated BOOLEAN DEFAULT false,
  escalated_at TIMESTAMPTZ,
  escalated_to UUID REFERENCES users(id),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_approval_requests_org ON discount_approval_requests(org_id);
CREATE INDEX idx_approval_requests_status ON discount_approval_requests(status);
CREATE INDEX idx_approval_requests_requester ON discount_approval_requests(requested_by);
CREATE INDEX idx_approval_requests_proposal ON discount_approval_requests(proposal_id);

-- ============================================================================
-- APPLIED DISCOUNTS TABLE (Track all discounts on proposals)
-- ============================================================================
CREATE TABLE IF NOT EXISTS applied_discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  
  -- Discount Source
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN (
    'manual',           -- Manually entered
    'promo_code',       -- Discount code
    'automatic_rule',   -- Auto-applied rule
    'loyalty',          -- Loyalty program
    'volume',           -- Volume/bulk discount
    'seasonal',         -- Seasonal campaign
    'referral'          -- Referral discount
  )),
  source_id UUID, -- Reference to source table
  source_name VARCHAR(255),
  
  -- Discount Details
  discount_type VARCHAR(20) NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL, -- Actual $ amount
  
  -- Order at time of application
  order_position INTEGER DEFAULT 1, -- For stacked discounts
  applied_to_subtotal DECIMAL(12,2),
  
  -- Approval (if required)
  required_approval BOOLEAN DEFAULT false,
  approval_request_id UUID REFERENCES discount_approval_requests(id),
  approval_status VARCHAR(20),
  
  -- Metadata
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  applied_by UUID REFERENCES users(id)
);

CREATE INDEX idx_applied_discounts_proposal ON applied_discounts(proposal_id);
CREATE INDEX idx_applied_discounts_source ON applied_discounts(source_type, source_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE automatic_discount_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_program ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE volume_discount_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonal_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_approval_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE applied_discounts ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (org-based access)
CREATE POLICY "org_access" ON discount_codes FOR ALL USING (true);
CREATE POLICY "org_access" ON discount_code_usage FOR ALL USING (true);
CREATE POLICY "org_access" ON automatic_discount_rules FOR ALL USING (true);
CREATE POLICY "org_access" ON loyalty_program FOR ALL USING (true);
CREATE POLICY "org_access" ON customer_loyalty FOR ALL USING (true);
CREATE POLICY "org_access" ON loyalty_transactions FOR ALL USING (true);
CREATE POLICY "org_access" ON volume_discount_tiers FOR ALL USING (true);
CREATE POLICY "org_access" ON seasonal_discounts FOR ALL USING (true);
CREATE POLICY "org_access" ON discount_approval_settings FOR ALL USING (true);
CREATE POLICY "org_access" ON discount_approval_requests FOR ALL USING (true);
CREATE POLICY "org_access" ON applied_discounts FOR ALL USING (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to validate and apply a discount code
CREATE OR REPLACE FUNCTION validate_discount_code(
  p_org_id UUID,
  p_code VARCHAR,
  p_client_id UUID,
  p_client_email VARCHAR,
  p_order_amount DECIMAL
) RETURNS JSONB AS $$
DECLARE
  v_discount discount_codes%ROWTYPE;
  v_usage_count INTEGER;
  v_customer_usage INTEGER;
  v_result JSONB;
BEGIN
  -- Find the code
  SELECT * INTO v_discount
  FROM discount_codes
  WHERE org_id = p_org_id
    AND UPPER(code) = UPPER(p_code)
    AND is_active = true
    AND starts_at <= NOW()
    AND (expires_at IS NULL OR expires_at > NOW());
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid or expired discount code');
  END IF;
  
  -- Check max total uses
  IF v_discount.max_uses_total IS NOT NULL AND v_discount.times_used >= v_discount.max_uses_total THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This discount code has reached its usage limit');
  END IF;
  
  -- Check per-customer usage
  SELECT COUNT(*) INTO v_customer_usage
  FROM discount_code_usage
  WHERE discount_code_id = v_discount.id
    AND (client_id = p_client_id OR client_email = p_client_email);
  
  IF v_discount.max_uses_per_customer IS NOT NULL AND v_customer_usage >= v_discount.max_uses_per_customer THEN
    RETURN jsonb_build_object('valid', false, 'error', 'You have already used this discount code');
  END IF;
  
  -- Check minimum order amount
  IF p_order_amount < v_discount.min_order_amount THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', format('Minimum order of $%s required for this discount', v_discount.min_order_amount)
    );
  END IF;
  
  -- Calculate discount amount
  DECLARE
    v_discount_amount DECIMAL;
  BEGIN
    IF v_discount.discount_type = 'percent' THEN
      v_discount_amount := p_order_amount * (v_discount.discount_value / 100);
      IF v_discount.max_discount_amount IS NOT NULL THEN
        v_discount_amount := LEAST(v_discount_amount, v_discount.max_discount_amount);
      END IF;
    ELSE
      v_discount_amount := LEAST(v_discount.discount_value, p_order_amount);
    END IF;
    
    RETURN jsonb_build_object(
      'valid', true,
      'discount_code_id', v_discount.id,
      'code', v_discount.code,
      'name', v_discount.name,
      'discount_type', v_discount.discount_type,
      'discount_value', v_discount.discount_value,
      'discount_amount', v_discount_amount,
      'description', v_discount.description
    );
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate loyalty tier
CREATE OR REPLACE FUNCTION calculate_loyalty_tier(
  p_org_id UUID,
  p_total_points INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_program loyalty_program%ROWTYPE;
  v_tier JSONB;
  v_result JSONB;
BEGIN
  SELECT * INTO v_program FROM loyalty_program WHERE org_id = p_org_id;
  
  IF NOT FOUND OR NOT v_program.is_active THEN
    RETURN jsonb_build_object('tier', 'None', 'discount_percent', 0);
  END IF;
  
  -- Find matching tier (highest that qualifies)
  SELECT tier INTO v_tier
  FROM jsonb_array_elements(v_program.tiers) AS tier
  WHERE (tier->>'min_points')::INTEGER <= p_total_points
  ORDER BY (tier->>'min_points')::INTEGER DESC
  LIMIT 1;
  
  IF v_tier IS NULL THEN
    v_tier := v_program.tiers->0;
  END IF;
  
  RETURN v_tier;
END;
$$ LANGUAGE plpgsql;

-- Function to get applicable automatic discounts
CREATE OR REPLACE FUNCTION get_applicable_auto_discounts(
  p_org_id UUID,
  p_order_amount DECIMAL,
  p_services JSONB,
  p_client_id UUID,
  p_is_new_customer BOOLEAN
) RETURNS JSONB AS $$
DECLARE
  v_rule automatic_discount_rules%ROWTYPE;
  v_discounts JSONB := '[]'::JSONB;
  v_applies BOOLEAN;
BEGIN
  FOR v_rule IN
    SELECT * FROM automatic_discount_rules
    WHERE org_id = p_org_id
      AND is_active = true
      AND (starts_at IS NULL OR starts_at <= NOW())
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY priority DESC
  LOOP
    v_applies := false;
    
    CASE v_rule.rule_type
      WHEN 'order_minimum' THEN
        v_applies := p_order_amount >= (v_rule.conditions->>'min_amount')::DECIMAL;
        
      WHEN 'first_order' THEN
        v_applies := p_is_new_customer;
        
      WHEN 'repeat_customer' THEN
        v_applies := NOT p_is_new_customer;
        
      WHEN 'seasonal' THEN
        v_applies := EXTRACT(MONTH FROM NOW()) BETWEEN
          (v_rule.conditions->>'start_month')::INTEGER AND
          (v_rule.conditions->>'end_month')::INTEGER;
          
      WHEN 'day_of_week' THEN
        v_applies := EXTRACT(DOW FROM NOW())::TEXT = ANY(
          SELECT jsonb_array_elements_text(v_rule.conditions->'days')
        );
        
      ELSE
        v_applies := false;
    END CASE;
    
    IF v_applies THEN
      v_discounts := v_discounts || jsonb_build_object(
        'rule_id', v_rule.id,
        'name', v_rule.name,
        'discount_type', v_rule.discount_type,
        'discount_value', v_rule.discount_value,
        'max_discount_amount', v_rule.max_discount_amount,
        'stackable', v_rule.stackable
      );
      
      -- If not stackable, return just this discount
      IF NOT v_rule.stackable THEN
        RETURN v_discounts;
      END IF;
    END IF;
  END LOOP;
  
  RETURN v_discounts;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_discount_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_discount_codes_timestamp
  BEFORE UPDATE ON discount_codes
  FOR EACH ROW EXECUTE FUNCTION update_discount_timestamp();

CREATE TRIGGER update_auto_rules_timestamp
  BEFORE UPDATE ON automatic_discount_rules
  FOR EACH ROW EXECUTE FUNCTION update_discount_timestamp();

CREATE TRIGGER update_loyalty_program_timestamp
  BEFORE UPDATE ON loyalty_program
  FOR EACH ROW EXECUTE FUNCTION update_discount_timestamp();

CREATE TRIGGER update_customer_loyalty_timestamp
  BEFORE UPDATE ON customer_loyalty
  FOR EACH ROW EXECUTE FUNCTION update_discount_timestamp();

CREATE TRIGGER update_seasonal_timestamp
  BEFORE UPDATE ON seasonal_discounts
  FOR EACH ROW EXECUTE FUNCTION update_discount_timestamp();

-- ============================================================================
-- SEED DEFAULT DATA
-- ============================================================================

-- Example: Insert default volume discount tiers for sealcoating
-- INSERT INTO volume_discount_tiers (org_id, name, measurement_type, service_type, tiers) VALUES
-- ('your-org-id', 'Sealcoating Volume Discounts', 'total_sqft', 'sealcoating', '[
--   {"min": 0, "max": 4999, "discount_percent": 0},
--   {"min": 5000, "max": 9999, "discount_percent": 5},
--   {"min": 10000, "max": 24999, "discount_percent": 10},
--   {"min": 25000, "max": 49999, "discount_percent": 15},
--   {"min": 50000, "max": null, "discount_percent": 20}
-- ]');
