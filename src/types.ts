// Core data model for the Business Architect V1

export interface VisionData {
  businessName: string;
  companyKind: string;
  whyExists: string;
  targetRevenue: string;
  targetProfit: string;
  targetEmployees: string;
  ownerHours: string;
  ownerRole: string;
  neverAgain: string;
  enjoyExcel: string;
  sellEventually: string; // "yes" | "no" | "maybe"
  fiveYearVision: string;
}

export interface HatEntry {
  id: string;
  functionName: string;
  currentOwner: string; // "Owner" | "Nobody" | employee name
}

export interface CurrentStateData {
  currentRevenue: string;
  currentEmployees: string;
  ownerHoursNow: string;
  hats: HatEntry[];
  bottleneck: string;
}

export interface FutureHatDecision {
  functionName: string;
  decision: "keep" | "hire" | "systematize";
}

export interface FutureStateData {
  desiredOrgSize: string;
  targetTimeline: string; // e.g. "12 months"
  futureHats: FutureHatDecision[];
}

export interface WizardData {
  industry: string;
  vision: VisionData;
  currentState: CurrentStateData;
  futureState: FutureStateData;
}

// ---- Blueprint (Gemini output) ----

export interface DependencyScore {
  current: number;
  target: number;
  explanation: string;
}

export interface Bottleneck {
  title: string;
  description: string;
  impact: string;
  recommendedFix: string;
}

export interface OrgPosition {
  title: string;
  reportsTo: string; // title of parent, or "" for the top
}

export interface CostItem {
  item: string;
  annualCost: number;
}

export interface PositionDetail {
  title: string;
  reportsTo: string;
  purpose: string;
  responsibilities: string[];
  compensation: string;
  costBreakdown: CostItem[];
  totalAnnualCost: number;
  kpis: string[];
  revenueResponsibility: string;
  hirePriority: number;
}

export interface InvestmentItem {
  category: string;
  amount: number;
}

export interface RevenueTarget {
  timeframe: string;
  revenue: number;
}

export interface ProfitProjection {
  year: string;
  revenue: number;
  profit: number;
  margin: string;
}

export interface FinancialModel {
  investmentBreakdown: InvestmentItem[];
  totalInvestment: number;
  revenueTargets: RevenueTarget[];
  profitProjections: ProfitProjection[];
  paybackMonths: number;
  paybackExplanation: string;
}

export interface HiringStep {
  order: number;
  position: string;
  timing: string;
  rationale: string;
  expectedImpact: string;
}

export interface ImplementationPhase {
  phase: string;
  timeframe: string;
  goal: string;
  actions: string[];
}

export interface OwnerFutureRole {
  title: string;
  hoursPerWeek: string;
  responsibilities: string[];
  giveUp: string[];
  closingLine: string;
}

export interface CompletionScore {
  area: string;
  score: number;
}

export interface RiskItem {
  risk: string;
  mitigation: string;
}

export interface Blueprint {
  businessName: string;
  executiveSummary: string;
  dependencyScore: DependencyScore;
  bottlenecks: Bottleneck[];
  orgChart: OrgPosition[];
  positions: PositionDetail[];
  financialModel: FinancialModel;
  hiringSequence: HiringStep[];
  implementationPlan: ImplementationPhase[];
  ownerFutureRole: OwnerFutureRole;
  completionScores: CompletionScore[];
  overallReadiness: number;
  risks: RiskItem[];
}

export const emptyVision = (): VisionData => ({
  businessName: "",
  companyKind: "",
  whyExists: "",
  targetRevenue: "",
  targetProfit: "",
  targetEmployees: "",
  ownerHours: "",
  ownerRole: "",
  neverAgain: "",
  enjoyExcel: "",
  sellEventually: "maybe",
  fiveYearVision: "",
});

export const emptyCurrentState = (): CurrentStateData => ({
  currentRevenue: "",
  currentEmployees: "",
  ownerHoursNow: "",
  hats: [],
  bottleneck: "",
});

export const emptyFutureState = (): FutureStateData => ({
  desiredOrgSize: "",
  targetTimeline: "12 months",
  futureHats: [],
});
