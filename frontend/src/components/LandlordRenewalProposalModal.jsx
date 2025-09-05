import React, { useState, useEffect } from 'react';

const LandlordRenewalProposalModal = ({
  open,
  onClose,
  onSubmit,
  currentRent = 0,
  currentLeaseEndDate = null,
  submitting = false,
}) => {
  const [proposalType, setProposalType] = useState('same_rent_12m');
  const [customTerm, setCustomTerm] = useState(12);
  const [customRent, setCustomRent] = useState(currentRent);
  const [customRentIncrease, setCustomRentIncrease] = useState(0);
  const [note, setNote] = useState('');

  // Update custom rent when current rent changes
  useEffect(() => {
    setCustomRent(currentRent);
  }, [currentRent]);

  if (!open) return null;

  // Calculate proposal details based on selection
  const getProposalDetails = () => {
    const baseRent = currentRent;
    const increaseAmount = (baseRent * customRentIncrease) / 100;
    const newRent = baseRent + increaseAmount;

    switch (proposalType) {
      case 'same_rent_12m':
        return {
          termMonths: 12,
          monthlyRent: baseRent,
          startDate: currentLeaseEndDate ? new Date(currentLeaseEndDate.getTime() + 24 * 60 * 60 * 1000) : null,
          endDate: currentLeaseEndDate ? new Date(currentLeaseEndDate.getTime() + 365 * 24 * 60 * 60 * 1000) : null,
        };
      case 'increase_5pct_12m':
        return {
          termMonths: 12,
          monthlyRent: Math.round(baseRent * 1.05),
          startDate: currentLeaseEndDate ? new Date(currentLeaseEndDate.getTime() + 24 * 60 * 60 * 1000) : null,
          endDate: currentLeaseEndDate ? new Date(currentLeaseEndDate.getTime() + 365 * 24 * 60 * 60 * 1000) : null,
        };
      case 'same_rent_6m':
        return {
          termMonths: 6,
          monthlyRent: baseRent,
          startDate: currentLeaseEndDate ? new Date(currentLeaseEndDate.getTime() + 24 * 60 * 60 * 1000) : null,
          endDate: currentLeaseEndDate ? new Date(currentLeaseEndDate.getTime() + 183 * 24 * 60 * 60 * 1000) : null,
        };
      case 'custom':
        const increase = (baseRent * customRentIncrease) / 100;
        const rent = baseRent + increase;
        const startDate = currentLeaseEndDate ? new Date(currentLeaseEndDate.getTime() + 24 * 60 * 60 * 1000) : null;
        const endDate = startDate ? new Date(startDate.getTime() + customTerm * 30 * 24 * 60 * 60 * 1000) : null;
        return {
          termMonths: customTerm,
          monthlyRent: Math.round(rent),
          startDate,
          endDate,
        };
      default:
        return {
          termMonths: 12,
          monthlyRent: baseRent,
          startDate: null,
          endDate: null,
        };
    }
  };

  const proposal = getProposalDetails();

  const handleSubmit = () => {
    onSubmit({
      proposedTermMonths: proposal.termMonths,
      proposedMonthlyRent: proposal.monthlyRent,
      proposedStartDate: proposal.startDate?.toISOString(),
      note: note || '',
    });
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg w-full max-w-2xl shadow-lg'>
        <div className='px-6 py-4 border-b'>
          <h3 className='text-lg font-semibold text-gray-900'>
            Propose Renewal Terms
          </h3>
          <p className='text-sm text-gray-600 mt-1'>
            Set the renewal terms for your tenant. They can accept or decline your proposal.
          </p>
        </div>
        
        <div className='px-6 py-4 space-y-6'>
          {/* Quick Presets */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-3'>
              Quick Presets
            </label>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
              <button
                type='button'
                onClick={() => setProposalType('same_rent_12m')}
                className={`p-3 text-left border rounded-lg transition-colors ${
                  proposalType === 'same_rent_12m'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className='font-medium text-sm'>12 months</div>
                <div className='text-xs text-gray-600'>Same rent ({currentRent} zł)</div>
              </button>
              
              <button
                type='button'
                onClick={() => setProposalType('increase_5pct_12m')}
                className={`p-3 text-left border rounded-lg transition-colors ${
                  proposalType === 'increase_5pct_12m'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className='font-medium text-sm'>12 months</div>
                <div className='text-xs text-gray-600'>+5% increase ({Math.round(currentRent * 1.05)} zł)</div>
              </button>
              
              <button
                type='button'
                onClick={() => setProposalType('same_rent_6m')}
                className={`p-3 text-left border rounded-lg transition-colors ${
                  proposalType === 'same_rent_6m'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className='font-medium text-sm'>6 months</div>
                <div className='text-xs text-gray-600'>Same rent ({currentRent} zł)</div>
              </button>
            </div>
            
            <button
              type='button'
              onClick={() => setProposalType('custom')}
              className={`mt-3 w-full p-3 text-left border rounded-lg transition-colors ${
                proposalType === 'custom'
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className='font-medium text-sm'>Custom Terms</div>
              <div className='text-xs text-gray-600'>Set your own terms and rent</div>
            </button>
          </div>

          {/* Custom Terms (shown when custom is selected) */}
          {proposalType === 'custom' && (
            <div className='space-y-4 p-4 bg-gray-50 rounded-lg'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Term (months)
                  </label>
                  <input
                    type='number'
                    min={1}
                    max={24}
                    value={customTerm}
                    onChange={(e) => setCustomTerm(Number(e.target.value))}
                    className='w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Rent Increase (%)
                  </label>
                  <input
                    type='number'
                    min={0}
                    max={50}
                    step={0.5}
                    value={customRentIncrease}
                    onChange={(e) => setCustomRentIncrease(Number(e.target.value))}
                    className='w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none'
                  />
                </div>
              </div>
            </div>
          )}

          {/* Proposal Preview */}
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <h4 className='font-medium text-blue-900 mb-2'>Proposal Preview</h4>
            <div className='space-y-1 text-sm text-blue-800'>
              <div><strong>Term:</strong> {proposal.termMonths} months</div>
              <div><strong>Monthly Rent:</strong> {proposal.monthlyRent} zł</div>
              {proposal.startDate && (
                <div><strong>Start Date:</strong> {proposal.startDate.toLocaleDateString()}</div>
              )}
              {proposal.endDate && (
                <div><strong>End Date:</strong> {proposal.endDate.toLocaleDateString()}</div>
              )}
              {proposal.monthlyRent !== currentRent && (
                <div className='text-blue-600'>
                  <strong>Change:</strong> {proposal.monthlyRent > currentRent ? '+' : ''}
                  {proposal.monthlyRent - currentRent} zł/month
                </div>
              )}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Message to Tenant (optional)
            </label>
            <textarea
              className='w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none'
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any additional information for your tenant..."
            />
          </div>
        </div>

        <div className='px-6 py-4 border-t flex items-center justify-end space-x-3'>
          <button
            onClick={onClose}
            className='px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200'
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className='px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60'
            disabled={submitting}
          >
            {submitting ? 'Sending Proposal...' : 'Send Proposal'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandlordRenewalProposalModal;
