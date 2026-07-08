export type IssueCategory = 'electricity' | 'garbage' | 'sanitation' | 'road_accidents' | 'infrastructure';

export interface LocationInfo {
  locality: string;
  constituency: string;
  state: string;
}

export interface AIAnalysis {
  recurringFrequency: 'high' | 'medium' | 'low';
  broaderImpact: string; // how resolving this acts as "optimistic wealth" / asset for society
  actionPriority: 'immediate' | 'medium_term' | 'long_term';
  tags: string[];
  estimatedCostRange?: string;
  safetyHazardLevel?: 'critical' | 'moderate' | 'low';
}

export interface CommunityIssue {
  id: string;
  category: IssueCategory;
  title: string;
  description: string;
  location: LocationInfo;
  reportedBy: string;
  reportedAt: string;
  impactScale: number; // 1 to 5 scale (1 = single household, 5 = whole ward/community)
  status: 'pending_analysis' | 'detected' | 'action_prioritized' | 'resolved';
  optimistic?: boolean; // client-only flag for Optimistic UI updates
  aiAnalysis?: AIAnalysis;
}

export interface NeedCluster {
  id: string;
  category: IssueCategory;
  title: string;
  constituency: string;
  state: string;
  issueIds: string[];
  summary: string;
  householdCount: number;
  urgencyScore: number; // 1-100
  wealthMultiplicationFactor: string; // how resolving this acts as community progression / social asset
  recommendedAction: string;
}

export interface ActionStep {
  step: string;
  priority: 'High' | 'Medium' | 'Normal';
  timeline: string;
  citizenRole: string; // how citizens help as a team
}

export interface MPBriefing {
  id: string;
  clusterId: string;
  mpName: string;
  constituency: string;
  state: string;
  date: string;
  title: string;
  executiveSummary: string;
  formalLetter: string; // Markdown letter formatted for the MP
  actionPlan: ActionStep[];
  communityContribution: string; // how the community works together as a team
  status: 'draft' | 'sent' | 'acknowledged' | 'action_taken';
}
