import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Receipt,
  Plus,
  Search,
  Filter,
  Calendar,
  Trash2,
  Edit2,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Tag,
  CheckCircle2,
  X,
  PieChart as PieIcon,
  BarChart3,
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
import { useFinances, usePigs, useBatches } from '../context/AppContext';
import {
  FINANCE_CATEGORIES,
  CURRENCY,
} from '../utils/constants';
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  generateId,
  cn,
} from '../utils/helpers';
import { StatCard } from '../components/StatCard';
import { Modal } from '../components/Modal';
import { DataTable } from '../components/DataTable';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../components/Toast';

const EXPENSE_COLORS = [
  '#ef4444', // Red (Feed)
  '#f59e0b', // Amber (Medication)
  '#8b5cf6', // Purple (Veterinary)
  '#3b82f6', // Blue (Labor)
  '#ec4899', // Pink (Equipment)
  '#06b6d4', // Cyan (Utilities)
  '#f97316', // Orange (Pig Purchase)
  '#64748b', // Slate (Other)
];

export function Finance() {
  const {
    finances,
    getTotalIncome,
    getTotalExpenses,
    addFinance,
    updateFinance,
    deleteFinance,
  } = useFinances();
  const { pigs } = usePigs();
  const { batches } = useBatches();
  const { toast } = useToast();

  // Filter States
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'income' | 'expense'
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form State
  const [formType, setFormType] = useState('expense'); // 'income' | 'expense'
  const [formCategory, setFormCategory] = useState(FINANCE_CATEGORIES.EXPENSE[0]);
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDescription, setFormDescription] = useState('');
  const [formPigId, setFormPigId] = useState('');
  const [formBatchId, setFormBatchId] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Confirm Delete Dialog State
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Totals
  const totalIncome = useMemo(() => getTotalIncome(), [finances]);
  const totalExpenses = useMemo(() => getTotalExpenses(), [finances]);
  const netProfit = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);
  const isNetPositive = netProfit >= 0;

  // Filtered List
  const filteredFinances = useMemo(() => {
    return finances.filter((item) => {
      // Type match
      if (typeFilter !== 'ALL' && item.type !== typeFilter) {
        return false;
      }
      // Category match
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false;
      }
      // Date range match
      if (startDate && item.date < startDate) {
        return false;
      }
      if (endDate && item.date > endDate) {
        return false;
      }
      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const descMatch = (item.description || '').toLowerCase().includes(q);
        const catMatch = (item.category || '').toLowerCase().includes(q);
        const pigMatch = pigs.some(
          (p) => p.id === item.pigId && (p.name.toLowerCase().includes(q) || p.tagNumber.toLowerCase().includes(q))
        );
        const batchMatch = batches.some(
          (b) => b.id === item.batchId && b.name.toLowerCase().includes(q)
        );
        if (!descMatch && !catMatch && !pigMatch && !batchMatch) {
          return false;
        }
      }
      return true;
    });
  }, [finances, typeFilter, categoryFilter, startDate, endDate, searchQuery, pigs, batches]);

  // Monthly Cash Flow Chart Data (Past 6 Months)
  const monthlyCashFlowData = useMemo(() => {
    const monthsMap = {};
    const now = new Date();

    // Prepare last 6 months in chronological order
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { month: 'short' });
      monthsMap[key] = {
        month: label,
        income: 0,
        expense: 0,
        net: 0,
      };
    }

    // Populate data
    finances.forEach((item) => {
      if (!item.date) return;
      const key = item.date.substring(0, 7);
      if (monthsMap[key]) {
        if (item.type === 'income') {
          monthsMap[key].income += Number(item.amount) || 0;
        } else {
          monthsMap[key].expense += Number(item.amount) || 0;
        }
        monthsMap[key].net = monthsMap[key].income - monthsMap[key].expense;
      }
    });

    return Object.values(monthsMap);
  }, [finances]);

  // Expense Breakdown by Category Chart Data
  const expenseBreakdownData = useMemo(() => {
    const catMap = {};
    finances
      .filter((item) => item.type === 'expense')
      .forEach((item) => {
        const cat = item.category || 'Other Expense';
        catMap[cat] = (catMap[cat] || 0) + Number(item.amount || 0);
      });

    return Object.entries(catMap)
      .map(([name, value]) => ({
        name,
        value: Math.round(value * 100) / 100,
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [finances]);

  // Open Modal for Add
  const handleOpenAdd = (type = 'expense') => {
    setEditingItem(null);
    setFormType(type);
    setFormCategory(
      type === 'income' ? FINANCE_CATEGORIES.INCOME[0] : FINANCE_CATEGORIES.EXPENSE[0]
    );
    setFormAmount('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormDescription('');
    setFormPigId('');
    setFormBatchId('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormType(item.type);
    setFormCategory(item.category);
    setFormAmount(String(item.amount));
    setFormDate(item.date || new Date().toISOString().split('T')[0]);
    setFormDescription(item.description || '');
    setFormPigId(item.pigId || '');
    setFormBatchId(item.batchId || '');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Type change inside modal switches categories appropriately
  const handleTypeChange = (newType) => {
    setFormType(newType);
    setFormCategory(
      newType === 'income' ? FINANCE_CATEGORIES.INCOME[0] : FINANCE_CATEGORIES.EXPENSE[0]
    );
  };

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = {};

    if (!formAmount || isNaN(Number(formAmount)) || Number(formAmount) <= 0) {
      errors.amount = 'Please enter a valid amount greater than 0';
    }
    if (!formDescription.trim()) {
      errors.description = 'Please provide a transaction description';
    }
    if (!formDate) {
      errors.date = 'Please select a date';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      type: formType,
      category: formCategory,
      amount: Number(formAmount),
      date: formDate,
      description: formDescription.trim(),
      pigId: formPigId || null,
      batchId: formBatchId || null,
    };

    if (editingItem) {
      updateFinance(editingItem.id, payload);
      toast.success('Transaction updated successfully');
    } else {
      addFinance(payload);
      toast.success(
        `${formType === 'income' ? 'Income' : 'Expense'} record created successfully`
      );
    }

    setIsModalOpen(false);
  };

  // Delete Confirm
  const handleConfirmDelete = () => {
    if (deletingId) {
      deleteFinance(deletingId);
      toast.success('Transaction removed successfully');
      setDeletingId(null);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setTypeFilter('ALL');
    setCategoryFilter('ALL');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters =
    typeFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    searchQuery.trim() !== '' ||
    startDate !== '' ||
    endDate !== '';

  // Table Columns
  const tableColumns = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (val) => (
        <span className="font-medium text-gray-700 whitespace-nowrap">
          {formatDate(val)}
        </span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (val) => (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
            val === 'income'
              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/10'
              : 'bg-red-50 text-red-700 ring-1 ring-red-600/10'
          )}
        >
          {val === 'income' ? (
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <ArrowDownRight className="w-3.5 h-3.5 text-red-600" />
          )}
          {val === 'income' ? 'Income' : 'Expense'}
        </span>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (val) => (
        <span className="badge-gray font-medium">{val}</span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      className: 'max-w-xs md:max-w-md',
      render: (val, row) => (
        <div>
          <p className="font-semibold text-gray-900 truncate">{val}</p>
          {(row.pigId || row.batchId) && (
            <div className="flex items-center gap-2 mt-0.5">
              {row.pigId && (
                <span className="text-[11px] text-gray-500 font-mono flex items-center gap-1">
                  <Tag className="w-3 h-3 text-emerald-600" />
                  {pigs.find((p) => p.id === row.pigId)?.tagNumber || 'Pig'}
                </span>
              )}
              {row.batchId && (
                <span className="text-[11px] text-gray-500 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-blue-600" />
                  {batches.find((b) => b.id === row.batchId)?.name || 'Batch'}
                </span>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'pigBatch',
      label: 'Linked Herd',
      render: (_, row) => {
        const pig = pigs.find((p) => p.id === row.pigId);
        const batch = batches.find((b) => b.id === row.batchId);
        if (!pig && !batch) {
          return <span className="text-gray-400 text-xs italic">General Farm</span>;
        }
        return (
          <div className="flex flex-col text-xs">
            {pig && (
              <span className="text-emerald-700 font-medium">
                {pig.name} ({pig.tagNumber})
              </span>
            )}
            {batch && (
              <span className="text-blue-700 font-medium">{batch.name}</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      className: 'text-right font-mono',
      render: (val, row) => {
        const isIncome = row.type === 'income';
        return (
          <span
            className={cn(
              'font-bold text-sm',
              isIncome ? 'text-emerald-600' : 'text-red-600'
            )}
          >
            {isIncome ? `+${formatCurrency(val)}` : `-${formatCurrency(val)}`}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      className: 'text-right',
      render: (_, row) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Edit Transaction"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setDeletingId(row.id);
              setIsDeleteDialogOpen(true);
            }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Transaction"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Financial Operations & Ledger
              </h2>
              <p className="text-xs text-gray-500">
                Track revenue, feed, medications, capital investments, and net operational profit
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleOpenAdd('income')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Income
          </button>
          <button
            type="button"
            onClick={() => handleOpenAdd('expense')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Top 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Income"
          value={formatCurrency(totalIncome)}
          icon={DollarSign}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          gradient="gradient-card-green"
        />

        <StatCard
          title="Total Expenses"
          value={formatCurrency(totalExpenses)}
          icon={CreditCard}
          iconBg="bg-red-50"
          iconColor="text-red-600"
          gradient="bg-white"
        />

        <StatCard
          title="Net Profit / Loss"
          value={formatCurrency(netProfit)}
          icon={isNetPositive ? TrendingUp : TrendingDown}
          iconBg={isNetPositive ? 'bg-blue-50' : 'bg-red-50'}
          iconColor={isNetPositive ? 'text-blue-600' : 'text-red-600'}
          gradient={isNetPositive ? 'gradient-card-blue' : 'bg-red-50/40'}
        />

        <StatCard
          title="Transactions Logged"
          value={finances.length}
          icon={Receipt}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          gradient="gradient-card-purple"
        />
      </div>

      {/* Visual Charts Section (Cash Flow & Expense Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Cash Flow Chart */}
        <div className="card bg-white border border-gray-200/80 p-5 sm:p-6 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Monthly Cash Flow (₱)
              </h3>
              <p className="text-xs text-gray-400">
                Income inflows vs expense outflows
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Income
              </span>
              <span className="flex items-center gap-1.5 text-red-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Expense
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyCashFlowData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  stroke="#cbd5e1"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  stroke="#cbd5e1"
                  tickFormatter={(v) => `₱${Number(v) >= 1000 ? `${Math.round(v/1000)}k` : v}`}
                />
                <Tooltip
                  formatter={(val, name) => [
                    formatCurrency(val),
                    name === 'income' ? 'Income' : 'Expense',
                  ]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '0.75rem',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar
                  dataKey="income"
                  name="income"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                />
                <Bar
                  dataKey="expense"
                  name="expense"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Breakdown Chart */}
        <div className="card bg-white border border-gray-200/80 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-purple-600" />
                Expense Breakdown by Category
              </h3>
              <p className="text-xs text-gray-500">
                Expenditure allocation across key operational cost centers
              </p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {expenseBreakdownData.length === 0 ? (
              <p className="text-xs text-gray-400">No expenses recorded yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseBreakdownData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {expenseBreakdownData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [formatCurrency(val), name]}
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
            )}
          </div>
        </div>
      </div>

      {/* Action / Filter Bar */}
      <div className="card-flat bg-white border border-gray-200/80 p-5 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <Filter className="w-4 h-4 text-brand-600" />
            <span>Search & Filter Transactions</span>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          {/* Search Query */}
          <div className="lg:col-span-2">
            <label className="label">Search Description / Herd</label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search transactions..."
                className="input pl-10 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="label">Type</label>
            <select
              className="select text-xs"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="income">Income Only</option>
              <option value="expense">Expense Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="label">Category</label>
            <select
              className="select text-xs"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              <optgroup label="Income Categories">
                {FINANCE_CATEGORIES.INCOME.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Expense Categories">
                {FINANCE_CATEGORIES.EXPENSE.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Date Range Start & End */}
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="label">From</label>
              <input
                type="date"
                className="input text-xs px-2 py-2"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label">To</label>
              <input
                type="date"
                className="input text-xs px-2 py-2"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">
            Transaction Records
          </h3>
          <span className="text-xs text-gray-500 font-medium">
            Showing {filteredFinances.length} of {finances.length} transactions
          </span>
        </div>

        <DataTable
          columns={tableColumns}
          data={filteredFinances}
          onRowClick={handleOpenEdit}
          emptyMessage="No financial records found matching your filters."
        />
      </div>

      {/* Add / Edit Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Transaction' : `Record New ${formType === 'income' ? 'Income' : 'Expense'}`}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Toggle */}
          <div>
            <label className="label">Transaction Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={cn(
                  'py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all duration-150',
                  formType === 'income'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                )}
              >
                <ArrowUpRight className="w-4 h-4" />
                Income
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={cn(
                  'py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all duration-150',
                  formType === 'expense'
                    ? 'bg-red-600 text-white border-red-600 shadow-xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                )}
              >
                <ArrowDownRight className="w-4 h-4" />
                Expense
              </button>
            </div>
          </div>

          {/* Amount & Date in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">
                Amount ({CURRENCY}) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className={cn('input pl-8 font-semibold text-gray-900', formErrors.amount && 'border-red-500')}
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                />
              </div>
              {formErrors.amount && (
                <p className="text-[11px] text-red-500 mt-1">{formErrors.amount}</p>
              )}
            </div>

            <div>
              <label className="label">
                Transaction Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className={cn('input', formErrors.date && 'border-red-500')}
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
              {formErrors.date && (
                <p className="text-[11px] text-red-500 mt-1">{formErrors.date}</p>
              )}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="label">Category</label>
            <select
              className="select"
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
            >
              {(formType === 'income'
                ? FINANCE_CATEGORIES.INCOME
                : FINANCE_CATEGORIES.EXPENSE
              ).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="label">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 500kg Finisher feed mix delivery from supplier"
              className={cn('input', formErrors.description && 'border-red-500')}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
            {formErrors.description && (
              <p className="text-[11px] text-red-500 mt-1">{formErrors.description}</p>
            )}
          </div>

          {/* Link to Pig and/or Batch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="label">Link to Pig (Optional)</label>
              <select
                className="select text-xs"
                value={formPigId}
                onChange={(e) => setFormPigId(e.target.value)}
              >
                <option value="">None / General Farm</option>
                {pigs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.tagNumber} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Link to Batch (Optional)</label>
              <select
                className="select text-xs"
                value={formBatchId}
                onChange={(e) => setFormBatchId(e.target.value)}
              >
                <option value="">None / General Farm</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={cn(
                'text-xs',
                formType === 'income' ? 'btn-primary bg-emerald-600 hover:bg-emerald-700' : 'btn-danger'
              )}
            >
              {editingItem ? 'Save Changes' : `Record ${formType === 'income' ? 'Income' : 'Expense'}`}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Financial Record"
        message="Are you sure you want to permanently delete this financial transaction? This action will adjust farm income and expense balances."
        confirmLabel="Delete Record"
        variant="danger"
      />
    </div>
  );
}

export default Finance;
