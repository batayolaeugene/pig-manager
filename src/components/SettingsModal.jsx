import React, { useState } from 'react';
import { X, Save, RotateCcw, Cloud, CheckCircle2, ShieldCheck, MapPin, DollarSign, Scale, Building2 } from 'lucide-react';
import { useSettings, useAppDispatch } from '../context/AppContext';
import { useToast } from './Toast';
import { backupToCloud } from '../lib/supabaseSync';

const PH_REGIONS = [
  'Cebu',
  'Batangas',
  'Bulacan',
  'Pampanga',
  'Bukidnon',
  'Iloilo',
  'Davao del Sur',
  'Pangasinan',
  'Tarlac',
  'General Santos',
  'Laguna',
  'Nueva Ecija',
];

export function SettingsModal({ isOpen, onClose }) {
  const { settings } = useSettings();
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    farmName: settings?.farmName || 'PorkPro Farm',
    region: settings?.region || 'Cebu',
    targetMarketWeight: settings?.targetMarketWeight || 90,
    liveweightPriceKg: settings?.liveweightPriceKg || 180,
  });

  const [isBackingUp, setIsBackingUp] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: {
        ...formData,
        targetMarketWeight: Number(formData.targetMarketWeight) || 90,
        liveweightPriceKg: Number(formData.liveweightPriceKg) || 180,
      },
    });
    toast({
      type: 'success',
      title: 'Settings Saved',
      message: 'Farm configuration and region updated successfully.',
    });
    onClose();
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo data to match the screenshot defaults? (10 active herd, Cebu region, ₱ -37,238 net)')) {
      dispatch({ type: 'RESET_DATA' });
      toast({
        type: 'info',
        title: 'Data Reset',
        message: 'Farm records restored to standard demo state.',
      });
      onClose();
    }
  };

  const handleManualBackup = async () => {
    setIsBackingUp(true);
    try {
      const state = JSON.parse(localStorage.getItem('porkpro_app_state_v3_ph') || '{}');
      await backupToCloud(state);
      toast({
        type: 'success',
        title: 'Cloud Backup Complete',
        message: 'Farm records safely synchronized to Supabase.',
      });
    } catch (err) {
      toast({
        type: 'error',
        title: 'Backup Failed',
        message: err.message || 'Could not connect to Supabase.',
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              ⚙️
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Farm Settings</h2>
              <p className="text-[11px] text-slate-400">PorkPro Philippine DA Operations</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl transition-colors active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Farm Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" /> Farm Name
            </label>
            <input
              type="text"
              value={formData.farmName}
              onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              placeholder="e.g. PorkPro Farm"
              required
            />
          </div>

          {/* Region */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" /> Farm Region (Philippines)
            </label>
            <select
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {PH_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Displayed in the hero card (e.g. 📍 region: Cebu)
            </p>
          </div>

          {/* Farmgate Liveweight Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Farmgate Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₱</span>
                <input
                  type="number"
                  step="1"
                  min="50"
                  max="350"
                  value={formData.liveweightPriceKg}
                  onChange={(e) => setFormData({ ...formData, liveweightPriceKg: e.target.value })}
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">₱ per kg liveweight</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-purple-600" /> Target Weight
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="60"
                  max="140"
                  value={formData.targetMarketWeight}
                  onChange={(e) => setFormData({ ...formData, targetMarketWeight: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">kg</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">DA standard: 85-95kg</p>
            </div>
          </div>

          {/* Cloud Sync Status Box */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <p className="text-xs font-extrabold text-emerald-950">Supabase Cloud Sync</p>
                <p className="text-[10px] text-emerald-700 font-medium">Automatic cloud data backup enabled</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleManualBackup}
              disabled={isBackingUp}
              className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg active:scale-95 transition-all flex items-center gap-1 shadow-2xs"
            >
              <Cloud className="w-3 h-3" />
              <span>{isBackingUp ? 'Syncing...' : 'Backup'}</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleResetData}
              className="text-xs font-bold text-slate-500 hover:text-rose-600 py-2 px-2 flex items-center gap-1.5 active:scale-95 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
