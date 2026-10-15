import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  Scale,
  Layers,
  Building2,
  Calendar,
  CheckCircle,
  AlertCircle,
  Award,
  ArrowRight,
  Sparkles,
  Percent,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { usePigs, useBatches, useFinances } from '../context/AppContext';
import { PIG_STATUS, CURRENCY } from '../utils/constants';
import {
  formatCurrency,
  formatWeight,
  getDaysBetween,
  cn,
} from '../utils/helpers';
import { StatusBadge } from '../components/StatusBadge';

const COST_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export function ProfitCalculator() {
  const { pigs } = usePigs();
  const { batches } = useBatches();
  const { finances, getTotalIncome, getTotalExpenses } = useFinances();

  const [activeTab, setActiveTab] = useState('pig'); // 'pig' | 'batch' | 'farm'

  // Per Pig State
  const [selectedPigId, setSelectedPigId] = useState(pigs[0]?.id || '');
  const [customPricePerKg, setCustomPricePerKg] = useState(180); // Default market price ₱180/kg liveweight

  // Per Batch State
  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || '');

  // Active Pig computation
  const activePig = useMemo(() => {
    return pigs.find((p) => p.id === selectedPigId) || pigs[0] || null;
  }, [pigs, selectedPigId]);

  // Compute Pig Financials
  const pigFinancials = useMemo(() => {
    if (!activePig) return null;

    const purchasePrice = Number(activePig.purchasePrice) || 3500;

    // Direct expenses
    const directExpenses = finances.filter(
      (f) => f.type === 'expense' && f.pigId === activePig.id
    );

    let feedCost = directExpenses
      .filter((f) => f.category === 'Feed')
      .reduce((sum, f) => sum + Number(f.amount || 0), 0);

    let medicalCost = directExpenses
      .filter((f) => f.category === 'Medication' || f.category === 'Veterinary')
      .reduce((sum, f) => sum + Number(f.amount || 0), 0);

    let otherDirectCost = directExpenses
      .filter((f) => f.category !== 'Feed' && f.category !== 'Medication' && f.category !== 'Veterinary' && f.category !== 'Pig Purchase')
      .reduce((sum, f) => sum + Number(f.amount || 0), 0);

    // If pig is in a batch, allocate batch-level expenses proportionally
    if (activePig.batchId) {
      const batchPigsList = pigs.filter((p) => p.batchId === activePig.batchId);
      const pigCount = Math.max(1, batchPigsList.length);

      const batchExpenses = finances.filter(
        (f) => f.type === 'expense' && f.batchId === activePig.batchId && !f.pigId
      );

      const batchFeed = batchExpenses
        .filter((f) => f.category === 'Feed')
        .reduce((sum, f) => sum + Number(f.amount || 0), 0);

      const batchMed = batchExpenses
        .filter((f) => f.category === 'Medication' || f.category === 'Veterinary')
        .reduce((sum, f) => sum + Number(f.amount || 0), 0);

      const batchOther = batchExpenses
        .filter((f) => f.category !== 'Feed' && f.category !== 'Medication' && f.category !== 'Veterinary')
        .reduce((sum, f) => sum + Number(f.amount || 0), 0);

      feedCost += batchFeed / pigCount;
      medicalCost += batchMed / pigCount;
      otherDirectCost += batchOther / pigCount;
    }

    // Realistic baseline fallback if no ledger records yet (Philippine Peso standards)
    if (feedCost === 0) {
      // Estimated feed intake ~2.8 FCR on gained weight * ₱38.00/kg
      const gainedKg = Math.max(10, (activePig.currentWeight || 30) - 8);
      feedCost = gainedKg * 2.8 * 38.00;
    }
    if (medicalCost === 0) {
      medicalCost = 450.0; // Basic preventative vaccinations
    }

    const totalCosts = purchasePrice + feedCost + medicalCost + otherDirectCost;

    // Actual revenue (if sold) vs Projected revenue
    const actualSaleIncome = finances
      .filter((f) => f.type === 'income' && f.pigId === activePig.id)
      .reduce((sum, f) => sum + Number(f.amount || 0), 0);

    const isSold = activePig.status === PIG_STATUS.SOLD && actualSaleIncome > 0;
    const projectedWeight = isSold ? activePig.currentWeight : (activePig.targetWeight || 110);
    const projectedRevenue = isSold ? actualSaleIncome : projectedWeight * customPricePerKg;

    const netProfit = projectedRevenue - totalCosts;
    const roi = totalCosts > 0 ? (netProfit / totalCosts) * 100 : 0;
    const breakEvenPricePerKg = projectedWeight > 0 ? totalCosts / projectedWeight : 0;

    return {
      purchasePrice: Math.round(purchasePrice * 100) / 100,
      feedCost: Math.round(feedCost * 100) / 100,
      medicalCost: Math.round(medicalCost * 100) / 100,
      otherCost: Math.round(otherDirectCost * 100) / 100,
      totalCosts: Math.round(totalCosts * 100) / 100,
      projectedRevenue: Math.round(projectedRevenue * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      roi: Math.round(roi * 10) / 10,
      breakEvenPricePerKg: Math.round(breakEvenPricePerKg * 100) / 100,
      isSold,
      projectedWeight,
    };
  }, [activePig, finances, pigs, customPricePerKg]);

  // Cost breakdown for active pig
  const pigCostBreakdownData = useMemo(() => {
    if (!pigFinancials) return [];
    return [
      { name: 'Purchase Price', value: pigFinancials.purchasePrice },
      { name: 'Feed Rations', value: pigFinancials.feedCost },
      { name: 'Health & Meds', value: pigFinancials.medicalCost },
      { name: 'Other Costs', value: pigFinancials.otherCost },
    ].filter((item) => item.value > 0);
  }, [pigFinancials]);

  // Comparison Bar Chart data (Cost vs Revenue)
  const pigComparisonData = useMemo(() => {
    if (!pigFinancials) return [];
    return [
      {
        name: 'Financial Comparison',
        'Total Investment': pigFinancials.totalCosts,
        'Projected Revenue': pigFinancials.projectedRevenue,
      },
    ];
  }, [pigFinancials]);

  // Active Batch calculation
  const activeBatch = useMemo(() => {
    return batches.find((b) => b.id === selectedBatchId) || batches[0] || null;
  }, [batches, selectedBatchId]);

  const batchAnalysis = useMemo(() => {
    if (!activeBatch) return null;
    const batchPigsList = pigs.filter(
      (p) => activeBatch.pigIds?.includes(p.id) || p.batchId === activeBatch.id
    );

    let totalInvestment = 0;
    let totalProjectedRevenue = 0;

    const pigBreakdown = batchPigsList.map((pig) => {
      const purchasePrice = Number(pig.purchasePrice) || 65;

      // Direct pig expenses
      const direct = finances.filter((f) => f.type === 'expense' && f.pigId === pig.id);
      let feed = direct.filter((f) => f.category === 'Feed').reduce((s, f) => s + f.amount, 0);
      let med = direct.filter((f) => f.category === 'Medication' || f.category === 'Veterinary').reduce((s, f) => s + f.amount, 0);
      let other = direct.filter((f) => f.category !== 'Feed' && f.category !== 'Medication' && f.category !== 'Veterinary' && f.category !== 'Pig Purchase').reduce((s, f) => s + f.amount, 0);

      // Proportionate batch expenses
      const count = Math.max(1, batchPigsList.length);
      const bExp = finances.filter((f) => f.type === 'expense' && f.batchId === activeBatch.id && !f.pigId);
      feed += bExp.filter((f) => f.category === 'Feed').reduce((s, f) => s + f.amount, 0) / count;
      med += bExp.filter((f) => f.category === 'Medication' || f.category === 'Veterinary').reduce((s, f) => s + f.amount, 0) / count;
      other += bExp.filter((f) => f.category !== 'Feed' && f.category !== 'Medication' && f.category !== 'Veterinary').reduce((s, f) => s + f.amount, 0) / count;

      if (feed === 0) {
        feed = Math.max(10, (pig.currentWeight || 30) - 8) * 2.8 * 38.00;
      }
      if (med === 0) med = 450;

      const totalCost = purchasePrice + feed + med + other;
      const actualIncome = finances.filter((f) => f.type === 'income' && f.pigId === pig.id).reduce((s, f) => s + f.amount, 0);
      const isSold = pig.status === PIG_STATUS.SOLD && actualIncome > 0;
      const rev = isSold ? actualIncome : (pig.targetWeight || 110) * customPricePerKg;
      const profit = rev - totalCost;
      const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;

      totalInvestment += totalCost;
      totalProjectedRevenue += rev;

      return {
        pig,
        purchasePrice: Math.round(purchasePrice),
        feedCost: Math.round(feed),
        medCost: Math.round(med),
        totalCost: Math.round(totalCost),
        revenue: Math.round(rev),
        profit: Math.round(profit),
        roi: Math.round(roi * 10) / 10,
      };
    });

    const netProfit = totalProjectedRevenue - totalInvestment;
    const avgRoi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;

    return {
      batchPigsList,
      pigBreakdown,
      totalInvestment: Math.round(totalInvestment * 100) / 100,
      totalProjectedRevenue: Math.round(totalProjectedRevenue * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      avgRoi: Math.round(avgRoi * 10) / 10,
    };
  }, [activeBatch, pigs, finances, customPricePerKg]);

  // Batch Cost Breakdown Pie Data
  const batchCostBreakdownData = useMemo(() => {
    if (!batchAnalysis || !batchAnalysis.pigBreakdown.length) return [];
    let purchases = 0;
    let feed = 0;
    let med = 0;

    batchAnalysis.pigBreakdown.forEach((p) => {
      purchases += p.purchasePrice;
      feed += p.feedCost;
      med += p.medCost;
    });

    return [
      { name: 'Feed Rations', value: Math.round(feed) },
      { name: 'Pig Acquisitions', value: Math.round(purchases) },
      { name: 'Health & Vet', value: Math.round(med) },
    ];
  }, [batchAnalysis]);

  // Batch Profit per Pig Bar Data
  const batchProfitPerPigData = useMemo(() => {
    if (!batchAnalysis) return [];
    return batchAnalysis.pigBreakdown.map((item) => ({
      name: item.pig.name,
      tag: item.pig.tagNumber,
      profit: item.profit,
    }));
  }, [batchAnalysis]);

  // Farm Overview Metrics
  const farmOverview = useMemo(() => {
    const totalPigsRaised = pigs.length;
    const totalIncomeAll = getTotalIncome();
    const totalExpensesAll = getTotalExpenses();

    // Sum pig purchases that might be in pigs list but not recorded in finances ledger
    const totalPigPurchaseCost = pigs.reduce((sum, p) => sum + (Number(p.purchasePrice) || 3500), 0);
    const ledgerPurchaseCost = finances
      .filter((f) => f.category === 'Pig Purchase')
      .reduce((sum, f) => sum + f.amount, 0);

    const unrecordedPurchases = Math.max(0, totalPigPurchaseCost - ledgerPurchaseCost);
    const totalFarmInvestment = totalExpensesAll + unrecordedPurchases;

    // Projected value of unsold pigs
    const unsoldPigsValue = pigs
      .filter((p) => p.status !== PIG_STATUS.SOLD)
      .reduce((sum, p) => sum + (p.targetWeight || 110) * customPricePerKg, 0);

    const totalRealizedAndProjectedRevenue = totalIncomeAll + unsoldPigsValue;
    const netFarmProfit = totalRealizedAndProjectedRevenue - totalFarmInvestment;
    const avgProfitPerPig = totalPigsRaised > 0 ? netFarmProfit / totalPigsRaised : 0;
    const avgRoi = totalFarmInvestment > 0 ? (netFarmProfit / totalFarmInvestment) * 100 : 0;

    // Ranked profitable pigs
    const rankedPigs = pigs
      .map((pig) => {
        const actualIncome = finances
          .filter((f) => f.type === 'income' && f.pigId === pig.id)
          .reduce((s, f) => s + f.amount, 0);
        const isSold = pig.status === PIG_STATUS.SOLD && actualIncome > 0;
        const rev = isSold ? actualIncome : (pig.targetWeight || 110) * customPricePerKg;

        const purchase = Number(pig.purchasePrice) || 3500;
        const direct = finances.filter((f) => f.type === 'expense' && f.pigId === pig.id);
        const directExp = direct.reduce((s, f) => s + f.amount, 0);
        const estFeed = directExp > 0 ? 0 : Math.max(10, (pig.currentWeight || 30) - 8) * 2.8 * 38.00;
        const totalCost = purchase + directExp + estFeed + 450;
        const profit = rev - totalCost;
        const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;

        return {
          pig,
          revenue: rev,
          cost: totalCost,
          profit,
          roi,
        };
      })
      .sort((a, b) => b.profit - a.profit);

    // Top 5 Expense Categories
    const catExpenses = {};
    finances
      .filter((f) => f.type === 'expense')
      .forEach((f) => {
        catExpenses[f.category] = (catExpenses[f.category] || 0) + Number(f.amount || 0);
      });

    const topExpenseCategories = Object.entries(catExpenses)
      .map(([name, amount]) => ({
        name,
        amount: Math.round(amount * 100) / 100,
        pct: totalExpensesAll > 0 ? Math.round((amount / totalExpensesAll) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Monthly Profit Trend data
    const monthKeys = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { month: 'short' });
      monthKeys[key] = { month: label, revenue: 0, expenses: 0, profit: 0 };
    }

    finances.forEach((f) => {
      if (!f.date) return;
      const key = f.date.substring(0, 7);
      if (monthKeys[key]) {
        if (f.type === 'income') {
          monthKeys[key].revenue += Number(f.amount) || 0;
        } else {
          monthKeys[key].expenses += Number(f.amount) || 0;
        }
        monthKeys[key].profit = monthKeys[key].revenue - monthKeys[key].expenses;
      }
    });

    const monthlyTrendData = Object.values(monthKeys);

    return {
      totalPigsRaised,
      totalFarmInvestment: Math.round(totalFarmInvestment * 100) / 100,
      totalRevenue: Math.round(totalRealizedAndProjectedRevenue * 100) / 100,
      netFarmProfit: Math.round(netFarmProfit * 100) / 100,
      avgProfitPerPig: Math.round(avgProfitPerPig * 100) / 100,
      avgRoi: Math.round(avgRoi * 10) / 10,
      topProfitablePigs: rankedPigs.slice(0, 5),
      topExpenseCategories,
      monthlyTrendData,
    };
  }, [pigs, finances, customPricePerKg, getTotalIncome, getTotalExpenses]);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Profit & Investment Calculator
              </h2>
              <p className="text-xs text-gray-500">
                Analyze unit economics, cost of gain, batch yields, and whole-farm return on investment
              </p>
            </div>
          </div>
        </div>

        {/* Global Market Price Simulator Input */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs">
            <span className="text-gray-500 font-medium">Live Market Price:</span>
            <div className="flex items-center">
              <span className="font-bold text-gray-700 mr-1">₱</span>
              <input
                type="number"
                step="5"
                min="50"
                max="500"
                className="w-16 px-1.5 py-0.5 text-xs font-bold bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 text-gray-900"
                value={customPricePerKg}
                onChange={(e) => setCustomPricePerKg(Number(e.target.value))}
              />
              <span className="text-gray-500 font-medium ml-1">/ kg</span>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200/80">
            <button
              type="button"
              onClick={() => setActiveTab('pig')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                activeTab === 'pig'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Scale className="w-3.5 h-3.5 text-emerald-600" />
              Per Pig
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('batch')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                activeTab === 'batch'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Per Batch
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('farm')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                activeTab === 'farm'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Building2 className="w-3.5 h-3.5 text-purple-600" />
              Farm Overview
            </button>
          </div>
        </div>
      </div>

      {/* ===================== TAB 1: PER PIG ===================== */}
      {activeTab === 'pig' && (
        <div className="space-y-6">
          {/* Pig Selector */}
          <div className="card-flat bg-white border border-gray-200/80 p-5 rounded-2xl shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="label">Select Pig for Unit Economic Analysis</label>
                <select
                  className="select font-medium text-gray-900"
                  value={selectedPigId}
                  onChange={(e) => setSelectedPigId(e.target.value)}
                >
                  {pigs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.tagNumber} - {p.name} ({p.currentWeight} kg - {p.breed} - {p.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Target Market Spec</label>
                <div className="h-[42px] px-3.5 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between text-xs text-gray-700">
                  <span>Target Weight:</span>
                  <span className="font-bold text-gray-900">
                    {pigFinancials?.projectedWeight} kg
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Unit Economics Highlight Banner (Profit / Loss & ROI) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              className={cn(
                'rounded-2xl p-5 border shadow-xs flex flex-col justify-between',
                (pigFinancials?.netProfit || 0) >= 0
                  ? 'gradient-card-green border-emerald-100/80'
                  : 'bg-red-50/70 border-red-200'
              )}
            >
              <div>
                <span
                  className={cn(
                    'text-xs font-semibold uppercase tracking-wider',
                    (pigFinancials?.netProfit || 0) >= 0
                      ? 'text-emerald-800'
                      : 'text-red-800'
                  )}
                >
                  {pigFinancials?.isSold ? 'Realized Net Profit' : 'Projected Net Profit'}
                </span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span
                    className={cn(
                      'text-3xl font-extrabold tracking-tight',
                      (pigFinancials?.netProfit || 0) >= 0
                        ? 'text-emerald-700'
                        : 'text-red-700'
                    )}
                  >
                    {formatCurrency(pigFinancials?.netProfit || 0)}
                  </span>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600 flex items-center justify-between">
                <span>Sale status:</span>
                <span className="font-semibold text-gray-900">
                  {pigFinancials?.isSold ? 'Sold (Realized)' : 'In Feedlot (Projected)'}
                </span>
              </div>
            </div>

            <div className="gradient-card-blue rounded-2xl p-5 border border-blue-100/80 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
                  Return on Investment (ROI)
                </span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-extrabold text-blue-900 tracking-tight">
                    {pigFinancials?.roi}%
                  </span>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600 flex items-center justify-between">
                <span>Profit margin:</span>
                <span className="font-semibold text-blue-950">
                  {pigFinancials?.projectedRevenue
                    ? Math.round(((pigFinancials.netProfit || 0) / pigFinancials.projectedRevenue) * 100)
                    : 0}
                  % of revenue
                </span>
              </div>
            </div>

            <div className="gradient-card-amber rounded-2xl p-5 border border-amber-100/80 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                  Total Invested Cost
                </span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    {formatCurrency(pigFinancials?.totalCosts || 0)}
                  </span>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600 flex items-center justify-between">
                <span>Break-even price:</span>
                <span className="font-bold text-amber-900">
                  ${pigFinancials?.breakEvenPricePerKg} / kg
                </span>
              </div>
            </div>

            <div className="gradient-card-purple rounded-2xl p-5 border border-purple-100/80 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-purple-800 uppercase tracking-wider">
                  Gross Revenue
                </span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-extrabold text-purple-900 tracking-tight">
                    {formatCurrency(pigFinancials?.projectedRevenue || 0)}
                  </span>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-600 flex items-center justify-between">
                <span>Weight base:</span>
                <span className="font-semibold text-purple-950">
                  {pigFinancials?.projectedWeight} kg @ ${customPricePerKg}/kg
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown Items List */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-white border border-gray-200/80 rounded-xl">
              <span className="text-xs text-gray-500 font-medium">1. Purchase Price</span>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {formatCurrency(pigFinancials?.purchasePrice || 0)}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">Weaner acquisition</p>
            </div>

            <div className="p-4 bg-white border border-gray-200/80 rounded-xl">
              <span className="text-xs text-gray-500 font-medium">2. Feed Rations</span>
              <p className="text-lg font-bold text-emerald-600 mt-1">
                {formatCurrency(pigFinancials?.feedCost || 0)}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">Direct + batch share</p>
            </div>

            <div className="p-4 bg-white border border-gray-200/80 rounded-xl">
              <span className="text-xs text-gray-500 font-medium">3. Health & Medical</span>
              <p className="text-lg font-bold text-blue-600 mt-1">
                {formatCurrency(pigFinancials?.medicalCost || 0)}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">Vaccines, therapy, vet</p>
            </div>

            <div className="p-4 bg-white border border-gray-200/80 rounded-xl">
              <span className="text-xs text-gray-500 font-medium">4. Other Overheads</span>
              <p className="text-lg font-bold text-purple-600 mt-1">
                {formatCurrency(pigFinancials?.otherCost || 0)}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">Utilities & supplies</p>
            </div>
          </div>

          {/* Visual Charts: Cost Breakdown & Revenue vs Cost */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cost Breakdown Donut Chart */}
            <div className="card bg-white border border-gray-200/80 p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-emerald-600" />
                    Unit Cost Distribution
                  </h3>
                  <p className="text-xs text-gray-500">
                    Proportion of capital invested in feed, animal stock, and medical care
                  </p>
                </div>
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pigCostBreakdownData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {pigCostBreakdownData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COST_COLORS[index % COST_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => formatCurrency(val)}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '0.75rem',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      iconType="circle"
                      wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Costs vs Revenue Visual Bar */}
            <div className="card bg-white border border-gray-200/80 p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    Investment vs Gross Return Comparison
                  </h3>
                  <p className="text-xs text-gray-500">
                    Direct comparison of total capital inputs vs revenue output
                  </p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={pigComparisonData}
                    margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      stroke="#cbd5e1"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      stroke="#cbd5e1"
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                      formatter={(val) => formatCurrency(val)}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '0.75rem',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      iconType="circle"
                      wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                    />
                    <Bar
                      dataKey="Total Investment"
                      fill="#ef4444"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={60}
                    />
                    <Bar
                      dataKey="Projected Revenue"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={60}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: PER BATCH ===================== */}
      {activeTab === 'batch' && (
        <div className="space-y-6">
          {/* Batch Selector */}
          <div className="card-flat bg-white border border-gray-200/80 p-5 rounded-2xl shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="label">Select Batch Cohort</label>
                <select
                  className="select font-medium text-gray-900"
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.pigIds?.length || 0} pigs)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Cohort Headcount</label>
                <div className="h-[42px] px-3.5 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between text-xs text-gray-700">
                  <span>Pigs Count:</span>
                  <span className="font-bold text-gray-900">
                    {batchAnalysis?.batchPigsList.length || 0} pigs
                  </span>
                </div>
              </div>

              <div>
                <label className="label">Target Date</label>
                <div className="h-[42px] px-3.5 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between text-xs text-gray-700">
                  <span>Market Target:</span>
                  <span className="font-bold text-gray-900">
                    {activeBatch?.targetMarketDate || 'Nov 2026'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Batch Aggregated Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="gradient-card-amber rounded-2xl p-5 border border-amber-100/80 shadow-xs">
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                Total Cohort Investment
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-gray-900">
                  {formatCurrency(batchAnalysis?.totalInvestment || 0)}
                </span>
              </div>
              <p className="text-xs text-amber-900/80 mt-1">
                Pigs + Feed + Health + Barn overheads
              </p>
            </div>

            <div className="gradient-card-purple rounded-2xl p-5 border border-purple-100/80 shadow-xs">
              <span className="text-xs font-semibold text-purple-800 uppercase tracking-wider">
                Total Projected Revenue
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-purple-900">
                  {formatCurrency(batchAnalysis?.totalProjectedRevenue || 0)}
                </span>
              </div>
              <p className="text-xs text-purple-900/80 mt-1">
                Based on target weights @ ${customPricePerKg}/kg
              </p>
            </div>

            <div
              className={cn(
                'rounded-2xl p-5 border shadow-xs',
                (batchAnalysis?.netProfit || 0) >= 0
                  ? 'gradient-card-green border-emerald-100/80'
                  : 'bg-red-50 border-red-200'
              )}
            >
              <span
                className={cn(
                  'text-xs font-semibold uppercase tracking-wider',
                  (batchAnalysis?.netProfit || 0) >= 0
                    ? 'text-emerald-800'
                    : 'text-red-800'
                )}
              >
                Projected Cohort Profit
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span
                  className={cn(
                    'text-3xl font-extrabold',
                    (batchAnalysis?.netProfit || 0) >= 0
                      ? 'text-emerald-700'
                      : 'text-red-700'
                  )}
                >
                  {formatCurrency(batchAnalysis?.netProfit || 0)}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Avg {formatCurrency(batchAnalysis?.batchPigsList.length ? (batchAnalysis?.netProfit || 0) / batchAnalysis.batchPigsList.length : 0)} / pig
              </p>
            </div>

            <div className="gradient-card-blue rounded-2xl p-5 border border-blue-100/80 shadow-xs">
              <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
                Average Cohort ROI
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-blue-900">
                  {batchAnalysis?.avgRoi}%
                </span>
              </div>
              <p className="text-xs text-blue-900/80 mt-1">
                Annualized return on invested capital
              </p>
            </div>
          </div>

          {/* Batch Charts: Cost Breakdown & Profit per Pig */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card bg-white border border-gray-200/80 p-6 rounded-2xl">
              <h4 className="text-sm font-bold text-gray-900 mb-1">
                Cohort Cost Structure
              </h4>
              <p className="text-xs text-gray-500 mb-4">
                Total expenditure distribution across {activeBatch?.name}
              </p>
              <div className="h-60 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={batchCostBreakdownData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {batchCostBreakdownData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COST_COLORS[index % COST_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => formatCurrency(val)}
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
              </div>
            </div>

            <div className="card bg-white border border-gray-200/80 p-6 rounded-2xl">
              <h4 className="text-sm font-bold text-gray-900 mb-1">
                Profit Margin per Pig in Batch
              </h4>
              <p className="text-xs text-gray-500 mb-4">
                Individual pig projected profit margin comparison
              </p>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={batchProfitPerPigData}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      stroke="#cbd5e1"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      stroke="#cbd5e1"
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                      formatter={(val) => [formatCurrency(val), 'Net Profit']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '0.75rem',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                    />
                    <Bar
                      dataKey="profit"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detailed Batch Pig Breakdown Table */}
          <div className="card bg-white border border-gray-200/80 p-6 rounded-2xl">
            <h4 className="text-sm font-bold text-gray-900 mb-1">
              Cohort Member Financial Breakdown
            </h4>
            <p className="text-xs text-gray-500 mb-4">
              Individual unit cost, projected revenue, and net return for each pig
            </p>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/75 text-gray-600 font-semibold uppercase tracking-wider">
                    <th className="px-3.5 py-3">Tag # & Name</th>
                    <th className="px-3.5 py-3">Current Weight</th>
                    <th className="px-3.5 py-3">Acquisition</th>
                    <th className="px-3.5 py-3">Feed Cost</th>
                    <th className="px-3.5 py-3">Med / Health</th>
                    <th className="px-3.5 py-3">Total Cost</th>
                    <th className="px-3.5 py-3">Est. Revenue</th>
                    <th className="px-3.5 py-3 text-right">Net Profit</th>
                    <th className="px-3.5 py-3 text-right">ROI %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {batchAnalysis?.pigBreakdown.map((item) => (
                    <tr key={item.pig.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3.5 py-3.5 font-medium text-gray-900">
                        <div>{item.pig.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          {item.pig.tagNumber}
                        </div>
                      </td>
                      <td className="px-3.5 py-3.5 text-gray-700">
                        {formatWeight(item.pig.currentWeight)}
                      </td>
                      <td className="px-3.5 py-3.5 text-gray-700">
                        {formatCurrency(item.purchasePrice)}
                      </td>
                      <td className="px-3.5 py-3.5 text-emerald-700 font-medium">
                        {formatCurrency(item.feedCost)}
                      </td>
                      <td className="px-3.5 py-3.5 text-blue-700 font-medium">
                        {formatCurrency(item.medCost)}
                      </td>
                      <td className="px-3.5 py-3.5 font-bold text-gray-900">
                        {formatCurrency(item.totalCost)}
                      </td>
                      <td className="px-3.5 py-3.5 font-bold text-purple-700">
                        {formatCurrency(item.revenue)}
                      </td>
                      <td className="px-3.5 py-3.5 text-right font-bold text-emerald-600">
                        +{formatCurrency(item.profit)}
                      </td>
                      <td className="px-3.5 py-3.5 text-right font-semibold text-blue-600">
                        {item.roi}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 3: FARM OVERVIEW ===================== */}
      {activeTab === 'farm' && (
        <div className="space-y-6">
          {/* Farm-Wide Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="gradient-card-purple rounded-2xl p-5 border border-purple-100/80 shadow-xs">
              <span className="text-xs font-semibold text-purple-800 uppercase tracking-wider">
                Total Pigs Raised
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-gray-900">
                  {farmOverview.totalPigsRaised}
                </span>
                <span className="text-sm font-semibold text-gray-500">head</span>
              </div>
              <p className="text-xs text-purple-900/80 mt-1">
                Active herd & sold market hogs
              </p>
            </div>

            <div className="gradient-card-amber rounded-2xl p-5 border border-amber-100/80 shadow-xs">
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                Total Farm Investment
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-gray-900">
                  {formatCurrency(farmOverview.totalFarmInvestment)}
                </span>
              </div>
              <p className="text-xs text-amber-900/80 mt-1">
                Acquisitions, feeds, health, supplies
              </p>
            </div>

            <div className="gradient-card-blue rounded-2xl p-5 border border-blue-100/80 shadow-xs">
              <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
                Gross Farm Revenue
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-blue-900">
                  {formatCurrency(farmOverview.totalRevenue)}
                </span>
              </div>
              <p className="text-xs text-blue-900/80 mt-1">
                Realized sales + herd inventory value
              </p>
            </div>

            <div className="gradient-card-green rounded-2xl p-5 border border-emerald-100/80 shadow-xs">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                Net Whole-Farm Profit
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-emerald-700">
                  {formatCurrency(farmOverview.netFarmProfit)}
                </span>
              </div>
              <p className="text-xs text-emerald-900/80 mt-1">
                Average {farmOverview.avgRoi}% overall herd ROI
              </p>
            </div>
          </div>

          {/* Area Chart: Monthly Trend of Revenue, Expenses & Net Profit */}
          <div className="card bg-white border border-gray-200/80 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Monthly Financial Trajectory (Past 6 Months)
                </h3>
                <p className="text-xs text-gray-500">
                  Area trajectory comparing total monthly farm receipts vs expenses
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Revenue
                </span>
                <span className="flex items-center gap-1.5 text-red-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Expenses
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={farmOverview.monthlyTrendData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    stroke="#cbd5e1"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    stroke="#cbd5e1"
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    formatter={(val, name) => [
                      formatCurrency(val),
                      name === 'revenue' ? 'Revenue' : 'Expenses',
                    ]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '0.75rem',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorExpenses)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Two-Column Ranking Sections: Top Profitable Pigs & Top Cost Drivers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 5 Most Profitable Pigs */}
            <div className="card bg-white border border-gray-200/80 p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Top 5 Most Profitable Pigs
                  </h3>
                  <p className="text-xs text-gray-500">
                    Highest return on invested feed & care
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {farmOverview.topProfitablePigs.map((item, idx) => (
                  <div
                    key={item.pig.id}
                    className="p-3.5 bg-gray-50/80 border border-gray-100 rounded-xl flex items-center justify-between hover:bg-emerald-50/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 text-xs">
                            {item.pig.name}
                          </p>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {item.pig.tagNumber}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {item.pig.breed} • {item.pig.currentWeight} kg
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-extrabold text-emerald-600">
                        +{formatCurrency(item.profit)}
                      </p>
                      <span className="text-[10px] font-semibold text-blue-600">
                        {Math.round(item.roi)}% ROI
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 5 Cost Categories */}
            <div className="card bg-white border border-gray-200/80 p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-red-500" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Top 5 Farm Cost Centers
                  </h3>
                  <p className="text-xs text-gray-500">
                    Primary expenditures ranked by total capital deployed
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {farmOverview.topExpenseCategories.map((cat, idx) => (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-gray-800">{cat.name}</span>
                      <span className="text-gray-900">
                        {formatCurrency(cat.amount)} ({cat.pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={cn(
                          'h-2 rounded-full transition-all duration-300',
                          idx === 0 ? 'bg-red-500' : idx === 1 ? 'bg-amber-500' : idx === 2 ? 'bg-blue-500' : 'bg-purple-500'
                        )}
                        style={{ width: `${Math.min(100, cat.pct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfitCalculator;
