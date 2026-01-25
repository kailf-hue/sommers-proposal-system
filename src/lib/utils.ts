/**
 * Sommer's Proposal System - Utility Functions
 * Common helpers, formatters, and constants
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

// ============================================================================
// CLASS NAME UTILITY
// ============================================================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// ID GENERATION
// ============================================================================

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export function generateProposalNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `SOM-${year}-${random}`;
}

export function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${year}${month}-${random}`;
}

// ============================================================================
// PRICING CONSTANTS
// ============================================================================

export const TIER_MULTIPLIERS = {
  economy: 0.85,
  standard: 1.0,
  premium: 1.35,
} as const;

export const CONDITION_MULTIPLIERS = {
  good: 1.0,
  fair: 1.15,
  poor: 1.3,
} as const;

export const URGENCY_MULTIPLIERS = {
  standard: 1.0,
  priority: 1.15,
  emergency: 1.35,
} as const;

export const DEFAULT_PRICING = {
  sealcoating: {
    min: 0.15,
    max: 0.35,
    default: 0.22,
    unit: 'sq ft',
  },
  crackFilling: {
    min: 1.0,
    max: 3.0,
    default: 1.75,
    unit: 'LF',
  },
  pothole: {
    min: 60,
    max: 150,
    default: 85,
    unit: 'each',
  },
  striping: {
    min: 4,
    max: 7,
    default: 5,
    unit: 'line',
  },
  adaStall: {
    min: 25,
    max: 45,
    default: 35,
    unit: 'stall',
  },
  arrow: {
    min: 15,
    max: 25,
    default: 18,
    unit: 'each',
  },
  fireLane: {
    min: 1.5,
    max: 3.0,
    default: 2.0,
    unit: 'LF',
  },
  stencil: {
    min: 20,
    max: 50,
    default: 30,
    unit: 'each',
  },
} as const;

// ============================================================================
// PRICING CALCULATIONS
// ============================================================================

export function calculateLineItemTotal(
  quantity: number,
  unitPrice: number,
  tier: keyof typeof TIER_MULTIPLIERS = 'standard'
): number {
  return quantity * unitPrice * TIER_MULTIPLIERS[tier];
}

export function calculateSubtotal(
  lineItems: Array<{ quantity: number; unitPrice: number }>,
  tier: keyof typeof TIER_MULTIPLIERS = 'standard'
): number {
  return lineItems.reduce(
    (sum, item) => sum + calculateLineItemTotal(item.quantity, item.unitPrice, tier),
    0
  );
}

export function applyConditionMultiplier(
  amount: number,
  condition: keyof typeof CONDITION_MULTIPLIERS
): number {
  return amount * CONDITION_MULTIPLIERS[condition];
}

export function calculateTax(amount: number, taxRate: number): number {
  return amount * taxRate;
}

export function calculateDeposit(total: number, depositPercent: number): number {
  return total * (depositPercent / 100);
}

export function calculateTierPrices(
  subtotal: number,
  condition: keyof typeof CONDITION_MULTIPLIERS,
  taxRate: number
): { economy: number; standard: number; premium: number } {
  const conditionMultiplier = CONDITION_MULTIPLIERS[condition];

  return {
    economy: subtotal * TIER_MULTIPLIERS.economy * conditionMultiplier * (1 + taxRate),
    standard: subtotal * TIER_MULTIPLIERS.standard * conditionMultiplier * (1 + taxRate),
    premium: subtotal * TIER_MULTIPLIERS.premium * conditionMultiplier * (1 + taxRate),
  };
}

// ============================================================================
// FORMATTERS
// ============================================================================

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

export function formatDate(
  date: string | Date,
  formatStr = 'MMM d, yyyy'
): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid date';
  return format(d, formatStr);
}

export function formatDateTime(
  date: string | Date,
  formatStr = 'MMM d, yyyy h:mm a'
): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid date';
  return format(d, formatStr);
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid date';
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

export function formatAddress(
  address: string,
  city: string,
  state: string,
  zip: string
): string {
  return `${address}, ${city}, ${state} ${zip}`;
}

export function formatSqFt(value: number): string {
  return `${formatNumber(value)} sq ft`;
}

export function formatLinearFeet(value: number): string {
  return `${formatNumber(value)} LF`;
}

// ============================================================================
// VALIDATION
// ============================================================================

export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned[0] === '1');
}

export function isValidZip(zip: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(zip);
}

// ============================================================================
// DATA TRANSFORMATION
// ============================================================================

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    },
    {} as Record<string, T[]>
  );
}

export function sortBy<T>(array: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
    if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ============================================================================
// LOCAL STORAGE
// ============================================================================

export function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;

  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

export function removeFromStorage(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

// ============================================================================
// COLOR UTILITIES
// ============================================================================

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function getContrastColor(hexColor: string): 'white' | 'black' {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return 'black';

  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? 'black' : 'white';
}

// ============================================================================
// US STATES
// ============================================================================

export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
] as const;

export const US_STATES_FULL: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

// ============================================================================
// STATUS CONSTANTS
// ============================================================================

export const PROPOSAL_STATUSES = {
  draft: { label: 'Draft', color: 'gray' },
  pending_review: { label: 'Pending Review', color: 'yellow' },
  sent: { label: 'Sent', color: 'blue' },
  viewed: { label: 'Viewed', color: 'purple' },
  accepted: { label: 'Accepted', color: 'green' },
  rejected: { label: 'Rejected', color: 'red' },
  expired: { label: 'Expired', color: 'gray' },
} as const;

export const DEAL_STAGES = {
  lead: { label: 'Lead', color: 'gray', order: 0 },
  qualified: { label: 'Qualified', color: 'blue', order: 1 },
  proposal: { label: 'Proposal', color: 'purple', order: 2 },
  negotiation: { label: 'Negotiation', color: 'yellow', order: 3 },
  won: { label: 'Won', color: 'green', order: 4 },
  lost: { label: 'Lost', color: 'red', order: 5 },
} as const;

export const JOB_STATUSES = {
  scheduled: { label: 'Scheduled', color: 'blue' },
  in_progress: { label: 'In Progress', color: 'yellow' },
  completed: { label: 'Completed', color: 'green' },
  cancelled: { label: 'Cancelled', color: 'red' },
  weather_hold: { label: 'Weather Hold', color: 'orange' },
} as const;

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  cn,
  generateId,
  generateProposalNumber,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatPhone,
  calculateTierPrices,
  TIER_MULTIPLIERS,
  CONDITION_MULTIPLIERS,
  DEFAULT_PRICING,
  US_STATES,
  PROPOSAL_STATUSES,
  DEAL_STAGES,
};
