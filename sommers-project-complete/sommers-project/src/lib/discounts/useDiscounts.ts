/**
 * Sommer's Proposal System - Discount Hooks
 * React hooks for easy discount system integration
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  discountEngine,
  discountCodesService,
  loyaltyService,
  seasonalDiscountService,
  discountApprovalService,
  autoDiscountService,
  volumeDiscountService,
} from './discountService';
import type {
  DiscountContext,
  DiscountCalculationResult,
  ValidateCodeResult,
  CustomerLoyalty,
  ActiveSeasonalDiscount,
  DiscountApprovalRequest,
  DiscountCode,
  AutoDiscountRule,
  VolumeDiscountTier,
  SeasonalDiscount,
  LoyaltyProgram,
} from './discountTypes';

// ============================================================================
// MAIN DISCOUNT HOOK
// ============================================================================

interface UseDiscountsOptions {
  subtotal: number;
  services: DiscountContext['services'];
  tier?: 'economy' | 'standard' | 'premium';
  clientId?: string;
  clientEmail?: string;
  isNewCustomer?: boolean;
  promoCode?: string;
  manualDiscountPercent?: number;
  manualDiscountAmount?: number;
  autoCalculate?: boolean;
}

interface UseDiscountsReturn {
  result: DiscountCalculationResult | null;
  isLoading: boolean;
  error: string | null;
  calculate: () => Promise<void>;
  applyPromoCode: (code: string) => Promise<ValidateCodeResult>;
  removePromoCode: () => void;
  setManualDiscount: (type: 'percent' | 'amount', value: number) => void;
  clearManualDiscount: () => void;
  appliedPromoCode: ValidateCodeResult | null;
  seasonalDiscounts: ActiveSeasonalDiscount[];
  customerLoyalty: CustomerLoyalty | null;
}

export function useDiscounts(options: UseDiscountsOptions): UseDiscountsReturn {
  const { orgId, user } = useAuth();
  const [result, setResult] = useState<DiscountCalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedPromoCode, setAppliedPromoCode] = useState<ValidateCodeResult | null>(null);
  const [manualDiscount, setManualDiscountState] = useState<{
    type: 'percent' | 'amount';
    value: number;
  } | null>(null);
  const [seasonalDiscounts, setSeasonalDiscounts] = useState<ActiveSeasonalDiscount[]>([]);
  const [customerLoyalty, setCustomerLoyalty] = useState<CustomerLoyalty | null>(null);

  // Build context from options
  const context: DiscountContext = useMemo(
    () => ({
      orgId: orgId || '',
      subtotal: options.subtotal,
      services: options.services,
      tier: options.tier || 'standard',
      clientId: options.clientId,
      clientEmail: options.clientEmail,
      isNewCustomer: options.isNewCustomer ?? true,
      promoCode: appliedPromoCode?.code || options.promoCode,
      manualDiscountPercent:
        manualDiscount?.type === 'percent'
          ? manualDiscount.value
          : options.manualDiscountPercent,
      manualDiscountAmount:
        manualDiscount?.type === 'amount'
          ? manualDiscount.value
          : options.manualDiscountAmount,
      userId: user?.id || '',
      userRole: user?.role || 'sales',
    }),
    [
      orgId,
      options,
      appliedPromoCode,
      manualDiscount,
      user,
    ]
  );

  // Calculate discounts
  const calculate = useCallback(async () => {
    if (!orgId) return;

    setIsLoading(true);
    setError(null);

    try {
      const calculationResult = await discountEngine.calculate(context);
      setResult(calculationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate discounts');
    } finally {
      setIsLoading(false);
    }
  }, [orgId, context]);

  // Apply promo code
  const applyPromoCode = useCallback(
    async (code: string): Promise<ValidateCodeResult> => {
      if (!orgId) {
        return { valid: false, error: 'Organization not found' };
      }

      try {
        const result = await discountCodesService.validate(
          orgId,
          code,
          options.clientId,
          options.clientEmail,
          options.subtotal
        );

        if (result.valid) {
          setAppliedPromoCode(result);
        }

        return result;
      } catch (err) {
        return { valid: false, error: 'Failed to validate code' };
      }
    },
    [orgId, options.clientId, options.clientEmail, options.subtotal]
  );

  // Remove promo code
  const removePromoCode = useCallback(() => {
    setAppliedPromoCode(null);
  }, []);

  // Set manual discount
  const setManualDiscount = useCallback((type: 'percent' | 'amount', value: number) => {
    setManualDiscountState({ type, value });
  }, []);

  // Clear manual discount
  const clearManualDiscount = useCallback(() => {
    setManualDiscountState(null);
  }, []);

  // Load seasonal discounts and loyalty
  useEffect(() => {
    if (!orgId) return;

    const loadExtras = async () => {
      try {
        const [seasonal, loyalty] = await Promise.all([
          seasonalDiscountService.getActive(orgId),
          options.clientId
            ? loyaltyService.getCustomerLoyalty(orgId, options.clientId)
            : Promise.resolve(null),
        ]);

        setSeasonalDiscounts(seasonal);
        setCustomerLoyalty(loyalty);
      } catch (err) {
        console.error('Error loading discount extras:', err);
      }
    };

    loadExtras();
  }, [orgId, options.clientId]);

  // Auto-calculate when dependencies change
  useEffect(() => {
    if (options.autoCalculate !== false) {
      calculate();
    }
  }, [calculate, options.autoCalculate]);

  return {
    result,
    isLoading,
    error,
    calculate,
    applyPromoCode,
    removePromoCode,
    setManualDiscount,
    clearManualDiscount,
    appliedPromoCode,
    seasonalDiscounts,
    customerLoyalty,
  };
}

// ============================================================================
// PROMO CODE HOOK
// ============================================================================

interface UsePromoCodeReturn {
  codes: DiscountCode[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (input: Parameters<typeof discountCodesService.create>[1]) => Promise<DiscountCode>;
  update: (id: string, updates: Parameters<typeof discountCodesService.update>[1]) => Promise<DiscountCode>;
  deactivate: (id: string) => Promise<void>;
  validate: (code: string, orderAmount: number, clientId?: string, clientEmail?: string) => Promise<ValidateCodeResult>;
}

export function usePromoCode(): UsePromoCodeReturn {
  const { orgId } = useAuth();
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!orgId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await discountCodesService.list(orgId, true);
      setCodes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load discount codes');
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(
    async (input: Parameters<typeof discountCodesService.create>[1]) => {
      if (!orgId) throw new Error('Organization not found');
      const code = await discountCodesService.create(orgId, input);
      setCodes((prev) => [code, ...prev]);
      return code;
    },
    [orgId]
  );

  const update = useCallback(
    async (id: string, updates: Parameters<typeof discountCodesService.update>[1]) => {
      const updated = await discountCodesService.update(id, updates);
      setCodes((prev) => prev.map((c) => (c.id === id ? updated : c)));
      return updated;
    },
    []
  );

  const deactivate = useCallback(async (id: string) => {
    await discountCodesService.deactivate(id);
    setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: false } : c)));
  }, []);

  const validate = useCallback(
    async (code: string, orderAmount: number, clientId?: string, clientEmail?: string) => {
      if (!orgId) return { valid: false, error: 'Organization not found' };
      return discountCodesService.validate(orgId, code, clientId, clientEmail, orderAmount);
    },
    [orgId]
  );

  return {
    codes,
    isLoading,
    error,
    refresh,
    create,
    update,
    deactivate,
    validate,
  };
}

// ============================================================================
// LOYALTY HOOK
// ============================================================================

interface UseLoyaltyReturn {
  program: LoyaltyProgram | null;
  customerLoyalty: CustomerLoyalty | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  enrollCustomer: (clientId: string, referralCode?: string) => Promise<CustomerLoyalty>;
  earnPoints: (input: Parameters<typeof loyaltyService.earnPoints>[1]) => Promise<void>;
  redeemPoints: (input: Parameters<typeof loyaltyService.redeemPoints>[1]) => Promise<{ discountAmount: number }>;
  getTransactionHistory: (loyaltyId: string) => Promise<ReturnType<typeof loyaltyService.getTransactionHistory>>;
}

export function useLoyalty(clientId?: string): UseLoyaltyReturn {
  const { orgId } = useAuth();
  const [program, setProgram] = useState<LoyaltyProgram | null>(null);
  const [customerLoyalty, setCustomerLoyalty] = useState<CustomerLoyalty | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!orgId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [programData, loyaltyData] = await Promise.all([
        loyaltyService.getProgram(orgId),
        clientId ? loyaltyService.getCustomerLoyalty(orgId, clientId) : Promise.resolve(null),
      ]);

      setProgram(programData);
      setCustomerLoyalty(loyaltyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load loyalty data');
    } finally {
      setIsLoading(false);
    }
  }, [orgId, clientId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const enrollCustomer = useCallback(
    async (clientId: string, referralCode?: string) => {
      if (!orgId) throw new Error('Organization not found');
      const loyalty = await loyaltyService.enrollCustomer(orgId, clientId, referralCode);
      setCustomerLoyalty(loyalty);
      return loyalty;
    },
    [orgId]
  );

  const earnPoints = useCallback(
    async (input: Parameters<typeof loyaltyService.earnPoints>[1]) => {
      if (!orgId) throw new Error('Organization not found');
      await loyaltyService.earnPoints(orgId, input);
      await refresh();
    },
    [orgId, refresh]
  );

  const redeemPoints = useCallback(
    async (input: Parameters<typeof loyaltyService.redeemPoints>[1]) => {
      if (!orgId) throw new Error('Organization not found');
      const result = await loyaltyService.redeemPoints(orgId, input);
      await refresh();
      return result;
    },
    [orgId, refresh]
  );

  const getTransactionHistory = useCallback(
    async (loyaltyId: string) => {
      return loyaltyService.getTransactionHistory(loyaltyId);
    },
    []
  );

  return {
    program,
    customerLoyalty,
    isLoading,
    error,
    refresh,
    enrollCustomer,
    earnPoints,
    redeemPoints,
    getTransactionHistory,
  };
}

// ============================================================================
// DISCOUNT APPROVALS HOOK
// ============================================================================

interface UseDiscountApprovalsReturn {
  pendingRequests: DiscountApprovalRequest[];
  settings: ReturnType<typeof discountApprovalService.getSettings> extends Promise<infer T> ? T : never;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  checkApprovalRequired: (
    discountPercent: number,
    discountAmount: number,
    orderTotal: number
  ) => Promise<{ required: boolean; reason?: string }>;
  createRequest: (input: Parameters<typeof discountApprovalService.createRequest>[1]) => Promise<DiscountApprovalRequest>;
  review: (input: Parameters<typeof discountApprovalService.review>[0]) => Promise<DiscountApprovalRequest>;
}

export function useDiscountApprovals(): UseDiscountApprovalsReturn {
  const { orgId, user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<DiscountApprovalRequest[]>([]);
  const [settings, setSettings] = useState<Awaited<ReturnType<typeof discountApprovalService.getSettings>>>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!orgId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [requests, settingsData] = await Promise.all([
        discountApprovalService.getPendingRequests(orgId),
        discountApprovalService.getSettings(orgId),
      ]);

      setPendingRequests(requests);
      setSettings(settingsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load approval data');
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const checkApprovalRequired = useCallback(
    async (discountPercent: number, discountAmount: number, orderTotal: number) => {
      if (!orgId || !user) return { required: false };
      return discountApprovalService.checkApprovalRequired(
        orgId,
        discountPercent,
        discountAmount,
        orderTotal,
        user.role || 'sales'
      );
    },
    [orgId, user]
  );

  const createRequest = useCallback(
    async (input: Parameters<typeof discountApprovalService.createRequest>[1]) => {
      if (!orgId || !user) throw new Error('Not authenticated');
      const request = await discountApprovalService.createRequest(orgId, input, user.id);
      setPendingRequests((prev) => [request, ...prev]);
      return request;
    },
    [orgId, user]
  );

  const review = useCallback(
    async (input: Parameters<typeof discountApprovalService.review>[0]) => {
      if (!user) throw new Error('Not authenticated');
      const updated = await discountApprovalService.review(input, user.id);
      setPendingRequests((prev) => prev.filter((r) => r.id !== input.requestId));
      return updated;
    },
    [user]
  );

  return {
    pendingRequests,
    settings,
    isLoading,
    error,
    refresh,
    checkApprovalRequired,
    createRequest,
    review,
  };
}

// ============================================================================
// ADMIN HOOKS
// ============================================================================

export function useAutoDiscountRules() {
  const { orgId } = useAuth();
  const [rules, setRules] = useState<AutoDiscountRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    try {
      const data = await autoDiscountService.list(orgId, false);
      setRules(data);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { rules, isLoading, refresh };
}

export function useVolumeDiscounts() {
  const { orgId } = useAuth();
  const [tiers, setTiers] = useState<VolumeDiscountTier[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    try {
      const data = await volumeDiscountService.list(orgId);
      setTiers(data);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { tiers, isLoading, refresh };
}

export function useSeasonalDiscounts() {
  const { orgId } = useAuth();
  const [discounts, setDiscounts] = useState<SeasonalDiscount[]>([]);
  const [activeDiscounts, setActiveDiscounts] = useState<ActiveSeasonalDiscount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    try {
      const [all, active] = await Promise.all([
        seasonalDiscountService.list(orgId, false),
        seasonalDiscountService.getActive(orgId),
      ]);
      setDiscounts(all);
      setActiveDiscounts(active);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { discounts, activeDiscounts, isLoading, refresh };
}
