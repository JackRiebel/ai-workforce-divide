// ── Constants from published research ───────────────────────────────────
// All numbers below are cited from specific studies. See Methodology section.

const ANTHROPIC = {
  coverage: {
    // Theoretical: Eloundou et al. β metric. Actual: Anthropic Economic Index Jan 2026 (~2M conversations)
    computerMath: { theoretical: 94, actual: 35.8 },
    officeAdmin: { theoretical: 90, actual: 34.3 },
    businessFinance: { theoretical: 88, actual: 28.4 },
    sales: { theoretical: 62, actual: 26.9 },
    legal: { theoretical: 89, actual: 20.4 },
    artMedia: { theoretical: 83.7, actual: 19.2 },
  },
  employment: {
    perTenPointsCoverageIncrease: -0.6, // pp decline per 10pp coverage
  },
  demographics: {
    femalePpHigher: 16,
    whitePpHigher: 11,
    earningsGapPct: 47,
    gradDegreeExposed: 17.4,
    gradDegreeUnexposed: 4.5,
    zeroExposureWorkers: 30,
  },
  laborMarket: {
    unemploymentBaseline: 3,
    noSystematicIncrease: true,
    youngWorkerDecline: 14,       // % decline in job-finding rate
    youngWorkerEmploymentDrop: 16, // % fall in employment age 22-25
    youngWorkerAgeRange: "22-25",
  },
};

// PwC 2025 Global AI Jobs Barometer (~1B job postings, 6 continents)
const PWC = {
  wagePremium: 56,              // % premium for AI-skilled roles (up from 25% in 2023)
  productivityGrowthExposed: 27,// % in most AI-exposed industries (2018-2024)
  productivityGrowthUnexposed: 9,// % in least AI-exposed industries
  jobGrowthLowExposure: 65,     // % job growth 2019-2024
  jobGrowthHighExposure: 38,    // % job growth 2019-2024
  aiJobPostingsGrowth: 7.5,     // % YoY growth in AI-requiring postings
  totalPostingsDecline: -11.3,  // % total postings declined
  skillsChangeRate: 66,         // % faster skill change in AI-exposed roles
  degreeRequirementDropAugmented: 7,  // pp drop in degree requirements
  degreeRequirementDropAutomated: 9,  // pp drop
};

// Empirical productivity studies (specific experiments)
const PRODUCTIVITY_STUDIES = {
  noyZhang: { n: 453, timeSaved: 40, qualityGain: 18, note: "Professionals, ChatGPT" },
  brynjolfsson: { n: 5172, avgGain: 15, bottomQuintileGain: 36, note: "Customer support agents" },
  peng: { timeSaved: 55.8, note: "GitHub Copilot, software developers" },
  cui: { n: 5000, weeklyTaskIncrease: 26.08, note: "Developers, field experiments" },
  schwarcz: { timeSaved: "50-130", note: "Law students, complex legal tasks" },
  choi: { n: 277, weeklyGain: 18, note: "Accountants" },
};

// St. Louis Fed (Nov 2024 survey)
const STLFED = {
  avgTimeSaved: 5.4,            // % of work hours for AI users
  hoursPerWeek: 2.2,            // hours saved per 40hr week
  aggregateProductivity: 1.4,   // % total hours saved (all workers incl non-users)
  duringUseProductivity: 33,    // % more productive during AI use
  computerMathUsage: 12,        // % of work hours using AI
  computerMathTimeSaved: 2.5,   // % time saved
  personalServiceUsage: 1.3,    // % of work hours using AI
  personalServiceTimeSaved: 0.4,// % time saved
};

// BLS 2024-2034 projections
const BLS = {
  totalNewJobs: 5200000,
  totalGrowthPct: 3.1,
  computerMathGrowth: 10.1,     // %
  trainingSpecialistGrowth: 10.8,// %
};

// Brynjolfsson, Chandar & Chen (2025) — Stanford/ADP, 3.5–5M workers monthly
const BRYNJOLFSSON_ADP = {
  sampleSize: "3.5–5M workers/month",
  source: "ADP payroll data (25M+ US workers)",
  youngWorkerDecline: 16,          // % relative employment decline, ages 22-25, high-exposure
  softwareDevYoungDecline: 20,     // % from late-2022 peak, ages 22-25
  softwareDevOlderGrowth: 6,       // % growth for older devs
  customerServiceDecline: 15,      // % early-career decline
  marketingSalesDecline: 12,       // % ages 22-25
  olderWorkerGrowth: "6–13",       // % ages 30+, high-exposure jobs
  entryLevelHiringDecline: 23,     // % vs pre-pandemic
  recentGradUnemployment: 4.8,     // %
  allYoungUnemployment: 7.4,       // %
  // Key: augmentation occupations GREW; automation occupations declined
  automationVsAugmentation: true,
  note: "Updated Nov 2025. Firm-level fixed effects, controlled for remote work, tech sector, interest rate sensitivity",
};

// Eckhardt & Goldschlag (2025) — EIG, CPS data, 5 AI exposure measures
const EIG = {
  unemploymentRiseMostExposed: 0.30,  // pp increase, Q5 (most exposed)
  unemploymentRiseLeastExposed: 0.94, // pp increase, Q1 (least exposed)
  // Direction is OPPOSITE of displacement narrative
  firmsNoNetImpact: 95,              // % of firms report zero net AI employment effect
  firmsExpectIncrease: 6.5,          // % expect AI-related employment increase
  firmsExpectDecrease: 6.1,          // % expect AI-related employment decrease
  aiUsingFirmsReplacingTasks: 27,    // % of AI-using firms replacing worker tasks
  note: "Results robust across all 5 exposure measures tested",
};

// Yale Budget Lab (Gimbel et al. 2026) — 7 AI exposure measures compared
const YALE_BUDGET_LAB = {
  measuresCompared: 7,
  rSquaredRange: "0.47–0.78",       // between measures
  noEmploymentDisruption: true,     // "stability, not major disruption"
  occupationalChurn: "slightly faster but not atypical vs 1984 PC era or 1996 Internet era",
  note: "Exposure ≠ usage. Measures agree on low-exposure jobs, disagree on high-exposure jobs",
};

// Census Bureau BTOS (Goldschlag 2025) — actual AI adoption by firms
const CENSUS_BTOS = {
  aiInProductionStart2024: 4.6,     // %
  aiInProductionSept2025: 10,       // %
  aiAnyFunctionNov2025: 17.3,       // %
  informationSector: 27,            // % using AI
  publishingHighest: 36,            // %
  dataProcessing: 35,               // %
  expectedGrowthNext6Months: 4,     // pp
  note: "Even in Information sector, >60% of firms NOT using AI",
};

// Anthropic: augmentation vs automation split (from Economic Index)
const ANTHROPIC_AUGMENTATION = {
  augmentation: 57,  // % of AI use that augments human work
  automation: 43,    // % of AI use that automates tasks entirely
};

// Brookings/Hamilton Project (Kolko, March 2026) — occupational churn by era
// Relative index of occupational mix change per Brookings Figure 5.
// Rankings match Brookings: 1910s & 1940s highest, current era lower than both
// and lower than 1950s, but faster than several recent pre-AI decades.
const BROOKINGS_CHURN = [
  { era: "1910s", value: 38, driver: "Agriculture → manufacturing, WWI", type: "war" },
  { era: "1920s", value: 22, driver: "Urbanization, roaring economy",   type: "growth" },
  { era: "1930s", value: 18, driver: "Great Depression froze mobility",  type: "stagnation" },
  { era: "1940s", value: 35, driver: "WWII, women enter workforce",     type: "war" },
  { era: "1950s", value: 30, driver: "Postwar boom, early computing",   type: "tech" },
  { era: "1960–80", value: 20, driver: "Services economy emerges",      type: "growth" },
  { era: "1980–2010", value: 14, driver: "PC + Internet eras",          type: "tech" },
  { era: "2010–18", value: 10, driver: "Pre-AI baseline",               type: "baseline" },
  { era: "2019–24", value: 16, driver: "AI era (so far)",               type: "ai" },
];

// Brookings/Hamilton Project (Kolko, March 2026) — meta-analysis context
const BROOKINGS = {
  keyFinding: "Evidence on AI labor market impact is inconclusive as of March 2026",
  narratorBias: "Researchers/journalists more exposed to AI than past automation, may color interpretation",
  historicalComparison: "Occupational mix change 2019-2024 is not unprecedented — less than 1910s, 1940s, 1950s",
  streetlampBias: "Available data overweights certain conclusions; under-explored: labor supply, transition dynamics",
};

// Education ordering
const EDU_ORDER = [
  "No formal educational credential",
  "High school diploma or equivalent",
  "Postsecondary nondegree award",
  "Some college, no degree",
  "Associate's degree",
  "Bachelor's degree",
  "Master's degree",
  "Doctoral or professional degree"
];
const EDU_SHORT = {
  "No formal educational credential": "No Formal Credential",
  "High school diploma or equivalent": "High School / GED",
  "Postsecondary nondegree award": "Certificate",
  "Some college, no degree": "Some College",
  "See How to Become One": "Varies",
  "Associate's degree": "Associate's",
  "Bachelor's degree": "Bachelor's",
  "Master's degree": "Master's",
  "Doctoral or professional degree": "Doctoral / Professional"
};

// Category display names
const CAT_NAMES = {
  "healthcare": "Healthcare",
  "office-and-administrative-support": "Office & Admin",
  "transportation-and-material-moving": "Transportation",
  "management": "Management",
  "food-preparation-and-serving": "Food Service",
  "sales": "Sales",
  "business-and-financial": "Business & Finance",
  "education-training-and-library": "Education",
  "construction-and-extraction": "Construction",
  "production": "Production",
  "installation-maintenance-and-repair": "Maintenance & Repair",
  "computer-and-information-technology": "Computer & IT",
  "building-and-grounds-cleaning": "Cleaning & Grounds",
  "personal-care-and-service": "Personal Care",
  "protective-service": "Protective Service",
  "community-and-social-service": "Community & Social",
  "architecture-and-engineering": "Architecture & Eng.",
  "legal": "Legal",
  "media-and-communication": "Media & Communication",
  "life-physical-and-social-science": "Science",
  "farming-fishing-and-forestry": "Farming & Forestry",
  "entertainment-and-sports": "Entertainment",
  "arts-and-design": "Arts & Design",
  "math": "Math & Data Science",
  "military": "Military",
};
