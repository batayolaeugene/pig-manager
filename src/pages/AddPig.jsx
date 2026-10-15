import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Users,
  ArrowLeft,
  Sparkles,
  Save,
  RotateCcw,
  PlusCircle,
  HelpCircle,
  Info,
} from 'lucide-react';
import { usePigs, useBatches } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { BREEDS, HEALTH_STATUS, PIG_STATUS } from '../utils/constants';
import { generateId, getPigStatusFromWeight } from '../utils/helpers';

export function AddPig() {
  const navigate = useNavigate();
  const { pigs, addPig } = usePigs();
  const { batches, addBatch } = useBatches();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('single'); // 'single' | 'batch'

  // Generate next suggested tag number
  const suggestedTag = useMemo(() => {
    let maxNum = 0;
    pigs.forEach((p) => {
      if (p.tagNumber && p.tagNumber.startsWith('P-')) {
        const numPart = parseInt(p.tagNumber.replace('P-', ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });
    const nextNum = maxNum + 1;
    return `P-${String(nextNum).padStart(4, '0')}`;
  }, [pigs]);

  // SINGLE PIG FORM STATE
  const [singleForm, setSingleForm] = useState({
    tagNumber: suggestedTag,
    name: '',
    breed: BREEDS[0] || 'Landrace',
    gender: 'male',
    dateOfBirth: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    weaningDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    currentWeight: 25.0,
    targetWeight: 110,
    purchasePrice: 65,
    healthStatus: HEALTH_STATUS.HEALTHY,
    batchId: '',
    notes: '',
  });

  const [singleErrors, setSingleErrors] = useState({});

  // BATCH ADD FORM STATE
  const [batchForm, setBatchForm] = useState({
    batchName: 'Fall 2026 Batch',
    pigCount: 5,
    baseTagNumber: suggestedTag,
    commonBreed: BREEDS[0] || 'Landrace',
    commonGender: 'mixed', // 'mixed' | 'male' | 'female'
    dateOfBirth: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    weaningDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    currentWeight: 22.0,
    targetWeight: 110,
    purchasePrice: 65,
    notes: 'Uniform nursery intake group.',
  });

  const [batchErrors, setBatchErrors] = useState({});

  // Handle single form input changes
  const handleSingleChange = (e) => {
    const { name, value } = e.target;
    setSingleForm((prev) => ({ ...prev, [name]: value }));
    if (singleErrors[name]) {
      setSingleErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Handle batch form input changes
  const handleBatchChange = (e) => {
    const { name, value } = e.target;
    setBatchForm((prev) => ({ ...prev, [name]: value }));
    if (batchErrors[name]) {
      setBatchErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Validate Single Form
  const validateSingle = () => {
    const errors = {};
    if (!singleForm.tagNumber.trim()) {
      errors.tagNumber = 'Tag number is required';
    } else if (
      pigs.some(
        (p) =>
          p.tagNumber?.toLowerCase() === singleForm.tagNumber.trim().toLowerCase()
      )
    ) {
      errors.tagNumber = 'This tag number is already assigned';
    }

    if (!singleForm.name.trim()) {
      errors.name = 'Pig name is required';
    }

    if (!singleForm.currentWeight || Number(singleForm.currentWeight) <= 0) {
      errors.currentWeight = 'Weight must be greater than 0';
    }

    if (!singleForm.targetWeight || Number(singleForm.targetWeight) <= 0) {
      errors.targetWeight = 'Target weight must be greater than 0';
    }

    if (!singleForm.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
    }

    setSingleErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Single Pig
  const handleSingleSubmit = (e) => {
    e.preventDefault();
    if (!validateSingle()) return;

    const numWeight = Number(singleForm.currentWeight);
    const numTarget = Number(singleForm.targetWeight) || 110;
    const determinedStatus = getPigStatusFromWeight(numWeight, numTarget);
    const pigId = generateId();

    const newPig = {
      id: pigId,
      tagNumber: singleForm.tagNumber.trim().toUpperCase(),
      name: singleForm.name.trim(),
      breed: singleForm.breed,
      gender: singleForm.gender,
      dateOfBirth: singleForm.dateOfBirth,
      weaningDate: singleForm.weaningDate || null,
      currentWeight: numWeight,
      targetWeight: numTarget,
      status: determinedStatus,
      batchId: singleForm.batchId || null,
      purchasePrice: Number(singleForm.purchasePrice) || 0,
      healthStatus: singleForm.healthStatus || HEALTH_STATUS.HEALTHY,
      notes: singleForm.notes.trim(),
      weightHistory: [
        {
          date: singleForm.weaningDate || new Date().toISOString().split('T')[0],
          weight: numWeight,
        },
      ],
      createdAt: new Date().toISOString(),
    };

    addPig(newPig);
    toast.success(`Pig "${newPig.name}" (${newPig.tagNumber}) added successfully!`);
    navigate('/pigs');
  };

  // Validate Batch Form
  const validateBatch = () => {
    const errors = {};
    if (!batchForm.batchName.trim()) {
      errors.batchName = 'Batch name is required';
    }

    const count = Number(batchForm.pigCount);
    if (!count || count < 1 || count > 100) {
      errors.pigCount = 'Pig count must be between 1 and 100';
    }

    if (!batchForm.baseTagNumber.trim()) {
      errors.baseTagNumber = 'Base tag number is required';
    }

    if (!batchForm.currentWeight || Number(batchForm.currentWeight) <= 0) {
      errors.currentWeight = 'Average weight must be greater than 0';
    }

    if (!batchForm.targetWeight || Number(batchForm.targetWeight) <= 0) {
      errors.targetWeight = 'Target weight must be greater than 0';
    }

    setBatchErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Batch Add
  const handleBatchSubmit = (e) => {
    e.preventDefault();
    if (!validateBatch()) return;

    const count = parseInt(batchForm.pigCount, 10);
    const baseTag = batchForm.baseTagNumber.trim().toUpperCase();

    // Parse tag prefix and numeric portion
    const match = baseTag.match(/^([A-Za-z\-]+)(\d+)$/);
    const prefix = match ? match[1] : 'P-';
    const startNum = match ? parseInt(match[2], 10) : 100;
    const padLength = match ? match[2].length : 4;

    const batchId = generateId();
    const createdPigIds = [];
    const avgWeight = Number(batchForm.currentWeight);
    const targetWeight = Number(batchForm.targetWeight) || 110;
    const determinedStatus = getPigStatusFromWeight(avgWeight, targetWeight);

    // Create pigs
    for (let i = 0; i < count; i++) {
      const pigTag = `${prefix}${String(startNum + i).padStart(padLength, '0')}`;
      const pigId = generateId();
      createdPigIds.push(pigId);

      let gender = batchForm.commonGender;
      if (batchForm.commonGender === 'mixed') {
        gender = i % 2 === 0 ? 'male' : 'female';
      }

      // Slight natural variance in weight +/- 0.5kg
      const weightVariance = Math.round((Math.sin(i) * 0.8) * 10) / 10;
      const individualWeight = Math.max(5, avgWeight + weightVariance);

      const pigData = {
        id: pigId,
        tagNumber: pigTag,
        name: `${batchForm.commonBreed} #${i + 1}`,
        breed: batchForm.commonBreed,
        gender,
        dateOfBirth: batchForm.dateOfBirth,
        weaningDate: batchForm.weaningDate || null,
        currentWeight: individualWeight,
        targetWeight,
        status: determinedStatus,
        batchId,
        purchasePrice: Number(batchForm.purchasePrice) || 0,
        healthStatus: HEALTH_STATUS.HEALTHY,
        notes: batchForm.notes ? `${batchForm.notes} (Pig ${i + 1})` : '',
        weightHistory: [
          {
            date: batchForm.weaningDate || new Date().toISOString().split('T')[0],
            weight: individualWeight,
          },
        ],
        createdAt: new Date().toISOString(),
      };

      addPig(pigData);
    }

    // Estimate target market date (approx 120 days from start)
    const startDate = batchForm.weaningDate || new Date().toISOString().split('T')[0];
    const targetMarketDate = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // Create batch record
    addBatch({
      id: batchId,
      name: batchForm.batchName.trim(),
      pigIds: createdPigIds,
      startDate,
      targetMarketDate,
      notes: batchForm.notes.trim(),
      createdAt: new Date().toISOString(),
    });

    toast.success(
      `Successfully created "${batchForm.batchName}" with ${count} pigs!`
    );
    navigate('/pigs');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary p-2 rounded-lg"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Add Livestock
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Register individual swine or batch intake cohorts into the farm database.
            </p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
          <button
            type="button"
            onClick={() => setActiveTab('single')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md font-medium text-xs transition-all ${
              activeTab === 'single'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Single Pig</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('batch')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md font-medium text-xs transition-all ${
              activeTab === 'batch'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Batch Add</span>
          </button>
        </div>
      </div>

      {/* SINGLE PIG FORM */}
      {activeTab === 'single' && (
        <form onSubmit={handleSingleSubmit} className="card space-y-6">
          <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Individual Pig Information
              </h2>
              <p className="text-xs text-gray-500">
                Enter details for a single pig record
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setSingleForm((prev) => ({ ...prev, tagNumber: suggestedTag }))
              }
              className="text-xs text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Auto-generate Tag
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tag Number */}
            <div>
              <label className="label">
                Tag Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="tagNumber"
                value={singleForm.tagNumber}
                onChange={handleSingleChange}
                placeholder="e.g. P-0015"
                className={`input ${singleErrors.tagNumber ? 'border-red-500 focus:border-red-500' : ''}`}
              />
              {singleErrors.tagNumber && (
                <p className="text-xs text-red-500 mt-1">{singleErrors.tagNumber}</p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="label">
                Pig Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={singleForm.name}
                onChange={handleSingleChange}
                placeholder="e.g. Barnaby"
                className={`input ${singleErrors.name ? 'border-red-500 focus:border-red-500' : ''}`}
              />
              {singleErrors.name && (
                <p className="text-xs text-red-500 mt-1">{singleErrors.name}</p>
              )}
            </div>

            {/* Breed */}
            <div>
              <label className="label">Breed</label>
              <select
                name="breed"
                value={singleForm.breed}
                onChange={handleSingleChange}
                className="select"
              >
                {BREEDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Gender Radio */}
            <div>
              <label className="label">Gender</label>
              <div className="flex items-center gap-6 mt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={singleForm.gender === 'male'}
                    onChange={handleSingleChange}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  <span>Male (Boar / Barrow)</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={singleForm.gender === 'female'}
                    onChange={handleSingleChange}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  <span>Female (Gilt / Sow)</span>
                </label>
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="label">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={singleForm.dateOfBirth}
                onChange={handleSingleChange}
                className={`input ${singleErrors.dateOfBirth ? 'border-red-500' : ''}`}
              />
              {singleErrors.dateOfBirth && (
                <p className="text-xs text-red-500 mt-1">{singleErrors.dateOfBirth}</p>
              )}
            </div>

            {/* Weaning Date */}
            <div>
              <label className="label">Weaning Date</label>
              <input
                type="date"
                name="weaningDate"
                value={singleForm.weaningDate}
                onChange={handleSingleChange}
                className="input"
              />
            </div>

            {/* Current Weight */}
            <div>
              <label className="label">
                Current Weight (kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                name="currentWeight"
                value={singleForm.currentWeight}
                onChange={handleSingleChange}
                className={`input ${singleErrors.currentWeight ? 'border-red-500' : ''}`}
              />
              {singleErrors.currentWeight && (
                <p className="text-xs text-red-500 mt-1">
                  {singleErrors.currentWeight}
                </p>
              )}
            </div>

            {/* Target Weight */}
            <div>
              <label className="label">Target Market Weight (kg)</label>
              <input
                type="number"
                step="0.5"
                min="30"
                name="targetWeight"
                value={singleForm.targetWeight}
                onChange={handleSingleChange}
                className={`input ${singleErrors.targetWeight ? 'border-red-500' : ''}`}
              />
              {singleErrors.targetWeight && (
                <p className="text-xs text-red-500 mt-1">
                  {singleErrors.targetWeight}
                </p>
              )}
            </div>

            {/* Purchase Price */}
            <div>
              <label className="label">Purchase Price ($)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                name="purchasePrice"
                value={singleForm.purchasePrice}
                onChange={handleSingleChange}
                placeholder="0.00"
                className="input"
              />
            </div>

            {/* Health Status */}
            <div>
              <label className="label">Health Status</label>
              <select
                name="healthStatus"
                value={singleForm.healthStatus}
                onChange={handleSingleChange}
                className="select"
              >
                <option value={HEALTH_STATUS.HEALTHY}>Healthy</option>
                <option value={HEALTH_STATUS.SICK}>Sick</option>
                <option value={HEALTH_STATUS.TREATING}>Under Treatment</option>
              </select>
            </div>

            {/* Assign to Batch */}
            <div className="md:col-span-2">
              <label className="label">Assign to Batch (Optional)</label>
              <select
                name="batchId"
                value={singleForm.batchId}
                onChange={handleSingleChange}
                className="select"
              >
                <option value="">None (Individual / Unbatched)</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="label">Notes / Observations</label>
              <textarea
                name="notes"
                rows={3}
                value={singleForm.notes}
                onChange={handleSingleChange}
                placeholder="Pedigree details, vaccinations received, ear notch patterns, pen assignment..."
                className="input resize-none"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Save className="w-4 h-4" />
              <span>Save Pig Record</span>
            </button>
          </div>
        </form>
      )}

      {/* BATCH ADD FORM */}
      {activeTab === 'batch' && (
        <form onSubmit={handleBatchSubmit} className="card space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-semibold text-gray-900">
              Batch Cohort Intake
            </h2>
            <p className="text-xs text-gray-500">
              Create a batch group and quickly generate consecutive pig records
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Batch Name */}
            <div>
              <label className="label">
                Batch Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="batchName"
                value={batchForm.batchName}
                onChange={handleBatchChange}
                placeholder="e.g. Fall 2026 Batch"
                className={`input ${batchErrors.batchName ? 'border-red-500' : ''}`}
              />
              {batchErrors.batchName && (
                <p className="text-xs text-red-500 mt-1">{batchErrors.batchName}</p>
              )}
            </div>

            {/* Number of Pigs */}
            <div>
              <label className="label">
                Number of Pigs (1–100) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="100"
                name="pigCount"
                value={batchForm.pigCount}
                onChange={handleBatchChange}
                className={`input ${batchErrors.pigCount ? 'border-red-500' : ''}`}
              />
              {batchErrors.pigCount && (
                <p className="text-xs text-red-500 mt-1">{batchErrors.pigCount}</p>
              )}
            </div>

            {/* Base Tag Number */}
            <div>
              <label className="label">
                Starting Tag Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="baseTagNumber"
                value={batchForm.baseTagNumber}
                onChange={handleBatchChange}
                placeholder="e.g. P-0020"
                className={`input ${batchErrors.baseTagNumber ? 'border-red-500' : ''}`}
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Tags will auto-increment (e.g. P-0020, P-0021...)
              </p>
              {batchErrors.baseTagNumber && (
                <p className="text-xs text-red-500 mt-1">
                  {batchErrors.baseTagNumber}
                </p>
              )}
            </div>

            {/* Common Breed */}
            <div>
              <label className="label">Common Breed</label>
              <select
                name="commonBreed"
                value={batchForm.commonBreed}
                onChange={handleBatchChange}
                className="select"
              >
                {BREEDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Gender Selection */}
            <div>
              <label className="label">Gender Distribution</label>
              <select
                name="commonGender"
                value={batchForm.commonGender}
                onChange={handleBatchChange}
                className="select"
              >
                <option value="mixed">Mixed (50% Male / 50% Female alternating)</option>
                <option value="male">All Male</option>
                <option value="female">All Female</option>
              </select>
            </div>

            {/* Average Date of Birth */}
            <div>
              <label className="label">Average Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={batchForm.dateOfBirth}
                onChange={handleBatchChange}
                className="input"
              />
            </div>

            {/* Average Weaning Date */}
            <div>
              <label className="label">Average Weaning Date</label>
              <input
                type="date"
                name="weaningDate"
                value={batchForm.weaningDate}
                onChange={handleBatchChange}
                className="input"
              />
            </div>

            {/* Average Weight */}
            <div>
              <label className="label">
                Average Weight per Pig (kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                name="currentWeight"
                value={batchForm.currentWeight}
                onChange={handleBatchChange}
                className={`input ${batchErrors.currentWeight ? 'border-red-500' : ''}`}
              />
              {batchErrors.currentWeight && (
                <p className="text-xs text-red-500 mt-1">
                  {batchErrors.currentWeight}
                </p>
              )}
            </div>

            {/* Target Weight */}
            <div>
              <label className="label">Target Market Weight (kg)</label>
              <input
                type="number"
                step="0.5"
                min="30"
                name="targetWeight"
                value={batchForm.targetWeight}
                onChange={handleBatchChange}
                className="input"
              />
            </div>

            {/* Purchase Price Per Pig */}
            <div>
              <label className="label">Purchase Price Per Pig ($)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                name="purchasePrice"
                value={batchForm.purchasePrice}
                onChange={handleBatchChange}
                className="input"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="label">Batch Notes</label>
              <textarea
                name="notes"
                rows={3}
                value={batchForm.notes}
                onChange={handleBatchChange}
                placeholder="Supplier info, pen allocation, initial feeding strategy..."
                className="input resize-none"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <PlusCircle className="w-4 h-4" />
              <span>Create Batch &amp; Pigs</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default AddPig;
