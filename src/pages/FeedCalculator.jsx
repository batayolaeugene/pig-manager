import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Scale,
  Layers,
  Calendar,
  AlertCircle,
  TrendingUp,
  Download,
  Info,
  Clock,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Flame,
  ArrowRight,
  Droplets,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { usePigs, useBatches } from '../context/AppContext';
import {
  FEED_TYPES,
  PIG_STATUS_LABELS,
  CURRENCY,
} from '../utils/constants';
import {
  formatCurrency,
  formatNumber,
  formatWeight,
  calculateDailyFeed,
  calculateFeedForBatch,
  getRecommendedFeed,
  cn,
} from '../utils/helpers';
import { StatusBadge } from '../components/StatusBadge';
import { useToast } from '../components/Toast';

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

export function FeedCalculator() {
  const { pigs } = usePigs();
  const { batches } = useBatches();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('pig'); // 'pig' | 'batch'

  // Per Pig State
  const [selectedPigId, setSelectedPigId] = useState(pigs[0]?.id || 'manual');
  const [manualWeight, setManualWeight] = useState(35);
  const [manualTargetWeight, setManualTargetWeight] = useState(110);

  // Per Batch State
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || '');

  // Active Pig details
  const activePig = useMemo(() => {
    if (selectedPigId === 'manual') return null;
    return pigs.find((p) => p.id === selectedPigId) || null;
  }, [pigs, selectedPigId]);

  const currentWeight = useMemo(() => {
    if (activePig) return Number(activePig.currentWeight) || 30;
    return Math.max(1, Number(manualWeight) || 30);
  }, [activePig, manualWeight]);

  const targetWeight = useMemo(() => {
    if (activePig) return Number(activePig.targetWeight) || 110;
    return Math.max(currentWeight + 5, Number(manualTargetWeight) || 110);
  }, [activePig, manualTargetWeight, currentWeight]);

  // Feed calculation for current weight
  const feedCalculation = useMemo(() => {
    return calculateDailyFeed(currentWeight);
  }, [currentWeight]);

  const { feedType, dailyKg, dailyCost } = feedCalculation;
  const weeklyKg = Math.round(dailyKg * 7 * 100) / 100;
  const weeklyCost = Math.round(dailyCost * 7 * 100) / 100;
  const monthlyKg = Math.round(dailyKg * 30 * 100) / 100;
  const monthlyCost = Math.round(dailyCost * 30 * 100) / 100;

  // Next feed transition info
  const transitionInfo = useMemo(() => {
    if (!feedType) return null;
    if (currentWeight >= feedType.maxWeight) {
      return {
        isLastStage: true,
        message: 'Pig has reached or surpassed this stage weight range. Ensure market readiness or maintenance feed.',
      };
    }
    const nextFeed = FEED_TYPES.find((f) => f.minWeight >= feedType.maxWeight);
    const weightRemaining = Math.max(0, feedType.maxWeight - currentWeight);
    const daysRemaining = Math.round(weightRemaining / 0.7);

    return {
      isLastStage: !nextFeed,
      nextFeedName: nextFeed ? nextFeed.name : 'Target Market Weight',
      switchWeight: feedType.maxWeight,
      weightRemaining: Math.round(weightRemaining * 10) / 10,
      daysRemaining,
    };
  }, [feedType, currentWeight]);

  // Schedule recommendation based on growth stage
  const feedingSchedule = useMemo(() => {
    if (currentWeight < 25) {
      return {
        timesPerDay: 4,
        frequency: '4x daily (Every 4 hours: 7 AM, 11 AM, 3 PM, 7 PM)',
        split: '25% per meal',
        notes: 'Creep/starter feeding requires fresh rations to encourage appetite and avoid spoilage.',
        waterLiters: Math.round(dailyKg * 3.5 * 10) / 10,
      };
    }
    if (currentWeight < 60) {
      return {
        timesPerDay: 3,
        frequency: '3x daily (Morning 7 AM, Midday 1 PM, Evening 6 PM)',
        split: '35% Morning, 30% Midday, 35% Evening',
        notes: 'Active growing phase. Ensure steady nutrient delivery to prevent gorging.',
        waterLiters: Math.round(dailyKg * 3.0 * 10) / 10,
      };
    }
    return {
      timesPerDay: 2,
      frequency: '2x daily (Morning 7 AM, Evening 5 PM)',
      split: '50% Morning, 50% Evening',
      notes: 'Finisher stage. High energy conversion. Keep clean ad-libitum water supply.',
      waterLiters: Math.round(dailyKg * 2.8 * 10) / 10,
    };
  }, [currentWeight, dailyKg]);

  // Detailed Philippine DA morning/afternoon ration schedule items
  const rationScheduleItems = useMemo(() => {
    const schedule = feedType?.schedule && feedType.schedule.length > 0
      ? feedType.schedule
      : [
          { time: '6:00 AM', label: 'Morning Ration', pct: 50 },
          { time: '4:00 PM', label: 'Afternoon Ration', pct: 50 },
        ];

    return schedule.map((item, index) => {
      const amountKg = Math.round((dailyKg * (item.pct / 100)) * 100) / 100;
      const amountGrams = Math.round(amountKg * 1000);
      const cost = Math.round((amountKg * (feedType?.costPerKg || 0)) * 100) / 100;
      return {
        ...item,
        index,
        amountKg,
        amountGrams,
        cost,
      };
    });
  }, [feedType, dailyKg]);

  // Projection simulation to target weight assuming 0.7 kg/day ADG
  const projectionData = useMemo(() => {
    if (currentWeight >= targetWeight) {
      return [];
    }

    const data = [];
    let simWeight = currentWeight;
    const dailyGain = 0.7; // 0.7 kg/day
    let monthIdx = 1;
    let totalDays = 0;

    while (simWeight < targetWeight && monthIdx <= 12) {
      let monthCost = 0;
      let monthFeedKg = 0;
      const startW = simWeight;
      let daysInMonth = 0;

      for (let day = 0; day < 30; day++) {
        if (simWeight >= targetWeight) break;
        daysInMonth++;
        totalDays++;
        const currentFeed = calculateDailyFeed(simWeight);
        monthCost += currentFeed.dailyCost;
        monthFeedKg += currentFeed.dailyKg;
        simWeight += dailyGain;
      }

      data.push({
        month: `Month ${monthIdx}`,
        cost: Math.round(monthCost * 100) / 100,
        feedKg: Math.round(monthFeedKg * 10) / 10,
        startWeight: Math.round(startW * 10) / 10,
        endWeight: Math.round(Math.min(simWeight, targetWeight) * 10) / 10,
        days: daysInMonth,
      });

      monthIdx++;
    }

    return data;
  }, [currentWeight, targetWeight]);

  const projectionSummary = useMemo(() => {
    const totalCost = projectionData.reduce((acc, curr) => acc + curr.cost, 0);
    const totalKg = projectionData.reduce((acc, curr) => acc + curr.feedKg, 0);
    const totalDays = projectionData.reduce((acc, curr) => acc + curr.days, 0);
    const kgToGain = Math.max(0, targetWeight - currentWeight);

    return {
      totalCost,
      totalKg,
      totalDays,
      kgToGain: Math.round(kgToGain * 10) / 10,
      fcr: totalKg > 0 && kgToGain > 0 ? (totalKg / kgToGain).toFixed(2) : '2.80',
    };
  }, [projectionData, currentWeight, targetWeight]);

  // Active Batch details
  const activeBatch = useMemo(() => {
    return batches.find((b) => b.id === selectedBatchId) || batches[0] || null;
  }, [batches, selectedBatchId]);

  const batchPigs = useMemo(() => {
    if (!activeBatch) return [];
    return pigs.filter(
      (p) => activeBatch.pigIds?.includes(p.id) || p.batchId === activeBatch.id
    );
  }, [activeBatch, pigs]);

  const batchFeedStats = useMemo(() => {
    return calculateFeedForBatch(batchPigs);
  }, [batchPigs]);

  const batchFeedDistribution = useMemo(() => {
    const counts = {};
    FEED_TYPES.forEach((f) => {
      counts[f.name] = 0;
    });

    batchFeedStats.details.forEach((item) => {
      const name = item.feedType.name;
      counts[name] = (counts[name] || 0) + 1;
    });

    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([name, count]) => ({
        name,
        count,
      }));
  }, [batchFeedStats]);

  const batchWeightMetrics = useMemo(() => {
    if (!batchPigs.length) return { min: 0, max: 0, avg: 0 };
    const weights = batchPigs.map((p) => Number(p.currentWeight) || 0);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const sum = weights.reduce((a, b) => a + b, 0);
    const avg = Math.round((sum / weights.length) * 10) / 10;
    return { min, max, avg };
  }, [batchPigs]);

  const handleExport = () => {
    toast.info('Export feed ration sheet feature is currently in preparation.');
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Feed Ration & Cost Calculator
              </h2>
              <p className="text-xs text-gray-500">
                Scientifically formulate rations, predict feeding costs, and track feed conversion rates
              </p>
            </div>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('pig')}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150',
              activeTab === 'pig'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <Scale className="w-3.5 h-3.5 text-emerald-600" />
            Per Pig Analysis
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('batch')}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150',
              activeTab === 'batch'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            Per Batch Ration
          </button>
        </div>
      </div>

      {/* ===================== PER PIG MODE ===================== */}
      {activeTab === 'pig' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="card-flat bg-white border border-gray-200/80 p-5 rounded-2xl shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="label">Select Pig or Mode</label>
                <select
                  className="select font-medium text-gray-800"
                  value={selectedPigId}
                  onChange={(e) => setSelectedPigId(e.target.value)}
                >
                  <option value="manual">⚙️ Manual Weight (Unregistered Pig)</option>
                  <optgroup label="Registered Herd Pigs">
                    {pigs.map((pig) => (
                      <option key={pig.id} value={pig.id}>
                        {pig.tagNumber} - {pig.name} ({pig.currentWeight} kg - {pig.breed})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {selectedPigId === 'manual' ? (
                <>
                  <div>
                    <label className="label">Current Weight (kg)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="5"
                        max="350"
                        step="0.5"
                        className="input pr-12 font-semibold text-gray-900"
                        value={manualWeight}
                        onChange={(e) => setManualWeight(Number(e.target.value))}
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                        kg
                      </span>
                    </div>
                    {/* Stepper Buttons for Mobile/Glove Usage */}
                    <div className="grid grid-cols-4 gap-1 mt-1.5">
                      <button
                        type="button"
                        onClick={() => setManualWeight((w) => Math.max(5, Math.round((Number(w) - 5) * 10) / 10))}
                        className="py-1 px-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[11px] font-bold"
                      >
                        -5kg
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualWeight((w) => Math.max(5, Math.round((Number(w) - 1) * 10) / 10))}
                        className="py-1 px-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[11px] font-bold"
                      >
                        -1kg
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualWeight((w) => Math.round((Number(w) + 1) * 10) / 10)}
                        className="py-1 px-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded text-[11px] font-bold"
                      >
                        +1kg
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualWeight((w) => Math.round((Number(w) + 5) * 10) / 10)}
                        className="py-1 px-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded text-[11px] font-bold"
                      >
                        +5kg
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="label">Target Market Weight (kg)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="30"
                        max="250"
                        step="1"
                        className="input pr-12 font-semibold text-gray-900"
                        value={manualTargetWeight}
                        onChange={(e) => setManualTargetWeight(Number(e.target.value))}
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                        kg
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="label">Registered Details</label>
                    <div className="h-[42px] px-3.5 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between text-xs text-gray-600">
                      <span>
                        Breed: <strong>{activePig?.breed}</strong>
                      </span>
                      <span>
                        Gender: <strong>{activePig?.gender}</strong>
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="label">Target Weight</label>
                    <div className="h-[42px] px-3.5 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between text-xs">
                      <span className="text-gray-500">Target Market:</span>
                      <span className="font-bold text-gray-900">
                        {activePig?.targetWeight || 110} kg
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick Active Pig Status Ribbon */}
          {activePig && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs text-emerald-900">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-semibold text-gray-900">
                  {activePig.name} ({activePig.tagNumber})
                </span>
                <span className="text-gray-400">|</span>
                <span>Current Weight: <strong>{formatWeight(currentWeight)}</strong></span>
                <span className="text-gray-400">|</span>
                <span>Status:</span>
                <StatusBadge type="pig-status" value={activePig.status} />
              </div>
              <div className="text-gray-600">
                Logged weight points: <strong>{activePig.weightHistory?.length || 1}</strong>
              </div>
            </div>
          )}

          {/* Key Metrics Grid (4 Gradient Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Recommended Feed */}
            <div className="gradient-card-blue rounded-2xl p-5 border border-blue-100/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
                    Recommended Feed
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                    {feedType.proteinPct}% CP
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                  {feedType.name}
                </h3>
                <p className="text-xs text-blue-900/80 mt-1">
                  Target bracket: {feedType.minWeight} - {feedType.maxWeight} kg
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-blue-200/50 flex items-center justify-between text-xs">
                <span className="text-gray-600">Unit Price:</span>
                <span className="font-bold text-blue-900">{formatCurrency(feedType.costPerKg)} / kg</span>
              </div>
            </div>

            {/* Card 2: Daily Feed Ration */}
            <div className="gradient-card-green rounded-2xl p-5 border border-emerald-100/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                    Daily Feed Ration
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    {feedType.dailyKgPer100kgBW}% BW
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-gray-900">
                    {dailyKg}
                  </span>
                  <span className="text-sm font-semibold text-gray-500">kg / day</span>
                </div>
                {/* Visual Meter */}
                <div className="mt-2.5">
                  <div className="w-full bg-emerald-200/60 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, (dailyKg / 4.5) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-emerald-800/80 mt-1">
                    <span>Low (1kg)</span>
                    <span>Standard ({dailyKg}kg)</span>
                    <span>Max (4.5kg)</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-emerald-200/50 flex items-center justify-between text-xs">
                <span className="text-gray-600">Daily Cost:</span>
                <span className="font-bold text-emerald-900">{formatCurrency(dailyCost)} / day</span>
              </div>
            </div>

            {/* Card 3: Weekly Feed */}
            <div className="gradient-card-amber rounded-2xl p-5 border border-amber-100/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                    Weekly (7 Days)
                  </span>
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-gray-900">
                    {weeklyKg}
                  </span>
                  <span className="text-sm font-semibold text-gray-500">kg</span>
                </div>
                <p className="text-xs text-amber-900/80 mt-1">
                  Schedule: {feedingSchedule.timesPerDay} meals per day
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-amber-200/50 flex items-center justify-between text-xs">
                <span className="text-gray-600">Weekly Cost:</span>
                <span className="font-bold text-amber-900">{formatCurrency(weeklyCost)}</span>
              </div>
            </div>

            {/* Card 4: Monthly Feed */}
            <div className="gradient-card-purple rounded-2xl p-5 border border-purple-100/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-purple-800 uppercase tracking-wider">
                    Monthly (30 Days)
                  </span>
                  <Sparkles className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-gray-900">
                    {monthlyKg}
                  </span>
                  <span className="text-sm font-semibold text-gray-500">kg</span>
                </div>
                <p className="text-xs text-purple-900/80 mt-1 truncate">
                  Est. Gain: ~21.0 kg / month
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-purple-200/50 flex items-center justify-between text-xs">
                <span className="text-gray-600">Monthly Cost:</span>
                <span className="font-bold text-purple-900">{formatCurrency(monthlyCost)}</span>
              </div>
            </div>
          </div>

          {/* 🕐 Daily Feeding Schedule (DA Philippines Standard) */}
          <div className="card bg-white border border-gray-200/80 p-6 rounded-2xl shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🕐</span>
                  <h3 className="text-base font-bold text-gray-900 tracking-tight">
                    Daily Feeding Schedule (DA Philippines Standard)
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Department of Agriculture recommended split rations for {feedType.name} • {rationScheduleItems.length} feedings per day
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-xs font-bold text-emerald-800">
                  Daily Intake: {dailyKg} kg ({formatCurrency(dailyCost)} / day)
                </span>
              </div>
            </div>

            {/* Visual Timeline with connecting lines & colored dots */}
            <div className="px-2 sm:px-6 py-2">
              <div className="relative">
                {/* Horizontal connecting line on sm+ screens */}
                <div className="absolute top-5 left-10 right-10 h-1 bg-gradient-to-r from-emerald-200 via-teal-300 to-emerald-400 rounded-full hidden sm:block -z-0" />

                {/* Stations */}
                <div
                  className={cn(
                    'grid grid-cols-1 gap-6 relative z-10',
                    rationScheduleItems.length === 2 && 'sm:grid-cols-2',
                    rationScheduleItems.length === 3 && 'sm:grid-cols-3',
                    rationScheduleItems.length >= 4 && 'sm:grid-cols-4'
                  )}
                >
                  {rationScheduleItems.map((ration, idx) => (
                    <div key={idx} className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 rounded-full bg-white border-2 border-emerald-600 text-emerald-700 shadow-sm flex items-center justify-center font-bold text-xs ring-4 ring-emerald-50 transition-transform hover:scale-105">
                        <Clock className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="mt-2.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-100">
                          {ration.time}
                        </span>
                        <p className="text-xs font-bold text-gray-900 mt-1">{ration.label}</p>
                        <p className="text-[11px] font-semibold text-emerald-700">
                          {ration.pct}% of daily total
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ration Cards Grid with kg, grams, and cost */}
            <div
              className={cn(
                'grid grid-cols-1 gap-4',
                rationScheduleItems.length === 2 && 'sm:grid-cols-2',
                rationScheduleItems.length === 3 && 'sm:grid-cols-3',
                rationScheduleItems.length >= 4 && 'sm:grid-cols-2 lg:grid-cols-4'
              )}
            >
              {rationScheduleItems.map((ration, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-emerald-50/40 via-white to-gray-50/60 rounded-xl p-4 border border-emerald-100/80 shadow-2xs hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{ration.time}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {ration.pct}% Split
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-gray-900 mb-3">{ration.label}</h4>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-baseline justify-between bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-xs">
                      <span className="text-gray-400 font-medium text-[11px] uppercase tracking-wider">Feed Amount</span>
                      <div className="text-right">
                        <span className="font-extrabold text-gray-900 text-base font-mono">{ration.amountKg} kg</span>
                        <span className="text-gray-400 text-[11px] ml-1 font-normal">({formatNumber(ration.amountGrams)}g)</span>
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-xs">
                      <span className="text-gray-400 font-medium text-[11px] uppercase tracking-wider">Estimated Cost</span>
                      <span className="font-bold text-emerald-800 text-xs font-mono">{formatCurrency(ration.cost)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tip Box with Feed Type Notes */}
            {feedType.notes && (
              <div className="flex items-start gap-3 p-4 bg-emerald-50/70 border border-emerald-200/70 rounded-xl text-xs text-emerald-900">
                <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-950">Feeding Advisory ({feedType.name}): </span>
                  <span>{feedType.notes}</span>
                </div>
              </div>
            )}

            {/* Water Requirement Reminder */}
            <div className="flex items-start gap-3 p-4 bg-blue-50/70 border border-blue-200/70 rounded-xl text-xs text-blue-900">
              <Droplets className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-blue-950">Water Requirement: </span>
                <span>
                  Always ensure clean fresh water. Pigs need 2-3 liters of water per kg of feed consumed.
                  (Estimated for this pig: ~{Math.round(dailyKg * 2.5 * 10) / 10}–{Math.round(dailyKg * 3.0 * 10) / 10} Liters/day)
                </span>
              </div>
            </div>
          </div>

          {/* Feed Stage Transition Advisory */}
          <div className="card bg-white border border-gray-200/80 p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-bold text-gray-900">
                Feed Stage Transition Advisory
              </h4>
            </div>
            {transitionInfo?.isLastStage ? (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800">
                <p className="font-semibold mb-1">Final Finishing Stage Active</p>
                <p>{transitionInfo.message}</p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-blue-900 font-semibold">
                      Next Feed: {transitionInfo?.nextFeedName}
                    </p>
                    <p className="text-blue-700 text-[11px] mt-0.5">
                      Triggered at weight threshold: <strong>{transitionInfo?.switchWeight} kg</strong>
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 bg-gray-50 rounded-lg">
                    <span className="text-gray-500 text-[11px]">Weight to Go</span>
                    <p className="text-sm font-bold text-gray-900">
                      +{transitionInfo?.weightRemaining} kg
                    </p>
                  </div>
                  <div className="p-2.5 bg-gray-50 rounded-lg">
                    <span className="text-gray-500 text-[11px]">Est. Days Until Switch</span>
                    <p className="text-sm font-bold text-blue-600">
                      ~{transitionInfo?.daysRemaining} days
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Projections Section (BarChart) */}
          <div className="card bg-white border border-gray-200/80 p-6 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Projected Feed Cost to Target Market Weight ({targetWeight} kg)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Simulated 30-day feeding intervals based on average daily gain (ADG) of 0.70 kg/day
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Monthly Feed Cost
                </span>
                <span className="inline-flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Feed Amount (kg)
                </span>
              </div>
            </div>

            {projectionData.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500 bg-gray-50 rounded-xl">
                Pig has already achieved or exceeded the target weight of {targetWeight} kg. No future feed projection required.
              </div>
            ) : (
              <>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={projectionData}
                      margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        stroke="#cbd5e1"
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        stroke="#cbd5e1"
                        tickFormatter={(v) => `${CURRENCY}${v}`}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        stroke="#cbd5e1"
                        tickFormatter={(v) => `${v}kg`}
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          name === 'cost' ? formatCurrency(value) : `${value} kg`,
                          name === 'cost' ? 'Monthly Cost' : 'Feed Consumed',
                        ]}
                        labelFormatter={(label, payload) => {
                          const item = payload?.[0]?.payload;
                          if (!item) return label;
                          return `${label} (${item.startWeight}kg → ${item.endWeight}kg)`;
                        }}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '0.75rem',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          fontSize: '12px',
                        }}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="cost"
                        name="cost"
                        fill="#059669"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={45}
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="feedKg"
                        name="feedKg"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={45}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Projection Summary Metric Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-gray-100 text-center">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-[11px] text-gray-500 font-medium">Estimated Days to Finish</p>
                    <p className="text-base font-bold text-gray-900 mt-0.5">
                      {projectionSummary.totalDays} Days
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-[11px] text-gray-500 font-medium">Total Feed Needed</p>
                    <p className="text-base font-bold text-blue-700 mt-0.5">
                      {projectionSummary.totalKg.toFixed(1)} kg
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-[11px] text-gray-500 font-medium">Total Projected Feed Cost</p>
                    <p className="text-base font-bold text-emerald-700 mt-0.5">
                      {formatCurrency(projectionSummary.totalCost)}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-[11px] text-gray-500 font-medium">Est. Feed Conversion (FCR)</p>
                    <p className="text-base font-bold text-purple-700 mt-0.5">
                      {projectionSummary.fcr} : 1
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Feed Type Reference Table */}
          <div className="card bg-white border border-gray-200/80 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Standard Feed Type Reference & Specifications
                </h3>
                <p className="text-xs text-gray-500">
                  Nutritional standards and costs applied in all farm calculations
                </p>
              </div>
              <span className="text-xs text-gray-400">
                Active stage highlighted in green
              </span>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/75 text-gray-600 font-semibold uppercase tracking-wider">
                    <th className="px-4 py-3">Feed Grade / Type</th>
                    <th className="px-4 py-3">Weight Range</th>
                    <th className="px-4 py-3">Crude Protein</th>
                    <th className="px-4 py-3">Ration (% BW)</th>
                    <th className="px-4 py-3">Cost per Kg</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {FEED_TYPES.map((feed) => {
                    const isActive = feed.id === feedType.id;
                    return (
                      <tr
                        key={feed.id}
                        className={cn(
                          'transition-colors',
                          isActive ? 'bg-emerald-50/60 font-semibold' : 'hover:bg-gray-50'
                        )}
                      >
                        <td className="px-4 py-3.5 text-gray-900 flex items-center gap-2">
                          {isActive && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                          {feed.name}
                        </td>
                        <td className="px-4 py-3.5 text-gray-700">
                          {feed.minWeight} – {feed.maxWeight} kg
                        </td>
                        <td className="px-4 py-3.5 text-gray-700">
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800">
                            {feed.proteinPct}% CP
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-gray-700">
                          {feed.dailyKgPer100kgBW}% body weight
                        </td>
                        <td className="px-4 py-3.5 text-emerald-700 font-bold">
                          {formatCurrency(feed.costPerKg)}
                        </td>
                        <td className="px-4 py-3.5">
                          {isActive ? (
                            <span className="badge-green">Active Target</span>
                          ) : (
                            <span className="badge-gray">Standard</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== PER BATCH MODE ===================== */}
      {activeTab === 'batch' && (
        <div className="space-y-6">
          {/* Batch Selector & Overview */}
          <div className="card-flat bg-white border border-gray-200/80 p-5 rounded-2xl shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="label">Select Batch</label>
                <select
                  className="select font-medium text-gray-800"
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                >
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name} ({batch.pigIds?.length || 0} pigs)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Cohort Size & Weights</label>
                <div className="h-[42px] px-3.5 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between text-xs text-gray-700">
                  <span>
                    Count: <strong>{batchPigs.length} pigs</strong>
                  </span>
                  <span>
                    Range: <strong>{batchWeightMetrics.min} – {batchWeightMetrics.max} kg</strong>
                  </span>
                </div>
              </div>

              <div>
                <label className="label">Average Weight</label>
                <div className="h-[42px] px-3.5 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between text-xs text-gray-700">
                  <span>Cohort Average:</span>
                  <span className="font-bold text-gray-900">
                    {batchWeightMetrics.avg} kg
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Batch Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="gradient-card-green rounded-2xl p-5 border border-emerald-100/80 shadow-xs">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                Total Daily Feed
              </span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-2xl font-extrabold text-gray-900">
                  {batchFeedStats.totalDailyKg}
                </span>
                <span className="text-sm font-semibold text-gray-500">kg / day</span>
              </div>
              <p className="text-xs text-emerald-900/80 mt-1">
                For {batchPigs.length} pigs in cohort
              </p>
            </div>

            <div className="gradient-card-blue rounded-2xl p-5 border border-blue-100/80 shadow-xs">
              <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
                Total Daily Cost
              </span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-2xl font-extrabold text-gray-900">
                  {formatCurrency(batchFeedStats.totalDailyCost)}
                </span>
                <span className="text-sm font-semibold text-gray-500">/ day</span>
              </div>
              <p className="text-xs text-blue-900/80 mt-1">
                Avg {formatCurrency(batchPigs.length ? batchFeedStats.totalDailyCost / batchPigs.length : 0)} / pig
              </p>
            </div>

            <div className="gradient-card-amber rounded-2xl p-5 border border-amber-100/80 shadow-xs">
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                Weekly Requirement
              </span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-2xl font-extrabold text-gray-900">
                  {Math.round(batchFeedStats.totalDailyKg * 7)}
                </span>
                <span className="text-sm font-semibold text-gray-500">kg / week</span>
              </div>
              <p className="text-xs text-amber-900/80 mt-1">
                Cost: {formatCurrency(batchFeedStats.totalDailyCost * 7)}
              </p>
            </div>

            <div className="gradient-card-purple rounded-2xl p-5 border border-purple-100/80 shadow-xs">
              <span className="text-xs font-semibold text-purple-800 uppercase tracking-wider">
                Monthly (30d) Total
              </span>
              <div className="flex items-baseline gap-1.5 mt-2">
                <span className="text-2xl font-extrabold text-gray-900">
                  {Math.round(batchFeedStats.totalDailyKg * 30)}
                </span>
                <span className="text-sm font-semibold text-gray-500">kg / month</span>
              </div>
              <p className="text-xs text-purple-900/80 mt-1">
                Cost: {formatCurrency(batchFeedStats.totalDailyCost * 30)}
              </p>
            </div>
          </div>

          {/* Feed Distribution Pie Chart & Action Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card bg-white border border-gray-200/80 p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-1">
                  Feed Stage Distribution
                </h4>
                <p className="text-xs text-gray-500 mb-4">
                  Breakdown of feeding rations across batch members
                </p>
                <div className="h-52 w-full flex items-center justify-center">
                  {batchFeedDistribution.length === 0 ? (
                    <p className="text-xs text-gray-400">No pigs assigned to batch</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={batchFeedDistribution}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          innerRadius={45}
                          paddingAngle={3}
                        >
                          {batchFeedDistribution.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [`${value} pigs`, name]}
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            borderRadius: '0.75rem',
                            border: '1px solid #e2e8f0',
                            fontSize: '12px',
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          iconType="circle"
                          wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleExport}
                  className="btn-secondary w-full justify-center text-xs"
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Export Batch Ration Schedule
                </button>
              </div>
            </div>

            {/* Batch Individual Pigs Table */}
            <div className="lg:col-span-2 card bg-white border border-gray-200/80 p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Individual Pig Feed Calculations
                  </h4>
                  <p className="text-xs text-gray-500">
                    Detailed ration metrics for each pig in {activeBatch?.name}
                  </p>
                </div>
                <span className="text-xs font-semibold text-gray-500">
                  {batchPigs.length} records
                </span>
              </div>

              {batchPigs.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500 bg-gray-50 rounded-xl">
                  No pigs are currently assigned to this batch. Go to Pig Inventory to assign pigs.
                </div>
              ) : (
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/75 text-gray-600 font-semibold uppercase tracking-wider">
                        <th className="px-3.5 py-3">Tag & Name</th>
                        <th className="px-3.5 py-3">Weight</th>
                        <th className="px-3.5 py-3">Feed Type</th>
                        <th className="px-3.5 py-3">Daily (kg)</th>
                        <th className="px-3.5 py-3">Daily Cost</th>
                        <th className="px-3.5 py-3">Monthly Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {batchFeedStats.details.map((item) => (
                        <tr key={item.pig.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3.5 py-3 font-medium text-gray-900">
                            <div>{item.pig.name}</div>
                            <div className="text-[10px] text-gray-400 font-mono">
                              {item.pig.tagNumber}
                            </div>
                          </td>
                          <td className="px-3.5 py-3 text-gray-700">
                            {formatWeight(item.pig.currentWeight)}
                          </td>
                          <td className="px-3.5 py-3">
                            <span className="badge-blue text-[11px]">
                              {item.feedType.name}
                            </span>
                          </td>
                          <td className="px-3.5 py-3 font-semibold text-gray-900">
                            {item.dailyKg} kg
                          </td>
                          <td className="px-3.5 py-3 text-emerald-700 font-medium">
                            {formatCurrency(item.dailyCost)}
                          </td>
                          <td className="px-3.5 py-3 text-gray-800">
                            {formatCurrency(item.dailyCost * 30)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-bold text-gray-900 border-t-2 border-gray-200">
                        <td className="px-3.5 py-3.5" colSpan="3">
                          Total Cohort Daily Ration
                        </td>
                        <td className="px-3.5 py-3.5 text-blue-700">
                          {batchFeedStats.totalDailyKg} kg
                        </td>
                        <td className="px-3.5 py-3.5 text-emerald-700">
                          {formatCurrency(batchFeedStats.totalDailyCost)}
                        </td>
                        <td className="px-3.5 py-3.5 text-purple-700">
                          {formatCurrency(batchFeedStats.totalDailyCost * 30)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeedCalculator;
