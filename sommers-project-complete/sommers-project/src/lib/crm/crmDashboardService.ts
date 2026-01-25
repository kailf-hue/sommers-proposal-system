/**
 * Sommer's Proposal System - CRM Dashboard Service
 * Phase 41: Advanced CRM metrics, client insights, and activity tracking
 */

import { supabase } from '../supabase';

// ============================================================================
// TYPES
// ============================================================================

export interface CRMDashboardData {
  overview: CRMOverview;
  clientMetrics: ClientMetrics;
  recentActivity: ActivityItem[];
  topClients: TopClient[];
  clientSegments: ClientSegment[];
  healthScores: HealthScoreDistribution;
  upcomingTasks: Task[];
  engagementTrends: EngagementTrend[];
}

export interface CRMOverview {
  totalClients: number;
  activeClients: number;
  newClientsThisMonth: number;
  clientGrowthRate: number;
  averageLifetimeValue: number;
  totalRevenue: number;
  averageProposalValue: number;
  repeatClientRate: number;
}

export interface ClientMetrics {
  byStatus: { status: string; count: number; value: number }[];
  bySource: { source: string; count: number }[];
  byIndustry: { industry: string; count: number }[];
  acquisitionTrend: { month: string; count: number }[];
}

export interface ActivityItem {
  id: string;
  type: 'proposal_sent' | 'proposal_viewed' | 'proposal_signed' | 'payment_received' | 'email_opened' | 'meeting_scheduled' | 'note_added' | 'call_logged';
  clientId: string;
  clientName: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  createdBy?: string;
}

export interface TopClient {
  id: string;
  name: string;
  email: string;
  totalRevenue: number;
  proposalCount: number;
  winRate: number;
  lastActivity: string;
  healthScore: number;
  tags: string[];
}

export interface ClientSegment {
  id: string;
  name: string;
  description: string;
  criteria: SegmentCriteria[];
  clientCount: number;
  totalValue: number;
  color: string;
}

export interface SegmentCriteria {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
  value: unknown;
}

export interface HealthScoreDistribution {
  excellent: number; // 80-100
  good: number;      // 60-79
  fair: number;      // 40-59
  atRisk: number;    // 0-39
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  clientId?: string;
  clientName?: string;
  assigneeId: string;
  assigneeName: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  relatedType?: string;
  relatedId?: string;
}

export interface EngagementTrend {
  date: string;
  emailsOpened: number;
  proposalsViewed: number;
  meetingsHeld: number;
  callsMade: number;
}

export interface ClientHealthScore {
  clientId: string;
  score: number;
  factors: HealthFactor[];
  trend: 'up' | 'down' | 'stable';
  lastCalculated: string;
}

export interface HealthFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
}

// ============================================================================
// CRM DASHBOARD SERVICE
// ============================================================================

export const crmDashboardService = {
  // --------------------------------------------------------------------------
  // Dashboard Data
  // --------------------------------------------------------------------------

  /**
   * Get complete CRM dashboard data
   */
  async getDashboardData(orgId: string): Promise<CRMDashboardData> {
    const [
      overview,
      clientMetrics,
      recentActivity,
      topClients,
      clientSegments,
      healthScores,
      upcomingTasks,
      engagementTrends,
    ] = await Promise.all([
      this.getOverview(orgId),
      this.getClientMetrics(orgId),
      this.getRecentActivity(orgId, 20),
      this.getTopClients(orgId, 10),
      this.getClientSegments(orgId),
      this.getHealthScoreDistribution(orgId),
      this.getUpcomingTasks(orgId, 10),
      this.getEngagementTrends(orgId, 30),
    ]);

    return {
      overview,
      clientMetrics,
      recentActivity,
      topClients,
      clientSegments,
      healthScores,
      upcomingTasks,
      engagementTrends,
    };
  },

  /**
   * Get CRM overview metrics
   */
  async getOverview(orgId: string): Promise<CRMOverview> {
    // Get client counts
    const { count: totalClients } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    const { count: activeClients } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'active');

    // Get new clients this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: newClientsThisMonth } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .gte('created_at', startOfMonth.toISOString());

    // Get last month's new clients for growth rate
    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

    const { count: newClientsLastMonth } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .gte('created_at', startOfLastMonth.toISOString())
      .lt('created_at', startOfMonth.toISOString());

    const clientGrowthRate = newClientsLastMonth
      ? ((newClientsThisMonth || 0) - newClientsLastMonth) / newClientsLastMonth * 100
      : 0;

    // Get revenue metrics from proposals
    const { data: revenueData } = await supabase
      .from('proposals')
      .select('total_amount')
      .eq('org_id', orgId)
      .eq('status', 'accepted');

    const totalRevenue = revenueData?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
    const averageProposalValue = revenueData?.length
      ? totalRevenue / revenueData.length
      : 0;

    // Calculate average lifetime value
    const averageLifetimeValue = totalClients
      ? totalRevenue / totalClients
      : 0;

    // Get repeat client rate
    const { data: clientProposalCounts } = await supabase
      .from('proposals')
      .select('client_id')
      .eq('org_id', orgId)
      .eq('status', 'accepted');

    const clientProposals = clientProposalCounts?.reduce((acc, p) => {
      acc[p.client_id] = (acc[p.client_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const repeatClients = Object.values(clientProposals).filter(count => count > 1).length;
    const repeatClientRate = Object.keys(clientProposals).length
      ? (repeatClients / Object.keys(clientProposals).length) * 100
      : 0;

    return {
      totalClients: totalClients || 0,
      activeClients: activeClients || 0,
      newClientsThisMonth: newClientsThisMonth || 0,
      clientGrowthRate: Math.round(clientGrowthRate * 10) / 10,
      averageLifetimeValue: Math.round(averageLifetimeValue),
      totalRevenue,
      averageProposalValue: Math.round(averageProposalValue),
      repeatClientRate: Math.round(repeatClientRate * 10) / 10,
    };
  },

  /**
   * Get client metrics breakdown
   */
  async getClientMetrics(orgId: string): Promise<ClientMetrics> {
    // By status
    const { data: statusData } = await supabase
      .from('clients')
      .select('status')
      .eq('org_id', orgId);

    const byStatus = Object.entries(
      statusData?.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {}
    ).map(([status, count]) => ({ status, count, value: 0 }));

    // By source
    const { data: sourceData } = await supabase
      .from('clients')
      .select('source')
      .eq('org_id', orgId);

    const bySource = Object.entries(
      sourceData?.reduce((acc, c) => {
        const source = c.source || 'Unknown';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {}
    ).map(([source, count]) => ({ source, count }));

    // By industry (if available)
    const { data: industryData } = await supabase
      .from('clients')
      .select('industry')
      .eq('org_id', orgId);

    const byIndustry = Object.entries(
      industryData?.reduce((acc, c) => {
        const industry = c.industry || 'Other';
        acc[industry] = (acc[industry] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {}
    ).map(([industry, count]) => ({ industry, count }));

    // Acquisition trend (last 6 months)
    const acquisitionTrend: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const { count } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString());

      acquisitionTrend.push({
        month: startOfMonth.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        count: count || 0,
      });
    }

    return { byStatus, bySource, byIndustry, acquisitionTrend };
  },

  /**
   * Get recent activity feed
   */
  async getRecentActivity(orgId: string, limit: number = 20): Promise<ActivityItem[]> {
    const { data, error } = await supabase
      .from('activity_log')
      .select(`
        id,
        type,
        client_id,
        description,
        metadata,
        created_at,
        created_by,
        clients (name)
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      // If activity_log doesn't exist, return mock data
      return this.getMockRecentActivity();
    }

    return (data || []).map((item) => ({
      id: item.id,
      type: item.type as ActivityItem['type'],
      clientId: item.client_id,
      clientName: (item.clients as any)?.name || 'Unknown',
      description: item.description,
      metadata: item.metadata,
      createdAt: item.created_at,
      createdBy: item.created_by,
    }));
  },

  /**
   * Get mock recent activity for demo
   */
  getMockRecentActivity(): ActivityItem[] {
    const now = new Date();
    return [
      { id: '1', type: 'proposal_signed', clientId: '1', clientName: 'Acme Corp', description: 'Signed proposal SOM-2026-0156', createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() },
      { id: '2', type: 'proposal_viewed', clientId: '2', clientName: 'Smith Properties', description: 'Viewed proposal 3 times', createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString() },
      { id: '3', type: 'payment_received', clientId: '3', clientName: 'Downtown Mall LLC', description: 'Payment of $12,500 received', createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString() },
      { id: '4', type: 'proposal_sent', clientId: '4', clientName: 'Johnson Realty', description: 'Proposal SOM-2026-0158 sent', createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString() },
      { id: '5', type: 'meeting_scheduled', clientId: '5', clientName: 'Tech Park Inc', description: 'Site visit scheduled for Jan 28', createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString() },
      { id: '6', type: 'email_opened', clientId: '2', clientName: 'Smith Properties', description: 'Opened follow-up email', createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString() },
      { id: '7', type: 'note_added', clientId: '1', clientName: 'Acme Corp', description: 'Added note: Interested in annual contract', createdAt: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString() },
      { id: '8', type: 'call_logged', clientId: '6', clientName: 'Harbor View Plaza', description: 'Discussed project timeline (15 min)', createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString() },
    ];
  },

  /**
   * Get top clients by revenue
   */
  async getTopClients(orgId: string, limit: number = 10): Promise<TopClient[]> {
    const { data: clients } = await supabase
      .from('clients')
      .select(`
        id,
        name,
        email,
        tags,
        proposals (
          id,
          status,
          total_amount,
          updated_at
        )
      `)
      .eq('org_id', orgId)
      .limit(50);

    if (!clients) return [];

    const topClients = clients
      .map((client) => {
        const proposals = (client.proposals as any[]) || [];
        const acceptedProposals = proposals.filter(p => p.status === 'accepted');
        const totalRevenue = acceptedProposals.reduce((sum, p) => sum + (p.total_amount || 0), 0);
        const winRate = proposals.length > 0
          ? (acceptedProposals.length / proposals.length) * 100
          : 0;
        const lastActivity = proposals.length > 0
          ? proposals.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0].updated_at
          : null;

        return {
          id: client.id,
          name: client.name,
          email: client.email,
          totalRevenue,
          proposalCount: proposals.length,
          winRate: Math.round(winRate),
          lastActivity: lastActivity || '',
          healthScore: this.calculateClientHealthScore(client, proposals),
          tags: client.tags || [],
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);

    return topClients;
  },

  /**
   * Calculate client health score
   */
  calculateClientHealthScore(client: any, proposals: any[]): number {
    let score = 50; // Base score

    // Recent activity (+20)
    const lastProposal = proposals[0];
    if (lastProposal) {
      const daysSince = (Date.now() - new Date(lastProposal.updated_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 30) score += 20;
      else if (daysSince < 90) score += 10;
      else score -= 10;
    }

    // Win rate (+20)
    const acceptedCount = proposals.filter(p => p.status === 'accepted').length;
    const winRate = proposals.length > 0 ? acceptedCount / proposals.length : 0;
    score += Math.round(winRate * 20);

    // Revenue (+10)
    const revenue = proposals
      .filter(p => p.status === 'accepted')
      .reduce((sum, p) => sum + (p.total_amount || 0), 0);
    if (revenue > 50000) score += 10;
    else if (revenue > 10000) score += 5;

    return Math.min(100, Math.max(0, score));
  },

  /**
   * Get client segments
   */
  async getClientSegments(orgId: string): Promise<ClientSegment[]> {
    const { data: segments } = await supabase
      .from('client_segments')
      .select('*')
      .eq('org_id', orgId);

    if (!segments || segments.length === 0) {
      // Return default segments
      return this.getDefaultSegments(orgId);
    }

    return segments.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      criteria: s.criteria || [],
      clientCount: s.client_count || 0,
      totalValue: s.total_value || 0,
      color: s.color || '#6B7280',
    }));
  },

  /**
   * Get default segments
   */
  async getDefaultSegments(orgId: string): Promise<ClientSegment[]> {
    // Calculate segment counts
    const { data: clients } = await supabase
      .from('clients')
      .select(`
        id,
        proposals (total_amount, status)
      `)
      .eq('org_id', orgId);

    const clientsWithRevenue = (clients || []).map((c) => {
      const revenue = ((c.proposals as any[]) || [])
        .filter(p => p.status === 'accepted')
        .reduce((sum, p) => sum + (p.total_amount || 0), 0);
      return { id: c.id, revenue };
    });

    const vip = clientsWithRevenue.filter(c => c.revenue >= 50000);
    const regular = clientsWithRevenue.filter(c => c.revenue >= 10000 && c.revenue < 50000);
    const newClients = clientsWithRevenue.filter(c => c.revenue < 10000 && c.revenue > 0);
    const prospects = clientsWithRevenue.filter(c => c.revenue === 0);

    return [
      {
        id: 'vip',
        name: 'VIP Clients',
        description: 'High-value clients with $50K+ lifetime value',
        criteria: [{ field: 'lifetime_value', operator: 'greater_than', value: 50000 }],
        clientCount: vip.length,
        totalValue: vip.reduce((sum, c) => sum + c.revenue, 0),
        color: '#F59E0B',
      },
      {
        id: 'regular',
        name: 'Regular Clients',
        description: 'Clients with $10K-$50K lifetime value',
        criteria: [{ field: 'lifetime_value', operator: 'greater_than', value: 10000 }],
        clientCount: regular.length,
        totalValue: regular.reduce((sum, c) => sum + c.revenue, 0),
        color: '#10B981',
      },
      {
        id: 'new',
        name: 'New Clients',
        description: 'Recently acquired clients',
        criteria: [{ field: 'lifetime_value', operator: 'less_than', value: 10000 }],
        clientCount: newClients.length,
        totalValue: newClients.reduce((sum, c) => sum + c.revenue, 0),
        color: '#3B82F6',
      },
      {
        id: 'prospects',
        name: 'Prospects',
        description: 'Potential clients with no completed deals',
        criteria: [{ field: 'lifetime_value', operator: 'equals', value: 0 }],
        clientCount: prospects.length,
        totalValue: 0,
        color: '#8B5CF6',
      },
    ];
  },

  /**
   * Get health score distribution
   */
  async getHealthScoreDistribution(orgId: string): Promise<HealthScoreDistribution> {
    const topClients = await this.getTopClients(orgId, 100);

    return {
      excellent: topClients.filter(c => c.healthScore >= 80).length,
      good: topClients.filter(c => c.healthScore >= 60 && c.healthScore < 80).length,
      fair: topClients.filter(c => c.healthScore >= 40 && c.healthScore < 60).length,
      atRisk: topClients.filter(c => c.healthScore < 40).length,
    };
  },

  /**
   * Get upcoming tasks
   */
  async getUpcomingTasks(orgId: string, limit: number = 10): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        clients (name),
        team_members (name)
      `)
      .eq('org_id', orgId)
      .in('status', ['pending', 'in_progress'])
      .order('due_date', { ascending: true })
      .limit(limit);

    if (error || !data) {
      return this.getMockTasks();
    }

    return data.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      clientId: t.client_id,
      clientName: (t.clients as any)?.name,
      assigneeId: t.assignee_id,
      assigneeName: (t.team_members as any)?.name || 'Unassigned',
      dueDate: t.due_date,
      priority: t.priority,
      status: t.status,
      relatedType: t.related_type,
      relatedId: t.related_id,
    }));
  },

  /**
   * Get mock tasks for demo
   */
  getMockTasks(): Task[] {
    const now = new Date();
    return [
      { id: '1', title: 'Follow up with Acme Corp', clientName: 'Acme Corp', clientId: '1', assigneeId: '1', assigneeName: 'John Smith', dueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), priority: 'high', status: 'pending' },
      { id: '2', title: 'Site visit - Smith Properties', clientName: 'Smith Properties', clientId: '2', assigneeId: '2', assigneeName: 'Sarah Johnson', dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), priority: 'medium', status: 'pending' },
      { id: '3', title: 'Send revised proposal', clientName: 'Downtown Mall', clientId: '3', assigneeId: '1', assigneeName: 'John Smith', dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), priority: 'high', status: 'in_progress' },
      { id: '4', title: 'Schedule project kickoff', clientName: 'Tech Park Inc', clientId: '5', assigneeId: '3', assigneeName: 'Mike Brown', dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), priority: 'medium', status: 'pending' },
      { id: '5', title: 'Review contract terms', clientName: 'Harbor View', clientId: '6', assigneeId: '1', assigneeName: 'John Smith', dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), priority: 'low', status: 'pending' },
    ];
  },

  /**
   * Get engagement trends
   */
  async getEngagementTrends(orgId: string, days: number = 30): Promise<EngagementTrend[]> {
    // In production, aggregate from activity_log
    // For now, return mock data
    const trends: EngagementTrend[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      trends.push({
        date: date.toISOString().split('T')[0],
        emailsOpened: Math.floor(Math.random() * 20) + 5,
        proposalsViewed: Math.floor(Math.random() * 15) + 3,
        meetingsHeld: Math.floor(Math.random() * 5),
        callsMade: Math.floor(Math.random() * 10) + 2,
      });
    }

    return trends;
  },

  // --------------------------------------------------------------------------
  // Activity Logging
  // --------------------------------------------------------------------------

  /**
   * Log an activity
   */
  async logActivity(
    orgId: string,
    activity: {
      type: ActivityItem['type'];
      clientId: string;
      description: string;
      metadata?: Record<string, unknown>;
      createdBy?: string;
    }
  ): Promise<void> {
    await supabase.from('activity_log').insert({
      org_id: orgId,
      type: activity.type,
      client_id: activity.clientId,
      description: activity.description,
      metadata: activity.metadata,
      created_by: activity.createdBy,
    });
  },

  // --------------------------------------------------------------------------
  // Task Management
  // --------------------------------------------------------------------------

  /**
   * Create a task
   */
  async createTask(
    orgId: string,
    task: Omit<Task, 'id' | 'status'>
  ): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        org_id: orgId,
        title: task.title,
        description: task.description,
        client_id: task.clientId,
        assignee_id: task.assigneeId,
        due_date: task.dueDate,
        priority: task.priority,
        related_type: task.relatedType,
        related_id: task.relatedId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      clientId: data.client_id,
      assigneeId: data.assignee_id,
      assigneeName: '',
      dueDate: data.due_date,
      priority: data.priority,
      status: data.status,
      relatedType: data.related_type,
      relatedId: data.related_id,
    };
  },

  /**
   * Update task status
   */
  async updateTaskStatus(taskId: string, status: Task['status']): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) throw error;
  },

  /**
   * Complete a task
   */
  async completeTask(taskId: string): Promise<void> {
    await this.updateTaskStatus(taskId, 'completed');
  },
};

// ============================================================================
// EXPORT
// ============================================================================

export default crmDashboardService;
