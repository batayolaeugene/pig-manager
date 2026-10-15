import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  GripVertical,
  Check,
  Edit2,
  Trash2,
  Tag,
  Layers,
  ArrowRight,
  X,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { useTasks, usePigs, useBatches } from '../context/AppContext';
import {
  TASK_CATEGORIES,
  TASK_PRIORITY,
  TASK_STATUS,
} from '../utils/constants';
import {
  formatDate,
  formatRelative,
  cn,
} from '../utils/helpers';
import { StatusBadge } from '../components/StatusBadge';
import { StatCard } from '../components/StatCard';
import { Modal } from '../components/Modal';
import { DataTable } from '../components/DataTable';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../components/Toast';

export function Tasks() {
  const { tasks, addTask, updateTask, deleteTask, completeTask, getOverdueTasks } = useTasks();
  const { pigs } = usePigs();
  const { batches } = useBatches();
  const { toast } = useToast();

  // View Mode: 'board' | 'list'
  const [viewMode, setViewMode] = useState('board');
  const [activeMobileColumn, setActiveMobileColumn] = useState(TASK_STATUS.PENDING);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [onlyOverdueFilter, setOnlyOverdueFilter] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDueDate, setFormDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [formPriority, setFormPriority] = useState(TASK_PRIORITY.MEDIUM);
  const [formCategory, setFormCategory] = useState(TASK_CATEGORIES[0]);
  const [formStatus, setFormStatus] = useState(TASK_STATUS.PENDING);
  const [formPigId, setFormPigId] = useState('');
  const [formBatchId, setFormBatchId] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Confirm Delete Dialog State
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Quick Stats
  const totalTasksCount = tasks.length;
  const overdueTasks = useMemo(() => getOverdueTasks(), [tasks, getOverdueTasks]);
  const dueTodayCount = useMemo(() => {
    return tasks.filter(
      (t) => t.status !== TASK_STATUS.COMPLETED && t.dueDate === todayStr
    ).length;
  }, [tasks, todayStr]);

  const completedThisWeekCount = useMemo(() => {
    return tasks.filter((t) => t.status === TASK_STATUS.COMPLETED).length;
  }, [tasks]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Overdue-only toggle
      if (onlyOverdueFilter) {
        const isOverdue =
          task.status !== TASK_STATUS.COMPLETED &&
          task.dueDate &&
          task.dueDate < todayStr;
        if (!isOverdue) return false;
      }

      // Priority filter
      if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'ALL' && task.category !== categoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && task.status !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (task.title || '').toLowerCase().includes(q);
        const descMatch = (task.description || '').toLowerCase().includes(q);
        const catMatch = (task.category || '').toLowerCase().includes(q);
        const pigMatch = pigs.some(
          (p) => p.id === task.pigId && (p.name.toLowerCase().includes(q) || p.tagNumber.toLowerCase().includes(q))
        );
        const batchMatch = batches.some(
          (b) => b.id === task.batchId && b.name.toLowerCase().includes(q)
        );
        if (!titleMatch && !descMatch && !catMatch && !pigMatch && !batchMatch) {
          return false;
        }
      }

      return true;
    });
  }, [
    tasks,
    onlyOverdueFilter,
    priorityFilter,
    categoryFilter,
    statusFilter,
    searchQuery,
    todayStr,
    pigs,
    batches,
  ]);

  // Tasks grouped for Kanban Board
  const kanbanColumns = useMemo(() => {
    return [
      {
        id: TASK_STATUS.PENDING,
        title: 'Pending',
        colorClass: 'bg-amber-500',
        tasks: filteredTasks.filter((t) => t.status === TASK_STATUS.PENDING),
      },
      {
        id: TASK_STATUS.IN_PROGRESS,
        title: 'In Progress',
        colorClass: 'bg-blue-500',
        tasks: filteredTasks.filter((t) => t.status === TASK_STATUS.IN_PROGRESS),
      },
      {
        id: TASK_STATUS.COMPLETED,
        title: 'Completed',
        colorClass: 'bg-emerald-500',
        tasks: filteredTasks.filter((t) => t.status === TASK_STATUS.COMPLETED),
      },
    ];
  }, [filteredTasks]);

  // Open Modal for Add
  const handleOpenAdd = (defaultStatus = TASK_STATUS.PENDING) => {
    setEditingTask(null);
    setFormTitle('');
    setFormDescription('');
    setFormDueDate(new Date().toISOString().split('T')[0]);
    setFormPriority(TASK_PRIORITY.MEDIUM);
    setFormCategory(TASK_CATEGORIES[0]);
    setFormStatus(defaultStatus);
    setFormPigId('');
    setFormBatchId('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (task) => {
    setEditingTask(task);
    setFormTitle(task.title || '');
    setFormDescription(task.description || '');
    setFormDueDate(task.dueDate || new Date().toISOString().split('T')[0]);
    setFormPriority(task.priority || TASK_PRIORITY.MEDIUM);
    setFormCategory(task.category || TASK_CATEGORIES[0]);
    setFormStatus(task.status || TASK_STATUS.PENDING);
    setFormPigId(task.pigId || '');
    setFormBatchId(task.batchId || '');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = {};

    if (!formTitle.trim()) {
      errors.title = 'Please enter a task title';
    }
    if (!formDueDate) {
      errors.dueDate = 'Please select a due date';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      title: formTitle.trim(),
      description: formDescription.trim(),
      dueDate: formDueDate,
      priority: formPriority,
      category: formCategory,
      status: formStatus,
      pigId: formPigId || null,
      batchId: formBatchId || null,
    };

    if (editingTask) {
      updateTask(editingTask.id, payload);
      toast.success('Task updated successfully');
    } else {
      addTask(payload);
      toast.success('New task added successfully');
    }

    setIsModalOpen(false);
  };

  // Inline Status Change
  const handleStatusChange = (taskId, newStatus) => {
    updateTask(taskId, {
      status: newStatus,
      completedAt: newStatus === TASK_STATUS.COMPLETED ? new Date().toISOString() : null,
    });
    toast.success(`Task status moved to ${newStatus}`);
  };

  // Quick Toggle Complete
  const handleToggleComplete = (taskId, currentStatus) => {
    const isCompleted = currentStatus === TASK_STATUS.COMPLETED;
    completeTask(taskId, !isCompleted);
    toast.success(
      isCompleted ? 'Task marked as pending' : 'Task marked as completed!'
    );
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (deletingTaskId) {
      deleteTask(deletingTaskId);
      toast.success('Task deleted successfully');
      setDeletingTaskId(null);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setPriorityFilter('ALL');
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
    setOnlyOverdueFilter(false);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    priorityFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    onlyOverdueFilter;

  // List View DataTable Columns
  const listColumns = [
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (val) => <StatusBadge type="task-priority" value={val} />,
    },
    {
      key: 'title',
      label: 'Task Details',
      className: 'max-w-md',
      render: (val, row) => (
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleComplete(row.id, row.status);
              }}
              className={cn(
                'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                row.status === TASK_STATUS.COMPLETED
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'border-gray-300 hover:border-emerald-500'
              )}
            >
              {row.status === TASK_STATUS.COMPLETED && (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              )}
            </button>
            <span
              className={cn(
                'font-bold text-gray-900 text-sm',
                row.status === TASK_STATUS.COMPLETED && 'line-through text-gray-400 font-normal'
              )}
            >
              {val}
            </span>
          </div>
          {row.description && (
            <p className="text-xs text-gray-500 line-clamp-1 ml-6 mt-0.5">
              {row.description}
            </p>
          )}
        </div>
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
      key: 'dueDate',
      label: 'Due Date',
      sortable: true,
      render: (val, row) => {
        const isOverdue =
          row.status !== TASK_STATUS.COMPLETED && val && val < todayStr;
        return (
          <div className="text-xs">
            <span
              className={cn(
                'font-medium',
                isOverdue ? 'text-red-600 font-bold' : 'text-gray-800'
              )}
            >
              {formatDate(val)}
            </span>
            <div
              className={cn(
                'text-[10px] mt-0.5',
                isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400'
              )}
            >
              {isOverdue ? 'Overdue!' : formatRelative(val)}
            </div>
          </div>
        );
      },
    },
    {
      key: 'linked',
      label: 'Linked To',
      render: (_, row) => {
        const pig = pigs.find((p) => p.id === row.pigId);
        const batch = batches.find((b) => b.id === row.batchId);
        if (!pig && !batch) {
          return <span className="text-gray-400 text-xs italic">General</span>;
        }
        return (
          <div className="flex flex-col text-xs">
            {pig && (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {pig.name} ({pig.tagNumber})
              </span>
            )}
            {batch && (
              <span className="text-blue-700 font-medium flex items-center gap-1">
                <Layers className="w-3 h-3" />
                {batch.name}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (val, row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <select
            className={cn(
              'text-xs py-1 px-2.5 rounded-lg border font-semibold focus:outline-none focus:ring-1',
              val === TASK_STATUS.COMPLETED
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : val === TASK_STATUS.IN_PROGRESS
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            )}
            value={val}
            onChange={(e) => handleStatusChange(row.id, e.target.value)}
          >
            <option value={TASK_STATUS.PENDING}>Pending</option>
            <option value={TASK_STATUS.IN_PROGRESS}>In Progress</option>
            <option value={TASK_STATUS.COMPLETED}>Completed</option>
          </select>
        </div>
      ),
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
            title="Edit Task"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setDeletingTaskId(row.id);
              setIsDeleteDialogOpen(true);
            }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Task"
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
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                Tasks & Schedule
              </h2>
              <p className="text-xs text-gray-500">
                Herd healthcare protocols, feeding tasks, weigh-ins, and scheduled farm maintenance
              </p>
            </div>
          </div>
        </div>

        {/* Top Actions: View Toggle + Add Task */}
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200/80">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                viewMode === 'board'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Board View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <List className="w-3.5 h-3.5" />
              List View
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleOpenAdd(TASK_STATUS.PENDING)}
            className="btn-primary text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </button>
        </div>
      </div>

      {/* Overdue Warning Alert Banner */}
      {overdueTasks.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-900 animate-slideIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-red-950">
                Action Required: {overdueTasks.length} Overdue Task{overdueTasks.length > 1 ? 's' : ''}
              </h4>
              <p className="text-xs text-red-700 mt-0.5">
                Critical livestock interventions or scheduled herd duties have passed their due deadline.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOnlyOverdueFilter((prev) => !prev)}
            className={cn(
              'px-3.5 py-2 text-xs font-bold rounded-lg border transition-colors self-start sm:self-auto',
              onlyOverdueFilter
                ? 'bg-red-700 text-white border-red-700'
                : 'bg-white text-red-700 border-red-300 hover:bg-red-100'
            )}
          >
            {onlyOverdueFilter ? 'Showing Overdue Tasks' : 'Filter Overdue Tasks'}
          </button>
        </div>
      )}

      {/* Quick Stats Row (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Tasks"
          value={totalTasksCount}
          icon={ClipboardList}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />

        <StatCard
          title="Overdue"
          value={overdueTasks.length}
          change={overdueTasks.length > 0 ? `${overdueTasks.length} urgent` : 'All clear'}
          icon={AlertTriangle}
          iconBg={overdueTasks.length > 0 ? 'bg-red-50' : 'bg-gray-50'}
          iconColor={overdueTasks.length > 0 ? 'text-red-600' : 'text-gray-400'}
        />

        <StatCard
          title="Due Today"
          value={dueTodayCount}
          icon={Calendar}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />

        <StatCard
          title="Completed"
          value={completedThisWeekCount}
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
      </div>

      {/* Quick Category & Priority Filter Pills (Mobile Priority) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        <button
          type="button"
          onClick={() => {
            setCategoryFilter('ALL');
            setOnlyOverdueFilter(false);
          }}
          className={cn(
            'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-xs',
            categoryFilter === 'ALL' && !onlyOverdueFilter
              ? 'bg-slate-900 text-white shadow-slate-900/20'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          )}
        >
          <span>All Tasks</span>
          <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
            {totalTasksCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setOnlyOverdueFilter(true);
            setCategoryFilter('ALL');
          }}
          className={cn(
            'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-xs',
            onlyOverdueFilter
              ? 'bg-red-600 text-white shadow-red-600/20'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          )}
        >
          <span>🚨 Overdue</span>
          <span className="px-1.5 py-0.2 rounded-md bg-red-100 text-red-800 text-[10px]">
            {overdueTasks.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setCategoryFilter('Vaccination');
            setOnlyOverdueFilter(false);
          }}
          className={cn(
            'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-xs',
            categoryFilter === 'Vaccination'
              ? 'bg-purple-600 text-white shadow-purple-600/20'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          )}
        >
          <span>💉 Vaccination</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setCategoryFilter('Deworming');
            setOnlyOverdueFilter(false);
          }}
          className={cn(
            'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-xs',
            categoryFilter === 'Deworming'
              ? 'bg-amber-600 text-white shadow-amber-600/20'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          )}
        >
          <span>💊 Deworming</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setCategoryFilter('Weight Check');
            setOnlyOverdueFilter(false);
          }}
          className={cn(
            'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-xs',
            categoryFilter === 'Weight Check'
              ? 'bg-emerald-600 text-white shadow-emerald-600/20'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          )}
        >
          <span>⚖️ Weight Checks</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setCategoryFilter('Feeding');
            setOnlyOverdueFilter(false);
          }}
          className={cn(
            'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-xs',
            categoryFilter === 'Feeding'
              ? 'bg-blue-600 text-white shadow-blue-600/20'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          )}
        >
          <span>🥣 Feeding</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="card-flat bg-white border border-gray-200/80 p-5 rounded-2xl shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <Filter className="w-4 h-4 text-brand-600" />
            <span>Filter Tasks</span>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          {/* Search */}
          <div>
            <label className="label">Search Tasks</label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search title, details, pigs..."
                className="input pl-10 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="label">Priority</label>
            <select
              className="select text-xs"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="ALL">All Priorities</option>
              <option value={TASK_PRIORITY.LOW}>Low Priority</option>
              <option value={TASK_PRIORITY.MEDIUM}>Medium Priority</option>
              <option value={TASK_PRIORITY.HIGH}>High Priority</option>
              <option value={TASK_PRIORITY.URGENT}>Urgent</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="label">Category</label>
            <select
              className="select text-xs"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              {TASK_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status (Only in board view or list view) */}
          <div>
            <label className="label">Status</label>
            <select
              className="select text-xs"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value={TASK_STATUS.PENDING}>Pending</option>
              <option value={TASK_STATUS.IN_PROGRESS}>In Progress</option>
              <option value={TASK_STATUS.COMPLETED}>Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* ===================== BOARD VIEW (KANBAN) ===================== */}
      {viewMode === 'board' && (
        <div className="space-y-4">
          {/* Mobile Column Tabs (Glove-friendly, no side-scroll) */}
          <div className="md:hidden flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl">
            {kanbanColumns.map((col) => (
              <button
                key={col.id}
                type="button"
                onClick={() => setActiveMobileColumn(col.id)}
                className={cn(
                  'flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5',
                  activeMobileColumn === col.id
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <span>{col.title}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px]',
                    activeMobileColumn === col.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-gray-200 text-gray-700'
                  )}
                >
                  {col.tasks.length}
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {kanbanColumns.map((col) => {
              const isVisibleOnMobile = activeMobileColumn === col.id;
              return (
                <div
                  key={col.id}
                  className={cn(
                    'bg-gray-100/70 border border-gray-200/70 rounded-2xl p-4 flex flex-col min-h-[450px]',
                    !isVisibleOnMobile && 'hidden md:flex'
                  )}
                >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <span className={cn('w-2.5 h-2.5 rounded-full', col.colorClass)} />
                  <h3 className="text-sm font-bold text-gray-900">{col.title}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white text-gray-700 shadow-xs">
                    {col.tasks.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAdd(col.id)}
                  className="p-1 text-gray-400 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
                  title={`Add ${col.title} Task`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Column Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto scrollbar-thin">
                {col.tasks.length === 0 ? (
                  <div className="h-40 border border-dashed border-gray-300 rounded-xl flex items-center justify-center text-xs text-gray-400">
                    No tasks in {col.title}
                  </div>
                ) : (
                  col.tasks.map((task) => {
                    const isOverdue =
                      task.status !== TASK_STATUS.COMPLETED &&
                      task.dueDate &&
                      task.dueDate < todayStr;
                    const pig = pigs.find((p) => p.id === task.pigId);
                    const batch = batches.find((b) => b.id === task.batchId);

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          'p-4 bg-white rounded-xl border border-gray-200 shadow-xs hover:shadow-md transition-all duration-150 relative group',
                          isOverdue && 'border-l-4 border-l-red-500'
                        )}
                      >
                        {/* Card Top Row: Grip Handle, Priority, Category, Edit */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <GripVertical className="w-3.5 h-3.5 text-gray-300 cursor-grab" />
                            <StatusBadge type="task-priority" value={task.priority} />
                            <span className="badge-gray text-[10px]">
                              {task.category}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(task)}
                              className="p-1 text-gray-400 hover:text-brand-600 hover:bg-gray-100 rounded"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingTaskId(task.id);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Title & Checkbox */}
                        <div className="flex items-start gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleToggleComplete(task.id, task.status)}
                            className={cn(
                              'w-6 h-6 mt-0.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all active:scale-90',
                              task.status === TASK_STATUS.COMPLETED
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-gray-300 hover:border-emerald-500'
                            )}
                          >
                            {task.status === TASK_STATUS.COMPLETED && (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <h4
                              className={cn(
                                'text-xs font-bold text-gray-900 leading-snug',
                                task.status === TASK_STATUS.COMPLETED && 'line-through text-gray-400 font-normal'
                              )}
                            >
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Linked Herd Tag */}
                        {(pig || batch) && (
                          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100 text-[11px]">
                            {pig && (
                              <span className="text-emerald-700 font-medium flex items-center gap-1">
                                <Tag className="w-3 h-3 text-emerald-600" />
                                {pig.name} ({pig.tagNumber})
                              </span>
                            )}
                            {batch && (
                              <span className="text-blue-700 font-medium flex items-center gap-1">
                                <Layers className="w-3 h-3 text-blue-600" />
                                {batch.name}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Card Bottom Row: Due Date & Move Status Dropdown */}
                        <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-gray-100 text-[11px]">
                          <div
                            className={cn(
                              'flex items-center gap-1 font-medium',
                              isOverdue ? 'text-red-600 font-bold' : 'text-gray-500'
                            )}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(task.dueDate)}</span>
                            {isOverdue && (
                              <span className="text-[10px] text-red-500 font-bold">
                                (Overdue)
                              </span>
                            )}
                          </div>

                          {/* Quick Move Status Selector */}
                          <div className="relative">
                            <select
                              value={task.status}
                              onChange={(e) => handleStatusChange(task.id, e.target.value)}
                              className="text-[10px] font-semibold py-1 px-2 pr-5 rounded-md border border-gray-200 bg-gray-50 text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                            >
                              <option value={TASK_STATUS.PENDING}>Move: Pending</option>
                              <option value={TASK_STATUS.IN_PROGRESS}>Move: In Progress</option>
                              <option value={TASK_STATUS.COMPLETED}>Move: Completed</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
        </div>
        </div>
      )}

      {/* ===================== LIST VIEW ===================== */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          <DataTable
            columns={listColumns}
            data={filteredTasks}
            onRowClick={handleOpenEdit}
            emptyMessage="No tasks found matching your filter criteria."
          />
        </div>
      )}

      {/* Add / Edit Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Edit Scheduled Task' : 'Add New Task'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="label">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Administer respiratory antibiotic booster"
              className={cn('input', formErrors.title && 'border-red-500')}
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
            />
            {formErrors.title && (
              <p className="text-[11px] text-red-500 mt-1">{formErrors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="label">Task Description</label>
            <textarea
              rows={3}
              placeholder="Provide specific instructions, dosage, pen numbers, or health notes..."
              className="input resize-none"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </div>

          {/* Due Date & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className={cn('input', formErrors.dueDate && 'border-red-500')}
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
              />
              {formErrors.dueDate && (
                <p className="text-[11px] text-red-500 mt-1">{formErrors.dueDate}</p>
              )}
            </div>

            <div>
              <label className="label">Priority Level</label>
              <select
                className="select"
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value)}
              >
                <option value={TASK_PRIORITY.LOW}>Low Priority</option>
                <option value={TASK_PRIORITY.MEDIUM}>Medium Priority</option>
                <option value={TASK_PRIORITY.HIGH}>High Priority</option>
                <option value={TASK_PRIORITY.URGENT}>Urgent</option>
              </select>
            </div>
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Task Category</label>
              <select
                className="select"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
              >
                {TASK_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Status</label>
              <select
                className="select"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
              >
                <option value={TASK_STATUS.PENDING}>Pending</option>
                <option value={TASK_STATUS.IN_PROGRESS}>In Progress</option>
                <option value={TASK_STATUS.COMPLETED}>Completed</option>
              </select>
            </div>
          </div>

          {/* Link to Pig and Batch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="label">Link to Pig (Optional)</label>
              <select
                className="select text-xs"
                value={formPigId}
                onChange={(e) => setFormPigId(e.target.value)}
              >
                <option value="">None / General Herd</option>
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
                <option value="">None / General Herd</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Modal Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs">
              {editingTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        message="Are you sure you want to delete this scheduled task? This operation cannot be undone."
        confirmLabel="Delete Task"
        variant="danger"
      />
    </div>
  );
}

export default Tasks;
