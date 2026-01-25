/**
 * Sommer's Proposal System - Discounts Admin Page
 * Manage all discount features: codes, rules, loyalty, seasonal, approvals
 */

import { useState, useEffect } from 'react';
import {
  Tag,
  Percent,
  Gift,
  Crown,
  Calendar,
  Shield,
  TrendingUp,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  RefreshCw,
  Download,
  AlertTriangle,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  discountCodesService,
  autoDiscountService,
  loyaltyService,
  volumeDiscountService,
  seasonalDiscountService,
  discountApprovalService,
} from '@/lib/discounts/discountService';
import type {
  DiscountCode,
  AutoDiscountRule,
  LoyaltyProgram,
  VolumeDiscountTier,
  SeasonalDiscount,
  DiscountApprovalRequest,
  DiscountApprovalSettings,
} from '@/lib/discounts/discountTypes';

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function DiscountsPage() {
  const { orgId } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'codes' | 'rules' | 'loyalty' | 'volume' | 'seasonal' | 'approvals' | 'settings'
  >('codes');
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [autoRules, setAutoRules] = useState<AutoDiscountRule[]>([]);
  const [loyaltyProgram, setLoyaltyProgram] = useState<LoyaltyProgram | null>(null);
  const [volumeTiers, setVolumeTiers] = useState<VolumeDiscountTier[]>([]);
  const [seasonalDiscounts, setSeasonalDiscounts] = useState<SeasonalDiscount[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<DiscountApprovalRequest[]>([]);
  const [approvalSettings, setApprovalSettings] = useState<DiscountApprovalSettings | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalCodes: 0,
    activeCodes: 0,
    totalRedemptions: 0,
    totalSavings: 0,
    pendingApprovals: 0,
    loyaltyMembers: 0,
  });

  // Load data
  useEffect(() => {
    if (!orgId) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [codes, rules, loyalty, volume, seasonal, approvals, settings] = await Promise.all([
          discountCodesService.list(orgId, true),
          autoDiscountService.list(orgId, false),
          loyaltyService.getProgram(orgId),
          volumeDiscountService.list(orgId),
          seasonalDiscountService.list(orgId, false),
          discountApprovalService.getPendingRequests(orgId),
          discountApprovalService.getSettings(orgId),
        ]);

        setDiscountCodes(codes);
        setAutoRules(rules);
        setLoyaltyProgram(loyalty);
        setVolumeTiers(volume);
        setSeasonalDiscounts(seasonal);
        setApprovalRequests(approvals);
        setApprovalSettings(settings);

        // Calculate stats
        setStats({
          totalCodes: codes.length,
          activeCodes: codes.filter((c) => c.isActive).length,
          totalRedemptions: codes.reduce((sum, c) => sum + c.timesUsed, 0),
          totalSavings: codes.reduce((sum, c) => sum + c.totalDiscountGiven, 0),
          pendingApprovals: approvals.length,
          loyaltyMembers: 0, // Would need separate query
        });
      } catch (error) {
        console.error('Error loading discount data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [orgId]);

  const tabs = [
    { id: 'codes', label: 'Promo Codes', icon: Tag, count: stats.activeCodes },
    { id: 'rules', label: 'Auto Rules', icon: Sparkles, count: autoRules.filter((r) => r.isActive).length },
    { id: 'loyalty', label: 'Loyalty Program', icon: Crown },
    { id: 'volume', label: 'Volume Discounts', icon: TrendingUp },
    { id: 'seasonal', label: 'Seasonal', icon: Calendar },
    { id: 'approvals', label: 'Approvals', icon: Shield, count: stats.pendingApprovals, highlight: stats.pendingApprovals > 0 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Discounts & Promotions</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage promo codes, automatic discounts, loyalty program, and more
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Discount
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard
          label="Active Codes"
          value={stats.activeCodes}
          icon={<Tag className="w-5 h-5 text-blue-500" />}
        />
        <StatCard
          label="Total Redemptions"
          value={stats.totalRedemptions.toLocaleString()}
          icon={<CheckCircle className="w-5 h-5 text-green-500" />}
        />
        <StatCard
          label="Total Savings"
          value={`$${stats.totalSavings.toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
        />
        <StatCard
          label="Auto Rules"
          value={autoRules.filter((r) => r.isActive).length}
          icon={<Sparkles className="w-5 h-5 text-purple-500" />}
        />
        <StatCard
          label="Loyalty Members"
          value={stats.loyaltyMembers.toLocaleString()}
          icon={<Crown className="w-5 h-5 text-yellow-500" />}
        />
        <StatCard
          label="Pending Approvals"
          value={stats.pendingApprovals}
          icon={<Shield className="w-5 h-5 text-orange-500" />}
          highlight={stats.pendingApprovals > 0}
        />
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors',
                activeTab === tab.id
                  ? 'border-brand-red text-brand-red'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'px-2 py-0.5 text-xs rounded-full',
                    tab.highlight
                      ? 'bg-red-100 text-red-600'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'codes' && (
          <PromoCodesTab
            codes={discountCodes}
            onRefresh={() => discountCodesService.list(orgId!, true).then(setDiscountCodes)}
          />
        )}
        {activeTab === 'rules' && (
          <AutoRulesTab
            rules={autoRules}
            onRefresh={() => autoDiscountService.list(orgId!, false).then(setAutoRules)}
          />
        )}
        {activeTab === 'loyalty' && (
          <LoyaltyTab
            program={loyaltyProgram}
            onUpdate={setLoyaltyProgram}
          />
        )}
        {activeTab === 'volume' && (
          <VolumeTab
            tiers={volumeTiers}
            onRefresh={() => volumeDiscountService.list(orgId!).then(setVolumeTiers)}
          />
        )}
        {activeTab === 'seasonal' && (
          <SeasonalTab
            discounts={seasonalDiscounts}
            onRefresh={() => seasonalDiscountService.list(orgId!, false).then(setSeasonalDiscounts)}
          />
        )}
        {activeTab === 'approvals' && (
          <ApprovalsTab
            requests={approvalRequests}
            onRefresh={() => discountApprovalService.getPendingRequests(orgId!).then(setApprovalRequests)}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsTab
            settings={approvalSettings}
            onUpdate={setApprovalSettings}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  highlight?: boolean;
}

function StatCard({ label, value, icon, highlight }: StatCardProps) {
  return (
    <div
      className={cn(
        'p-4 bg-white dark:bg-gray-800 rounded-lg border',
        highlight && 'border-red-300 dark:border-red-700'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-gray-500 dark:text-gray-400 text-sm">{label}</span>
        {icon}
      </div>
      <div
        className={cn(
          'text-2xl font-bold mt-2',
          highlight ? 'text-red-600' : 'text-gray-900 dark:text-white'
        )}
      >
        {value}
      </div>
    </div>
  );
}

// Placeholder for Sparkles since it's not in lucide
const Sparkles = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
    <path d="M5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1z" />
    <path d="M19 12l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1z" />
  </svg>
);

// ============================================================================
// PROMO CODES TAB
// ============================================================================

interface PromoCodesTabProps {
  codes: DiscountCode[];
  onRefresh: () => void;
}

function PromoCodesTab({ codes, onRefresh }: PromoCodesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filteredCodes = codes.filter((code) => {
    const matchesSearch =
      code.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      code.name.toLowerCase().includes(searchQuery.toLowerCase());

    if (filter === 'active') {
      return matchesSearch && code.isActive && (!code.expiresAt || new Date(code.expiresAt) > new Date());
    }
    if (filter === 'expired') {
      return matchesSearch && (!code.isActive || (code.expiresAt && new Date(code.expiresAt) < new Date()));
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search codes..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All Codes</option>
            <option value="active">Active</option>
            <option value="expired">Expired/Inactive</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onRefresh} className="p-2 hover:bg-gray-100 rounded-lg">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Code
          </button>
        </div>
      </div>

      {/* Codes Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usage</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid Period</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredCodes.map((code) => (
              <tr key={code.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-mono text-sm font-bold">
                      {code.code}
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText(code.code)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{code.name}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium">
                    {code.discountType === 'percent'
                      ? `${code.discountValue}%`
                      : `$${code.discountValue.toFixed(2)}`}
                  </span>
                  {code.maxDiscountAmount && (
                    <div className="text-xs text-gray-500">Max: ${code.maxDiscountAmount}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{code.timesUsed} uses</div>
                  {code.maxUsesTotal && (
                    <div className="text-xs text-gray-500">of {code.maxUsesTotal}</div>
                  )}
                  <div className="text-xs text-green-600">${code.totalDiscountGiven.toFixed(2)} given</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">
                    {new Date(code.startsAt).toLocaleDateString()}
                    {code.expiresAt && (
                      <>
                        {' → '}
                        {new Date(code.expiresAt).toLocaleDateString()}
                      </>
                    )}
                  </div>
                  {code.expiresAt && new Date(code.expiresAt) < new Date() && (
                    <div className="text-xs text-red-500">Expired</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {code.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                      <CheckCircle className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      <EyeOff className="w-3 h-3" />
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <BarChart3 className="w-4 h-4 text-gray-400" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <Edit2 className="w-4 h-4 text-gray-400" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <Trash2 className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCodes.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No promo codes found</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 text-brand-red hover:underline"
            >
              Create your first code
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// AUTO RULES TAB
// ============================================================================

interface AutoRulesTabProps {
  rules: AutoDiscountRule[];
  onRefresh: () => void;
}

function AutoRulesTab({ rules, onRefresh }: AutoRulesTabProps) {
  const getRuleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      order_minimum: 'Order Minimum',
      service_quantity: 'Service Quantity',
      service_combo: 'Service Combo',
      first_order: 'First Order',
      repeat_customer: 'Repeat Customer',
      referral: 'Referral',
      seasonal: 'Seasonal',
      day_of_week: 'Day of Week',
      bulk_volume: 'Bulk Volume',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Rule
        </button>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg border hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    rule.isActive ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'
                  )}
                >
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{rule.name}</h4>
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                      {getRuleTypeLabel(rule.ruleType)}
                    </span>
                    {rule.stackable && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-xs">Stackable</span>
                    )}
                  </div>
                  {rule.description && (
                    <p className="text-sm text-gray-500 mt-1">{rule.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>
                      {rule.discountType === 'percent'
                        ? `${rule.discountValue}% off`
                        : `$${rule.discountValue} off`}
                    </span>
                    <span>•</span>
                    <span>Priority: {rule.priority}</span>
                    <span>•</span>
                    <span>{rule.timesApplied} times applied</span>
                    <span>•</span>
                    <span className="text-green-600">${rule.totalDiscountGiven.toFixed(2)} given</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className={cn(
                    'px-3 py-1 rounded-full text-sm font-medium',
                    rule.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  )}
                >
                  {rule.isActive ? 'Active' : 'Inactive'}
                </button>
                <button className="p-2 hover:bg-gray-100 rounded">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {rules.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white dark:bg-gray-800 rounded-lg border">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No automatic discount rules</p>
            <p className="text-sm mt-1">Create rules to automatically apply discounts based on conditions</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// LOYALTY TAB
// ============================================================================

interface LoyaltyTabProps {
  program: LoyaltyProgram | null;
  onUpdate: (program: LoyaltyProgram | null) => void;
}

function LoyaltyTab({ program, onUpdate }: LoyaltyTabProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (!program) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border">
        <Crown className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
        <h3 className="text-xl font-semibold mb-2">Start a Loyalty Program</h3>
        <p className="text-gray-500 mb-4 max-w-md mx-auto">
          Reward your repeat customers with points, tier-based discounts, and exclusive perks.
        </p>
        <button className="btn-primary">Create Loyalty Program</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Program Status */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <Crown className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{program.name}</h3>
            <p className="text-sm text-gray-500">
              {program.isActive ? 'Program is active' : 'Program is paused'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={cn(
              'px-4 py-2 rounded-lg font-medium',
              program.isActive
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            )}
          >
            {program.isActive ? 'Active' : 'Paused'}
          </button>
          <button className="btn-secondary" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Program
          </button>
        </div>
      </div>

      {/* Points Settings */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <h4 className="font-semibold mb-4">Points Earning</h4>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Points per dollar spent</span>
              <span className="font-medium">{program.pointsPerDollar} pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Signup bonus</span>
              <span className="font-medium">{program.pointsForSignup} pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Referral bonus</span>
              <span className="font-medium">{program.pointsForReferral} pts</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <h4 className="font-semibold mb-4">Points Redemption</h4>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Points value</span>
              <span className="font-medium">
                {Math.round(1 / program.pointsToDollarRatio)} pts = $1
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Minimum to redeem</span>
              <span className="font-medium">{program.minPointsToRedeem} pts</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Max redemption</span>
              <span className="font-medium">{program.maxRedemptionPercent}% of order</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tiers */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
        <h4 className="font-semibold mb-4">Membership Tiers</h4>
        <div className="grid md:grid-cols-4 gap-4">
          {program.tiers.map((tier, index) => (
            <div
              key={tier.name}
              className={cn(
                'p-4 rounded-lg border-2 text-center',
                index === 0 && 'border-amber-300 bg-amber-50',
                index === 1 && 'border-gray-300 bg-gray-50',
                index === 2 && 'border-yellow-400 bg-yellow-50',
                index === 3 && 'border-gray-700 bg-gray-100'
              )}
            >
              <Crown
                className={cn(
                  'w-8 h-8 mx-auto mb-2',
                  index === 0 && 'text-amber-600',
                  index === 1 && 'text-gray-500',
                  index === 2 && 'text-yellow-500',
                  index === 3 && 'text-gray-700'
                )}
              />
              <h5 className="font-bold">{tier.name}</h5>
              <p className="text-sm text-gray-500 mt-1">
                {tier.minPoints.toLocaleString()}+ pts
              </p>
              <p className="text-lg font-bold text-brand-red mt-2">
                {tier.discountPercent}% off
              </p>
              {tier.perks.length > 0 && (
                <div className="mt-3 text-xs text-gray-500">
                  {tier.perks.map((perk) => (
                    <div key={perk} className="flex items-center justify-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      {perk.replace(/_/g, ' ')}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// VOLUME TAB
// ============================================================================

interface VolumeTabProps {
  tiers: VolumeDiscountTier[];
  onRefresh: () => void;
}

function VolumeTab({ tiers, onRefresh }: VolumeTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Volume Tier
        </button>
      </div>

      <div className="grid gap-4">
        {tiers.map((tier) => (
          <div key={tier.id} className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold">{tier.name}</h4>
                <p className="text-sm text-gray-500">
                  {tier.measurementType.replace(/_/g, ' ')}
                  {tier.serviceType && ` • ${tier.serviceType}`}
                </p>
              </div>
              <span
                className={cn(
                  'px-3 py-1 rounded-full text-sm',
                  tier.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                )}
              >
                {tier.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {tier.tiers.map((level, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-center"
                >
                  <div className="text-xs text-gray-500">
                    {level.min.toLocaleString()}
                    {level.max ? ` - ${level.max.toLocaleString()}` : '+'}
                  </div>
                  <div className="text-lg font-bold text-brand-red">
                    {level.discountPercent}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {tiers.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white dark:bg-gray-800 rounded-lg border">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No volume discount tiers configured</p>
            <p className="text-sm mt-1">Reward customers who book larger projects</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SEASONAL TAB
// ============================================================================

interface SeasonalTabProps {
  discounts: SeasonalDiscount[];
  onRefresh: () => void;
}

function SeasonalTab({ discounts, onRefresh }: SeasonalTabProps) {
  const now = new Date();

  const getStatus = (discount: SeasonalDiscount) => {
    if (!discount.isActive) return 'inactive';
    if (new Date(discount.startsAt) > now) return 'scheduled';
    if (new Date(discount.expiresAt) < now) return 'expired';
    return 'active';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      <div className="grid gap-4">
        {discounts.map((discount) => {
          const status = getStatus(discount);
          return (
            <div
              key={discount.id}
              className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden"
            >
              {/* Banner Preview */}
              {discount.showBanner && (
                <div
                  className="p-4 text-white"
                  style={{ backgroundColor: discount.bannerColor }}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span className="font-bold">{discount.name}</span>
                  </div>
                  {discount.bannerText && <p className="text-sm mt-1 opacity-90">{discount.bannerText}</p>}
                </div>
              )}

              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    {!discount.showBanner && <h4 className="font-semibold">{discount.name}</h4>}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span>
                        {discount.discountType === 'percent'
                          ? `${discount.discountValue}% off`
                          : `$${discount.discountValue} off`}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(discount.startsAt).toLocaleDateString()} -{' '}
                        {new Date(discount.expiresAt).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>{discount.timesApplied} uses</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'px-3 py-1 rounded-full text-sm',
                        status === 'active' && 'bg-green-100 text-green-700',
                        status === 'scheduled' && 'bg-blue-100 text-blue-700',
                        status === 'expired' && 'bg-gray-100 text-gray-500',
                        status === 'inactive' && 'bg-gray-100 text-gray-500'
                      )}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {discounts.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white dark:bg-gray-800 rounded-lg border">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No seasonal campaigns</p>
            <p className="text-sm mt-1">Create time-limited promotions for holidays or seasons</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// APPROVALS TAB
// ============================================================================

interface ApprovalsTabProps {
  requests: DiscountApprovalRequest[];
  onRefresh: () => void;
}

function ApprovalsTab({ requests, onRefresh }: ApprovalsTabProps) {
  return (
    <div className="space-y-4">
      {requests.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white dark:bg-gray-800 rounded-lg border">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
          <p className="text-lg font-medium">All caught up!</p>
          <p className="text-sm mt-1">No pending discount approvals</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="bg-white dark:bg-gray-800 rounded-lg border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-orange-500" />
                    <span className="font-semibold">#{request.proposalNumber}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-600">{request.clientName}</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Requested: {request.discountType === 'percent'
                      ? `${request.discountValue}%`
                      : `$${request.discountValue}`} discount
                    <span className="mx-2">•</span>
                    ${request.discountAmount.toFixed(2)} off ${request.proposalTotal.toFixed(2)}
                  </div>
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                    <strong>Reason:</strong> {request.reason}
                  </div>
                  {request.isRepeatCustomer && (
                    <span className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600">
                      <Users className="w-3 h-3" />
                      Repeat customer • LTV: ${request.clientLifetimeValue?.toFixed(2) || 'N/A'}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                    Reject
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SETTINGS TAB
// ============================================================================

interface SettingsTabProps {
  settings: DiscountApprovalSettings | null;
  onUpdate: (settings: DiscountApprovalSettings | null) => void;
}

function SettingsTab({ settings, onUpdate }: SettingsTabProps) {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
        <h4 className="font-semibold mb-4">Approval Workflow</h4>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium">Require approval for large discounts</span>
              <p className="text-sm text-gray-500">
                Discounts above thresholds will need manager approval
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings?.requireApproval ?? true}
              className="w-5 h-5 rounded border-gray-300"
              onChange={() => {}}
            />
          </label>

          <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium mb-1">
                Approval threshold (percent)
              </label>
              <input
                type="number"
                value={settings?.approvalThresholdPercent ?? 15}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Discounts above this % require approval
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Approval threshold (amount)
              </label>
              <input
                type="number"
                value={settings?.approvalThresholdAmount ?? 500}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Discounts above this $ amount require approval
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <label className="block text-sm font-medium mb-2">Role-based limits</label>
            <div className="space-y-2">
              {Object.entries(settings?.roleLimits || {}).map(([role, limits]) => (
                <div key={role} className="flex items-center gap-4 p-2 bg-gray-50 rounded">
                  <span className="w-24 font-medium capitalize">{role}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Max:</span>
                    <input
                      type="number"
                      value={limits.maxPercent}
                      className="w-20 px-2 py-1 border rounded text-sm"
                    />
                    <span className="text-sm">%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">or</span>
                    <span className="text-sm">$</span>
                    <input
                      type="number"
                      value={limits.maxAmount ?? ''}
                      placeholder="No limit"
                      className="w-24 px-2 py-1 border rounded text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn-primary">Save Settings</button>
      </div>
    </div>
  );
}
