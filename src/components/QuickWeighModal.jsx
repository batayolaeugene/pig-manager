import React, { useState, useEffect } from 'react';
import { Scale, Check, Calendar, TrendingUp, Sparkles, X, Plus, Minus } from 'lucide-react';
import { usePigs } from '../context/AppContext';
import { useToast } from './Toast';
import { formatWeight, calculateDailyFeed, getProgressToMarket, getPigStatusFromWeight } from '../utils/helpers';
import { PIG_STATUS_LABELS } from '../utils/constants';

export function QuickWeighModal({ isOpen, onClose, defaultPigId = null }) {
  const { pigs, addWeightRecord } = usePigs();
  const { toast } = useToast();

  const [selectedPigId, setSelectedPigId] = useState('');
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Set default or initial pig
  useEffect(() => {
    if (defaultPigId) {
      setSelectedPigId(defaultPigId);
    } else if (pigs.length > 0 && !selectedPigId) {
      setSelectedPigId(pigs[0].id);
    }
  }, [defaultPigId, pigs, selectedPigId]);

  const selectedPig = pigs.find((p) => p.id === selectedPigId);

  // Set current weight when pig changes
  useEffect(() => {
    if (selectedPig) {
      setWeight(selectedPig.currentWeight?.toString() || '20');
    }
  }, [selectedPigId, selectedPig]);

  if (!isOpen) return null;

  const currentNumWeight = Number(weight) || 0;
  const prevWeight = selectedPig?.currentWeight || 0;
  const weightDiff = Math.round((currentNumWeight - prevWeight) * 10) / 10;
  const newStatus = getPigStatusFromWeight(currentNumWeight, selectedPig?.targetWeight || 90);
  const feedInfo = calculateDailyFeed(currentNumWeight);
  const marketProgress = getProgressToMarket(currentNumWeight, selectedPig?.targetWeight || 90);

  const adjustWeight = (delta) => {
    setWeight((prev) => {
      const val = Math.max(1, Math.round((Number(prev || 0) + delta) * 10) / 10);
      return val.toString();
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!selectedPigId) {
      toast.error('Please select a pig');
      return;
    }
    if (!currentNumWeight || currentNumWeight <= 0) {
      toast.error('Please enter a valid weight');
      return;
    }

    addWeightRecord(selectedPigId, currentNumWeight, date);
    toast.success(
      `Logged ${formatWeight(currentNumWeight)} for ${selectedPig?.tagNumber || selectedPig?.name}! Status: ${PIG_STATUS_LABELS[newStatus] || newStatus}`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-scaleIn flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Quick Weigh-In</h2>
              <p className="text-xs text-emerald-100">DA Swine Growth Tracking</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Pig Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
              Select Pig
            </label>
            <select
              value={selectedPigId}
              onChange={(e) => setSelectedPigId(e.target.value)}
              className="select w-full text-sm font-medium"
            >
              {pigs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.tagNumber} — {p.name} ({formatWeight(p.currentWeight)})
                </option>
              ))}
            </select>
          </div>

          {/* Large Weight Display & Numeric Stepper */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Scale Measurement
            </p>
            <div className="flex items-center justify-center gap-2 my-1">
              <input
                type="number"
                step="0.1"
                min="1"
                max="350"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-36 text-center text-3xl font-extrabold text-slate-900 bg-white border border-slate-300 rounded-xl py-2 shadow-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                autoFocus
              />
              <span className="text-xl font-bold text-slate-500">kg</span>
            </div>

            {/* Glove-Friendly Quick Step Buttons */}
            <div className="grid grid-cols-6 gap-1.5 mt-3">
              <button
                type="button"
                onClick={() => adjustWeight(-5)}
                className="py-2 bg-white border border-gray-200 hover:bg-gray-100 active:scale-95 text-gray-700 rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                -5
              </button>
              <button
                type="button"
                onClick={() => adjustWeight(-1)}
                className="py-2 bg-white border border-gray-200 hover:bg-gray-100 active:scale-95 text-gray-700 rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                -1
              </button>
              <button
                type="button"
                onClick={() => adjustWeight(-0.5)}
                className="py-2 bg-white border border-gray-200 hover:bg-gray-100 active:scale-95 text-gray-700 rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                -0.5
              </button>
              <button
                type="button"
                onClick={() => adjustWeight(0.5)}
                className="py-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 active:scale-95 text-emerald-800 rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                +0.5
              </button>
              <button
                type="button"
                onClick={() => adjustWeight(1)}
                className="py-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 active:scale-95 text-emerald-800 rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => adjustWeight(5)}
                className="py-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 active:scale-95 text-emerald-800 rounded-lg text-xs font-bold transition-all shadow-xs"
              >
                +5
              </button>
            </div>

            {/* Gain/Loss Indicator */}
            {selectedPig && (
              <div className="mt-3 flex items-center justify-center gap-2 text-xs">
                <span className="text-gray-500">Previous: {formatWeight(prevWeight)}</span>
                <span>&bull;</span>
                <span
                  className={`font-semibold ${
                    weightDiff > 0
                      ? 'text-emerald-600'
                      : weightDiff < 0
                      ? 'text-red-500'
                      : 'text-gray-500'
                  }`}
                >
                  {weightDiff > 0 ? `+${weightDiff} kg gain` : weightDiff < 0 ? `${weightDiff} kg` : 'No change'}
                </span>
              </div>
            )}
          </div>

          {/* Real-time Stage & Ration Impact Card */}
          <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-950">
              <span>DA Feed Stage</span>
              <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-full text-[11px]">
                {feedInfo.feedType.name}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 pt-1 border-t border-emerald-200/40">
              <div>
                <span className="text-gray-500 block text-[11px]">Daily Ration:</span>
                <span className="font-bold text-gray-900">{feedInfo.dailyKg} kg / day</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[11px]">Market Progress:</span>
                <span className="font-bold text-brand-700">{marketProgress}% to 90kg</span>
              </div>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Measurement Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input w-full text-sm"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1 py-3 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 py-3 text-sm bg-emerald-600 hover:bg-emerald-700 font-bold shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Save Weight</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuickWeighModal;
