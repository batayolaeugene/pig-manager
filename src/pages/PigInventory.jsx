import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  Search,
  LayoutGrid,
  Table as TableIcon,
  X,
  Scale,
  Calendar,
  Layers,
  Sparkles,
  RotateCcw,
  SlidersHorizontal,
  Utensils,
  AlertCircle,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { usePigs, useBatches } from '../context/AppContext';
import {
  formatWeight,
  getProgressToMarket,
  getDaysBetween,
  calculateDailyFeed,
  cn,
} from '../utils/helpers';
import {
  PIG_STATUS,
  PIG_STATUS_LABELS,
  HEALTH_STATUS,
  HEALTH_STATUS_LABELS,
} from '../utils/constants';
import { DataTable } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../components/Toast';

export function PigInventory() {
  const navigate = useNavigate();
  const { pigs, updatePig } = usePigs();
  const { batches } = useBatches();
  const { toast } = useToast();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [healthFilter, setHealthFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Map batches for fast lookup
  const batchMap = useMemo(() => {
    const map = {};
    batches.forEach((b) => {
      map[b.id] = b.name;
    });
    return map;
  }, [batches]);

  // Counts for Segmented Filter Pills
  const counts = useMemo(() => {
    return {
      all: pigs.length,
      weaning: pigs.filter((p) => p.status === PIG_STATUS.WEANING).length,
      growing: pigs.filter((p) => p.status === PIG_STATUS.GROWING).length,
      finishing: pigs.filter((p) => p.status === PIG_STATUS.FINISHING).length,
      marketReady: pigs.filter((p) => p.status === PIG_STATUS.MARKET_READY).length,
      attention: pigs.filter((p) => p.healthStatus !== HEALTH_STATUS.HEALTHY).length,
    };
  }, [pigs]);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setHealthFilter('all');
    setBatchFilter('all');
    setSortBy('newest');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'all' ||
    healthFilter !== 'all' ||
    batchFilter !== 'all' ||
    sortBy !== 'newest';

  // Quick Weigh trigger
  const triggerQuickWeigh = (pigId) => {
    window.dispatchEvent(
      new CustomEvent('porkpro:open-weigh', { detail: { pigId } })
    );
  };

  // Quick Health toggle
  const cycleHealth = (pig, e) => {
    e.stopPropagation();
    let nextHealth = HEALTH_STATUS.HEALTHY;
    if (pig.healthStatus === HEALTH_STATUS.HEALTHY) nextHealth = HEALTH_STATUS.TREATING;
    else if (pig.healthStatus === HEALTH_STATUS.TREATING) nextHealth = HEALTH_STATUS.SICK;
    else nextHealth = HEALTH_STATUS.HEALTHY;

    updatePig(pig.id, { healthStatus: nextHealth });
    toast.success(`${pig.tagNumber} health updated to: ${HEALTH_STATUS_LABELS[nextHealth]}`);
  };

  // Filter and sort pigs
  const filteredPigs = useMemo(() => {
    return pigs
      .filter((pig) => {
        // Search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matchTag = pig.tagNumber?.toLowerCase().includes(query);
          const matchName = pig.name?.toLowerCase().includes(query);
          const matchBreed = pig.breed?.toLowerCase().includes(query);
          if (!matchTag && !matchName && !matchBreed) return false;
        }

        // Segmented / Status filter
        if (statusFilter !== 'all') {
          if (statusFilter === 'attention') {
            if (pig.healthStatus === HEALTH_STATUS.HEALTHY) return false;
          } else if (pig.status !== statusFilter) {
            return false;
          }
        }

        // Health filter
        if (healthFilter !== 'all' && pig.healthStatus !== healthFilter) {
          return false;
        }

        // Batch filter
        if (batchFilter !== 'all') {
          if (batchFilter === 'unbatched' && pig.batchId) return false;
          if (batchFilter !== 'unbatched' && pig.batchId !== batchFilter) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '');
        if (sortBy === 'name-desc') return (b.name || '').localeCompare(a.name || '');
        if (sortBy === 'weight-asc') return (a.currentWeight || 0) - (b.currentWeight || 0);
        if (sortBy === 'weight-desc') return (b.currentWeight || 0) - (a.currentWeight || 0);
        if (sortBy === 'oldest') {
          return new Date(a.dateOfBirth || a.createdAt || 0) - new Date(b.dateOfBirth || b.createdAt || 0);
        }
        // newest default
        return new Date(b.dateOfBirth || b.createdAt || 0) - new Date(a.dateOfBirth || a.createdAt || 0);
      });
  }, [pigs, searchQuery, statusFilter, healthFilter, batchFilter, sortBy]);

  // Quick stats
  const stats = useMemo(() => {
    const totalPigs = filteredPigs.length;
    const avgWeight =
      totalPigs > 0
        ? Math.round((filteredPigs.reduce((sum, p) => sum + (p.currentWeight || 0), 0) / totalPigs) * 10) / 10
        : 0;
    const marketReadyCount = filteredPigs.filter((p) => p.status === PIG_STATUS.MARKET_READY).length;
    const sickCount = filteredPigs.filter((p) => p.healthStatus !== HEALTH_STATUS.HEALTHY).length;

    return { totalPigs, avgWeight, marketReadyCount, sickCount };
  }, [filteredPigs]);

  // Columns for Table View
  const columns = useMemo(
    () => [
      {
        key: 'tagNumber',
        label: 'Tag #',
        sortable: true,
        render: (val) => (
          <span className="font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">
            {val}
          </span>
        ),
      },
      {
        key: 'name',
        label: 'Name',
        sortable: true,
        render: (val) => (
          <div className="font-bold text-gray-900 hover:text-brand-600 transition-colors">
            {val}
          </div>
        ),
      },
      {
        key: 'breed',
        label: 'Breed',
        sortable: true,
        render: (val) => <span className="text-gray-600 text-xs">{val}</span>,
      },
      {
        key: 'currentWeight',
        label: 'Scale Weight',
        sortable: true,
        render: (val, row) => (
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-gray-900">{formatWeight(val)}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerQuickWeigh(row.id);
              }}
              className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-bold"
            >
              Weigh
            </button>
          </div>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        render: (val) => <StatusBadge type="pig-status" value={val} />,
      },
      {
        key: 'healthStatus',
        label: 'Health',
        render: (val) => <StatusBadge type="health" value={val} />,
      },
      {
        key: 'batchId',
        label: 'Batch',
        render: (val) =>
          val && batchMap[val] ? (
            <span className="inline-flex items-center gap-1 text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
              <Layers className="w-3 h-3 text-gray-400" />
              {batchMap[val]}
            </span>
          ) : (
            <span className="text-gray-400 text-xs italic">Unbatched</span>
          ),
      },
    ],
    [batchMap]
  );

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">
            Pig Inventory
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {pigs.length} registered swine &bull; Real-time weight and feed records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => triggerQuickWeigh()}
            className="btn-secondary py-2 px-3 text-xs font-bold"
          >
            <Scale className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Quick Weigh</span>
          </button>
          <Link to="/pigs/add" className="btn-primary py-2 px-3 text-xs font-bold">
            <Plus className="w-4 h-4" />
            <span>Add Pig</span>
          </Link>
        </div>
      </div>

      {/* SWIPEABLE SEGMENTED FILTER PILLS (Mobile Priority) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={cn(
            'px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-xs',
            statusFilter === 'all'
              ? 'bg-slate-900 text-white shadow-slate-900/20'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          )}
        >
          <span>All Herd</span>
          <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
            {counts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(PIG_STATUS.WEANING)}
          className={cn(
            'px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-xs',
            statusFilter === PIG_STATUS.WEANING
              ? 'bg-blue-600 text-white shadow-blue-600/20'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          )}
        >
          <span>🍼 Weaning</span>
          <span className="px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-800 text-[10px]">
            {counts.weaning}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(PIG_STATUS.GROWING)}
          className={cn(
            'px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-xs',
            statusFilter === PIG_STATUS.GROWING
              ? 'bg-amber-500 text-white shadow-amber-500/20'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          )}
        >
          <span>🌾 Growing</span>
          <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 text-[10px]">
            {counts.growing}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(PIG_STATUS.FINISHING)}
          className={cn(
            'px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-xs',
            statusFilter === PIG_STATUS.FINISHING
              ? 'bg-purple-600 text-white shadow-purple-600/20'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          )}
        >
          <span>🎯 Finishing</span>
          <span className="px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-900 text-[10px]">
            {counts.finishing}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(PIG_STATUS.MARKET_READY)}
          className={cn(
            'px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-xs',
            statusFilter === PIG_STATUS.MARKET_READY
              ? 'bg-emerald-600 text-white shadow-emerald-600/20'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          )}
        >
          <span>🏆 Ready to Market</span>
          <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-900 text-[10px]">
            {counts.marketReady}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('attention')}
          className={cn(
            'px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-xs',
            statusFilter === 'attention'
              ? 'bg-rose-600 text-white shadow-rose-600/20'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          )}
        >
          <span>⚠️ Medical Attention</span>
          <span className="px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-900 text-[10px]">
            {counts.attention}
          </span>
        </button>
      </div>

      {/* SEARCH AND SORT BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by tag #, name, or breed..."
            className="input w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="select text-xs py-2 px-3 font-semibold bg-white"
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
            <option value="weight-desc">Weight: High → Low</option>
            <option value="weight-asc">Weight: Low → High</option>
            <option value="name-asc">Name (A → Z)</option>
          </select>

          {/* Cards / Table Switcher (Desktop only) */}
          <div className="hidden sm:inline-flex rounded-xl border border-gray-200 p-0.5 bg-gray-100">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1.5 rounded-lg text-xs font-bold transition-all',
                viewMode === 'grid' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
              )}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                'p-1.5 rounded-lg text-xs font-bold transition-all',
                viewMode === 'table' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'
              )}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* QUICK STAT CHIPS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Filtered Count</p>
          <p className="text-2xl font-extrabold text-gray-900 font-mono mt-0.5">{stats.totalPigs}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Average Weight</p>
          <p className="text-2xl font-extrabold text-emerald-600 font-mono mt-0.5">
            {formatWeight(stats.avgWeight)}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Market Ready</p>
          <p className="text-2xl font-extrabold text-blue-600 font-mono mt-0.5">
            {stats.marketReadyCount}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-xs">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Treatment</p>
          <p
            className={cn(
              'text-2xl font-extrabold font-mono mt-0.5',
              stats.sickCount > 0 ? 'text-rose-600' : 'text-gray-400'
            )}
          >
            {stats.sickCount}
          </p>
        </div>
      </div>

      {/* CONTENT: Card View (Default) or Table View */}
      {filteredPigs.length === 0 ? (
        <EmptyState
          title="No pigs match your filter"
          description="Try selecting another status tab or clear your search query."
          action={{
            label: 'Reset all filters',
            onClick: resetFilters,
          }}
        />
      ) : viewMode === 'table' ? (
        <DataTable
          columns={columns}
          data={filteredPigs}
          onRowClick={(pig) => navigate(`/pigs/${pig.id}`)}
          emptyMessage="No pigs found."
        />
      ) : (
        /* FIELD-READY CARD GRID (CLEAN, FOCUSED, TABULAR ALIGNMENT) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredPigs.map((pig) => {
            const progress = getProgressToMarket(
              pig.currentWeight,
              pig.targetWeight
            );
            const batchName = pig.batchId ? batchMap[pig.batchId] : null;
            const dailyFeed = calculateDailyFeed(pig.currentWeight);
            const morningRationKg = ((dailyFeed.dailyKg * 0.5)).toFixed(2);
            const afternoonRationKg = ((dailyFeed.dailyKg * 0.5)).toFixed(2);

            return (
              <div
                key={pig.id}
                className="bg-white border border-gray-200/80 hover:border-emerald-400/80 p-4 sm:p-5 flex flex-col justify-between transition-all duration-150 shadow-xs rounded-2xl"
              >
                <div>
                  {/* Top Row: Tag, Name & Status Badges */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div
                      onClick={() => navigate(`/pigs/${pig.id}`)}
                      className="cursor-pointer group min-w-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-900 text-white rounded-md flex-shrink-0">
                          {pig.tagNumber}
                        </span>
                        <h3 className="text-base font-extrabold text-gray-900 group-hover:text-brand-600 transition-colors truncate">
                          {pig.name}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {pig.breed} &bull; <span className="capitalize">{pig.gender}</span>
                        {batchName && (
                          <span className="font-medium text-emerald-700 ml-1">({batchName})</span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => cycleHealth(pig, e)}
                        className="active:scale-95 transition-transform"
                        title="Click to toggle health"
                      >
                        <StatusBadge type="health" value={pig.healthStatus} />
                      </button>
                      <StatusBadge type="pig-status" value={pig.status} />
                    </div>
                  </div>

                  {/* 2-Column Key Metrics (Weight & Ration) */}
                  <div className="grid grid-cols-2 gap-3 py-3 px-3.5 bg-gray-50/80 rounded-xl border border-gray-100/90 mb-3">
                    {/* Weight Metric */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Live Weight
                      </p>
                      <p className="text-xl font-extrabold text-gray-900 font-mono tracking-tight mt-0.5">
                        {formatWeight(pig.currentWeight)}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
                        Target: <span className="text-gray-700">{formatWeight(pig.targetWeight || 90)}</span>
                      </p>
                    </div>

                    {/* Daily Ration Metric */}
                    <div className="border-l border-gray-200/60 pl-3">
                      <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider truncate">
                        {dailyFeed.feedType.name}
                      </p>
                      <p className="text-xl font-extrabold text-emerald-700 font-mono tracking-tight mt-0.5">
                        {dailyFeed.dailyKg} <span className="text-xs font-normal">kg/d</span>
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5 font-medium tabular-nums">
                        AM: {morningRationKg}k &bull; PM: {afternoonRationKg}k
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar with Right-Aligned Percentage */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold mb-1">
                      <span>Market Readiness</span>
                      <span className="font-bold text-emerald-700 font-mono">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-brand-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => triggerQuickWeigh(pig.id)}
                    className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  >
                    <Scale className="w-4 h-4" />
                    <span>Log Weight</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(`/pigs/${pig.id}`)}
                    className="py-2 px-3 bg-white border border-gray-200 hover:bg-gray-50 active:scale-95 text-gray-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>Profile &rarr;</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PigInventory;
