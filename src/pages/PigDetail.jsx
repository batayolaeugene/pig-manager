import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Scale,
  Utensils,
  HeartPulse,
  DollarSign,
  Plus,
  Calendar,
  Layers,
  Activity,
  FileText,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  usePigs,
  useBatches,
  useFinances,
  useTasks,
} from '../context/AppContext';
import { useToast } from '../components/Toast';
import {
  formatDate,
  formatRelative,
  formatCurrency,
  formatWeight,
  getProgressToMarket,
  calculateDailyFeed,
  getRecommendedFeed,
  calculateProfit,
  getDaysBetween,
  cn,
} from '../utils/helpers';
import {
  PIG_STATUS,
  PIG_STATUS_LABELS,
  HEALTH_STATUS,
  HEALTH_STATUS_LABELS,
  BREEDS,
  FEED_TYPES,
  FINANCE_CATEGORIES,
} from '../utils/constants';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';

export function PigDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pigs, getPig, updatePig, deletePig, addWeightRecord } = usePigs();
  const { batches } = useBatches();
  const { finances, getFinancesByPig, addFinance } = useFinances();
  const { tasks } = useTasks();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'weight' | 'feed' | 'health' | 'finances'

  // Modal states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);

  // Form states for modals
  const pig = useMemo(() => getPig(id), [getPig, id]);

  const [editForm, setEditForm] = useState({
    name: '',
    breed: '',
    status: '',
    healthStatus: '',
    targetWeight: 110,
    batchId: '',
    notes: '',
  });

  const [weightForm, setWeightForm] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '',
  });

  const [healthForm, setHealthForm] = useState({
    healthStatus: HEALTH_STATUS.HEALTHY,
    notes: '',
  });

  const [financeForm, setFinanceForm] = useState({
    type: 'expense',
    category: 'Medication',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  // Keep editForm in sync when pig loads
  React.useEffect(() => {
    if (pig) {
      setEditForm({
        name: pig.name || '',
        breed: pig.breed || '',
        status: pig.status || PIG_STATUS.GROWING,
        healthStatus: pig.healthStatus || HEALTH_STATUS.HEALTHY,
        targetWeight: pig.targetWeight || 110,
        batchId: pig.batchId || '',
        notes: pig.notes || '',
      });
      setHealthForm({
        healthStatus: pig.healthStatus || HEALTH_STATUS.HEALTHY,
        notes: '',
      });
      setWeightForm((prev) => ({
        ...prev,
        weight: (pig.currentWeight || 20).toString(),
      }));
    }
  }, [pig]);

  if (!pig) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <EmptyState
          title="Pig Record Not Found"
          description="The requested pig ID does not exist or has been removed from the registry."
          action={{
            label: 'Back to Pig Inventory',
            onClick: () => navigate('/pigs'),
          }}
        />
      </div>
    );
  }

  // Related data
  const batch = batches.find((b) => b.id === pig.batchId);
  const pigFinances = getFinancesByPig(pig.id);
  const financialSummary = calculateProfit(pig, finances);
  const progressPercent = getProgressToMarket(pig.currentWeight, pig.targetWeight);
  const feedRecommendation = calculateDailyFeed(pig.currentWeight);
  const daysOld = pig.dateOfBirth
    ? getDaysBetween(pig.dateOfBirth, new Date())
    : null;
  const daysSinceWeaning = pig.weaningDate
    ? getDaysBetween(pig.weaningDate, new Date())
    : null;

  // Estimated days to market: assume average daily gain of ~0.75 kg/day
  const remainingWeight = Math.max(0, (pig.targetWeight || 110) - (pig.currentWeight || 0));
  const estimatedDaysToMarket = Math.ceil(remainingWeight / 0.75);

  // Weight history sorted chronologically
  const sortedWeightHistory = useMemo(() => {
    const list = Array.isArray(pig.weightHistory) ? [...pig.weightHistory] : [];
    return list.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [pig.weightHistory]);

  // Weight history table with gain calculations
  const weightTableData = useMemo(() => {
    return sortedWeightHistory.map((rec, index) => {
      let gain = null;
      if (index > 0) {
        const prev = sortedWeightHistory[index - 1].weight;
        gain = (rec.weight - prev).toFixed(1);
      }
      return {
        ...rec,
        gain,
      };
    });
  }, [sortedWeightHistory]);

  // Handle Edit Save
  const handleEditSubmit = (e) => {
    e.preventDefault();
    updatePig(pig.id, {
      name: editForm.name.trim(),
      breed: editForm.breed,
      status: editForm.status,
      healthStatus: editForm.healthStatus,
      targetWeight: Number(editForm.targetWeight) || 110,
      batchId: editForm.batchId || null,
      notes: editForm.notes.trim(),
    });
    toast.success('Pig details updated successfully!');
    setIsEditOpen(false);
  };

  // Handle Delete Pig
  const handleDeleteConfirm = () => {
    deletePig(pig.id);
    toast.success(`Pig ${pig.name} (${pig.tagNumber}) deleted.`);
    navigate('/pigs');
  };

  // Handle Add Weight
  const handleWeightSubmit = (e) => {
    e.preventDefault();
    const numWeight = Number(weightForm.weight);
    if (!numWeight || numWeight <= 0) {
      toast.error('Please enter a valid weight.');
      return;
    }
    addWeightRecord(pig.id, numWeight, weightForm.date);
    toast.success(`Logged weight of ${formatWeight(numWeight)} on ${formatDate(weightForm.date)}.`);
    setIsWeightModalOpen(false);
  };

  // Handle Health Status Update
  const handleHealthSubmit = (e) => {
    e.preventDefault();
    const updatedNotes = healthForm.notes.trim()
      ? `${pig.notes ? pig.notes + '\n' : ''}[${formatDate(new Date())}] Health set to ${HEALTH_STATUS_LABELS[healthForm.healthStatus] || healthForm.healthStatus}: ${healthForm.notes.trim()}`
      : pig.notes;

    updatePig(pig.id, {
      healthStatus: healthForm.healthStatus,
      notes: updatedNotes,
    });
    toast.success(`Health status updated to ${HEALTH_STATUS_LABELS[healthForm.healthStatus] || healthForm.healthStatus}`);
    setIsHealthModalOpen(false);
  };

  // Handle Add Transaction
  const handleFinanceSubmit = (e) => {
    e.preventDefault();
    const amountNum = Number(financeForm.amount);
    if (!amountNum || amountNum <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    addFinance({
      type: financeForm.type,
      category: financeForm.category,
      amount: amountNum,
      date: financeForm.date,
      description: financeForm.description.trim() || `${financeForm.category} for ${pig.name} (${pig.tagNumber})`,
      pigId: pig.id,
      batchId: pig.batchId || null,
    });

    toast.success(`Recorded ${financeForm.type} of ${formatCurrency(amountNum)}.`);
    setIsFinanceModalOpen(false);
    setFinanceForm((prev) => ({ ...prev, amount: '', description: '' }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/pigs')}
            className="btn-secondary p-2 rounded-lg"
            title="Back to inventory"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                {pig.name}
              </h1>
              <span className="font-mono text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-800 rounded-md border border-gray-200/60">
                {pig.tagNumber}
              </span>
              <StatusBadge type="pig-status" value={pig.status} />
              <StatusBadge type="health" value={pig.healthStatus} />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {pig.breed} &bull; <span className="capitalize">{pig.gender}</span>
              {batch && (
                <>
                  {' '}&bull; Batch:{' '}
                  <span className="font-medium text-gray-700">{batch.name}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsWeightModalOpen(true)}
            className="btn-primary bg-emerald-600 hover:bg-emerald-700 font-bold py-2 px-3.5 text-xs flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
          >
            <Scale className="w-4 h-4" />
            <span>Log Weight</span>
          </button>
          <button
            type="button"
            onClick={() => setIsHealthModalOpen(true)}
            className="btn-secondary py-2 px-3 text-xs font-semibold active:scale-95 transition-all"
          >
            <HeartPulse className="w-4 h-4 text-rose-500" />
            <span>Health</span>
          </button>
          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="btn-secondary py-2 px-3 text-xs"
          >
            <Edit3 className="w-4 h-4 text-gray-500" />
            <span className="hidden sm:inline">Edit</span>
          </button>
          <button
            type="button"
            onClick={() => setIsDeleteOpen(true)}
            className="btn-danger py-2 px-3 text-xs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-thin">
        {[
          { id: 'overview', label: 'Overview', icon: FileText },
          { id: 'weight', label: 'Weight History', icon: Scale },
          { id: 'feed', label: 'Feed & Nutrition', icon: Utensils },
          { id: 'health', label: 'Health Status', icon: HeartPulse },
          { id: 'finances', label: 'Finances & P&L', icon: DollarSign },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors',
                isActive
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Pig Info Card */}
          <div className="card space-y-4">
            <h3 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
              Pig Specifications &amp; Lineage
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-400 font-medium">Tag Number</p>
                <p className="font-mono text-sm font-semibold text-gray-900 mt-0.5">
                  {pig.tagNumber}
                </p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">Breed</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {pig.breed}
                </p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">Gender</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5 capitalize">
                  {pig.gender}
                </p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">Batch</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {batch ? batch.name : 'Unassigned'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">Date of Birth</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {formatDate(pig.dateOfBirth)}
                </p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">Age</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {daysOld !== null ? `${daysOld} days` : '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">Weaning Date</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {formatDate(pig.weaningDate)}
                </p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">Days Post-Weaning</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {daysSinceWeaning !== null ? `${daysSinceWeaning} days` : '—'}
                </p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">Purchase Price</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {formatCurrency(pig.purchasePrice || 0)}
                </p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">Current Status</p>
                <div className="mt-1">
                  <StatusBadge type="pig-status" value={pig.status} />
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-medium mb-1">
                Field Notes &amp; Observations
              </p>
              <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-700 whitespace-pre-line leading-relaxed border border-gray-100">
                {pig.notes || 'No specialized notes recorded for this pig.'}
              </div>
            </div>
          </div>

          {/* Right Column: Quick Stats & Progress */}
          <div className="space-y-6">
            {/* Weight Progress Ring/Bar Card */}
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">
                  Target Weight Progress
                </h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  {progressPercent}% Achieved
                </span>
              </div>

              {/* Progress bar visual */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-600">
                    Current: {formatWeight(pig.currentWeight)}
                  </span>
                  <span className="text-brand-700">
                    Target: {formatWeight(pig.targetWeight)}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-gray-200">
                  <div
                    className="bg-brand-500 h-full rounded-full transition-all duration-700 shadow-sm"
                    style={{ width: `${Math.min(100, progressPercent)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-gray-400">
                  <span>Remaining: {formatWeight(remainingWeight)}</span>
                  <span>Est. {estimatedDaysToMarket} days to market</span>
                </div>
              </div>

              {/* Metric grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100/60">
                  <p className="text-[11px] text-emerald-700 font-medium">
                    Daily Feed Intake
                  </p>
                  <p className="text-lg font-bold text-emerald-900 mt-0.5">
                    {feedRecommendation.dailyKg} kg
                  </p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">
                    {feedRecommendation.feedType.name}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100/60">
                  <p className="text-[11px] text-blue-700 font-medium">
                    Daily Feeding Cost
                  </p>
                  <p className="text-lg font-bold text-blue-900 mt-0.5">
                    {formatCurrency(feedRecommendation.dailyCost)}
                  </p>
                  <p className="text-[10px] text-blue-600 mt-0.5">
                    @ {formatCurrency(feedRecommendation.feedType.costPerKg)}/kg
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="card space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Livestock Actions
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setIsWeightModalOpen(true)}
                  className="btn-secondary w-full justify-center"
                >
                  <Scale className="w-4 h-4 text-brand-600" />
                  <span>Log Weight</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsHealthModalOpen(true)}
                  className="btn-secondary w-full justify-center"
                >
                  <HeartPulse className="w-4 h-4 text-red-500" />
                  <span>Update Health</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsFinanceModalOpen(true)}
                  className="btn-secondary w-full justify-center"
                >
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Add Expense</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditOpen(true)}
                  className="btn-secondary w-full justify-center"
                >
                  <Edit3 className="w-4 h-4 text-blue-600" />
                  <span>Edit Info</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WEIGHT HISTORY */}
      {activeTab === 'weight' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Weight History &amp; Growth Curve
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Recorded scale measurements and average daily gain trajectory
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsWeightModalOpen(true)}
              className="btn-primary"
            >
              <Scale className="w-4 h-4" />
              <span>Record Weight</span>
            </button>
          </div>

          {/* Chart */}
          <div className="card p-6">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Growth Curve (kg vs Date)
            </h4>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={sortedWeightHistory}
                  margin={{ top: 10, right: 20, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, Math.ceil((pig.targetWeight || 120) * 1.05)]}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val) => [`${val} kg`, 'Weight']}
                    labelFormatter={(label) => formatDate(label)}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      color: '#fff',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#059669"
                    strokeWidth={3}
                    dot={{ fill: '#059669', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table of Records */}
          <div className="card overflow-hidden p-0">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900">
                Weigh-in Log
              </h4>
              <span className="text-xs text-gray-400">
                {weightTableData.length} entries
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/75 text-gray-500 font-semibold">
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Weight (kg)</th>
                    <th className="px-6 py-3">Gain vs Previous</th>
                    <th className="px-6 py-3">% of Market Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {weightTableData.map((row, idx) => {
                    const targetPct = Math.round(
                      (row.weight / (pig.targetWeight || 110)) * 100
                    );
                    return (
                      <tr key={idx} className="hover:bg-gray-50/60">
                        <td className="px-6 py-3 font-medium text-gray-900">
                          {formatDate(row.date)}
                        </td>
                        <td className="px-6 py-3 font-semibold text-gray-900">
                          {formatWeight(row.weight)}
                        </td>
                        <td className="px-6 py-3">
                          {row.gain !== null ? (
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                                Number(row.gain) >= 0
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {Number(row.gain) >= 0 ? `+${row.gain}` : row.gain} kg
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Initial baseline</span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-gray-600 font-medium">
                            {targetPct}%
                          </span>
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

      {/* TAB 3: FEED & NUTRITION */}
      {activeTab === 'feed' && (
        <div className="space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-base font-semibold text-gray-900">
              Nutritional Requirements &amp; Feed Schedule
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Automated ration calculations based on standard commercial swine feeding tables
            </p>
          </div>

          {/* Current Recommendation Highlight */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card bg-brand-50/50 border-brand-200">
              <p className="text-xs font-semibold text-brand-800 uppercase tracking-wider">
                Current Ration
              </p>
              <p className="text-xl font-bold text-brand-900 mt-1">
                {feedRecommendation.feedType.name}
              </p>
              <p className="text-xs text-brand-700 mt-1">
                Crude Protein: {feedRecommendation.feedType.proteinPct}%
              </p>
            </div>

            <div className="card">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Daily Feed Intake
              </p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {feedRecommendation.dailyKg} kg
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {(feedRecommendation.dailyKg * 2.20462).toFixed(1)} lbs per day
              </p>
            </div>

            <div className="card">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Daily Feed Cost
              </p>
              <p className="text-xl font-bold text-emerald-600 mt-1">
                {formatCurrency(feedRecommendation.dailyCost)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                @ {formatCurrency(feedRecommendation.feedType.costPerKg)}/kg
              </p>
            </div>

            <div className="card">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Monthly Projection
              </p>
              <p className="text-xl font-bold text-blue-600 mt-1">
                {formatCurrency(feedRecommendation.dailyCost * 30)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {(feedRecommendation.dailyKg * 30).toFixed(1)} kg / month
              </p>
            </div>
          </div>

          {/* Growth Stage Progression Cards */}
          <div className="card space-y-4">
            <h4 className="text-sm font-semibold text-gray-900">
              Swine Nutrition Stages
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {FEED_TYPES.map((feed) => {
                const isCurrent =
                  pig.currentWeight >= feed.minWeight &&
                  pig.currentWeight < feed.maxWeight;
                return (
                  <div
                    key={feed.id}
                    className={cn(
                      'p-4 rounded-xl border text-xs transition-all relative',
                      isCurrent
                        ? 'border-brand-500 bg-brand-50/30 ring-2 ring-brand-500/20'
                        : 'border-gray-100 bg-white'
                    )}
                  >
                    {isCurrent && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-600 text-white">
                        ACTIVE
                      </span>
                    )}
                    <h5 className="font-bold text-gray-900 text-sm">{feed.name}</h5>
                    <p className="text-gray-500 mt-1">
                      Weight: {feed.minWeight} – {feed.maxWeight} kg
                    </p>
                    <div className="mt-3 pt-2 border-t border-gray-100 space-y-1 text-gray-600">
                      <p>Protein: <strong>{feed.proteinPct}%</strong></p>
                      <p>Rate: <strong>{feed.dailyKgPer100kgBW}% bodyweight</strong></p>
                      <p>Cost: <strong>{formatCurrency(feed.costPerKg)}/kg</strong></p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: HEALTH STATUS */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Health Status &amp; Veterinary Notes
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Current condition, clinical observations, and veterinary treatment history
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsHealthModalOpen(true)}
              className="btn-primary"
            >
              <HeartPulse className="w-4 h-4" />
              <span>Update Status</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Status overview card */}
            <div className="card space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Current Health Status
              </h4>
              <div className="flex items-center gap-3">
                <StatusBadge type="health" value={pig.healthStatus} className="text-sm px-3 py-1" />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {pig.healthStatus === HEALTH_STATUS.HEALTHY
                  ? 'Livestock is in optimal health condition with active feeding and healthy physical mobility.'
                  : pig.healthStatus === HEALTH_STATUS.TREATING
                  ? 'Pig is currently receiving medical attention or therapeutic supplements under observation.'
                  : 'Pig has been flagged with potential illness or lameness. Veterinary examination recommended.'}
              </p>
            </div>

            {/* Health Log / Notes */}
            <div className="card md:col-span-2 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Clinical Notes &amp; Observations
              </h4>
              <div className="p-4 bg-gray-50 rounded-xl text-xs text-gray-700 whitespace-pre-line leading-relaxed border border-gray-100 min-h-[140px]">
                {pig.notes || 'No health issues or veterinary treatments recorded.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FINANCES & P&L */}
      {activeTab === 'finances' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Financial Performance &amp; Profit / Loss
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Revenue from pig sale, feed and medication expenses, and net ROI
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsFinanceModalOpen(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Add Transaction</span>
            </button>
          </div>

          {/* Financial summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="card bg-white">
              <p className="text-xs font-medium text-gray-400">Total Income</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">
                {formatCurrency(financialSummary.income)}
              </p>
            </div>

            <div className="card bg-white">
              <p className="text-xs font-medium text-gray-400">Total Expenses</p>
              <p className="text-xl font-bold text-red-600 mt-1">
                {formatCurrency(financialSummary.expenses)}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                Incl. {formatCurrency(pig.purchasePrice || 0)} purchase
              </p>
            </div>

            <div className="card bg-white">
              <p className="text-xs font-medium text-gray-400">Net Profit</p>
              <p
                className={`text-xl font-bold mt-1 ${
                  financialSummary.profit >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(financialSummary.profit)}
              </p>
            </div>

            <div className="card bg-white">
              <p className="text-xs font-medium text-gray-400">Return on Cost</p>
              <p
                className={`text-xl font-bold mt-1 ${
                  financialSummary.roi >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {financialSummary.roi.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="card overflow-hidden p-0">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900">
                Pig Transaction Ledger
              </h4>
              <span className="text-xs text-gray-400">
                {pigFinances.length} entries
              </span>
            </div>
            {pigFinances.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                No individual transactions logged for this pig yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/75 text-gray-500 font-semibold">
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3">Description</th>
                      <th className="px-6 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {pigFinances.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-50/60">
                        <td className="px-6 py-3 font-medium text-gray-900">
                          {formatDate(tx.date)}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                              tx.type === 'income'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-medium text-gray-800">
                          {tx.category}
                        </td>
                        <td className="px-6 py-3 text-gray-600 max-w-xs truncate">
                          {tx.description}
                        </td>
                        <td className="px-6 py-3 text-right font-semibold">
                          <span
                            className={
                              tx.type === 'income'
                                ? 'text-emerald-600'
                                : 'text-red-600'
                            }
                          >
                            {tx.type === 'income' ? '+' : '-'}
                            {formatCurrency(tx.amount)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Pig — ${pig.name} (${pig.tagNumber})`}
        size="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Pig Name</label>
              <input
                type="text"
                required
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="input"
              />
            </div>
            <div>
              <label className="label">Breed</label>
              <select
                value={editForm.breed}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, breed: e.target.value }))
                }
                className="select"
              >
                {BREEDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select
                value={editForm.status}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, status: e.target.value }))
                }
                className="select"
              >
                <option value={PIG_STATUS.WEANING}>Weaning</option>
                <option value={PIG_STATUS.GROWING}>Growing</option>
                <option value={PIG_STATUS.FINISHING}>Finishing</option>
                <option value={PIG_STATUS.MARKET_READY}>Market Ready</option>
                <option value={PIG_STATUS.SOLD}>Sold</option>
              </select>
            </div>
            <div>
              <label className="label">Health Status</label>
              <select
                value={editForm.healthStatus}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    healthStatus: e.target.value,
                  }))
                }
                className="select"
              >
                <option value={HEALTH_STATUS.HEALTHY}>Healthy</option>
                <option value={HEALTH_STATUS.SICK}>Sick</option>
                <option value={HEALTH_STATUS.TREATING}>Under Treatment</option>
              </select>
            </div>
            <div>
              <label className="label">Target Market Weight (kg)</label>
              <input
                type="number"
                step="0.5"
                min="30"
                value={editForm.targetWeight}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    targetWeight: e.target.value,
                  }))
                }
                className="input"
              />
            </div>
            <div>
              <label className="label">Assigned Batch</label>
              <select
                value={editForm.batchId}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, batchId: e.target.value }))
                }
                className="select"
              >
                <option value="">None (Unbatched)</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Notes / History</label>
              <textarea
                rows={3}
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="input resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* RECORD WEIGHT MODAL */}
      <Modal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        title="Record Weight Measurement"
        size="sm"
      >
        <form onSubmit={handleWeightSubmit} className="space-y-4">
          <div>
            <label className="label">Measurement Date</label>
            <input
              type="date"
              required
              value={weightForm.date}
              onChange={(e) =>
                setWeightForm((prev) => ({ ...prev, date: e.target.value }))
              }
              className="input"
            />
          </div>
          <div>
            <label className="label">Scale Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="400"
              required
              value={weightForm.weight}
              onChange={(e) =>
                setWeightForm((prev) => ({ ...prev, weight: e.target.value }))
              }
              placeholder="e.g. 48.5"
              className="input text-center text-xl font-bold"
            />
            {/* Glove-friendly adjustment buttons */}
            <div className="grid grid-cols-6 gap-1 mt-2">
              {[-5, -1, -0.5, 0.5, 1, 5].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => {
                    const current = Number(weightForm.weight) || pig.currentWeight || 20;
                    const next = Math.max(1, Math.round((current + delta) * 10) / 10);
                    setWeightForm((prev) => ({ ...prev, weight: next.toString() }));
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    delta > 0
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsWeightModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Log Weight
            </button>
          </div>
        </form>
      </Modal>

      {/* UPDATE HEALTH MODAL */}
      <Modal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        title="Update Health Status"
        size="md"
      >
        <form onSubmit={handleHealthSubmit} className="space-y-4">
          <div>
            <label className="label">Health Condition</label>
            <select
              value={healthForm.healthStatus}
              onChange={(e) =>
                setHealthForm((prev) => ({
                  ...prev,
                  healthStatus: e.target.value,
                }))
              }
              className="select"
            >
              <option value={HEALTH_STATUS.HEALTHY}>Healthy</option>
              <option value={HEALTH_STATUS.SICK}>Sick</option>
              <option value={HEALTH_STATUS.TREATING}>Under Treatment</option>
            </select>
          </div>
          <div>
            <label className="label">Clinical Observations / Treatment Note</label>
            <textarea
              rows={3}
              value={healthForm.notes}
              onChange={(e) =>
                setHealthForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Symptoms, medication administered, dosage, follow-up plan..."
              className="input resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsHealthModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Health Log
            </button>
          </div>
        </form>
      </Modal>

      {/* ADD FINANCE MODAL */}
      <Modal
        isOpen={isFinanceModalOpen}
        onClose={() => setIsFinanceModalOpen(false)}
        title="Add Pig Transaction"
        size="md"
      >
        <form onSubmit={handleFinanceSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Transaction Type</label>
              <select
                value={financeForm.type}
                onChange={(e) => {
                  const newType = e.target.value;
                  setFinanceForm((prev) => ({
                    ...prev,
                    type: newType,
                    category:
                      newType === 'income'
                        ? FINANCE_CATEGORIES.INCOME[0]
                        : FINANCE_CATEGORIES.EXPENSE[0],
                  }));
                }}
                className="select"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div>
              <label className="label">Category</label>
              <select
                value={financeForm.category}
                onChange={(e) =>
                  setFinanceForm((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                className="select"
              >
                {(financeForm.type === 'income'
                  ? FINANCE_CATEGORIES.INCOME
                  : FINANCE_CATEGORIES.EXPENSE
                ).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (₱)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={financeForm.amount}
                onChange={(e) =>
                  setFinanceForm((prev) => ({ ...prev, amount: e.target.value }))
                }
                placeholder="0.00"
                className="input"
              />
            </div>
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                required
                value={financeForm.date}
                onChange={(e) =>
                  setFinanceForm((prev) => ({ ...prev, date: e.target.value }))
                }
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <input
              type="text"
              value={financeForm.description}
              onChange={(e) =>
                setFinanceForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="e.g. Iron injection booster, Sale invoice..."
              className="input"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsFinanceModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Record Transaction
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Pig Record?"
        message={`Are you sure you want to remove ${pig.name} (${pig.tagNumber}) from your livestock registry? This will permanently delete weight logs and linked associations.`}
        confirmLabel="Delete Pig"
        variant="danger"
      />
    </div>
  );
}

export default PigDetail;
