import React, { useState, useEffect } from 'react';

const SendOfferModal = ({ request, offerForm, setOfferForm, onClose, onSubmit }) => {
  const [totalCost, setTotalCost] = useState(0);

  // Debug logging for availableFrom date
  useEffect(() => {
    console.log('SendOfferModal - offerForm.availableFrom:', offerForm.availableFrom);
    console.log('SendOfferModal - request.moveInDate:', request.moveInDate);
  }, [offerForm.availableFrom, request.moveInDate]);

  useEffect(() => {
    const rent = parseInt(offerForm.monthlyRent) || 0;
    const deposit = parseInt(offerForm.securityDeposit) || 0;
    
    // Calculate pro-rated first month rent using Polish rental logic (30 days per month)
    let firstMonthRent = rent;
    let proRatedCalculation = null;
    
    if (offerForm.availableFrom && rent > 0) {
      const moveInDate = new Date(offerForm.availableFrom);
      const moveInDay = moveInDate.getDate();
      const daysInMonth = 30; // Polish rental standard
      const daysOccupied = daysInMonth - moveInDay + 1;
      
      // Only pro-rate if not moving in on the 1st
      if (moveInDay > 1) {
        firstMonthRent = (rent / daysInMonth) * daysOccupied;
        proRatedCalculation = {
          daysOccupied,
          daysInMonth,
          originalRent: rent,
          proRatedRent: firstMonthRent
        };
      }
    }
    
    const total = firstMonthRent + deposit;
    setTotalCost(total);
    
    // Update offerForm with calculated values
    setOfferForm(prev => ({
      ...prev,
      firstMonthRent: firstMonthRent,
      proRatedCalculation: proRatedCalculation
    }));
  }, [offerForm.monthlyRent, offerForm.securityDeposit, offerForm.availableFrom]);

  const handleInputChange = (field, value) => {
    setOfferForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Send Offer to {request.tenant.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Instructions */}
          <div className="text-sm text-gray-600">
            Configure your rental offer terms and conditions for this tenant.
          </div>

          {/* Financial Terms Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Financial Terms</h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                Tenant's budget: {request.budgetRange.max.toLocaleString('pl-PL')} zł. You can adjust your offer within reasonable range.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Rent (PLN)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={offerForm.monthlyRent}
                    onChange={(e) => handleInputChange('monthlyRent', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="3200"
                    min="0"
                    step="100"
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-1">
                    <button
                      type="button"
                      onClick={() => handleInputChange('monthlyRent', (parseInt(offerForm.monthlyRent) || 0) + 100)}
                      className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center text-gray-600"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('monthlyRent', Math.max(0, (parseInt(offerForm.monthlyRent) || 0) - 100))}
                      className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center text-gray-600"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Security Deposit (PLN)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={offerForm.securityDeposit}
                    onChange={(e) => handleInputChange('securityDeposit', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="3200"
                    min="0"
                    step="100"
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-1">
                    <button
                      type="button"
                      onClick={() => handleInputChange('securityDeposit', (parseInt(offerForm.securityDeposit) || 0) + 100)}
                      className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center text-gray-600"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('securityDeposit', Math.max(0, (parseInt(offerForm.securityDeposit) || 0) - 100))}
                      className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center text-gray-600"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>
            </div>

            

            {/* First Month Calculation */}
            {offerForm.proRatedCalculation && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">First Month Pro-rating</h4>
                <div className="text-xs text-yellow-700 space-y-1">
                  <p>Move-in date: {new Date(offerForm.availableFrom).toLocaleDateString()}</p>
                  <p>Days occupied: {offerForm.proRatedCalculation.daysOccupied} out of {offerForm.proRatedCalculation.daysInMonth}</p>
                  <p>Calculation: {offerForm.proRatedCalculation.daysOccupied}/{offerForm.proRatedCalculation.daysInMonth} × {offerForm.proRatedCalculation.originalRent.toLocaleString('pl-PL')} zł</p>
                  <p className="font-medium">First month rent: {offerForm.proRatedCalculation.proRatedRent.toFixed(2)} zł</p>
                </div>
              </div>
            )}

            {/* Total Initial Cost */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-800">Total Initial Cost</span>
                <span className="text-2xl font-bold text-green-600">
                  {totalCost.toFixed(2)} zł
                </span>
              </div>
              <div className="text-sm text-green-700 mt-2 space-y-1">
                <p>• First month rent: {offerForm.firstMonthRent ? offerForm.firstMonthRent.toFixed(2) : '0'} zł</p>
                <p>• Security deposit: {offerForm.securityDeposit ? parseFloat(offerForm.securityDeposit).toFixed(2) : '0'} zł</p>
              </div>
              <p className="text-sm text-green-700 mt-2">
                This is what the tenant will need to pay upfront to secure the property.
              </p>
            </div>
          </div>

          {/* Lease Terms Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Lease Terms</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Available From
                </label>
                <input
                  type="date"
                  value={offerForm.availableFrom}
                  onChange={(e) => handleInputChange('availableFrom', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                {request.moveInDate && (
                  <div className="text-xs text-gray-600 mt-1 space-y-1">
                    <p>Selected: {offerForm.availableFrom}</p>
                    <p>Tenant expects: {new Date(request.moveInDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}</p>
                    {offerForm.availableFrom && request.moveInDate && (
                      <p className={`font-medium ${
                        new Date(offerForm.availableFrom) <= new Date(request.moveInDate) 
                          ? 'text-green-600' 
                          : 'text-orange-600'
                      }`}>
                        {new Date(offerForm.availableFrom) <= new Date(request.moveInDate) 
                          ? '✅ Available on time' 
                          : '⚠️ Available after tenant expects'}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lease Duration
                </label>
                                 <select
                   value={offerForm.leaseDuration}
                   onChange={(e) => handleInputChange('leaseDuration', e.target.value)}
                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   required
                 >
                   <option value="1">1 month</option>
                   <option value="2">2 months</option>
                   <option value="3">3 months</option>
                   <option value="4">4 months</option>
                   <option value="5">5 months</option>
                   <option value="6">6 months</option>
                   <option value="7">7 months</option>
                   <option value="8">8 months</option>
                   <option value="9">9 months</option>
                   <option value="10">10 months</option>
                   <option value="11">11 months</option>
                   <option value="12">12 months</option>
                 </select>
              </div>
            </div>
          </div>

          {/* Additional Terms & Conditions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Additional Terms & Conditions</h3>
            
            <div>
              <textarea
                value={offerForm.additionalTerms}
                onChange={(e) => handleInputChange('additionalTerms', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
                placeholder="e.g., Pets allowed (small dogs/cats), No smoking, Utilities included (water, heating), Internet included"
              />
              <p className="text-sm text-gray-600 mt-2">
                Include any specific conditions, allowed pets, utility inclusions, or property rules.
              </p>
            </div>

                         
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send Offer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendOfferModal; 