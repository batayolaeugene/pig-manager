import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Utensils,
  Check,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  BarChart3,
  Scale,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Layers,
  Plus,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { usePigs, useTasks, useFinances, useSettings } from '../context/AppContext';
import {
  formatDate,
  calculateFeedForBatch,
  getEstimatedMarketValue,
  getProgressToMarket,
} from '../utils/helpers';
import { PIG_STATUS } from '../utils/constants';
import { useToast } from '../components/Toast';

const STATUS_COLORS = {
  [PIG_STATUS.WEANING]: '#3b82f6', // blue
  [PIG_STATUS.GROWING]: '#f59e0b', // amber
  [PIG_STATUS.FINISHING]: '#8b5cf6', // purple
  [PIG_STATUS.MARKET_READY]: '#10b981', // emerald
};

// Activity category icon helper matching the screenshot
function getActivityIcon(category = '', type = '') {
  const cat = (category || '').toLowerCase();
  if (cat.includes('medicin') || cat.includes('vaccin')) return '💊';
  if (cat.includes('utilit') || cat.includes('electri') || cat.includes('water')) return '💡';
  if (cat.includes('feed') || cat.includes('darak') || cat.includes('pellet')) return '🌾';
  if (cat.includes('sale') || cat.includes('sold') || type === 'income') return '📥';
  if (cat.includes('pig') || cat.includes('purchase')) return '🐷';
  return '📋';
}

function formatActivityDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatAmount(val, isNegative) {
  const abs = Math.abs(val || 0);
  const formatted = abs.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return isNegative ? `₱ -${formatted}` : `₱ ${formatted}`;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { pigs } = usePigs();
  const { tasks } = useTasks();
  const { finances, getTotalIncome, getTotalExpenses } = useFinances();
  const { settings } = useSettings();
  const { toast } = useToast();

  const [cycleIndex, setCycleIndex] = useState(0);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [morningFed, setMorningFed] = useState(false);
  const [afternoonFed, setAfternoonFed] = useState(false);

  // Active (non-sold) pigs
  const activePigs = useMemo(
    () => pigs.filter((p) => p.status !== PIG_STATUS.SOLD),
    [pigs]
  );

  // Financial metrics
  const totalRevenue = useMemo(() => getTotalIncome(), [getTotalIncome]);
  const totalExpenses = useMemo(() => getTotalExpenses(), [getTotalExpenses]);
  const netProfit = totalRevenue - totalExpenses;

  // Estimated total herd value based on liveweight
  const liveweightPrice = settings?.liveweightPriceKg || 180;
  const estimatedHerdValue = useMemo(() => {
    return activePigs.reduce((sum, p) => {
      const weight = p.currentWeight || 10;
      return sum + weight * liveweightPrice;
    }, 0);
  }, [activePigs, liveweightPrice]);

  // Metrics to cycle through in the dark hero card
  const heroMetrics = [
    {
      label: 'TOTAL NET/LOSS',
      valueFormatted: formatAmount(netProfit, netProfit < 0),
      isLoss: netProfit < 0,
    },
    {
      label: 'TOTAL REVENUE',
      valueFormatted: formatAmount(totalRevenue, false),
      isLoss: false,
    },
    {
      label: 'TOTAL EXPENSES',
      valueFormatted: formatAmount(totalExpenses, true),
      isLoss: true,
    },
    {
      label: 'HERD MARKET VALUE',
      valueFormatted: formatAmount(estimatedHerdValue, false),
      isLoss: false,
    },
  ];

  const currentMetric = heroMetrics[cycleIndex % heroMetrics.length];

  const handleCycleMetric = (e) => {
    if (e) e.stopPropagation();
    setCycleIndex((prev) => (prev + 1) % heroMetrics.length);
  };

  // Recent 4 activities matching the screenshot priority
  const recentActivities = useMemo(() => {
    return [...finances]
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 4);
  }, [finances]);

  // Urgent Tasks
  const urgentTasks = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(
      (t) =>
        t.status !== 'completed' &&
        (t.priority === 'urgent' || (t.dueDate && t.dueDate <= today))
    );
  }, [tasks]);

  // Daily Feed Calculation for Herd (Philippine DA Standards)
  const herdFeed = useMemo(() => {
    return calculateFeedForBatch(activePigs);
  }, [activePigs]);

  const morningRationKg = Math.round(herdFeed.totalDailyKg * 0.5 * 10) / 10;
  const afternoonRationKg = Math.round(herdFeed.totalDailyKg * 0.5 * 10) / 10;

  // Herd status distribution
  const statusDistribution = useMemo(() => {
    const counts = {
      [PIG_STATUS.WEANING]: 0,
      [PIG_STATUS.GROWING]: 0,
      [PIG_STATUS.FINISHING]: 0,
      [PIG_STATUS.MARKET_READY]: 0,
    };
    activePigs.forEach((p) => {
      if (counts[p.status] !== undefined) counts[p.status] += 1;
    });
    const total = activePigs.length || 1;
    return [
      { name: 'Weaning', value: counts[PIG_STATUS.WEANING], color: STATUS_COLORS[PIG_STATUS.WEANING], percentage: Math.round((counts[PIG_STATUS.WEANING] / total) * 100) },
      { name: 'Growing', value: counts[PIG_STATUS.GROWING], color: STATUS_COLORS[PIG_STATUS.GROWING], percentage: Math.round((counts[PIG_STATUS.GROWING] / total) * 100) },
      { name: 'Finishing', value: counts[PIG_STATUS.FINISHING], color: STATUS_COLORS[PIG_STATUS.FINISHING], percentage: Math.round((counts[PIG_STATUS.FINISHING] / total) * 100) },
      { name: 'Market Ready', value: counts[PIG_STATUS.MARKET_READY], color: STATUS_COLORS[PIG_STATUS.MARKET_READY], percentage: Math.round((counts[PIG_STATUS.MARKET_READY] / total) * 100) },
    ].filter((item) => item.value > 0);
  }, [activePigs]);

  // Herd growth mock trajectory
  const herdGrowthData = useMemo(() => {
    const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
    return months.map((month, idx) => ({
      month,
      count: Math.max(3, Math.round(activePigs.length * (0.4 + idx * 0.12))),
    }));
  }, [activePigs.length]);

  return (
    <div className="space-y-6 max-w-xl lg:max-w-4xl mx-auto pb-16 animate-fadeIn">
      {/* 1. DARK HERO CARD (TOTAL NET/LOSS) — Exact 1:1 match with user screenshot */}
      <section
        onClick={handleCycleMetric}
        className="bg-[#0b0c10] text-white rounded-3xl sm:rounded-[28px] p-5 sm:p-6 shadow-xl shadow-black/25 border border-zinc-900 cursor-pointer select-none active:scale-[0.99] transition-transform relative overflow-hidden"
      >
        {/* Top Row: Metric Title & Interactive TAP TO CYCLE */}
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-[11px] font-black tracking-widest uppercase">
            {currentMetric.label}
          </span>
          <button
            type="button"
            onClick={handleCycleMetric}
            className="text-[10px] font-extrabold tracking-wider uppercase text-zinc-400 hover:text-white flex items-center gap-1 active:scale-95 transition-colors"
          >
            <span>TAP TO CYCLE</span>
            <span className="text-xs">↻</span>
          </button>
        </div>

        {/* Center Big Display Amount */}
        <div className="my-3.5">
          <p
            className={`text-3xl sm:text-4xl font-black tracking-tight ${
              currentMetric.isLoss ? 'text-[#ff4d6d]' : 'text-emerald-400'
            }`}
          >
            {currentMetric.valueFormatted}
          </p>
        </div>

        {/* Subtle Horizontal Divider */}
        <div className="border-t border-zinc-800/90 pt-3 flex items-center justify-between text-xs font-semibold">
          {/* Active Herd */}
          <div className="flex items-center gap-1.5 text-zinc-300">
            <span className="text-sm">🐷</span>
            <span>Active Herd:</span>
            <span className="text-emerald-400 font-black">{activePigs.length}</span>
          </div>

          {/* Region */}
          <div className="flex items-center gap-1.5 text-zinc-300">
            <span className="text-sm">📍</span>
            <span className="text-zinc-300">region:</span>
            <span className="text-white font-bold capitalize">
              {settings?.region || 'Cebu'}
            </span>
          </div>
        </div>
      </section>

      {/* 2. QUICK ACTIONS — 5 Chunky Pastel Mint Circular Buttons matching screenshot */}
      <section>
        <h2 className="text-xs font-black tracking-wider text-slate-900 uppercase mb-3">
          QUICK ACTIONS
        </h2>

        <div className="flex items-start justify-between gap-1.5 sm:gap-4 overflow-x-auto pb-1 no-scrollbar">
          {/* PIGS */}
          <button
            type="button"
            onClick={() => navigate('/pigs')}
            className="flex flex-col items-center flex-1 min-w-[60px] group active:scale-95 transition-all"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#e8f7f0] border border-[#c7eee0] flex items-center justify-center text-2xl sm:text-3xl shadow-xs group-hover:bg-[#d5f3e4] transition-colors">
              🐷
            </div>
            <span className="text-[10px] sm:text-xs font-black tracking-wide text-slate-800 mt-2 uppercase text-center">
              PIGS
            </span>
          </button>

          {/* LOG CASH */}
          <button
            type="button"
            onClick={() => navigate('/finance')}
            className="flex flex-col items-center flex-1 min-w-[60px] group active:scale-95 transition-all"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#e8f7f0] border border-[#c7eee0] flex items-center justify-center text-2xl sm:text-3xl shadow-xs group-hover:bg-[#d5f3e4] transition-colors">
              💸
            </div>
            <span className="text-[10px] sm:text-xs font-black tracking-wide text-slate-800 mt-2 uppercase text-center">
              LOG CASH
            </span>
          </button>

          {/* ADD TASK */}
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="flex flex-col items-center flex-1 min-w-[60px] group active:scale-95 transition-all"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#e8f7f0] border border-[#c7eee0] flex items-center justify-center text-2xl sm:text-3xl shadow-xs group-hover:bg-[#d5f3e4] transition-colors">
              <div className="w-7 h-7 bg-white rounded-md border border-slate-300 flex flex-col items-center overflow-hidden shadow-2xs">
                <div className="w-full bg-rose-500 text-white text-[6px] font-black leading-tight text-center py-0.5">
                  JULY
                </div>
                <div className="text-[10px] font-black text-slate-900 leading-none mt-0.5">
                  17
                </div>
              </div>
            </div>
            <span className="text-[10px] sm:text-xs font-black tracking-wide text-slate-800 mt-2 uppercase text-center">
              ADD TASK
            </span>
          </button>

          {/* FEED CALC */}
          <button
            type="button"
            onClick={() => navigate('/feed')}
            className="flex flex-col items-center flex-1 min-w-[60px] group active:scale-95 transition-all"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#e8f7f0] border border-[#c7eee0] flex items-center justify-center text-2xl sm:text-3xl shadow-xs group-hover:bg-[#d5f3e4] transition-colors">
              🌾
            </div>
            <span className="text-[10px] sm:text-xs font-black tracking-wide text-slate-800 mt-2 uppercase text-center">
              FEED CALC
            </span>
          </button>

          {/* SELL CALC */}
          <button
            type="button"
            onClick={() => navigate('/profit')}
            className="flex flex-col items-center flex-1 min-w-[60px] group active:scale-95 transition-all"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#e8f7f0] border border-[#c7eee0] flex items-center justify-center text-2xl sm:text-3xl shadow-xs group-hover:bg-[#d5f3e4] transition-colors">
              💰
            </div>
            <span className="text-[10px] sm:text-xs font-black tracking-wide text-slate-800 mt-2 uppercase text-center">
              SELL CALC
            </span>
          </button>
        </div>
      </section>

      {/* 3. RECENT ACTIVITY — Clean Rounded Cards with VIEW ALL */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-black tracking-wider text-slate-900 uppercase">
            RECENT ACTIVITY
          </h2>
          <Link
            to="/finance"
            className="text-xs font-black text-emerald-500 hover:text-emerald-600 uppercase tracking-wide transition-colors"
          >
            VIEW ALL
          </Link>
        </div>

        <div className="space-y-2.5">
          {recentActivities.map((item) => {
            const isIncome = item.type === 'income';
            const icon = getActivityIcon(item.category, item.type);
            const formattedDate = formatActivityDate(item.date);
            const amountNum = Number(item.amount) || 0;
            const formattedAmount = `${isIncome ? '+' : '-'}₱ ${amountNum.toLocaleString('en-PH', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;

            return (
              <div
                key={item.id}
                onClick={() => navigate('/finance')}
                className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-slate-300 active:scale-[0.99] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100/90 flex items-center justify-center text-xl flex-shrink-0 shadow-2xs">
                    {icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {item.category || item.description}
                    </p>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">
                      {formattedDate}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 pl-3">
                  <p
                    className={`text-sm sm:text-base font-black tracking-tight ${
                      isIncome ? 'text-[#10b981]' : 'text-[#ff4d6d]'
                    }`}
                  >
                    {formattedAmount}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. PHILIPPINE DA FEEDING RATION TRACKER (Morning & Afternoon Rations) */}
      <section className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-base">🥣</span>
            <div>
              <h3 className="text-sm font-black text-slate-900">DA Daily Feeding Rations</h3>
              <p className="text-[11px] text-slate-500">
                Philippine Department of Agriculture Feeding Standard
              </p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
            {herdFeed.totalDailyKg} kg / day
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          {/* Morning Ration */}
          <div
            className={`p-3.5 rounded-2xl border transition-all ${
              morningFed
                ? 'bg-emerald-50/70 border-emerald-200'
                : 'bg-slate-50 border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-black text-slate-800">☀️ Morning (50%)</span>
              <span className="text-xs font-extrabold text-emerald-700">
                {morningRationKg} kg
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mb-2.5">Schedule: 6:00 AM - 7:30 AM</p>
            <button
              type="button"
              onClick={() => {
                setMorningFed((prev) => !prev);
                toast({
                  type: 'success',
                  title: morningFed ? 'Ration Unchecked' : 'Morning Ration Completed',
                  message: `${morningRationKg} kg feeding logged for herd.`,
                });
              }}
              className={`w-full min-h-[44px] rounded-xl text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all ${
                morningFed
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{morningFed ? 'Fed' : 'Checkoff'}</span>
            </button>
          </div>

          {/* Afternoon Ration */}
          <div
            className={`p-3.5 rounded-2xl border transition-all ${
              afternoonFed
                ? 'bg-emerald-50/70 border-emerald-200'
                : 'bg-slate-50 border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-black text-slate-800">🌤️ Afternoon (50%)</span>
              <span className="text-xs font-extrabold text-emerald-700">
                {afternoonRationKg} kg
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mb-2.5">Schedule: 3:30 PM - 5:00 PM</p>
            <button
              type="button"
              onClick={() => {
                setAfternoonFed((prev) => !prev);
                toast({
                  type: 'success',
                  title: afternoonFed ? 'Ration Unchecked' : 'Afternoon Ration Completed',
                  message: `${afternoonRationKg} kg feeding logged for herd.`,
                });
              }}
              className={`w-full min-h-[44px] rounded-xl text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all ${
                afternoonFed
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{afternoonFed ? 'Fed' : 'Checkoff'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 5. URGENT HEALTH TASKS (IF ANY) */}
      {urgentTasks.length > 0 && (
        <section className="p-4 rounded-3xl bg-amber-500/10 border border-amber-300/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-black text-amber-950 truncate">
                {urgentTasks.length} Urgent Health Task{urgentTasks.length > 1 ? 's' : ''}
              </p>
              <p className="text-[11px] text-amber-800 truncate">
                {urgentTasks[0].title} &bull; Due: {formatDate(urgentTasks[0].dueDate)}
              </p>
            </div>
          </div>
          <Link
            to="/tasks"
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs flex-shrink-0"
          >
            View
          </Link>
        </section>
      )}

      {/* 6. COLLAPSIBLE HERD ANALYTICS & CHARTS */}
      <section className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
        <button
          type="button"
          onClick={() => setShowAnalytics((prev) => !prev)}
          className="w-full flex items-center justify-between text-left active:scale-[0.99] transition-transform"
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <div>
              <h3 className="text-sm font-black text-slate-900">Herd Growth & Stage Distribution</h3>
              <p className="text-[11px] text-slate-500">Analytics across 10 active hogs</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl">
            <span>{showAnalytics ? 'Hide' : 'Show'}</span>
            {showAnalytics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showAnalytics && (
          <div className="mt-5 pt-4 border-t border-slate-100 space-y-6 animate-fadeIn">
            {/* Status Breakdown Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {statusDistribution.map((item) => (
                <div
                  key={item.name}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center"
                >
                  <p className="text-xs font-black" style={{ color: item.color }}>
                    {item.name}
                  </p>
                  <p className="text-lg font-black text-slate-900 mt-0.5">
                    {item.value} <span className="text-[11px] font-normal text-slate-400">({item.percentage}%)</span>
                  </p>
                </div>
              ))}
            </div>

            {/* Growth Curve Chart */}
            <div>
              <p className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                6-Month Herd Population Trajectory
              </p>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={herdGrowthData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#growthGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
