import { format, formatDistanceToNow, differenceInDays, parseISO, isValid, addDays } from 'date-fns';
import { FEED_TYPES, PIG_STATUS, AUTO_TASK_TEMPLATES, MARKET_STANDARDS, CURRENCY_CODE, LOCALE } from './constants';

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function formatDate(date) {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '—';
  return format(d, 'MMM dd, yyyy');
}

export function formatDateShort(date) {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '—';
  return format(d, 'MM/dd/yy');
}

export function formatRelative(date) {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '—';
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY_CODE,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num) {
  return new Intl.NumberFormat(LOCALE).format(num);
}

export function formatWeight(kg) {
  return `${Number(kg).toFixed(1)} kg`;
}

export function getDaysBetween(start, end) {
  const s = typeof start === 'string' ? parseISO(start) : start;
  const e = typeof end === 'string' ? parseISO(end) : (end || new Date());
  return differenceInDays(e, s);
}

export function getRecommendedFeed(weight) {
  // Only match growing/fattening feeds (not sow feeds)
  const growingFeeds = FEED_TYPES.filter(f => !f.id.startsWith('sow'));
  return growingFeeds.find(f => weight >= f.minWeight && weight < f.maxWeight) || growingFeeds[growingFeeds.length - 1];
}

export function calculateDailyFeed(weight) {
  const feed = getRecommendedFeed(weight);
  // Use the weight-based formula but clamp to min/max daily kg
  let dailyAmount = (weight / 100) * feed.dailyKgPer100kgBW;
  dailyAmount = Math.max(feed.dailyKg.min, Math.min(feed.dailyKg.max, dailyAmount));
  
  // Calculate per-ration amounts based on schedule
  const rations = feed.schedule.map(slot => ({
    ...slot,
    amount: Math.round((dailyAmount * slot.pct / 100) * 100) / 100,
  }));

  return {
    feedType: feed,
    dailyKg: Math.round(dailyAmount * 100) / 100,
    dailyCost: Math.round(dailyAmount * feed.costPerKg * 100) / 100,
    rations,
    feedsPerDay: feed.feedsPerDay,
  };
}

export function calculateFeedForBatch(pigs) {
  let totalDailyKg = 0;
  let totalDailyCost = 0;
  const details = pigs.map(pig => {
    const feed = calculateDailyFeed(pig.currentWeight);
    totalDailyKg += feed.dailyKg;
    totalDailyCost += feed.dailyCost;
    return { pig, ...feed };
  });
  return {
    details,
    totalDailyKg: Math.round(totalDailyKg * 100) / 100,
    totalDailyCost: Math.round(totalDailyCost * 100) / 100,
  };
}

export function calculateProfit(pig, finances) {
  const pigFinances = finances.filter(f => f.pigId === pig.id);
  const income = pigFinances.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
  const expenses = pigFinances.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
  const totalExpenses = expenses + (pig.purchasePrice || 0);
  return {
    income,
    expenses: totalExpenses,
    profit: income - totalExpenses,
    roi: totalExpenses > 0 ? ((income - totalExpenses) / totalExpenses) * 100 : 0,
  };
}

export function getPigStatusFromWeight(weight, targetWeight) {
  const target = targetWeight || MARKET_STANDARDS.targetLiveWeight.ideal;
  if (weight < 15) return PIG_STATUS.WEANING;
  if (weight < 35) return PIG_STATUS.GROWING;
  if (weight < target * 0.85) return PIG_STATUS.FINISHING;
  return PIG_STATUS.MARKET_READY;
}

export function getProgressToMarket(currentWeight, targetWeight) {
  const target = targetWeight || MARKET_STANDARDS.targetLiveWeight.ideal;
  return Math.min(100, Math.round((currentWeight / target) * 100));
}

export function getEstimatedDaysToMarket(currentWeight, targetWeight) {
  const target = targetWeight || MARKET_STANDARDS.targetLiveWeight.ideal;
  if (currentWeight >= target) return 0;
  return Math.ceil((target - currentWeight) / MARKET_STANDARDS.averageDailyGain);
}

export function getEstimatedMarketValue(weight, pricePerKg) {
  const price = pricePerKg || MARKET_STANDARDS.farmGatePricePerKg;
  return weight * price;
}

// Generate auto tasks based on Philippine DA vaccination/health schedule
export function generateAutoTasks(pig) {
  const dob = pig.dateOfBirth ? parseISO(pig.dateOfBirth) : null;
  if (!dob || !isValid(dob)) return [];

  const today = new Date();
  const pigAgeDays = differenceInDays(today, dob);

  return AUTO_TASK_TEMPLATES
    .filter(template => template.offsetDays > pigAgeDays) // Only future tasks
    .map(template => {
      const dueDate = addDays(dob, template.offsetDays);
      return {
        id: generateId(),
        title: `${template.title} — ${pig.tagNumber || pig.name}`,
        description: template.description,
        dueDate: format(dueDate, 'yyyy-MM-dd'),
        priority: template.priority,
        status: 'pending',
        pigId: pig.id,
        batchId: pig.batchId || null,
        category: template.category,
        autoGenerated: true,
        createdAt: new Date().toISOString(),
      };
    });
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
