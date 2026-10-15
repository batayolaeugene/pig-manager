import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { ToastProvider, ToastContainer } from './components/Toast';

// Lazy-loaded page components for optimal bundle splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PigInventory = lazy(() => import('./pages/PigInventory'));
const AddPig = lazy(() => import('./pages/AddPig'));
const PigDetail = lazy(() => import('./pages/PigDetail'));
const BatchManagement = lazy(() => import('./pages/BatchManagement'));
const FeedCalculator = lazy(() => import('./pages/FeedCalculator'));
const Finance = lazy(() => import('./pages/Finance'));
const ProfitCalculator = lazy(() => import('./pages/ProfitCalculator'));
const Tasks = lazy(() => import('./pages/Tasks'));

// Clean centered loading spinner component
function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin shadow-xs" />
      <p className="text-sm font-medium text-gray-400 animate-pulse">
        Loading...
      </p>
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pigs" element={<PigInventory />} />
            <Route path="/pigs/add" element={<AddPig />} />
            <Route path="/pigs/:id" element={<PigDetail />} />
            <Route path="/batches" element={<BatchManagement />} />
            <Route path="/feed" element={<FeedCalculator />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/profit" element={<ProfitCalculator />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
      <ToastContainer />
    </ToastProvider>
  );
}

export default App;
