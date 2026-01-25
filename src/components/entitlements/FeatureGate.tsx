/**
 * Sommer's Proposal System - FeatureGate Component
 * Conditionally renders children based on plan features and entitlements
 */

import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { entitlementsService, type FeatureKey, type Plan } from '@/lib/entitlements/entitlementsService';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Card, CardContent } from '@/components/ui';
import { cn } from '@/lib/utils';

// ============================================================================
// CONTEXT
// ============================================================================

interface EntitlementsContextValue {
  plan: Plan | null;
  features: Record<FeatureKey, boolean>;
  isLoading: boolean;
  isComped: boolean;
  hasFeature: (feature: FeatureKey) => boolean;
  refresh: () => Promise<void>;
}

const EntitlementsContext = createContext<EntitlementsContextValue | null>(null);

export function useEntitlements() {
  const context = useContext(EntitlementsContext);
  if (!context) {
    throw new Error('useEntitlements must be used within EntitlementsProvider');
  }
  return context;
}

// ============================================================================
// PROVIDER
// ============================================================================

interface EntitlementsProviderProps {
  children: ReactNode;
}

export function EntitlementsProvider({ children }: EntitlementsProviderProps) {
  const { organization } = useAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [features, setFeatures] = useState<Record<FeatureKey, boolean>>({} as Record<FeatureKey, boolean>);
  const [isLoading, setIsLoading] = useState(true);
  const [isComped, setIsComped] = useState(false);

  const loadEntitlements = async () => {
    if (!organization?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const [effectivePlan, allFeatures, comped] = await Promise.all([
        entitlementsService.getEffectivePlan(organization.id),
        entitlementsService.getAllFeatures(organization.id),
        entitlementsService.isComped(organization.id),
      ]);

      setPlan(effectivePlan);
      setFeatures(allFeatures);
      setIsComped(comped);
    } catch (error) {
      console.error('Failed to load entitlements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEntitlements();
  }, [organization?.id]);

  const hasFeature = (feature: FeatureKey): boolean => {
    return features[feature] ?? false;
  };

  return (
    <EntitlementsContext.Provider
      value={{
        plan,
        features,
        isLoading,
        isComped,
        hasFeature,
        refresh: loadEntitlements,
      }}
    >
      {children}
    </EntitlementsContext.Provider>
  );
}

// ============================================================================
// FEATURE GATE COMPONENT
// ============================================================================

interface FeatureGateProps {
  feature: FeatureKey;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgrade?: boolean;
  upgradeMessage?: string;
  className?: string;
}

export function FeatureGate({
  feature,
  children,
  fallback,
  showUpgrade = true,
  upgradeMessage,
  className,
}: FeatureGateProps) {
  const { hasFeature, plan, isLoading } = useEntitlements();

  if (isLoading) {
    return (
      <div className={cn('animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg h-24', className)} />
    );
  }

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgrade) {
    return null;
  }

  return (
    <UpgradePrompt
      feature={feature}
      currentPlan={plan?.displayName || 'Free'}
      message={upgradeMessage}
      className={className}
    />
  );
}

// ============================================================================
// UPGRADE PROMPT
// ============================================================================

interface UpgradePromptProps {
  feature: FeatureKey;
  currentPlan: string;
  message?: string;
  className?: string;
}

const featureNames: Record<FeatureKey, string> = {
  proposals: 'Proposals',
  clients: 'Client Management',
  templates: 'Templates',
  basic_analytics: 'Basic Analytics',
  advanced_analytics: 'Advanced Analytics',
  email_support: 'Email Support',
  priority_support: 'Priority Support',
  dedicated_support: 'Dedicated Support',
  custom_branding: 'Custom Branding',
  integrations: 'Integrations',
  ai_assistant: 'AI Assistant',
  automation: 'Automation',
  api_access: 'API Access',
  white_label: 'White Label',
  custom_domain: 'Custom Domain',
  sso: 'Single Sign-On',
  audit_logs: 'Audit Logs',
};

const featureMinPlans: Record<FeatureKey, string> = {
  proposals: 'Free',
  clients: 'Free',
  templates: 'Free',
  basic_analytics: 'Free',
  advanced_analytics: 'Pro',
  email_support: 'Free',
  priority_support: 'Pro',
  dedicated_support: 'Enterprise',
  custom_branding: 'Pro',
  integrations: 'Pro',
  ai_assistant: 'Pro',
  automation: 'Business',
  api_access: 'Business',
  white_label: 'Business',
  custom_domain: 'Enterprise',
  sso: 'Enterprise',
  audit_logs: 'Enterprise',
};

function UpgradePrompt({ feature, currentPlan, message, className }: UpgradePromptProps) {
  const featureName = featureNames[feature] || feature;
  const requiredPlan = featureMinPlans[feature] || 'Pro';

  return (
    <Card className={cn('border-dashed border-2 border-gray-300 dark:border-gray-600', className)}>
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
          <Lock className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Upgrade to unlock {featureName}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
          {message || `${featureName} is available on the ${requiredPlan} plan and above.`}
        </p>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <span>Current plan:</span>
          <span className="font-medium text-gray-900 dark:text-white">{currentPlan}</span>
        </div>
        <Button
          onClick={() => window.location.href = '/settings/billing'}
          leftIcon={<Sparkles className="w-4 h-4" />}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          View Plans
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// PLAN BADGE
// ============================================================================

interface PlanBadgeProps {
  plan: string;
  className?: string;
}

const planColors: Record<string, string> = {
  free: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  pro: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  business: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  enterprise: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
};

export function PlanBadge({ plan, className }: PlanBadgeProps) {
  const colorClass = planColors[plan.toLowerCase()] || planColors.free;

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      colorClass,
      className
    )}>
      {plan}
    </span>
  );
}

// ============================================================================
// FEATURE BADGE
// ============================================================================

interface FeatureBadgeProps {
  feature: FeatureKey;
  showLock?: boolean;
  className?: string;
}

export function FeatureBadge({ feature, showLock = true, className }: FeatureBadgeProps) {
  const { hasFeature } = useEntitlements();
  const isAvailable = hasFeature(feature);
  const featureName = featureNames[feature] || feature;
  const requiredPlan = featureMinPlans[feature] || 'Pro';

  if (isAvailable) {
    return null;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
        'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
        className
      )}
      title={`${featureName} requires ${requiredPlan} plan`}
    >
      {showLock && <Lock className="w-3 h-3" />}
      {requiredPlan}
    </span>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default FeatureGate;
