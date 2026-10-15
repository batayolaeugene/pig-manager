import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Layers,
  Plus,
  Calendar,
  Scale,
  Utensils,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  UserMinus,
  PlusCircle,
  Check,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useBatches, usePigs, useFinances } from '../context/AppContext';
import { useToast } from '../components/Toast';
import {
  formatDate,
  formatCurrency,
  formatWeight,
  getProgressToMarket,
  calculateFeedForBatch,
  generateId,
  cn,
} from '../utils/helpers';
import { PIG_STATUS, PIG_STATUS_LABELS } from '../utils/constants';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';

const STATUS_COLOR_HEX = {
  [PIG_STATUS.WEANING]: '#3b82f6', // blue
  [PIG_STATUS.GROWING]: '#f59e0b', // amber
  [PIG_STATUS.FINISHING]: '#8b5cf6', // purple
  [PIG_STATUS.MARKET_READY]: '#10b981', // emerald
  [PIG_STATUS.SOLD]: '#94a3b8', // slate
};

export function BatchManagement() {
  const navigate = useNavigate();
  const { batches, addBatch, updateBatch, deleteBatch, removePigFromBatch, addPigsToBatch } =
    useBatches();
  const { pigs } = usePigs();
  const { finances } = useFinances();
  const { toast } = useToast();

  // Expanded batch accordion state
  const [expandedBatchId, setExpandedBatchId] = useState(
    batches.length > 0 ? batches[0].id : null
  );

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null); // null when creating
  const [deleteConfirmBatch, setDeleteConfirmBatch] = useState(null);
  const [addPigsModalBatch, setAddPigsModalBatch] = useState(null);

  // Create / Edit Batch Form
  const [batchForm, setBatchForm] = useState({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    targetMarketDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    notes: '',
    selectedPigIds: [],
  });

  // Pigs not assigned to any batch
  const unassignedPigs = useMemo(
    () => pigs.filter((p) => !p.batchId && p.status !== PIG_STATUS.SOLD),
    [pigs]
  );

  // Selected pigs for Add Pigs modal
  const [selectedToAddPigIds, setSelectedToAddPigIds] = useState([]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingBatch(null);
    setBatchForm({
      name: '',
      startDate: new Date().toISOString().split('T')[0],
      targetMarketDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      notes: '',
      selectedPigIds: [],
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (batch) => {
    setEditingBatch(batch);
    setBatchForm({
      name: batch.name || '',
      startDate: batch.startDate || '',
      targetMarketDate: batch.targetMarketDate || '',
      notes: batch.notes || '',
      selectedPigIds: batch.pigIds || [],
    });
    setIsModalOpen(true);
  };

  // Save Batch (Create or Update)
  const handleSaveBatch = (e) => {
    e.preventDefault();
    if (!batchForm.name.trim()) {
      toast.error('Please enter a batch name');
      return;
    }

    if (editingBatch) {
      updateBatch(editingBatch.id, {
        name: batchForm.name.trim(),
        startDate: batchForm.startDate,
        targetMarketDate: batchForm.targetMarketDate,
        notes: batchForm.notes.trim(),
        pigIds: batchForm.selectedPigIds,
      });
      toast.success(`Batch "${batchForm.name}" updated successfully!`);
    } else {
      const newBatchId = generateId();
      addBatch({
        id: newBatchId,
        name: batchForm.name.trim(),
        startDate: batchForm.startDate,
        targetMarketDate: batchForm.targetMarketDate,
        notes: batchForm.notes.trim(),
        pigIds: batchForm.selectedPigIds,
        createdAt: new Date().toISOString(),
      });
      toast.success(`Batch "${batchForm.name}" created with ${batchForm.selectedPigIds.length} pigs!`);
      setExpandedBatchId(newBatchId);
    }
    setIsModalOpen(false);
  };

  // Confirm Delete
  const handleDeleteBatch = () => {
    if (!deleteConfirmBatch) return;
    deleteBatch(deleteConfirmBatch.id);
    toast.success(`Batch "${deleteConfirmBatch.name}" removed. Pigs are now unassigned.`);
    if (expandedBatchId === deleteConfirmBatch.id) {
      setExpandedBatchId(null);
    }
    setDeleteConfirmBatch(null);
  };

  // Handle Remove Pig from batch
  const handleRemovePig = (batchId, pigId, pigName) => {
    removePigFromBatch(batchId, pigId);
    toast.info(`Removed ${pigName} from batch.`);
  };

  // Handle Add pigs modal submit
  const handleAddPigsSubmit = (e) => {
    e.preventDefault();
    if (!addPigsModalBatch || selectedToAddPigIds.length === 0) {
      toast.warning('Select at least one pig to add.');
      return;
    }

    addPigsToBatch(addPigsModalBatch.id, selectedToAddPigIds);
    toast.success(
      `Added ${selectedToAddPigIds.length} pig(s) to "${addPigsModalBatch.name}"!`
    );
    setAddPigsModalBatch(null);
    setSelectedToAddPigIds([]);
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto pb-16">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Batch Management
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200/60">
              <Layers className="w-3.5 h-3.5" />
              {batches.length} Active Batches
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Group swine cohorts, monitor aggregated feeding demands, and track cohort profitability.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Batch</span>
        </button>
      </div>

      {/* BATCHES LIST */}
      {batches.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No Batches Created Yet"
          description="Group your pigs into feeding cohorts to calculate bulk feed rations and monitor performance."
          action={{
            label: 'Create Your First Batch',
            icon: Plus,
            onClick: handleOpenCreate,
          }}
        />
      ) : (
        <div className="space-y-6">
          {batches.map((batch) => {
            const isExpanded = expandedBatchId === batch.id;

            // Collect all pigs in this batch
            const batchPigs = pigs.filter(
              (p) => (batch.pigIds && batch.pigIds.includes(p.id)) || p.batchId === batch.id
            );

            // Metrics calculation
            const pigCount = batchPigs.length;
            const totalWeight = batchPigs.reduce(
              (sum, p) => sum + (Number(p.currentWeight) || 0),
              0
            );
            const avgWeight = pigCount > 0 ? totalWeight / pigCount : 0;

            const avgProgress =
              pigCount > 0
                ? Math.round(
                    batchPigs.reduce(
                      (sum, p) =>
                        sum + getProgressToMarket(p.currentWeight, p.targetWeight),
                      0
                    ) / pigCount
                  )
                : 0;

            // Status breakdown counts
            const statusCounts = {
              [PIG_STATUS.WEANING]: 0,
              [PIG_STATUS.GROWING]: 0,
              [PIG_STATUS.FINISHING]: 0,
              [PIG_STATUS.MARKET_READY]: 0,
              [PIG_STATUS.SOLD]: 0,
            };
            batchPigs.forEach((p) => {
              if (statusCounts[p.status] !== undefined) {
                statusCounts[p.status] += 1;
              }
            });

            // Feed Calculation
            const feedMetrics = calculateFeedForBatch(batchPigs);

            // Batch Finances Calculation
            const batchFinances = finances.filter(
              (f) =>
                f.batchId === batch.id ||
                (f.pigId && batchPigs.some((p) => p.id === f.pigId))
            );
            const totalPigPurchase = batchPigs.reduce(
              (sum, p) => sum + (Number(p.purchasePrice) || 0),
              0
            );
            const totalIncome = batchFinances
              .filter((f) => f.type === 'income')
              .reduce((sum, f) => sum + Number(f.amount || 0), 0);
            const operationalExpenses = batchFinances
              .filter((f) => f.type === 'expense')
              .reduce((sum, f) => sum + Number(f.amount || 0), 0);
            const totalExpenses = operationalExpenses + totalPigPurchase;
            const netProfit = totalIncome - totalExpenses;

            return (
              <div
                key={batch.id}
                className={cn(
                  'rounded-2xl border transition-all duration-200 overflow-hidden bg-white shadow-sm',
                  isExpanded
                    ? 'border-brand-500/40 ring-1 ring-brand-500/20'
                    : 'border-gray-200/80 hover:border-gray-300'
                )}
              >
                {/* BATCH CARD HEADER (Clickable to Expand) */}
                <div
                  className="p-6 cursor-pointer select-none transition-colors hover:bg-gray-50/50"
                  onClick={() =>
                    setExpandedBatchId(isExpanded ? null : batch.id)
                  }
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Title & Dates */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                          {batch.name}
                        </h2>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200/60">
                          {pigCount} {pigCount === 1 ? 'Pig' : 'Pigs'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>Started: {formatDate(batch.startDate)}</span>
                        <span>&bull;</span>
                        <span>Target Delivery: {formatDate(batch.targetMarketDate)}</span>
                      </div>
                    </div>

                    {/* Middle: Average Weight & Progress */}
                    <div className="flex items-center gap-8 text-xs">
                      <div>
                        <p className="text-gray-400 font-medium">Average Weight</p>
                        <p className="text-lg font-bold text-gray-900 mt-0.5">
                          {formatWeight(avgWeight)}
                        </p>
                      </div>

                      <div className="w-36 sm:w-44">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="text-gray-400 font-medium">Market Progress</span>
                          <span className="font-semibold text-brand-700">
                            {avgProgress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-brand-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, avgProgress)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions & Expand Toggle */}
                    <div
                      className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(batch)}
                        className="btn-secondary px-2.5 py-1.5 text-xs"
                        title="Edit batch details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmBatch(batch)}
                        className="btn-ghost text-red-600 hover:bg-red-50 px-2.5 py-1.5 text-xs"
                        title="Delete batch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedBatchId(isExpanded ? null : batch.id)
                        }
                        className="btn-ghost p-1.5 text-gray-400 hover:text-gray-700"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Horizontal mini stacked bar for status breakdown */}
                  {pigCount > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-100/80">
                      <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1.5">
                        <span className="font-medium text-gray-600">Cohort Status Breakdown</span>
                        <div className="flex items-center gap-3">
                          {Object.entries(statusCounts)
                            .filter(([_, count]) => count > 0)
                            .map(([statusKey, count]) => (
                              <span key={statusKey} className="inline-flex items-center gap-1">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor: STATUS_COLOR_HEX[statusKey] || '#94a3b8',
                                  }}
                                />
                                <span className="capitalize">{PIG_STATUS_LABELS[statusKey] || statusKey}:</span>
                                <strong className="text-gray-800">{count}</strong>
                              </span>
                            ))}
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full overflow-hidden flex bg-gray-100">
                        {Object.entries(statusCounts).map(([statusKey, count]) => {
                          if (count === 0) return null;
                          const widthPct = (count / pigCount) * 100;
                          return (
                            <div
                              key={statusKey}
                              style={{
                                width: `${widthPct}%`,
                                backgroundColor: STATUS_COLOR_HEX[statusKey] || '#94a3b8',
                              }}
                              title={`${PIG_STATUS_LABELS[statusKey] || statusKey}: ${count} (${Math.round(widthPct)}%)`}
                              className="h-full first:rounded-l-full last:rounded-r-full"
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* INLINE EXPANDED DETAIL VIEW */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-6 space-y-6 animate-fadeIn">
                    {/* Batch Notes if any */}
                    {batch.notes && (
                      <div className="p-3 bg-white rounded-xl border border-gray-200/60 text-xs text-gray-600">
                        <strong className="text-gray-800">Batch Notes: </strong>
                        {batch.notes}
                      </div>
                    )}

                    {/* Operational Summary Grid: Feed & Profit */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Batch Feed Calculator */}
                      <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                          <div className="flex items-center gap-2 text-brand-700 font-semibold text-sm">
                            <Utensils className="w-4 h-4" />
                            <span>Batch Feed Calculator</span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {pigCount} pigs combined
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-gray-400">Total Daily Ration</p>
                            <p className="text-xl font-bold text-gray-900 mt-0.5">
                              {feedMetrics.totalDailyKg} kg/day
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              ~{(feedMetrics.totalDailyKg * 7).toFixed(1)} kg / week
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">Estimated Daily Cost</p>
                            <p className="text-xl font-bold text-emerald-600 mt-0.5">
                              {formatCurrency(feedMetrics.totalDailyCost)}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              ~{formatCurrency(feedMetrics.totalDailyCost * 30)} / month
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Batch Profit Summary */}
                      <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                            <DollarSign className="w-4 h-4" />
                            <span>Batch Financial Balance</span>
                          </div>
                          <span className="text-xs text-gray-400">
                            Gross &amp; Net P&amp;L
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div>
                            <p className="text-gray-400">Total Income</p>
                            <p className="text-base font-bold text-emerald-600 mt-0.5">
                              {formatCurrency(totalIncome)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">Total Expenses</p>
                            <p className="text-base font-bold text-red-600 mt-0.5">
                              {formatCurrency(totalExpenses)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">Net Profit</p>
                            <p
                              className={`text-base font-bold mt-0.5 ${
                                netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
                              }`}
                            >
                              {formatCurrency(netProfit)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pigs in Batch Mini Table */}
                    <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden shadow-xs">
                      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-gray-900">
                            Pigs in Cohort ({pigCount})
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAddPigsModalBatch(batch);
                            setSelectedToAddPigIds([]);
                          }}
                          className="btn-secondary py-1.5 px-3 text-xs"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-brand-600" />
                          <span>Assign Existing Pigs</span>
                        </button>
                      </div>

                      {pigCount === 0 ? (
                        <div className="p-8 text-center text-xs text-gray-400">
                          No pigs currently in this batch. Click "Assign Existing Pigs" to add members.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-gray-100 bg-gray-50/75 text-gray-500 font-semibold">
                                <th className="px-5 py-3">Tag #</th>
                                <th className="px-5 py-3">Name</th>
                                <th className="px-5 py-3">Breed &amp; Gender</th>
                                <th className="px-5 py-3">Weight</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                              {batchPigs.map((pig) => (
                                <tr
                                  key={pig.id}
                                  className="hover:bg-gray-50/70 transition-colors"
                                >
                                  <td className="px-5 py-3 font-mono font-semibold text-gray-900">
                                    <Link
                                      to={`/pigs/${pig.id}`}
                                      className="hover:text-brand-600 transition-colors underline-offset-2 hover:underline"
                                    >
                                      {pig.tagNumber}
                                    </Link>
                                  </td>
                                  <td className="px-5 py-3 font-semibold text-gray-900">
                                    <Link
                                      to={`/pigs/${pig.id}`}
                                      className="hover:text-brand-600 transition-colors"
                                    >
                                      {pig.name}
                                    </Link>
                                  </td>
                                  <td className="px-5 py-3 text-gray-600 capitalize">
                                    {pig.breed} &bull; {pig.gender}
                                  </td>
                                  <td className="px-5 py-3 font-medium text-gray-900">
                                    {formatWeight(pig.currentWeight)}
                                  </td>
                                  <td className="px-5 py-3">
                                    <StatusBadge
                                      type="pig-status"
                                      value={pig.status}
                                    />
                                  </td>
                                  <td className="px-5 py-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemovePig(batch.id, pig.id, pig.name)
                                      }
                                      className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                                      title="Remove from batch"
                                    >
                                      <UserMinus className="w-4 h-4" />
                                    </button>
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
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT BATCH MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBatch ? `Edit Batch: ${editingBatch.name}` : 'Create New Batch'}
        size="lg"
      >
        <form onSubmit={handleSaveBatch} className="space-y-4">
          <div>
            <label className="label">
              Batch Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={batchForm.name}
              onChange={(e) =>
                setBatchForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g. Winter 2026 Finishers"
              className="input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Cohort Start Date</label>
              <input
                type="date"
                required
                value={batchForm.startDate}
                onChange={(e) =>
                  setBatchForm((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="input"
              />
            </div>
            <div>
              <label className="label">Target Market Date</label>
              <input
                type="date"
                required
                value={batchForm.targetMarketDate}
                onChange={(e) =>
                  setBatchForm((prev) => ({
                    ...prev,
                    targetMarketDate: e.target.value,
                  }))
                }
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Notes / Objectives</label>
            <textarea
              rows={2}
              value={batchForm.notes}
              onChange={(e) =>
                setBatchForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Growth rate targets, pen assignments, feed trial notes..."
              className="input resize-none"
            />
          </div>

          {/* Pig Selector Checklist (for unassigned pigs or currently assigned) */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Select Pigs for Cohort</label>
              <span className="text-xs text-gray-500">
                {batchForm.selectedPigIds.length} selected
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto scrollbar-thin border border-gray-200 rounded-lg p-2 divide-y divide-gray-100 bg-gray-50/50">
              {pigs
                .filter(
                  (p) =>
                    !p.batchId ||
                    (editingBatch && editingBatch.pigIds?.includes(p.id)) ||
                    p.batchId === editingBatch?.id
                )
                .map((pig) => {
                  const isChecked = batchForm.selectedPigIds.includes(pig.id);
                  return (
                    <label
                      key={pig.id}
                      className="flex items-center justify-between py-2 px-2 hover:bg-white rounded cursor-pointer transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBatchForm((prev) => ({
                                ...prev,
                                selectedPigIds: [...prev.selectedPigIds, pig.id],
                              }));
                            } else {
                              setBatchForm((prev) => ({
                                ...prev,
                                selectedPigIds: prev.selectedPigIds.filter(
                                  (id) => id !== pig.id
                                ),
                              }));
                            }
                          }}
                          className="rounded text-brand-600 focus:ring-brand-500"
                        />
                        <span className="font-mono font-medium text-gray-800">
                          {pig.tagNumber}
                        </span>
                        <span className="font-semibold text-gray-900">
                          {pig.name}
                        </span>
                        <span className="text-gray-400">({pig.breed})</span>
                      </div>
                      <span className="font-medium text-gray-600">
                        {formatWeight(pig.currentWeight)}
                      </span>
                    </label>
                  );
                })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingBatch ? 'Save Batch' : 'Create Batch'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ASSIGN PIGS TO BATCH MODAL */}
      <Modal
        isOpen={Boolean(addPigsModalBatch)}
        onClose={() => setAddPigsModalBatch(null)}
        title={`Add Unassigned Pigs to "${addPigsModalBatch?.name}"`}
        size="md"
      >
        <form onSubmit={handleAddPigsSubmit} className="space-y-4">
          <p className="text-xs text-gray-500">
            Select unassigned pigs to assign into cohort{' '}
            <strong>{addPigsModalBatch?.name}</strong>:
          </p>

          {unassignedPigs.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">
              All active pigs are already assigned to a batch.
            </p>
          ) : (
            <div className="max-h-60 overflow-y-auto scrollbar-thin border border-gray-200 rounded-lg p-2 divide-y divide-gray-100 bg-gray-50/50">
              {unassignedPigs.map((pig) => {
                const isSelected = selectedToAddPigIds.includes(pig.id);
                return (
                  <label
                    key={pig.id}
                    className="flex items-center justify-between py-2 px-2 hover:bg-white rounded cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedToAddPigIds((prev) => [...prev, pig.id]);
                          } else {
                            setSelectedToAddPigIds((prev) =>
                              prev.filter((id) => id !== pig.id)
                            );
                          }
                        }}
                        className="rounded text-brand-600 focus:ring-brand-500"
                      />
                      <span className="font-mono font-medium text-gray-800">
                        {pig.tagNumber}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {pig.name}
                      </span>
                      <span className="text-gray-400">({pig.breed})</span>
                    </div>
                    <span className="font-medium text-gray-600">
                      {formatWeight(pig.currentWeight)}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setAddPigsModalBatch(null)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={selectedToAddPigIds.length === 0}
              className="btn-primary disabled:opacity-50"
            >
              Add Selected ({selectedToAddPigIds.length})
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDialog
        isOpen={Boolean(deleteConfirmBatch)}
        onClose={() => setDeleteConfirmBatch(null)}
        onConfirm={handleDeleteBatch}
        title="Delete Cohort Batch?"
        message={`Are you sure you want to delete "${deleteConfirmBatch?.name}"? Pigs assigned to this batch will be retained in your inventory as unbatched.`}
        confirmLabel="Delete Batch"
        variant="danger"
      />
    </div>
  );
}

export default BatchManagement;
