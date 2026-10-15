import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react';
import {
  samplePigs,
  sampleBatches,
  sampleTasks,
  sampleFinances,
  sampleNotifications,
} from '../utils/sampleData';
import { generateId, getPigStatusFromWeight, generateAutoTasks } from '../utils/helpers';
import { TASK_STATUS, PIG_STATUS } from '../utils/constants';
import { debouncedBackup } from '../lib/supabaseSync';

const STORAGE_KEY = 'porkpro_app_state_v3_ph';

const defaultSettings = {
  farmName: 'PorkPro Farm',
  currency: 'PHP',
  targetMarketWeight: 90,
  defaultBreed: 'Landrace x Large White',
  region: 'Cebu',
  liveweightPriceKg: 180,
};

const defaultInitialState = {
  pigs: samplePigs,
  batches: sampleBatches,
  tasks: sampleTasks,
  finances: sampleFinances,
  notifications: sampleNotifications,
  settings: defaultSettings,
};

function loadInitialState() {
  if (typeof window === 'undefined') return defaultInitialState;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultInitialState;
    const parsed = JSON.parse(saved);
    return {
      pigs: Array.isArray(parsed.pigs) ? parsed.pigs : defaultInitialState.pigs,
      batches: Array.isArray(parsed.batches) ? parsed.batches : defaultInitialState.batches,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : defaultInitialState.tasks,
      finances: Array.isArray(parsed.finances) ? parsed.finances : defaultInitialState.finances,
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : defaultInitialState.notifications,
      settings: parsed.settings ? { ...defaultSettings, ...parsed.settings } : defaultSettings,
    };
  } catch (error) {
    console.error('Failed to load PorkPro state from localStorage:', error);
    return defaultInitialState;
  }
}

export function appReducer(state, action) {
  switch (action.type) {
    case 'SET_STATE': {
      return {
        ...state,
        ...action.payload,
      };
    }

    case 'RESET_DATA': {
      return {
        pigs: samplePigs,
        batches: sampleBatches,
        tasks: sampleTasks,
        finances: sampleFinances,
        notifications: sampleNotifications,
        settings: defaultSettings,
      };
    }

    // --- PIG ACTIONS ---
    case 'ADD_PIG': {
      const newPig = {
        id: action.payload.id || generateId(),
        createdAt: new Date().toISOString(),
        weightHistory: action.payload.weightHistory || [
          {
            date: new Date().toISOString().split('T')[0],
            weight: Number(action.payload.currentWeight) || 10,
          },
        ],
        ...action.payload,
      };

      // Auto-generate tasks based on Philippine DA vaccination/health schedule
      const autoTasks = generateAutoTasks(newPig);

      let updatedBatches = state.batches;
      if (newPig.batchId) {
        updatedBatches = state.batches.map(batch => {
          if (batch.id === newPig.batchId && !batch.pigIds.includes(newPig.id)) {
            return { ...batch, pigIds: [...batch.pigIds, newPig.id] };
          }
          return batch;
        });
      }

      // Add notification about auto-generated tasks
      const newNotifications = autoTasks.length > 0 ? [
        {
          id: generateId(),
          title: 'Tasks Auto-Generated',
          message: `${autoTasks.length} tasks created for ${newPig.tagNumber || newPig.name} based on DA vaccination & health schedule.`,
          type: 'success',
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...state.notifications,
      ] : state.notifications;

      return {
        ...state,
        pigs: [newPig, ...state.pigs],
        batches: updatedBatches,
        tasks: [...autoTasks, ...state.tasks],
        notifications: newNotifications,
      };
    }

    case 'UPDATE_PIG': {
      const updatedPigs = state.pigs.map(pig => {
        if (pig.id === action.payload.id) {
          return { ...pig, ...action.payload };
        }
        return pig;
      });

      // Handle batch reassignment if batchId was updated
      let updatedBatches = state.batches;
      if (action.payload.batchId !== undefined) {
        const pigId = action.payload.id;
        const newBatchId = action.payload.batchId;
        updatedBatches = state.batches.map(batch => {
          if (batch.id === newBatchId && !batch.pigIds.includes(pigId)) {
            return { ...batch, pigIds: [...batch.pigIds, pigId] };
          }
          if (batch.id !== newBatchId && batch.pigIds.includes(pigId)) {
            return { ...batch, pigIds: batch.pigIds.filter(id => id !== pigId) };
          }
          return batch;
        });
      }

      return {
        ...state,
        pigs: updatedPigs,
        batches: updatedBatches,
      };
    }

    case 'DELETE_PIG': {
      const pigId = action.payload.id || action.payload;
      return {
        ...state,
        pigs: state.pigs.filter(pig => pig.id !== pigId),
        batches: state.batches.map(batch => ({
          ...batch,
          pigIds: batch.pigIds.filter(id => id !== pigId),
        })),
        tasks: state.tasks.filter(task => task.pigId !== pigId),
      };
    }

    case 'ADD_WEIGHT_RECORD': {
      const { pigId, weight, date } = action.payload;
      const numWeight = Number(weight);
      const recordDate = date || new Date().toISOString().split('T')[0];

      return {
        ...state,
        pigs: state.pigs.map(pig => {
          if (pig.id !== pigId) return pig;

          const existingHistory = Array.isArray(pig.weightHistory) ? pig.weightHistory : [];
          const updatedHistory = [...existingHistory, { date: recordDate, weight: numWeight }]
            .sort((a, b) => new Date(a.date) - new Date(b.date));

          // Auto-calculate new status if not sold
          let newStatus = pig.status;
          if (pig.status !== PIG_STATUS.SOLD) {
            newStatus = getPigStatusFromWeight(numWeight, state.settings?.targetMarketWeight || 110);
          }

          return {
            ...pig,
            currentWeight: numWeight,
            status: newStatus,
            weightHistory: updatedHistory,
          };
        }),
      };
    }

    // --- BATCH ACTIONS ---
    case 'ADD_BATCH': {
      const newBatch = {
        id: action.payload.id || generateId(),
        pigIds: action.payload.pigIds || [],
        createdAt: new Date().toISOString(),
        ...action.payload,
      };

      // Assign batchId to all included pigs
      const updatedPigs = state.pigs.map(pig => {
        if (newBatch.pigIds.includes(pig.id)) {
          return { ...pig, batchId: newBatch.id };
        }
        return pig;
      });

      return {
        ...state,
        batches: [newBatch, ...state.batches],
        pigs: updatedPigs,
      };
    }

    case 'UPDATE_BATCH': {
      const updatedBatches = state.batches.map(batch => {
        if (batch.id === action.payload.id) {
          return { ...batch, ...action.payload };
        }
        return batch;
      });

      let updatedPigs = state.pigs;
      if (Array.isArray(action.payload.pigIds)) {
        const batchId = action.payload.id;
        const newPigIds = action.payload.pigIds;
        updatedPigs = state.pigs.map(pig => {
          if (newPigIds.includes(pig.id)) {
            return { ...pig, batchId };
          }
          if (pig.batchId === batchId && !newPigIds.includes(pig.id)) {
            return { ...pig, batchId: null };
          }
          return pig;
        });
      }

      return {
        ...state,
        batches: updatedBatches,
        pigs: updatedPigs,
      };
    }

    case 'DELETE_BATCH': {
      const batchId = action.payload.id || action.payload;
      return {
        ...state,
        batches: state.batches.filter(batch => batch.id !== batchId),
        pigs: state.pigs.map(pig => (pig.batchId === batchId ? { ...pig, batchId: null } : pig)),
        tasks: state.tasks.filter(task => task.batchId !== batchId),
      };
    }

    case 'ADD_PIGS_TO_BATCH': {
      const { batchId, pigIds } = action.payload;
      const idsToAdd = Array.isArray(pigIds) ? pigIds : [pigIds];

      return {
        ...state,
        batches: state.batches.map(batch => {
          if (batch.id !== batchId) return batch;
          const merged = Array.from(new Set([...batch.pigIds, ...idsToAdd]));
          return { ...batch, pigIds: merged };
        }),
        pigs: state.pigs.map(pig => {
          if (idsToAdd.includes(pig.id)) {
            return { ...pig, batchId };
          }
          return pig;
        }),
      };
    }

    case 'REMOVE_PIG_FROM_BATCH': {
      const { batchId, pigId } = action.payload;
      return {
        ...state,
        batches: state.batches.map(batch => {
          if (batch.id !== batchId) return batch;
          return { ...batch, pigIds: batch.pigIds.filter(id => id !== pigId) };
        }),
        pigs: state.pigs.map(pig => {
          if (pig.id === pigId && pig.batchId === batchId) {
            return { ...pig, batchId: null };
          }
          return pig;
        }),
      };
    }

    // --- TASK ACTIONS ---
    case 'ADD_TASK': {
      const newTask = {
        id: action.payload.id || generateId(),
        status: action.payload.status || TASK_STATUS.PENDING,
        createdAt: new Date().toISOString(),
        ...action.payload,
      };
      return {
        ...state,
        tasks: [newTask, ...state.tasks],
      };
    }

    case 'UPDATE_TASK': {
      return {
        ...state,
        tasks: state.tasks.map(task => {
          if (task.id === action.payload.id) {
            return { ...task, ...action.payload };
          }
          return task;
        }),
      };
    }

    case 'DELETE_TASK': {
      const taskId = action.payload.id || action.payload;
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== taskId),
      };
    }

    case 'COMPLETE_TASK': {
      const taskId = typeof action.payload === 'object' ? action.payload.taskId : action.payload;
      const explicitCompleted = typeof action.payload === 'object' ? action.payload.completed : undefined;

      return {
        ...state,
        tasks: state.tasks.map(task => {
          if (task.id !== taskId) return task;
          const isCurrentlyCompleted = task.status === TASK_STATUS.COMPLETED;
          const shouldBeCompleted = explicitCompleted !== undefined ? explicitCompleted : !isCurrentlyCompleted;
          return {
            ...task,
            status: shouldBeCompleted ? TASK_STATUS.COMPLETED : TASK_STATUS.PENDING,
            completedAt: shouldBeCompleted ? new Date().toISOString() : null,
          };
        }),
      };
    }

    // --- FINANCE ACTIONS ---
    case 'ADD_FINANCE': {
      const newFinance = {
        id: action.payload.id || generateId(),
        date: action.payload.date || new Date().toISOString().split('T')[0],
        amount: Number(action.payload.amount) || 0,
        createdAt: new Date().toISOString(),
        ...action.payload,
      };
      return {
        ...state,
        finances: [newFinance, ...state.finances],
      };
    }

    case 'UPDATE_FINANCE': {
      return {
        ...state,
        finances: state.finances.map(item => {
          if (item.id === action.payload.id) {
            return {
              ...item,
              ...action.payload,
              amount: action.payload.amount !== undefined ? Number(action.payload.amount) : item.amount,
            };
          }
          return item;
        }),
      };
    }

    case 'DELETE_FINANCE': {
      const financeId = action.payload.id || action.payload;
      return {
        ...state,
        finances: state.finances.filter(item => item.id !== financeId),
      };
    }

    // --- NOTIFICATION ACTIONS ---
    case 'ADD_NOTIFICATION': {
      const newNotification = {
        id: action.payload.id || generateId(),
        read: false,
        createdAt: new Date().toISOString(),
        type: action.payload.type || 'info',
        ...action.payload,
      };
      return {
        ...state,
        notifications: [newNotification, ...state.notifications],
      };
    }

    case 'DISMISS_NOTIFICATION': {
      const notifId = action.payload.id || action.payload;
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== notifId),
      };
    }

    case 'CLEAR_NOTIFICATIONS': {
      return {
        ...state,
        notifications: [],
      };
    }

    case 'MARK_NOTIFICATION_READ': {
      const notifId = action.payload.id || action.payload;
      return {
        ...state,
        notifications: state.notifications.map(n => {
          if (n.id === notifId) {
            return { ...n, read: true };
          }
          return n;
        }),
      };
    }

    // --- SETTINGS ACTIONS ---
    case 'UPDATE_SETTINGS': {
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };
    }

    default:
      return state;
  }
}

export const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, undefined, loadInitialState);

  // Sync state to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      // Auto-sync to cloud (debounced, won't fire more than once per 30s)
      debouncedBackup(state);
    } catch (error) {
      console.error('Failed to persist PorkPro state:', error);
    }
  }, [state]);

  const contextValue = useMemo(() => ({ state, dispatch }), [state]);

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

// --- CORE HOOK ---
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// --- SPECIALIZED HELPER HOOKS ---

export function usePigs() {
  const { state, dispatch } = useApp();

  const getPig = useCallback(
    id => state.pigs.find(pig => pig.id === id),
    [state.pigs]
  );

  const getPigsByBatch = useCallback(
    batchId => state.pigs.filter(pig => pig.batchId === batchId),
    [state.pigs]
  );

  const getPigsByStatus = useCallback(
    status => state.pigs.filter(pig => pig.status === status),
    [state.pigs]
  );

  const addPig = useCallback(
    pigData => dispatch({ type: 'ADD_PIG', payload: pigData }),
    [dispatch]
  );

  const updatePig = useCallback(
    (id, updates) => dispatch({ type: 'UPDATE_PIG', payload: { id, ...updates } }),
    [dispatch]
  );

  const deletePig = useCallback(
    id => dispatch({ type: 'DELETE_PIG', payload: id }),
    [dispatch]
  );

  const addWeightRecord = useCallback(
    (pigId, weight, date) =>
      dispatch({ type: 'ADD_WEIGHT_RECORD', payload: { pigId, weight, date } }),
    [dispatch]
  );

  return useMemo(
    () => ({
      pigs: state.pigs,
      getPig,
      getPigsByBatch,
      getPigsByStatus,
      addPig,
      updatePig,
      deletePig,
      addWeightRecord,
    }),
    [state.pigs, getPig, getPigsByBatch, getPigsByStatus, addPig, updatePig, deletePig, addWeightRecord]
  );
}

export function useBatches() {
  const { state, dispatch } = useApp();

  const getBatch = useCallback(
    id => state.batches.find(batch => batch.id === id),
    [state.batches]
  );

  const getBatchPigs = useCallback(
    batchId => {
      const batch = state.batches.find(b => b.id === batchId);
      if (!batch) return [];
      return state.pigs.filter(pig => batch.pigIds.includes(pig.id) || pig.batchId === batchId);
    },
    [state.batches, state.pigs]
  );

  const addBatch = useCallback(
    batchData => dispatch({ type: 'ADD_BATCH', payload: batchData }),
    [dispatch]
  );

  const updateBatch = useCallback(
    (id, updates) => dispatch({ type: 'UPDATE_BATCH', payload: { id, ...updates } }),
    [dispatch]
  );

  const deleteBatch = useCallback(
    id => dispatch({ type: 'DELETE_BATCH', payload: id }),
    [dispatch]
  );

  const addPigsToBatch = useCallback(
    (batchId, pigIds) => dispatch({ type: 'ADD_PIGS_TO_BATCH', payload: { batchId, pigIds } }),
    [dispatch]
  );

  const removePigFromBatch = useCallback(
    (batchId, pigId) => dispatch({ type: 'REMOVE_PIG_FROM_BATCH', payload: { batchId, pigId } }),
    [dispatch]
  );

  return useMemo(
    () => ({
      batches: state.batches,
      getBatch,
      getBatchPigs,
      addBatch,
      updateBatch,
      deleteBatch,
      addPigsToBatch,
      removePigFromBatch,
    }),
    [state.batches, getBatch, getBatchPigs, addBatch, updateBatch, deleteBatch, addPigsToBatch, removePigFromBatch]
  );
}

export function useTasks() {
  const { state, dispatch } = useApp();

  const getOverdueTasks = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return state.tasks.filter(
      task => task.status !== TASK_STATUS.COMPLETED && task.dueDate && task.dueDate < today
    );
  }, [state.tasks]);

  const getUpcomingTasks = useCallback(
    (days = 7) => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      return state.tasks.filter(
        task =>
          task.status !== TASK_STATUS.COMPLETED &&
          task.dueDate &&
          task.dueDate >= todayStr &&
          task.dueDate <= futureDateStr
      );
    },
    [state.tasks]
  );

  const addTask = useCallback(
    taskData => dispatch({ type: 'ADD_TASK', payload: taskData }),
    [dispatch]
  );

  const updateTask = useCallback(
    (id, updates) => dispatch({ type: 'UPDATE_TASK', payload: { id, ...updates } }),
    [dispatch]
  );

  const deleteTask = useCallback(
    id => dispatch({ type: 'DELETE_TASK', payload: id }),
    [dispatch]
  );

  const completeTask = useCallback(
    (taskId, completed) => dispatch({ type: 'COMPLETE_TASK', payload: { taskId, completed } }),
    [dispatch]
  );

  return useMemo(
    () => ({
      tasks: state.tasks,
      getOverdueTasks,
      getUpcomingTasks,
      addTask,
      updateTask,
      deleteTask,
      completeTask,
    }),
    [state.tasks, getOverdueTasks, getUpcomingTasks, addTask, updateTask, deleteTask, completeTask]
  );
}

export function useFinances() {
  const { state, dispatch } = useApp();

  const getTotalIncome = useCallback(() => {
    return state.finances
      .filter(item => item.type === 'income')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [state.finances]);

  const getTotalExpenses = useCallback(() => {
    return state.finances
      .filter(item => item.type === 'expense')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [state.finances]);

  const getFinancesByPig = useCallback(
    pigId => state.finances.filter(item => item.pigId === pigId),
    [state.finances]
  );

  const addFinance = useCallback(
    financeData => dispatch({ type: 'ADD_FINANCE', payload: financeData }),
    [dispatch]
  );

  const updateFinance = useCallback(
    (id, updates) => dispatch({ type: 'UPDATE_FINANCE', payload: { id, ...updates } }),
    [dispatch]
  );

  const deleteFinance = useCallback(
    id => dispatch({ type: 'DELETE_FINANCE', payload: id }),
    [dispatch]
  );

  return useMemo(
    () => ({
      finances: state.finances,
      getTotalIncome,
      getTotalExpenses,
      getFinancesByPig,
      addFinance,
      updateFinance,
      deleteFinance,
    }),
    [state.finances, getTotalIncome, getTotalExpenses, getFinancesByPig, addFinance, updateFinance, deleteFinance]
  );
}

export function useNotifications() {
  const { state, dispatch } = useApp();

  const unreadCount = useMemo(() => {
    return state.notifications.filter(n => !n.read).length;
  }, [state.notifications]);

  const addNotification = useCallback(
    notifData => dispatch({ type: 'ADD_NOTIFICATION', payload: notifData }),
    [dispatch]
  );

  const dismissNotification = useCallback(
    id => dispatch({ type: 'DISMISS_NOTIFICATION', payload: id }),
    [dispatch]
  );

  const clearNotifications = useCallback(
    () => dispatch({ type: 'CLEAR_NOTIFICATIONS' }),
    [dispatch]
  );

  const markNotificationRead = useCallback(
    id => dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id }),
    [dispatch]
  );

  return useMemo(
    () => ({
      notifications: state.notifications,
      unreadCount,
      addNotification,
      dismissNotification,
      clearNotifications,
      markNotificationRead,
    }),
    [state.notifications, unreadCount, addNotification, dismissNotification, clearNotifications, markNotificationRead]
  );
}

export function useSettings() {
  const { state, dispatch } = useApp();

  const updateSettings = useCallback(
    (newSettings) => dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings }),
    [dispatch]
  );

  return useMemo(
    () => ({
      settings: state.settings,
      updateSettings,
    }),
    [state.settings, updateSettings]
  );
}

export function useAppDispatch() {
  const { dispatch } = useApp();
  return dispatch;
}

