/**
 * Sommer's Proposal System - AI Pricing Optimization Service
 * Phase 48-49: ML-based pricing, win rate prediction, and optimization
 */

import { supabase } from '../supabase';
import { entitlementsService } from '../entitlements/entitlementsService';

// ============================================================================
// TYPES
// ============================================================================

export interface PricingRecommendation {
  proposalId?: string;
  serviceType: string;
  currentPrice: number;
  recommendedPrice: number;
  priceRange: { min: number; max: number };
  confidence: number;
  winProbability: number;
  factors: PricingFactor[];
  competitorAnalysis?: CompetitorPricing;
  historicalData?: HistoricalPricing;
  recommendation: 'increase' | 'decrease' | 'maintain';
  reasoning: string;
}

export interface PricingFactor {
  name: string;
  impact: number; // -100 to +100
  direction: 'positive' | 'negative' | 'neutral';
  description: string;
  weight: number;
}

export interface CompetitorPricing {
  avgMarketPrice: number;
  pricePosition: 'below' | 'at' | 'above';
  competitors: { name: string; estimatedPrice: number }[];
}

export interface HistoricalPricing {
  avgWinPrice: number;
  avgLossPrice: number;
  optimalPricePoint: number;
  priceElasticity: number;
}

export interface WinProbabilityPrediction {
  proposalId: string;
  probability: number;
  confidence: number;
  factors: WinFactor[];
  suggestions: string[];
  similarDeals: SimilarDeal[];
}

export interface WinFactor {
  name: string;
  score: number; // 0-100
  impact: 'high' | 'medium' | 'low';
  suggestion?: string;
}

export interface SimilarDeal {
  proposalId: string;
  clientName: string;
  value: number;
  outcome: 'won' | 'lost';
  similarity: number;
}

export interface PricingModel {
  id: string;
  orgId: string;
  name: string;
  serviceType: string;
  basePrice: number;
  variables: PricingVariable[];
  rules: PricingRule[];
  isActive: boolean;
  accuracy: number;
  lastTrainedAt: string;
  createdAt: string;
}

export interface PricingVariable {
  name: string;
  type: 'numeric' | 'categorical' | 'boolean';
  weight: number;
  coefficient: number;
  values?: string[];
}

export interface PricingRule {
  id: string;
  condition: string;
  adjustment: number;
  adjustmentType: 'percentage' | 'fixed';
  priority: number;
}

export interface OptimizationResult {
  originalPrice: number;
  optimizedPrice: number;
  expectedWinRate: number;
  expectedRevenue: number;
  tradeoffs: OptimizationTradeoff[];
}

export interface OptimizationTradeoff {
  price: number;
  winProbability: number;
  expectedValue: number;
}

export interface MarketAnalysis {
  serviceType: string;
  region: string;
  avgPrice: number;
  priceRange: { min: number; max: number };
  demandLevel: 'high' | 'medium' | 'low';
  seasonalFactor: number;
  competitorCount: number;
  marketTrend: 'increasing' | 'stable' | 'decreasing';
}

export interface DealScoring {
  proposalId: string;
  overallScore: number;
  dimensions: {
    clientFit: number;
    dealSize: number;
    timing: number;
    competition: number;
    relationship: number;
  };
  recommendations: string[];
}

// ============================================================================
// AI PRICING SERVICE
// ============================================================================

export const aiPricingService = {
  // --------------------------------------------------------------------------
  // Pricing Recommendations
  // --------------------------------------------------------------------------

  /**
   * Get pricing recommendation for a service
   */
  async getPricingRecommendation(
    orgId: string,
    options: {
      serviceType: string;
      squareFootage?: number;
      condition?: 'good' | 'fair' | 'poor';
      clientId?: string;
      region?: string;
    }
  ): Promise<PricingRecommendation> {
    // Check plan for AI features
    const hasAI = await entitlementsService.hasFeature(orgId, 'ai_assistant');
    if (!hasAI) {
      throw new Error('AI pricing requires a Pro plan or higher');
    }

    // Get historical pricing data
    const historicalData = await this.getHistoricalPricingData(
      orgId,
      options.serviceType
    );

    // Get market analysis
    const marketAnalysis = await this.getMarketAnalysis(
      options.serviceType,
      options.region || 'default'
    );

    // Calculate base price
    const basePrice = this.calculateBasePrice(
      options.serviceType,
      options.squareFootage || 1000,
      options.condition || 'good'
    );

    // Generate factors
    const factors = await this.analyzePricingFactors(orgId, options, historicalData);

    // Calculate recommended price
    const adjustmentFactor = factors.reduce(
      (acc, f) => acc + (f.impact / 100) * f.weight,
      0
    );
    const recommendedPrice = Math.round(basePrice * (1 + adjustmentFactor));

    // Calculate win probability at this price
    const winProbability = this.estimateWinProbability(
      recommendedPrice,
      historicalData,
      marketAnalysis
    );

    // Determine recommendation
    const recommendation = recommendedPrice > basePrice * 1.05
      ? 'increase'
      : recommendedPrice < basePrice * 0.95
      ? 'decrease'
      : 'maintain';

    return {
      serviceType: options.serviceType,
      currentPrice: basePrice,
      recommendedPrice,
      priceRange: {
        min: Math.round(historicalData.avgWinPrice * 0.85),
        max: Math.round(historicalData.avgWinPrice * 1.15),
      },
      confidence: 75 + Math.min(historicalData.sampleSize / 10, 20),
      winProbability,
      factors,
      competitorAnalysis: {
        avgMarketPrice: marketAnalysis.avgPrice,
        pricePosition:
          recommendedPrice < marketAnalysis.avgPrice * 0.95
            ? 'below'
            : recommendedPrice > marketAnalysis.avgPrice * 1.05
            ? 'above'
            : 'at',
        competitors: [
          { name: 'Competitor A', estimatedPrice: marketAnalysis.avgPrice * 0.9 },
          { name: 'Competitor B', estimatedPrice: marketAnalysis.avgPrice },
          { name: 'Competitor C', estimatedPrice: marketAnalysis.avgPrice * 1.1 },
        ],
      },
      historicalData: {
        avgWinPrice: historicalData.avgWinPrice,
        avgLossPrice: historicalData.avgLossPrice,
        optimalPricePoint: historicalData.optimalPrice,
        priceElasticity: historicalData.elasticity,
      },
      recommendation,
      reasoning: this.generatePricingReasoning(factors, recommendation, winProbability),
    };
  },

  /**
   * Calculate base price for service
   */
  calculateBasePrice(
    serviceType: string,
    squareFootage: number,
    condition: 'good' | 'fair' | 'poor'
  ): number {
    // Base rates per service type (per sq ft)
    const baseRates: Record<string, number> = {
      sealcoating: 0.25,
      crack_filling: 0.15,
      line_striping: 0.10,
      patching: 0.50,
      overlay: 1.50,
    };

    const conditionMultipliers: Record<string, number> = {
      good: 1.0,
      fair: 1.15,
      poor: 1.30,
    };

    const baseRate = baseRates[serviceType] || 0.25;
    const conditionMultiplier = conditionMultipliers[condition];

    return Math.round(squareFootage * baseRate * conditionMultiplier * 100) / 100;
  },

  /**
   * Analyze pricing factors
   */
  async analyzePricingFactors(
    orgId: string,
    options: Record<string, unknown>,
    historicalData: any
  ): Promise<PricingFactor[]> {
    const factors: PricingFactor[] = [];

    // Condition factor
    const condition = options.condition as string || 'good';
    factors.push({
      name: 'Surface Condition',
      impact: condition === 'poor' ? 15 : condition === 'fair' ? 8 : 0,
      direction: condition === 'good' ? 'neutral' : 'positive',
      description: `${condition.charAt(0).toUpperCase() + condition.slice(1)} condition requires ${condition === 'good' ? 'standard' : 'additional'} preparation`,
      weight: 0.25,
    });

    // Seasonality factor
    const month = new Date().getMonth();
    const seasonalIndex = [40, 50, 80, 110, 130, 140, 150, 140, 120, 90, 60, 40][month];
    const seasonalImpact = (seasonalIndex - 100) / 5;
    factors.push({
      name: 'Seasonal Demand',
      impact: seasonalImpact,
      direction: seasonalImpact > 0 ? 'positive' : seasonalImpact < 0 ? 'negative' : 'neutral',
      description: seasonalIndex > 100 ? 'Peak season pricing applies' : 'Off-season rates available',
      weight: 0.20,
    });

    // Client relationship factor
    if (options.clientId) {
      const clientHistory = await this.getClientHistory(options.clientId as string);
      const repeatBonus = clientHistory.repeatCustomer ? -5 : 0;
      factors.push({
        name: 'Client Relationship',
        impact: repeatBonus,
        direction: repeatBonus < 0 ? 'negative' : 'neutral',
        description: clientHistory.repeatCustomer ? 'Repeat customer loyalty discount' : 'New customer standard rate',
        weight: 0.15,
      });
    }

    // Volume factor
    const sqft = options.squareFootage as number || 1000;
    const volumeDiscount = sqft > 10000 ? -10 : sqft > 5000 ? -5 : 0;
    factors.push({
      name: 'Project Size',
      impact: volumeDiscount,
      direction: volumeDiscount < 0 ? 'negative' : 'neutral',
      description: volumeDiscount < 0 ? 'Volume discount applicable' : 'Standard volume rate',
      weight: 0.15,
    });

    // Market position factor
    const marketPosition = historicalData.avgWinPrice > historicalData.avgLossPrice ? 5 : -5;
    factors.push({
      name: 'Market Position',
      impact: marketPosition,
      direction: marketPosition > 0 ? 'positive' : 'negative',
      description: marketPosition > 0 ? 'Strong market position allows premium pricing' : 'Competitive pricing recommended',
      weight: 0.25,
    });

    return factors;
  },

  /**
   * Get historical pricing data
   */
  async getHistoricalPricingData(
    orgId: string,
    serviceType: string
  ): Promise<{
    avgWinPrice: number;
    avgLossPrice: number;
    optimalPrice: number;
    elasticity: number;
    sampleSize: number;
  }> {
    const { data: proposals } = await supabase
      .from('proposals')
      .select('total_amount, status')
      .eq('org_id', orgId)
      .in('status', ['signed', 'rejected']);

    if (!proposals || proposals.length < 5) {
      // Return industry defaults
      return {
        avgWinPrice: 5000,
        avgLossPrice: 6000,
        optimalPrice: 4800,
        elasticity: -0.5,
        sampleSize: proposals?.length || 0,
      };
    }

    const wonDeals = proposals.filter((p) => p.status === 'signed');
    const lostDeals = proposals.filter((p) => p.status === 'rejected');

    const avgWinPrice = wonDeals.length > 0
      ? wonDeals.reduce((sum, p) => sum + (p.total_amount || 0), 0) / wonDeals.length
      : 5000;

    const avgLossPrice = lostDeals.length > 0
      ? lostDeals.reduce((sum, p) => sum + (p.total_amount || 0), 0) / lostDeals.length
      : avgWinPrice * 1.2;

    // Calculate optimal price point
    const optimalPrice = avgWinPrice * 0.95;

    // Estimate price elasticity
    const elasticity = avgLossPrice > avgWinPrice
      ? -((lostDeals.length / proposals.length) / ((avgLossPrice - avgWinPrice) / avgWinPrice))
      : -0.5;

    return {
      avgWinPrice,
      avgLossPrice,
      optimalPrice,
      elasticity,
      sampleSize: proposals.length,
    };
  },

  /**
   * Get client history
   */
  async getClientHistory(clientId: string): Promise<{
    repeatCustomer: boolean;
    totalSpend: number;
    dealCount: number;
  }> {
    const { data: proposals } = await supabase
      .from('proposals')
      .select('total_amount, status')
      .eq('client_id', clientId)
      .eq('status', 'signed');

    return {
      repeatCustomer: (proposals?.length || 0) > 1,
      totalSpend: proposals?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0,
      dealCount: proposals?.length || 0,
    };
  },

  /**
   * Estimate win probability
   */
  estimateWinProbability(
    price: number,
    historicalData: any,
    marketAnalysis: MarketAnalysis
  ): number {
    const baseProb = 50;

    // Price vs historical wins
    const priceDiff = (price - historicalData.avgWinPrice) / historicalData.avgWinPrice;
    const priceImpact = priceDiff * historicalData.elasticity * 100;

    // Market position
    const marketDiff = (price - marketAnalysis.avgPrice) / marketAnalysis.avgPrice;
    const marketImpact = marketDiff < 0 ? Math.abs(marketDiff) * 20 : -marketDiff * 30;

    // Seasonal adjustment
    const seasonalImpact = (marketAnalysis.seasonalFactor - 100) / 10;

    const probability = Math.min(95, Math.max(5,
      baseProb + priceImpact + marketImpact + seasonalImpact
    ));

    return Math.round(probability);
  },

  /**
   * Generate pricing reasoning
   */
  generatePricingReasoning(
    factors: PricingFactor[],
    recommendation: string,
    winProbability: number
  ): string {
    const mainFactors = factors
      .filter((f) => Math.abs(f.impact) > 3)
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
      .slice(0, 3);

    const factorDescriptions = mainFactors
      .map((f) => f.description.toLowerCase())
      .join(', ');

    return `Based on analysis of ${factors.length} pricing factors (${factorDescriptions}), we recommend ${recommendation === 'increase' ? 'increasing' : recommendation === 'decrease' ? 'decreasing' : 'maintaining'} the price. At this price point, the estimated win probability is ${winProbability}%.`;
  },

  // --------------------------------------------------------------------------
  // Win Probability Prediction
  // --------------------------------------------------------------------------

  /**
   * Predict win probability for a proposal
   */
  async predictWinProbability(
    proposalId: string
  ): Promise<WinProbabilityPrediction> {
    const { data: proposal } = await supabase
      .from('proposals')
      .select(`
        *,
        clients (*)
      `)
      .eq('id', proposalId)
      .single();

    if (!proposal) throw new Error('Proposal not found');

    // Analyze factors
    const factors = await this.analyzeWinFactors(proposal);

    // Calculate overall probability
    const probability = this.calculateWinProbability(factors);

    // Find similar deals
    const similarDeals = await this.findSimilarDeals(proposal);

    // Generate suggestions
    const suggestions = this.generateWinSuggestions(factors);

    return {
      proposalId,
      probability,
      confidence: 70 + (similarDeals.length > 5 ? 15 : similarDeals.length * 3),
      factors,
      suggestions,
      similarDeals,
    };
  },

  /**
   * Analyze win factors
   */
  async analyzeWinFactors(proposal: Record<string, unknown>): Promise<WinFactor[]> {
    const factors: WinFactor[] = [];

    // Price competitiveness
    const avgDealSize = 15000; // Would calculate from org data
    const priceScore = proposal.total_amount
      ? Math.min(100, Math.max(0, 100 - Math.abs((proposal.total_amount as number) - avgDealSize) / avgDealSize * 50))
      : 50;
    factors.push({
      name: 'Price Competitiveness',
      score: priceScore,
      impact: priceScore < 50 ? 'high' : 'medium',
      suggestion: priceScore < 50 ? 'Consider adjusting price closer to market average' : undefined,
    });

    // Client relationship
    const client = proposal.clients as any;
    const relationshipScore = client?.lifetime_value ? Math.min(100, client.lifetime_value / 1000) : 30;
    factors.push({
      name: 'Client Relationship',
      score: relationshipScore,
      impact: relationshipScore < 40 ? 'high' : 'low',
      suggestion: relationshipScore < 40 ? 'Build relationship before sending proposal' : undefined,
    });

    // Timing
    const daysSinceCreated = proposal.created_at
      ? (Date.now() - new Date(proposal.created_at as string).getTime()) / (1000 * 60 * 60 * 24)
      : 0;
    const timingScore = Math.max(0, 100 - daysSinceCreated * 3);
    factors.push({
      name: 'Proposal Freshness',
      score: timingScore,
      impact: timingScore < 50 ? 'high' : 'low',
      suggestion: timingScore < 50 ? 'Follow up soon - proposal aging' : undefined,
    });

    // Engagement
    const viewCount = (proposal.view_count as number) || 0;
    const engagementScore = Math.min(100, viewCount * 20);
    factors.push({
      name: 'Client Engagement',
      score: engagementScore,
      impact: engagementScore < 30 ? 'high' : 'medium',
      suggestion: engagementScore < 30 ? 'Client has not viewed proposal - follow up' : undefined,
    });

    // Completeness
    const hasSignature = !!(proposal.signature_requested);
    const hasPayment = !!(proposal.payment_enabled);
    const completenessScore = (hasSignature ? 50 : 0) + (hasPayment ? 50 : 0);
    factors.push({
      name: 'Proposal Completeness',
      score: completenessScore,
      impact: completenessScore < 100 ? 'medium' : 'low',
      suggestion: completenessScore < 100 ? 'Add signature/payment options to streamline acceptance' : undefined,
    });

    return factors;
  },

  /**
   * Calculate win probability from factors
   */
  calculateWinProbability(factors: WinFactor[]): number {
    const weights: Record<string, number> = {
      'Price Competitiveness': 0.30,
      'Client Relationship': 0.25,
      'Proposal Freshness': 0.15,
      'Client Engagement': 0.20,
      'Proposal Completeness': 0.10,
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const factor of factors) {
      const weight = weights[factor.name] || 0.1;
      weightedSum += factor.score * weight;
      totalWeight += weight;
    }

    return Math.round(weightedSum / totalWeight);
  },

  /**
   * Find similar deals
   */
  async findSimilarDeals(
    proposal: Record<string, unknown>
  ): Promise<SimilarDeal[]> {
    const orgId = proposal.org_id as string;
    const amount = proposal.total_amount as number;

    const { data: similar } = await supabase
      .from('proposals')
      .select('id, proposal_number, total_amount, status, clients (name)')
      .eq('org_id', orgId)
      .in('status', ['signed', 'rejected'])
      .gte('total_amount', amount * 0.7)
      .lte('total_amount', amount * 1.3)
      .limit(10);

    return (similar || []).map((s) => ({
      proposalId: s.id,
      clientName: (s.clients as any)?.name || 'Unknown',
      value: s.total_amount,
      outcome: s.status === 'signed' ? 'won' : 'lost',
      similarity: Math.round(100 - Math.abs(s.total_amount - amount) / amount * 100),
    }));
  },

  /**
   * Generate win suggestions
   */
  generateWinSuggestions(factors: WinFactor[]): string[] {
    return factors
      .filter((f) => f.suggestion && f.score < 70)
      .sort((a, b) => {
        const impactOrder = { high: 3, medium: 2, low: 1 };
        return impactOrder[b.impact] - impactOrder[a.impact];
      })
      .map((f) => f.suggestion!)
      .slice(0, 5);
  },

  // --------------------------------------------------------------------------
  // Price Optimization
  // --------------------------------------------------------------------------

  /**
   * Optimize price for maximum expected value
   */
  async optimizePrice(
    orgId: string,
    basePrice: number,
    options?: { minPrice?: number; maxPrice?: number }
  ): Promise<OptimizationResult> {
    const minPrice = options?.minPrice || basePrice * 0.7;
    const maxPrice = options?.maxPrice || basePrice * 1.3;

    const historicalData = await this.getHistoricalPricingData(orgId, 'sealcoating');
    const marketAnalysis = await this.getMarketAnalysis('sealcoating', 'default');

    const tradeoffs: OptimizationTradeoff[] = [];
    let optimalPrice = basePrice;
    let maxExpectedValue = 0;

    // Test price points
    for (let price = minPrice; price <= maxPrice; price += (maxPrice - minPrice) / 10) {
      const winProb = this.estimateWinProbability(price, historicalData, marketAnalysis) / 100;
      const expectedValue = price * winProb;

      tradeoffs.push({
        price: Math.round(price),
        winProbability: Math.round(winProb * 100),
        expectedValue: Math.round(expectedValue),
      });

      if (expectedValue > maxExpectedValue) {
        maxExpectedValue = expectedValue;
        optimalPrice = price;
      }
    }

    const optimalWinRate = this.estimateWinProbability(optimalPrice, historicalData, marketAnalysis);

    return {
      originalPrice: basePrice,
      optimizedPrice: Math.round(optimalPrice),
      expectedWinRate: optimalWinRate,
      expectedRevenue: Math.round(maxExpectedValue),
      tradeoffs,
    };
  },

  // --------------------------------------------------------------------------
  // Market Analysis
  // --------------------------------------------------------------------------

  /**
   * Get market analysis
   */
  async getMarketAnalysis(
    serviceType: string,
    region: string
  ): Promise<MarketAnalysis> {
    // In production, this would fetch from market data API or internal benchmarks
    const marketData: Record<string, Partial<MarketAnalysis>> = {
      sealcoating: {
        avgPrice: 0.22,
        priceRange: { min: 0.15, max: 0.35 },
        demandLevel: 'high',
        competitorCount: 15,
      },
      crack_filling: {
        avgPrice: 1.50,
        priceRange: { min: 1.00, max: 3.00 },
        demandLevel: 'medium',
        competitorCount: 12,
      },
      line_striping: {
        avgPrice: 5.00,
        priceRange: { min: 4.00, max: 7.00 },
        demandLevel: 'medium',
        competitorCount: 8,
      },
    };

    const data = marketData[serviceType] || marketData.sealcoating;
    const month = new Date().getMonth();
    const seasonalFactor = [40, 50, 80, 110, 130, 140, 150, 140, 120, 90, 60, 40][month];

    return {
      serviceType,
      region,
      avgPrice: (data.avgPrice || 0.22) * 1000, // Convert to per job estimate
      priceRange: {
        min: (data.priceRange?.min || 0.15) * 1000,
        max: (data.priceRange?.max || 0.35) * 1000,
      },
      demandLevel: data.demandLevel || 'medium',
      seasonalFactor,
      competitorCount: data.competitorCount || 10,
      marketTrend: 'stable',
    };
  },

  // --------------------------------------------------------------------------
  // Deal Scoring
  // --------------------------------------------------------------------------

  /**
   * Score a deal
   */
  async scoreDeal(proposalId: string): Promise<DealScoring> {
    const prediction = await this.predictWinProbability(proposalId);
    const factors = prediction.factors;

    const dimensions = {
      clientFit: factors.find((f) => f.name === 'Client Relationship')?.score || 50,
      dealSize: factors.find((f) => f.name === 'Price Competitiveness')?.score || 50,
      timing: factors.find((f) => f.name === 'Proposal Freshness')?.score || 50,
      competition: 70, // Would analyze competitive mentions
      relationship: factors.find((f) => f.name === 'Client Engagement')?.score || 50,
    };

    const overallScore = Math.round(
      (dimensions.clientFit * 0.25 +
        dimensions.dealSize * 0.20 +
        dimensions.timing * 0.15 +
        dimensions.competition * 0.20 +
        dimensions.relationship * 0.20)
    );

    return {
      proposalId,
      overallScore,
      dimensions,
      recommendations: prediction.suggestions,
    };
  },

  // --------------------------------------------------------------------------
  // Pricing Models
  // --------------------------------------------------------------------------

  /**
   * Get pricing models
   */
  async getPricingModels(orgId: string): Promise<PricingModel[]> {
    const { data, error } = await supabase
      .from('pricing_models')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(transformPricingModel);
  },

  /**
   * Create pricing model
   */
  async createPricingModel(
    orgId: string,
    model: Omit<PricingModel, 'id' | 'orgId' | 'accuracy' | 'lastTrainedAt' | 'createdAt'>
  ): Promise<PricingModel> {
    const { data, error } = await supabase
      .from('pricing_models')
      .insert({
        org_id: orgId,
        name: model.name,
        service_type: model.serviceType,
        base_price: model.basePrice,
        variables: model.variables,
        rules: model.rules,
        is_active: model.isActive,
        accuracy: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return transformPricingModel(data);
  },

  /**
   * Train pricing model
   */
  async trainPricingModel(modelId: string): Promise<{ accuracy: number }> {
    // In production, this would use ML training
    const accuracy = 75 + Math.random() * 20;

    await supabase
      .from('pricing_models')
      .update({
        accuracy,
        last_trained_at: new Date().toISOString(),
      })
      .eq('id', modelId);

    return { accuracy };
  },
};

// ============================================================================
// HELPERS
// ============================================================================

function transformPricingModel(row: Record<string, unknown>): PricingModel {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    name: row.name as string,
    serviceType: row.service_type as string,
    basePrice: row.base_price as number,
    variables: (row.variables || []) as PricingVariable[],
    rules: (row.rules || []) as PricingRule[],
    isActive: row.is_active as boolean,
    accuracy: row.accuracy as number,
    lastTrainedAt: row.last_trained_at as string,
    createdAt: row.created_at as string,
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export default aiPricingService;
