export type VisitType =
  | 'Farmer Visit'
  | 'Dealer Visit'
  | 'Distributor Visit'
  | 'Field Visit'
  | 'Field Program'
  | 'Other';

export interface Employee {
  id: string;
  empId: string;
  name: string;
  mobileNumber: string;
  designation: string;
  district: string;
  territory: string;
  dailyVisitTarget: number;
  avatarUrl?: string;
  isActive: boolean;
  joinedDate?: string;
}

export interface AIAnalysisResult {
  qualityScore: number; // 0 - 100
  isBlur: boolean;
  fieldVisible: boolean;
  personVisible: boolean;
  brandingVisible: boolean;
  visitTypeMatch: boolean;
  summaryHindi: string;
  summaryEnglish: string;
  tags: string[];
}

export interface Visit {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeMobile: string;
  territory: string;
  district: string;
  visitType: VisitType;
  entityName: string; // Dealer / Farmer / Program Name
  village: string;
  latitude: number;
  longitude: number;
  locationName: string;
  photoUrl: string;
  remarksBooking: string;
  isRepeatLocation: boolean;
  distanceFromPrevKm: number;
  aiAnalysis: AIAnalysisResult;
  timestamp: string; // ISO 8601
}

export type BotStep =
  | 'START'
  | 'SELECT_VISIT_TYPE'
  | 'COLLECT_DETAILS'
  | 'COLLECT_LOCATION'
  | 'COLLECT_PHOTO'
  | 'COLLECT_REMARKS'
  | 'CONFIRMED';

export interface BotSession {
  mobileNumber: string;
  employeeId?: string;
  currentStep: BotStep;
  tempVisitData: {
    visitType?: VisitType;
    entityName?: string;
    village?: string;
    latitude?: number;
    longitude?: number;
    locationName?: string;
    photoUrl?: string;
    remarksBooking?: string;
  };
  lastActive: string;
}

export interface DailySummary {
  date: string;
  totalEmployees: number;
  activeEmployees: number;
  totalVisits: number;
  uniqueLocations: number;
  repeatLocations: number;
  visitsByType: Record<VisitType, number>;
  totalEstimatedKm: number;
  overallTargetAchievementPercent: number;
  topPerformers: {
    employeeName: string;
    district: string;
    visitsCount: number;
    targetAchievementPercent: number;
    travelKm: number;
  }[];
  lowPerformers: {
    employeeName: string;
    district: string;
    visitsCount: number;
    targetAchievementPercent: number;
  }[];
}
