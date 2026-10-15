export const PIG_STATUS = {
  WEANING: 'weaning',
  GROWING: 'growing',
  FINISHING: 'finishing',
  MARKET_READY: 'market-ready',
  SOLD: 'sold',
};

export const PIG_STATUS_LABELS = {
  [PIG_STATUS.WEANING]: 'Weaning',
  [PIG_STATUS.GROWING]: 'Growing',
  [PIG_STATUS.FINISHING]: 'Finishing',
  [PIG_STATUS.MARKET_READY]: 'Market Ready',
  [PIG_STATUS.SOLD]: 'Sold',
};

export const PIG_STATUS_COLORS = {
  [PIG_STATUS.WEANING]: 'badge-blue',
  [PIG_STATUS.GROWING]: 'badge-yellow',
  [PIG_STATUS.FINISHING]: 'badge-purple',
  [PIG_STATUS.MARKET_READY]: 'badge-green',
  [PIG_STATUS.SOLD]: 'badge-gray',
};

export const HEALTH_STATUS = {
  HEALTHY: 'healthy',
  SICK: 'sick',
  TREATING: 'treating',
};

export const HEALTH_STATUS_LABELS = {
  [HEALTH_STATUS.HEALTHY]: 'Healthy',
  [HEALTH_STATUS.SICK]: 'Sick',
  [HEALTH_STATUS.TREATING]: 'Under Treatment',
};

export const HEALTH_STATUS_COLORS = {
  [HEALTH_STATUS.HEALTHY]: 'badge-green',
  [HEALTH_STATUS.SICK]: 'badge-red',
  [HEALTH_STATUS.TREATING]: 'badge-yellow',
};

export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
};

export const TASK_CATEGORIES = [
  'Feeding', 'Health Check', 'Vaccination', 'Deworming', 'Weight Check',
  'Cleaning', 'Medication', 'Breeding', 'Iron Injection', 'Castration', 'Other'
];

export const FINANCE_CATEGORIES = {
  INCOME: ['Pig Sale', 'Manure Sale', 'Piglet Sale', 'Other Income'],
  EXPENSE: ['Feed', 'Medication', 'Veterinary', 'Vaccine', 'Labor', 'Equipment', 'Utilities', 'Pig Purchase', 'Vitamins & Supplements', 'Other Expense'],
};

// Philippine breeds commonly raised
export const BREEDS = [
  'Landrace', 'Large White', 'Duroc', 'Hampshire', 'Pietrain',
  'Berkshire', 'Chester White', 'Native (Black Pig)', 'Cross Breed',
  'Landrace x Large White', 'Duroc x Landrace', 'Large White x Duroc',
  'Other',
];

// Philippine DA/BAI Feeding Standards
// Costs are in Philippine Peso (PHP) per kg based on commercial feed prices
export const FEED_TYPES = [
  {
    id: 'pre-starter',
    name: 'Pre-Starter / Creep Feed',
    minWeight: 2,
    maxWeight: 7,
    ageRange: '7-28 days',
    dailyKg: { min: 0.1, max: 0.5 },
    dailyKgPer100kgBW: 7.0,
    proteinPct: 22,
    costPerKg: 35.00,
    bagPrice: 1750,
    bagWeight: 50,
    feedsPerDay: 4,
    schedule: [
      { time: '6:00 AM', label: 'Early Morning', pct: 25 },
      { time: '10:00 AM', label: 'Mid Morning', pct: 25 },
      { time: '2:00 PM', label: 'Afternoon', pct: 25 },
      { time: '6:00 PM', label: 'Evening', pct: 25 },
    ],
    notes: 'Introduce creep feed at Day 7. Use crumble form. Ensure fresh clean water is always available.',
  },
  {
    id: 'starter',
    name: 'Starter Feed',
    minWeight: 7,
    maxWeight: 15,
    ageRange: '29-42 days',
    dailyKg: { min: 0.3, max: 1.0 },
    dailyKgPer100kgBW: 6.0,
    proteinPct: 20,
    costPerKg: 30.00,
    bagPrice: 1500,
    bagWeight: 50,
    feedsPerDay: 3,
    schedule: [
      { time: '6:00 AM', label: 'Morning', pct: 35 },
      { time: '12:00 PM', label: 'Noon', pct: 30 },
      { time: '5:00 PM', label: 'Afternoon', pct: 35 },
    ],
    notes: 'Transition from creep to starter gradually over 3-5 days. Highly digestible mash or crumble.',
  },
  {
    id: 'grower',
    name: 'Grower Feed',
    minWeight: 15,
    maxWeight: 35,
    ageRange: '43-70 days',
    dailyKg: { min: 0.8, max: 1.5 },
    dailyKgPer100kgBW: 4.5,
    proteinPct: 17,
    costPerKg: 25.00,
    bagPrice: 1250,
    bagWeight: 50,
    feedsPerDay: 2,
    schedule: [
      { time: '6:00 AM', label: 'Morning Ration', pct: 50 },
      { time: '4:00 PM', label: 'Afternoon Ration', pct: 50 },
    ],
    notes: 'Switch to pellets/mash. Can supplement with rice bran, copra meal, or kangkong. Ensure adequate trough space.',
  },
  {
    id: 'finisher',
    name: 'Finisher Feed',
    minWeight: 35,
    maxWeight: 60,
    ageRange: '71-120 days',
    dailyKg: { min: 1.5, max: 2.5 },
    dailyKgPer100kgBW: 3.8,
    proteinPct: 15,
    costPerKg: 22.00,
    bagPrice: 1100,
    bagWeight: 50,
    feedsPerDay: 2,
    schedule: [
      { time: '6:00 AM', label: 'Morning Ration', pct: 50 },
      { time: '4:00 PM', label: 'Afternoon Ration', pct: 50 },
    ],
    notes: 'Mid-protein finisher mash or pellet. Can mix with local ingredients (rice bran 20%, copra meal 10%).',
  },
  {
    id: 'finisher-2',
    name: 'Finisher Feed (Heavy)',
    minWeight: 60,
    maxWeight: 100,
    ageRange: '121-180 days',
    dailyKg: { min: 2.2, max: 3.5 },
    dailyKgPer100kgBW: 3.5,
    proteinPct: 14,
    costPerKg: 20.00,
    bagPrice: 1000,
    bagWeight: 50,
    feedsPerDay: 2,
    schedule: [
      { time: '6:00 AM', label: 'Morning Ration', pct: 50 },
      { time: '4:00 PM', label: 'Afternoon Ration', pct: 50 },
    ],
    notes: 'Final fattening stage. Reduce protein slightly. Avoid overfeeding to prevent excessive fat. Target 80-100 kg for market.',
  },
  {
    id: 'sow-gestation',
    name: 'Sow / Gestating Feed',
    minWeight: 100,
    maxWeight: 250,
    ageRange: 'Breeding sows',
    dailyKg: { min: 1.8, max: 2.5 },
    dailyKgPer100kgBW: 2.0,
    proteinPct: 14,
    costPerKg: 22.00,
    bagPrice: 1100,
    bagWeight: 50,
    feedsPerDay: 2,
    schedule: [
      { time: '6:00 AM', label: 'Morning Ration', pct: 50 },
      { time: '4:00 PM', label: 'Afternoon Ration', pct: 50 },
    ],
    notes: 'Controlled feeding to prevent over-conditioning. Increase ration to 2.5 kg/day in last week before farrowing.',
  },
  {
    id: 'sow-lactating',
    name: 'Sow / Lactating Feed',
    minWeight: 100,
    maxWeight: 300,
    ageRange: 'Lactating sows',
    dailyKg: { min: 3.0, max: 5.0 },
    dailyKgPer100kgBW: 3.5,
    proteinPct: 16,
    costPerKg: 24.00,
    bagPrice: 1200,
    bagWeight: 50,
    feedsPerDay: 3,
    schedule: [
      { time: '6:00 AM', label: 'Morning', pct: 35 },
      { time: '12:00 PM', label: 'Noon', pct: 30 },
      { time: '5:00 PM', label: 'Afternoon', pct: 35 },
    ],
    notes: 'Ad libitum or 3.0 kg base + 0.4 kg per piglet nursing. High energy and protein to support milk production.',
  },
];

// Philippine DA/BAI/LGU Vaccination & Health Schedule
// Auto-generated tasks when a pig is added
export const AUTO_TASK_TEMPLATES = [
  {
    offsetDays: 3,
    title: 'Iron Dextran Injection',
    description: 'Administer Iron Dextran injection (2ml IM) to prevent nutritional anemia. Required for all confined piglets.',
    category: 'Iron Injection',
    priority: 'high',
    fromEvent: 'birth',
  },
  {
    offsetDays: 7,
    title: 'Start Creep Feeding',
    description: 'Begin introducing pre-starter/creep feed in small amounts. Use crumble form. Ensure fresh water.',
    category: 'Feeding',
    priority: 'medium',
    fromEvent: 'birth',
  },
  {
    offsetDays: 14,
    title: 'Ear Notching / Tagging',
    description: 'Ear notch or tag for identification. Record tag number.',
    category: 'Other',
    priority: 'low',
    fromEvent: 'birth',
  },
  {
    offsetDays: 21,
    title: 'Weaning',
    description: 'Separate piglets from sow. Transition to starter feed gradually over 3-5 days. Monitor for post-weaning stress.',
    category: 'Other',
    priority: 'high',
    fromEvent: 'birth',
  },
  {
    offsetDays: 28,
    title: 'First Weight Check (Post-Weaning)',
    description: 'Record post-weaning weight. Expected weight: 7-8 kg. Check for any post-weaning issues.',
    category: 'Weight Check',
    priority: 'medium',
    fromEvent: 'birth',
  },
  {
    offsetDays: 42,
    title: 'Hog Cholera Vaccine (Primary)',
    description: 'Administer Classical Swine Fever (Hog Cholera) vaccine — PRIMARY DOSE. This is MANDATORY per DA/BAI. Contact your Municipal Agriculture Office (MAO) for free government vaccine.',
    category: 'Vaccination',
    priority: 'urgent',
    fromEvent: 'birth',
  },
  {
    offsetDays: 42,
    title: 'First Deworming',
    description: 'Administer first deworming (Ivermectin or Levamisole based on weight). Targets roundworms and mange.',
    category: 'Deworming',
    priority: 'high',
    fromEvent: 'birth',
  },
  {
    offsetDays: 56,
    title: 'Mycoplasma Vaccine (1st Dose)',
    description: 'Administer Mycoplasma hyopneumoniae vaccine — first dose. Prevents chronic respiratory disease and slow growth.',
    category: 'Vaccination',
    priority: 'high',
    fromEvent: 'birth',
  },
  {
    offsetDays: 70,
    title: 'Hog Cholera Booster',
    description: 'Administer Hog Cholera BOOSTER dose. DO NOT SKIP — a single dose is insufficient for long-term immunity per DA/BAI guidelines.',
    category: 'Vaccination',
    priority: 'urgent',
    fromEvent: 'birth',
  },
  {
    offsetDays: 70,
    title: 'Mycoplasma Vaccine (2nd Dose)',
    description: 'Administer Mycoplasma hyopneumoniae booster — second dose. Completes primary respiratory protection.',
    category: 'Vaccination',
    priority: 'high',
    fromEvent: 'birth',
  },
  {
    offsetDays: 90,
    title: 'Weight Check — Grower Stage',
    description: 'Record weight. Expected: 25-35 kg at ~3 months. Evaluate feed conversion. Transition to finisher feed if weight allows.',
    category: 'Weight Check',
    priority: 'medium',
    fromEvent: 'birth',
  },
  {
    offsetDays: 120,
    title: 'Second Deworming',
    description: 'Administer second deworming dose. Deworm every 2-3 months per DA guidelines.',
    category: 'Deworming',
    priority: 'high',
    fromEvent: 'birth',
  },
  {
    offsetDays: 120,
    title: 'Weight Check — Finisher Stage',
    description: 'Record weight. Expected: 45-60 kg at ~4 months. Should be on finisher feed by now.',
    category: 'Weight Check',
    priority: 'medium',
    fromEvent: 'birth',
  },
  {
    offsetDays: 150,
    title: 'Pre-Market Weight Check',
    description: 'Record weight. Expected: 70-85 kg at ~5 months. Begin evaluating market readiness. Contact buyer/trader.',
    category: 'Weight Check',
    priority: 'high',
    fromEvent: 'birth',
  },
  {
    offsetDays: 170,
    title: 'Market Readiness Assessment',
    description: 'Final weight check before market. Target: 80-100 kg live weight. Coordinate with buyer. Withhold feed 12 hours before transport. Ensure no vaccine withdrawal period violations.',
    category: 'Weight Check',
    priority: 'urgent',
    fromEvent: 'birth',
  },
];

// Philippine market standards
export const MARKET_STANDARDS = {
  targetLiveWeight: { min: 80, max: 100, ideal: 90 },
  farmGatePricePerKg: 180, // PHP per kg live weight (2024 average)
  dressingPercentage: 75, // typical for commercial breeds
  targetAgeAtMarket: 170, // days (~5.5 months)
  averageDailyGain: 0.55, // kg/day for commercial breeds in PH conditions
};

export const CURRENCY = '₱';
export const CURRENCY_CODE = 'PHP';
export const LOCALE = 'en-PH';
