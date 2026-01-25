/**
 * Sommer's Proposal System - Proposal Store
 * Zustand state management for proposal wizard
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  generateId, 
  generateProposalNumber,
  TIER_MULTIPLIERS,
  CONDITION_MULTIPLIERS,
  DEFAULT_PRICING,
} from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export type PricingTier = 'economy' | 'standard' | 'premium';
export type SurfaceCondition = 'good' | 'fair' | 'poor';
export type UrgencyLevel = 'standard' | 'priority' | 'emergency';
export type ProposalStatus = 'draft' | 'pending_review' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';

export interface LineItem {
  id: string;
  serviceId: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  tier: PricingTier | 'all';
}

export interface Measurements {
  totalSqft: number;
  deductionSqft: number;
  netSqft: number;
  crackLinearFeet: number;
  crackBoxes: number;
  potholes: number;
  alligatorSqft: number;
  parkingStalls: number;
  adaStalls: number;
  arrows: number;
  fireLaneFeet: number;
  customStencils: number;
}

export interface ProposalFormData {
  // Meta
  id: string | null;
  proposalNumber: string;
  status: ProposalStatus;
  
  // Property
  propertyName: string;
  propertyType: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  
  // Contact
  contactId: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactCompany: string;
  
  // Measurements
  measurements: Measurements;
  surfaceCondition: SurfaceCondition;
  conditionNotes: string;
  
  // Services
  selectedServices: string[];
  customLineItems: LineItem[];
  
  // Pricing
  selectedTier: PricingTier;
  discountPercent: number;
  discountAmount: number;
  taxRate: number;
  depositPercent: number;
  
  // Applied Discounts (from discount system)
  appliedDiscounts: Array<{
    id: string;
    sourceType: string;
    sourceName: string;
    discountType: 'percent' | 'fixed';
    discountValue: number;
    discountAmount: number;
  }>;
  totalDiscountAmount: number;
  requiresApproval: boolean;
  approvalReason?: string;
  
  // Scheduling
  urgencyLevel: UrgencyLevel;
  preferredStartDate: string;
  estimatedDuration: string;
  
  // Terms
  validDays: number;
  requireSignature: boolean;
  requireDeposit: boolean;
  
  // Content
  title: string;
  introduction: string;
  scopeOfWork: string;
  termsAndConditions: string;
  internalNotes: string;
  clientNotes: string;
  
  // Rep
  repName: string;
  repEmail: string;
  repPhone: string;
}

export interface ProposalImages {
  logo: string | null;
  aerial: string[];
  condition: string[];
  portfolio: string[];
  custom: string[];
}

export interface PricingState {
  subtotal: number;
  conditionAdjustment: number;
  adjustedSubtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  depositAmount: number;
  tierPricing: {
    economy: number;
    standard: number;
    premium: number;
  };
  lineItems: LineItem[];
}

export interface ProposalState {
  // Form data
  formData: ProposalFormData;
  images: ProposalImages;
  pricing: PricingState;
  
  // Navigation
  currentStep: number;
  
  // Status
  isDirty: boolean;
  lastSaved: Date | null;
  isSubmitting: boolean;
  
  // Actions
  setFormField: <K extends keyof ProposalFormData>(field: K, value: ProposalFormData[K]) => void;
  setMeasurement: <K extends keyof Measurements>(field: K, value: Measurements[K]) => void;
  toggleService: (serviceId: string) => void;
  addCustomLineItem: (item: Omit<LineItem, 'id'>) => void;
  updateCustomLineItem: (id: string, updates: Partial<LineItem>) => void;
  removeCustomLineItem: (id: string) => void;
  setImage: (type: keyof ProposalImages, value: string | string[] | null) => void;
  addImage: (type: keyof ProposalImages, url: string) => void;
  removeImage: (type: keyof ProposalImages, url: string) => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  recalculatePricing: () => void;
  applyDiscount: (discount: ProposalFormData['appliedDiscounts'][0]) => void;
  removeDiscount: (discountId: string) => void;
  clearDiscounts: () => void;
  resetForm: () => void;
  loadProposal: (data: Partial<ProposalState>) => void;
  markSaved: () => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialMeasurements: Measurements = {
  totalSqft: 0,
  deductionSqft: 0,
  netSqft: 0,
  crackLinearFeet: 0,
  crackBoxes: 0,
  potholes: 0,
  alligatorSqft: 0,
  parkingStalls: 0,
  adaStalls: 0,
  arrows: 0,
  fireLaneFeet: 0,
  customStencils: 0,
};

const initialFormData: ProposalFormData = {
  id: null,
  proposalNumber: generateProposalNumber(),
  status: 'draft',
  
  propertyName: '',
  propertyType: 'commercial',
  address: '',
  city: '',
  state: '',
  zip: '',
  
  contactId: null,
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  contactCompany: '',
  
  measurements: { ...initialMeasurements },
  surfaceCondition: 'fair',
  conditionNotes: '',
  
  selectedServices: [],
  customLineItems: [],
  
  selectedTier: 'standard',
  discountPercent: 0,
  discountAmount: 0,
  taxRate: 0.08,
  depositPercent: 30,
  
  appliedDiscounts: [],
  totalDiscountAmount: 0,
  requiresApproval: false,
  
  urgencyLevel: 'standard',
  preferredStartDate: '',
  estimatedDuration: '',
  
  validDays: 30,
  requireSignature: true,
  requireDeposit: true,
  
  title: '',
  introduction: '',
  scopeOfWork: '',
  termsAndConditions: '',
  internalNotes: '',
  clientNotes: '',
  
  repName: '',
  repEmail: '',
  repPhone: '',
};

const initialImages: ProposalImages = {
  logo: null,
  aerial: [],
  condition: [],
  portfolio: [],
  custom: [],
};

const initialPricing: PricingState = {
  subtotal: 0,
  conditionAdjustment: 0,
  adjustedSubtotal: 0,
  discountAmount: 0,
  taxAmount: 0,
  total: 0,
  depositAmount: 0,
  tierPricing: { economy: 0, standard: 0, premium: 0 },
  lineItems: [],
};

// ============================================================================
// DEFAULT LINE ITEMS
// ============================================================================

const DEFAULT_SERVICES = [
  { id: 'sealcoating', name: 'Sealcoating', unit: 'sq ft', unitPrice: DEFAULT_PRICING.sealcoating.default },
  { id: 'crack-filling', name: 'Crack Filling', unit: 'LF', unitPrice: DEFAULT_PRICING.crackFilling.default },
  { id: 'pothole-repair', name: 'Pothole Repair', unit: 'each', unitPrice: DEFAULT_PRICING.pothole.default },
  { id: 'line-striping', name: 'Line Striping', unit: 'lines', unitPrice: DEFAULT_PRICING.striping.default },
  { id: 'ada-stalls', name: 'ADA/Handicap Stalls', unit: 'stalls', unitPrice: DEFAULT_PRICING.adaStall.default },
  { id: 'arrows', name: 'Directional Arrows', unit: 'each', unitPrice: DEFAULT_PRICING.arrow.default },
  { id: 'fire-lane', name: 'Fire Lane', unit: 'LF', unitPrice: DEFAULT_PRICING.fireLane.default },
  { id: 'stencils', name: 'Custom Stencils', unit: 'each', unitPrice: DEFAULT_PRICING.stencil.default },
];

// ============================================================================
// STORE
// ============================================================================

export const useProposalStore = create<ProposalState>()(
  devtools(
    persist(
      (set, get) => ({
        formData: { ...initialFormData },
        images: { ...initialImages },
        pricing: { ...initialPricing },
        currentStep: 0,
        isDirty: false,
        lastSaved: null,
        isSubmitting: false,

        // Form field actions
        setFormField: (field, value) => {
          set((state) => ({
            formData: { ...state.formData, [field]: value },
            isDirty: true,
          }));
          
          // Recalculate pricing if relevant fields change
          const pricingFields = ['selectedTier', 'surfaceCondition', 'discountPercent', 'taxRate', 'depositPercent'];
          if (pricingFields.includes(field as string)) {
            get().recalculatePricing();
          }
        },

        setMeasurement: (field, value) => {
          set((state) => {
            const measurements = { ...state.formData.measurements, [field]: value };
            
            // Auto-calculate net sqft
            if (field === 'totalSqft' || field === 'deductionSqft') {
              measurements.netSqft = Math.max(0, measurements.totalSqft - measurements.deductionSqft);
            }
            
            return {
              formData: { ...state.formData, measurements },
              isDirty: true,
            };
          });
          get().recalculatePricing();
        },

        toggleService: (serviceId) => {
          set((state) => {
            const services = state.formData.selectedServices.includes(serviceId)
              ? state.formData.selectedServices.filter((id) => id !== serviceId)
              : [...state.formData.selectedServices, serviceId];
            
            return {
              formData: { ...state.formData, selectedServices: services },
              isDirty: true,
            };
          });
          get().recalculatePricing();
        },

        addCustomLineItem: (item) => {
          const newItem: LineItem = { ...item, id: generateId() };
          set((state) => ({
            formData: {
              ...state.formData,
              customLineItems: [...state.formData.customLineItems, newItem],
            },
            isDirty: true,
          }));
          get().recalculatePricing();
        },

        updateCustomLineItem: (id, updates) => {
          set((state) => ({
            formData: {
              ...state.formData,
              customLineItems: state.formData.customLineItems.map((item) =>
                item.id === id ? { ...item, ...updates, total: (updates.quantity ?? item.quantity) * (updates.unitPrice ?? item.unitPrice) } : item
              ),
            },
            isDirty: true,
          }));
          get().recalculatePricing();
        },

        removeCustomLineItem: (id) => {
          set((state) => ({
            formData: {
              ...state.formData,
              customLineItems: state.formData.customLineItems.filter((item) => item.id !== id),
            },
            isDirty: true,
          }));
          get().recalculatePricing();
        },

        setImage: (type, value) => {
          set((state) => ({
            images: { ...state.images, [type]: value },
            isDirty: true,
          }));
        },

        addImage: (type, url) => {
          set((state) => {
            const current = state.images[type];
            if (Array.isArray(current)) {
              return {
                images: { ...state.images, [type]: [...current, url] },
                isDirty: true,
              };
            }
            return {
              images: { ...state.images, [type]: url },
              isDirty: true,
            };
          });
        },

        removeImage: (type, url) => {
          set((state) => {
            const current = state.images[type];
            if (Array.isArray(current)) {
              return {
                images: { ...state.images, [type]: current.filter((u) => u !== url) },
                isDirty: true,
              };
            }
            return {
              images: { ...state.images, [type]: null },
              isDirty: true,
            };
          });
        },

        // Navigation
        setStep: (step) => set({ currentStep: step }),
        nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 5) })),
        prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),

        // Discount actions
        applyDiscount: (discount) => {
          set((state) => {
            const existing = state.formData.appliedDiscounts.find((d) => d.id === discount.id);
            if (existing) return state;
            
            const appliedDiscounts = [...state.formData.appliedDiscounts, discount];
            const totalDiscountAmount = appliedDiscounts.reduce((sum, d) => sum + d.discountAmount, 0);
            
            return {
              formData: {
                ...state.formData,
                appliedDiscounts,
                totalDiscountAmount,
              },
              isDirty: true,
            };
          });
          get().recalculatePricing();
        },

        removeDiscount: (discountId) => {
          set((state) => {
            const appliedDiscounts = state.formData.appliedDiscounts.filter((d) => d.id !== discountId);
            const totalDiscountAmount = appliedDiscounts.reduce((sum, d) => sum + d.discountAmount, 0);
            
            return {
              formData: {
                ...state.formData,
                appliedDiscounts,
                totalDiscountAmount,
              },
              isDirty: true,
            };
          });
          get().recalculatePricing();
        },

        clearDiscounts: () => {
          set((state) => ({
            formData: {
              ...state.formData,
              appliedDiscounts: [],
              totalDiscountAmount: 0,
            },
            isDirty: true,
          }));
          get().recalculatePricing();
        },

        // Pricing calculation
        recalculatePricing: () => {
          const { formData } = get();
          const { measurements, selectedServices, customLineItems, selectedTier, surfaceCondition, taxRate, depositPercent } = formData;
          
          // Build line items from selected services
          const lineItems: LineItem[] = [];
          
          selectedServices.forEach((serviceId) => {
            const service = DEFAULT_SERVICES.find((s) => s.id === serviceId);
            if (!service) return;
            
            let quantity = 0;
            switch (serviceId) {
              case 'sealcoating':
                quantity = measurements.netSqft;
                break;
              case 'crack-filling':
                quantity = measurements.crackLinearFeet;
                break;
              case 'pothole-repair':
                quantity = measurements.potholes;
                break;
              case 'line-striping':
                quantity = measurements.parkingStalls;
                break;
              case 'ada-stalls':
                quantity = measurements.adaStalls;
                break;
              case 'arrows':
                quantity = measurements.arrows;
                break;
              case 'fire-lane':
                quantity = measurements.fireLaneFeet;
                break;
              case 'stencils':
                quantity = measurements.customStencils;
                break;
            }
            
            if (quantity > 0) {
              lineItems.push({
                id: generateId(),
                serviceId,
                name: service.name,
                quantity,
                unit: service.unit,
                unitPrice: service.unitPrice,
                total: quantity * service.unitPrice,
                tier: 'all',
              });
            }
          });
          
          // Add custom line items
          lineItems.push(...customLineItems);
          
          // Calculate subtotal
          const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
          
          // Apply tier multiplier
          const tierMultiplier = TIER_MULTIPLIERS[selectedTier];
          const tieredSubtotal = subtotal * tierMultiplier;
          
          // Apply condition multiplier
          const conditionMultiplier = CONDITION_MULTIPLIERS[surfaceCondition];
          const conditionAdjustment = tieredSubtotal * (conditionMultiplier - 1);
          const adjustedSubtotal = tieredSubtotal * conditionMultiplier;
          
          // Apply discounts
          const discountAmount = formData.totalDiscountAmount;
          const afterDiscount = adjustedSubtotal - discountAmount;
          
          // Calculate tax
          const taxAmount = afterDiscount * taxRate;
          
          // Calculate total
          const total = afterDiscount + taxAmount;
          
          // Calculate deposit
          const depositAmount = total * (depositPercent / 100);
          
          // Calculate tier pricing for comparison
          const tierPricing = {
            economy: subtotal * TIER_MULTIPLIERS.economy * conditionMultiplier * (1 + taxRate),
            standard: subtotal * TIER_MULTIPLIERS.standard * conditionMultiplier * (1 + taxRate),
            premium: subtotal * TIER_MULTIPLIERS.premium * conditionMultiplier * (1 + taxRate),
          };
          
          set({
            pricing: {
              subtotal,
              conditionAdjustment,
              adjustedSubtotal,
              discountAmount,
              taxAmount,
              total,
              depositAmount,
              tierPricing,
              lineItems,
            },
          });
        },

        // Reset
        resetForm: () => {
          set({
            formData: { ...initialFormData, proposalNumber: generateProposalNumber() },
            images: { ...initialImages },
            pricing: { ...initialPricing },
            currentStep: 0,
            isDirty: false,
            lastSaved: null,
          });
        },

        // Load existing
        loadProposal: (data) => {
          set((state) => ({
            ...state,
            ...data,
            isDirty: false,
          }));
          get().recalculatePricing();
        },

        markSaved: () => set({ isDirty: false, lastSaved: new Date() }),
      }),
      {
        name: 'sommers-proposal-store',
        partialize: (state) => ({
          formData: state.formData,
          images: state.images,
          currentStep: state.currentStep,
        }),
      }
    ),
    { name: 'ProposalStore' }
  )
);

export default useProposalStore;
