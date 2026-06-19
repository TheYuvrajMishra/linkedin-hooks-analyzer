export interface Post {
  id: string;
  postUrl: string;
  publishedAt: string | null;
  impressions: number;
  engagements: number;
  engagementRate: number;
  postText: string | null;
  hook: string | null;
  hookType: string | null;
  topic: string | null;
  hookLength: number | null;
  openingWords: string | null;
  sentenceStructure: string | null;
  analyzed: boolean;
}

export interface DailyMetric {
  id: string;
  date: string;
  impressions: number;
  engagements: number;
}

export interface FollowerMetric {
  id: string;
  date: string;
  newFollowers: number;
}

export interface DemographicMetric {
  id: string;
  category: string;
  value: string;
  percentage: number;
}

export interface AIAnalysis {
  id: string;
  winningHooks: string[];
  winningTopics: string[];
  recommendations: string[];
  suggestedHooks?: Array<{ hookTemplate: string; hookType: string; topic: string; explanation: string }>;
  createdAt: string;
}

export interface DBStatus {
  isFallback: boolean;
  databaseType: string;
  stats: {
    totalPosts: number;
    analyzedPosts: number;
    dailyMetricsCount: number;
    followerMetricsCount: number;
    demographicsCount: number;
    hasAIInsights: boolean;
  };
}
