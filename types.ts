export interface UserProfile {
  username: string;
  role: string;
  department: string;
  avatarUrl: string;
}

export interface AnalysisResult {
  id: string;
  imageUrl: string;
  timestamp: string;
  bacteriaType: string;
  confidence: number;
  notes: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface PiResponse {
  success: boolean;
  data?: {
    identified_bacteria: string;
    confidence_score: number;
    analysis_time_ms: number;
  };
  error?: string;
}