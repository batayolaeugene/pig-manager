import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Warehouse,
  TrendingUp,
  DollarSign,
  ClipboardList,
  Plus,
  ArrowRight,
  Scale,
  Calendar,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Utensils,
  ChevronDown,
  ChevronUp,
  BarChart3,
  ShieldAlert,
  Check,
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
import { usePigs, useTasks, useFinances } from '../context/AppContext';
import {
  formatDate,
  formatRelative,
  formatCurrency,
  formatWeight,
  getProgressToMarket,
  calculateFeedForBatch,
  getEstimatedMarketValue,
} from '../utils/helpers';
import { PIG_STATUS, PIG_STATUS_LABELS, MARKET_STANDARDS } from '../utils/constants';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../components/Toast';

const STATUS_COLORS = {
  [PIG_STATUS.WEANING]: '#3b82f6', // blue
  [PIG_STATUS.GROWING]: '#f59e0b', // amber
  [PIG_STATUS.FINISHING]: '#8b5cf6', // purple
  [PIG_STATUS.MARKET_READY]: '#10b981', // emerald
};

// Custom Tooltip for Area Chart
function AreaChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs shadow-xl border border-slate-700">
        <p className="font-semibold text-slate-300">{label}</p>
        <p className="text-emerald-400 font-bold text-sm mt-0.5">
          {payload[0].value} Pigs
        </p>
      </div>
    );
  }
  return null;
}

// Custom Tooltip for Donut Chart
function PieChartTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs shadow-xl border border-slate-700">
        <p className="font-semibold" style={{ color: data.payload.color }}>
          {data.name}
        </p>
        <p className="text-white font-bold text-sm mt-0.5">
          {data.value} Pigs ({data.payload.percentage}%)
        </p>
      </div>
    );
  }
  return null;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { pigs } = usePigs();
  const { tasks, completeTask } = useTasks();
  const { finances, getTotalIncome } = useFinances();
  const { toast } = useToast();

  const [showMobileCharts, setShowMobileCharts] = useState(false);
  const [morningFed, setMorningFed] = useState(false);
  const [afternoonFed, setAfternoonFed] = useState(false);

  // Non-sold pigs
  const activePigs = useMemo(
    () => pigs.filter((p) => p.status !== PIG_STATUS.SOLD),
    [pigs]
  );

  // Market ready count & projected value
  const marketReadyPigs = useMemo(
    () => pigs.filter((p) => p.status === PIG_STATUS.MARKET_READY),
    [pigs]
  );

  const marketReadyValue = useMemo(() => {
    return marketReadyPigs.reduce((sum, p) => {
      return sum + getEstimatedMarketValue(p.currentWeight);
    }, 0);
  }, [marketReadyPigs]);

  // Total Revenue (all income)
  const totalRevenue = useMemo(() => getTotalIncome(), [getTotalIncome]);

  // Active Tasks (non-completed)
  const activeTasksCount = useMemo(
    () => tasks.filter((t) => t.status !== 'completed').length,
    [tasks]
  );

  // Urgent / Overdue Tasks
  const urgentTasks = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(
      (t) =>
        t.status !== 'completed' &&
        (t.priority === 'urgent' || (t.dueDate && t.dueDate <= today))
    );
  }, [tasks]);

  // Daily Feed Totals for Herd
  const herdFeed = useMemo(() => {
    return calculateFeedForBatch(activePigs);
  }, [activePigs]);

  // Morning Ration (50% average) and Afternoon Ration (50%)
  const morningRationKg = Math.round((herdFeed.totalDailyKg * 0.5) * 10) / 10;
  const afternoonRationKg = Math.round((herdFeed.totalDailyKg * 0.5) * 10) / 10;

  // 6-month Herd Growth Calculation
  const herdGrowthData = useMemo(() => {
    const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
    const now = new Date();
    return months.map((month, index) => {
      const monthOffset = 5 - index;
      const targetMonthDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
      const count = pigs.filter((p) => {
        const pDate = new Date(p.dateOfBirth || p.createdAt || '2026-05-01');
        return pDate <= targetMonthDate;
      }).length;
      const adjustedCount = Math.max(count, Math.round(activePigs.length * (0.4 + index * 0.12)));
      return { month, count: adjustedCount };
    });
  }, [pigs, activePigs.length]);

  // Pig Status Distribution (excluding sold)
  const statusDistribution = useMemo(() => {
    const counts = {
      [PIG_STATUS.WEANING]: 0,
      [PIG_STATUS.GROWING]: 0,
      [PIG_STATUS.FINISHING]: 0,
      [PIG_STATUS.MARKET_READY]: 0,
    };

    activePigs.forEach((p) => {
      if (counts[p.status] !== undefined) {
        counts[p.status] += 1;
      }
    });

    const total = activePigs.length || 1;

    return [
      {
        name: 'Weaning',
        statusKey: PIG_STATUS.WEANING,
        value: counts[PIG_STATUS.WEANING],
        color: STATUS_COLORS[PIG_STATUS.WEANING],
        percentage: Math.round((counts[PIG_STATUS.WEANING] / total) * 100),
      },
      {
        name: 'Growing',
        statusKey: PIG_STATUS.GROWING,
        value: counts[PIG_STATUS.GROWING],
        color: STATUS_COLORS[PIG_STATUS.GROWING],
        percentage: Math.round((counts[PIG_STATUS.GROWING] / total) * 100),
      },
      {
        name: 'Finishing',
        statusKey: PIG_STATUS.FINISHING,
        value: counts[PIG_STATUS.FINISHING],
        color: STATUS_COLORS[PIG_STATUS.FINISHING],
        percentage: Math.round((counts[PIG_STATUS.FINISHING] / total) * 100),
      },
      {
        name: 'Market Ready',
        statusKey: PIG_STATUS.MARKET_READY,
        value: counts[PIG_STATUS.MARKET_READY],
        color: STATUS_COLORS[PIG_STATUS.MARKET_READY],
        percentage: Math.round((counts[PIG_STATUS.MARKET_READY] / total) * 100),
      },
    ].filter((item) => item.value > 0);
  }, [activePigs]);

  // Top 5 pigs closest to target market weight
  const topProgressPigs = useMemo(() => {
    return [...activePigs]
      .sort((a, b) => {
        const progA = getProgressToMarket(a.currentWeight, a.targetWeight);
        const progB = getProgressToMarket(b.currentWeight, b.targetWeight);
        return progB - progA;
      })
      .slice(0, 5);
  }, [activePigs]);

  // Next 5 upcoming tasks
  const upcomingTasks = useMemo(() => {
    return [...tasks]
      .filter((t) => t.status !== 'completed')
      .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0))
      .slice(0, 5);
  }, [tasks]);

  // Quick Weigh trigger
  const triggerQuickWeigh = (pigId = null) => {
    window.dispatchEvent(
      new CustomEvent('porkpro:open-weigh', { detail: { pigId } })
    );
  };

  return (
    <div className="space-y-5 sm:space-y-7 animate-fadeIn max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">
              Farm Dashboard
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <Sparkles className="w-3 h-3 text-emerald-500" /> PH Standard
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Real-time swine herd metrics aligned with Philippine DA &amp; BAI guidelines.
          </p>
        </div>

        {/* Desktop Quick Header Buttons */}
        <div className="hidden sm:flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => triggerQuickWeigh()}
            className="btn-secondary py-2 text-xs font-bold"
          >
            <Scale className="w-4 h-4 text-emerald-600" />
            <span>Quick Weigh</span>
          </button>
          <Link to="/batches" className="btn-secondary py-2 text-xs">
            <Layers className="w-4 h-4 text-gray-500" />
            <span>Batches</span>
          </Link>
          <Link to="/pigs/add" className="btn-primary py-2 text-xs">
            <Plus className="w-4 h-4" />
            <span>Add Pig</span>
          </Link>
        </div>
      </div>

      {/* URGENT DA VACCINATION & HEALTH ALERT BANNER */}
      {urgentTasks.length > 0 && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-300/80 flex items-center justify-between gap-3 animate-slideIn">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-amber-950">
                {urgentTasks.length} Urgent / Overdue DA Health Task{urgentTasks.length > 1 ? 's' : ''}
              </p>
              <p className="text-[11px] sm:text-xs text-amber-800 line-clamp-1">
                {urgentTasks[0].title} &bull; Due: {formatDate(urgentTasks[0].dueDate)}
              </p>
            </div>
          </div>
          <Link
            to="/tasks"
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex-shrink-0"
          >
            Review Tasks
          </Link>
        </div>
      )}

      {/* FIELD QUICK ACTION BUTTONS (Glove-Friendly, Large Tap Zones) */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        <button
          type="button"
          onClick={() => triggerQuickWeigh()}
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-600/20 text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-bold block leading-tight">Weigh Pig</span>
            <span className="text-[10px] text-emerald-100 block">Fast 1-tap scale</span>
          </div>
        </button>

        <Link
          to="/feed"
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-gray-200/90 hover:border-blue-400 hover:bg-blue-50/40 active:scale-95 transition-all shadow-xs text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-bold text-gray-900 block leading-tight">
              Feed Guide
            </span>
            <span className="text-[10px] text-gray-500 block">DA daily rations</span>
          </div>
        </Link>

        <Link
          to="/pigs/add"
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-gray-200/90 hover:border-emerald-400 hover:bg-emerald-50/40 active:scale-95 transition-all shadow-xs text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-bold text-gray-900 block leading-tight">
              Add Pig
            </span>
            <span className="text-[10px] text-gray-500 block">Single or Batch</span>
          </div>
        </Link>

        <Link
          to="/tasks"
          className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-gray-200/90 hover:border-purple-400 hover:bg-purple-50/40 active:scale-95 transition-all shadow-xs text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-bold text-gray-900 block leading-tight">
              Today's Tasks
            </span>
            <span className="text-[10px] text-gray-500 block">Vaccine &amp; health</span>
          </div>
        </Link>
      </section>

      {/* TODAY'S FEEDING TRACKER (Philippine DA Morning & Afternoon Widget) */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-4 sm:p-6 shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Today's Feeding Schedule (DA Standard)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Total Active Herd: {activePigs.length} pigs &bull; Total Daily Feed:{' '}
                  <span className="text-emerald-400 font-bold">{herdFeed.totalDailyKg} kg</span> (
                  {formatCurrency(herdFeed.totalDailyCost)})
                </p>
              </div>
            </div>

            <Link
              to="/feed"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 self-start sm:self-auto"
            >
              <span>Detailed Ration Calculator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Morning & Afternoon Ration Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Morning Meal (6:00 AM) */}
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                morningFed
                  ? 'bg-emerald-950/40 border-emerald-500/50'
                  : 'bg-slate-800/80 border-slate-700/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                    🌅 Morning Ration
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-700 text-slate-300 font-mono">
                    6:00 AM
                  </span>
                </div>
                <span className="text-xs font-bold text-white">{morningRationKg} kg total</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Creep/Starter crumble &bull; 50% daily allowance
              </p>
              <button
                type="button"
                onClick={() => {
                  setMorningFed(!morningFed);
                  toast.success(
                    morningFed ? 'Morning feed unmarked' : 'Morning ration marked as completed!'
                  );
                }}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  morningFed
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                {morningFed ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Morning Fed (Done)</span>
                  </>
                ) : (
                  <span>Mark Morning Fed</span>
                )}
              </button>
            </div>

            {/* Afternoon Meal (4:00 PM) */}
            <div
              className={`p-3.5 rounded-2xl border transition-all ${
                afternoonFed
                  ? 'bg-emerald-950/40 border-emerald-500/50'
                  : 'bg-slate-800/80 border-slate-700/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-orange-400 flex items-center gap-1">
                    🌇 Afternoon Ration
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-700 text-slate-300 font-mono">
                    4:00 PM
                  </span>
                </div>
                <span className="text-xs font-bold text-white">{afternoonRationKg} kg total</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Grower/Finisher pellets &bull; Fresh water check (2-3L/kg)
              </p>
              <button
                type="button"
                onClick={() => {
                  setAfternoonFed(!afternoonFed);
                  toast.success(
                    afternoonFed
                      ? 'Afternoon feed unmarked'
                      : 'Afternoon ration marked as completed!'
                  );
                }}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  afternoonFed
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                {afternoonFed ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Afternoon Fed (Done)</span>
                  </>
                ) : (
                  <span>Mark Afternoon Fed</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TOP SECTION: 4 Stat Cards (Responsive 2x2 on Mobile, 4-Col Desktop) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <StatCard
          title="Active Swine Herd"
          value={activePigs.length}
          change="+8.5"
          changeLabel="vs last mo"
          icon={Warehouse}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Market Ready"
          value={marketReadyPigs.length}
          change={formatCurrency(marketReadyValue)}
          changeLabel="live market value"
          icon={TrendingUp}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Total Farm Revenue"
          value={formatCurrency(totalRevenue)}
          change="+12.4"
          changeLabel="YTD earnings"
          icon={DollarSign}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          title="Active Tasks"
          value={activeTasksCount}
          change={urgentTasks.length > 0 ? `${urgentTasks.length} urgent` : 'On schedule'}
          changeLabel={urgentTasks.length > 0 ? 'needs attention' : 'all good'}
          icon={ClipboardList}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
      </section>

      {/* MOBILE CHARTS TOGGLE BUTTON (Reduces mobile clutter) */}
      <div className="lg:hidden flex items-center justify-between p-3.5 bg-white rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-brand-600" />
          <span className="text-xs font-bold text-gray-800">
            {showMobileCharts ? 'Growth & Status Charts' : 'Herd Population Charts'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowMobileCharts(!showMobileCharts)}
          className="text-xs font-bold text-brand-600 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-50"
        >
          <span>{showMobileCharts ? 'Hide Charts' : 'Show Charts'}</span>
          {showMobileCharts ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* MIDDLE SECTION: 2 Charts Side by Side (Always visible on desktop, toggleable on mobile) */}
      <section className={`${showMobileCharts ? 'grid' : 'hidden lg:grid'} grid-cols-1 lg:grid-cols-2 gap-5`}>
        {/* Chart 1: Herd Growth Overview */}
        <div className="card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
                Herd Growth Overview
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Swine population trajectory over past 6 months
              </p>
            </div>
            <Link
              to="/pigs"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 group"
            >
              <span>View Herd</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="h-60 sm:h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={herdGrowthData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="herdGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip content={<AreaChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#herdGrowthGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Pig Status Distribution */}
        <div className="card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900 tracking-tight">
                Pig Status Distribution
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Active herd lifecycle breakdown
              </p>
            </div>
            <Link
              to="/pigs"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 group"
            >
              <span>Manage</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {statusDistribution.length === 0 ? (
            <div className="h-60 sm:h-64 flex items-center justify-center">
              <EmptyState
                title="No Active Pigs"
                description="Add pigs to view status breakdown"
              />
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 h-60 sm:h-64">
              <div className="relative w-44 h-44 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<PieChartTooltip />} />
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center metric */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-gray-900 leading-none">
                    {activePigs.length}
                  </span>
                  <span className="text-[10px] font-medium text-gray-500 mt-0.5">
                    Active Herd
                  </span>
                </div>
              </div>

              {/* Status Breakdown List */}
              <div className="flex-1 w-full space-y-2">
                {statusDistribution.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-xs p-2 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-semibold text-gray-700">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-bold text-gray-900">
                      <span>{item.value} pigs</span>
                      <span className="text-gray-400 font-normal">
                        ({item.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* BOTTOM SECTION: 3 Columns (Weight Leaderboard, Upcoming Tasks, Recent Finances) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Column 1: Weight Progress Leaderboard with 1-Tap Quick Weigh */}
        <div className="card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Market Weight Leaders</h3>
                  <p className="text-[11px] text-gray-400">Target: {MARKET_STANDARDS.targetLiveWeight.ideal} kg</p>
                </div>
              </div>
              <Link
                to="/pigs"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 group"
              >
                <span>All Pigs</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {topProgressPigs.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">
                No active pigs currently logged.
              </p>
            ) : (
              <div className="space-y-3">
                {topProgressPigs.map((pig) => {
                  const progress = getProgressToMarket(
                    pig.currentWeight,
                    pig.targetWeight
                  );
                  return (
                    <div
                      key={pig.id}
                      className="p-2.5 rounded-xl bg-gray-50/70 hover:bg-gray-100/70 border border-gray-100 transition-all flex items-center justify-between gap-3"
                    >
                      <div
                        onClick={() => navigate(`/pigs/${pig.id}`)}
                        className="flex-1 cursor-pointer min-w-0"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900 text-xs truncate">
                            {pig.name}
                          </span>
                          <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-gray-200 text-gray-600">
                            {pig.tagNumber}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-brand-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, progress)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                          <span className="font-semibold text-gray-800">
                            {formatWeight(pig.currentWeight)}
                          </span>
                          <span className="font-bold text-brand-700">
                            {progress}%
                          </span>
                        </div>
                      </div>

                      {/* 1-Tap Quick Weigh Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerQuickWeigh(pig.id);
                        }}
                        className="p-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-xs flex-shrink-0 flex items-center gap-1 active:scale-95"
                        title="Quick Weigh"
                      >
                        <Scale className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Weigh</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Upcoming Tasks */}
        <div className="card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Upcoming Schedule</h3>
                  <p className="text-[11px] text-gray-400">Vaccines &amp; scale checks</p>
                </div>
              </div>
              <Link
                to="/tasks"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 group"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {upcomingTasks.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">
                All scheduled tasks completed!
              </p>
            ) : (
              <div className="space-y-2.5">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-2.5 rounded-xl bg-gray-50/70 border border-gray-100 flex items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => {
                          completeTask(task.id, true);
                          toast.success(`Completed: ${task.title}`);
                        }}
                        className="w-5 h-5 rounded-full border-2 border-gray-300 hover:border-emerald-500 hover:bg-emerald-50 flex items-center justify-center flex-shrink-0 transition-colors"
                        title="Mark Complete"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                          <span className="font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                            {task.category}
                          </span>
                          <span>&bull;</span>
                          <span className="text-gray-400">{formatDate(task.dueDate)}</span>
                        </div>
                      </div>
                    </div>
                    <StatusBadge type="task-priority" value={task.priority} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Recent Transactions in PHP */}
        <div className="card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Recent Transactions</h3>
                  <p className="text-[11px] text-gray-400">Philippine Peso (₱)</p>
                </div>
              </div>
              <Link
                to="/finance"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 group"
              >
                <span>Finance</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {finances.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">
                No financial transactions recorded.
              </p>
            ) : (
              <div className="space-y-2.5">
                {finances.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-gray-50/70 border border-gray-100 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {item.description || item.category}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {formatDate(item.date)} &bull; {item.category}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-extrabold flex-shrink-0 ${
                        item.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
