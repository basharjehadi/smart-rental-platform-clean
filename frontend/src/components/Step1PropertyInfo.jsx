const Step1PropertyInfo = ({ 
  formData, 
  errors, 
  propertyTypes, 
  furnishingOptions, 
  suggestedAmenities, 
  onInputChange, 
  onAmenityToggle 
}) => {
  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Property details & features</h2>
        <p className="text-gray-600">Tell us about your property and what makes it special.</p>
      </div>

      {/* Basic Information */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Property Title */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => onInputChange('title', e.target.value)}
              placeholder="e.g. Beautiful 2-room apartment in city center"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          {/* Property Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Type *
            </label>
            <select
              value={formData.propertyType}
              onChange={(e) => onInputChange('propertyType', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.propertyType ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select property type</option>
              {propertyTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
            {errors.propertyType && <p className="mt-1 text-sm text-red-600">{errors.propertyType}</p>}
          </div>

          {/* Monthly Rent */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              $ Monthly Rent (PLN) *
            </label>
            <input
              type="number"
              value={formData.monthlyRent}
              onChange={(e) => onInputChange('monthlyRent', e.target.value)}
              placeholder="3500"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.monthlyRent ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.monthlyRent && <p className="mt-1 text-sm text-red-600">{errors.monthlyRent}</p>}
          </div>
        </div>
      </div>

      {/* Specifications */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Specifications</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Number of Rooms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Rooms
            </label>
            <div className="relative">
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
              </svg>
              <input
                type="number"
                value={formData.rooms}
                onChange={(e) => onInputChange('rooms', e.target.value)}
                placeholder="2"
                disabled={['room', 'shared room', 'studio'].includes(formData.propertyType.toLowerCase())}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  ['room', 'shared room', 'studio'].includes(formData.propertyType.toLowerCase()) 
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                    : 'border-gray-300'
                }`}
              />
            </div>
            {['room', 'shared room', 'studio'].includes(formData.propertyType.toLowerCase()) && (
              <p className="mt-1 text-sm text-blue-600">
                ✓ Automatically set to 1 for {formData.propertyType} properties
              </p>
            )}
          </div>

          {/* Bathrooms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bathrooms
            </label>
            <div className="relative">
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
              <input
                type="number"
                value={formData.bathrooms}
                onChange={(e) => onInputChange('bathrooms', e.target.value)}
                placeholder="1"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Area (m²)
            </label>
            <div className="relative">
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <input
                type="number"
                value={formData.area}
                onChange={(e) => onInputChange('area', e.target.value)}
                placeholder="65"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Floor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Floor
            </label>
            <div className="relative">
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <input
                type="number"
                value={formData.floor}
                onChange={(e) => onInputChange('floor', e.target.value)}
                placeholder="3"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Building Floors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Building Floors
            </label>
            <div className="relative">
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <input
                type="number"
                value={formData.buildingFloors}
                onChange={(e) => onInputChange('buildingFloors', e.target.value)}
                placeholder="5"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Features */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Additional Features</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Furnishing */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Furnishing
            </label>
            <select
              value={formData.furnishing}
              onChange={(e) => onInputChange('furnishing', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select option</option>
              {furnishingOptions.map(option => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Available From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available From *
            </label>
            <div className="relative">
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <input
                type="date"
                value={formData.availableFrom}
                onChange={(e) => onInputChange('availableFrom', e.target.value)}
                min={new Date().toISOString().split('T')[0]} // Cannot select past dates
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.availableFrom ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.availableFrom && <p className="mt-1 text-sm text-red-600">{errors.availableFrom}</p>}
            <p className="mt-1 text-sm text-gray-500">When is this property available for tenants to move in?</p>
          </div>

          {/* Parking Space Available */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="parkingAvailable"
              checked={formData.parkingAvailable}
              onChange={(e) => onInputChange('parkingAvailable', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="parkingAvailable" className="ml-2 text-sm font-medium text-gray-700 flex items-center">
              <svg className="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
              Parking Space Available
            </label>
          </div>

          {/* Pets Allowed */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="petsAllowed"
              checked={formData.petsAllowed}
              onChange={(e) => onInputChange('petsAllowed', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="petsAllowed" className="ml-2 text-sm font-medium text-gray-700 flex items-center">
              <svg className="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Pets Allowed
            </label>
          </div>

          {/* Smoking Allowed */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="smokingAllowed"
              checked={formData.smokingAllowed}
              onChange={(e) => onInputChange('smokingAllowed', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="smokingAllowed" className="ml-2 text-sm font-medium text-gray-700 flex items-center">
              <svg className="w-4 h-4 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
              </svg>
              Smoking Allowed
            </label>
          </div>
        </div>
      </div>

      {/* Property Description */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Property Description</h3>
        </div>
        
        <textarea
          value={formData.description}
          onChange={(e) => onInputChange('description', e.target.value)}
          placeholder="Describe your property, location highlights, nearby amenities, transportation links..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Amenities */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Amenities</h3>
          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            {formData.amenities.length} selected
          </span>
        </div>

        {/* Selected Amenities Display */}
        {formData.amenities.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Selected Amenities:</h4>
            <div className="flex flex-wrap gap-2">
              {formData.amenities.map(amenity => (
                <div
                  key={amenity}
                  className="inline-flex items-center px-3 py-2 bg-blue-100 border border-blue-200 rounded-lg text-sm font-medium text-blue-800"
                >
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {amenity}
                  <button
                    type="button"
                    onClick={() => onAmenityToggle(amenity)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Amenities Categories */}
        <div className="space-y-6">
          {/* Basic Amenities */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Basic Amenities
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {suggestedAmenities.filter(amenity => 
                ['Balcony', 'Internet', 'Washing Machine', 'Dishwasher', 'Air Conditioning', 'Elevator', 'Heating', 'Garden', 'Terrace', 'Parking', 'Security System', 'Intercom', 'Furnished', 'Pet Friendly', 'Bike Storage'].includes(amenity)
              ).map(amenity => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => onAmenityToggle(amenity)}
                  className={`flex items-center px-3 py-2 border-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    formData.amenities.includes(amenity)
                      ? 'bg-blue-500 border-blue-500 text-white shadow-lg transform scale-105'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  {formData.amenities.includes(amenity) ? (
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  )}
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          {/* Premium Amenities */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Premium Amenities
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {suggestedAmenities.filter(amenity => 
                ['Gym', 'Swimming Pool', 'Sauna', 'Playground', 'BBQ Area', 'Storage Room', 'Wardrobe', 'Built-in Wardrobe'].includes(amenity)
              ).map(amenity => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => onAmenityToggle(amenity)}
                  className={`flex items-center px-3 py-2 border-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    formData.amenities.includes(amenity)
                      ? 'bg-purple-500 border-purple-500 text-white shadow-lg transform scale-105'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  {formData.amenities.includes(amenity) ? (
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  )}
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          {/* Property Features */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Property Features
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {suggestedAmenities.filter(amenity => 
                ['Hardwood Floors', 'Carpeted Floors', 'High Ceilings', 'Large Windows', 'South Facing', 'Quiet Location'].includes(amenity)
              ).map(amenity => (
            <button
              key={amenity}
              type="button"
              onClick={() => onAmenityToggle(amenity)}
                  className={`flex items-center px-3 py-2 border-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                formData.amenities.includes(amenity)
                      ? 'bg-green-500 border-green-500 text-white shadow-lg transform scale-105'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
                  {formData.amenities.includes(amenity) ? (
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  )}
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          {/* Nearby Locations */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Nearby Locations
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {suggestedAmenities.filter(amenity => 
                amenity.startsWith('Near ')
              ).map(amenity => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => onAmenityToggle(amenity)}
                  className={`flex items-center px-3 py-2 border-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    formData.amenities.includes(amenity)
                      ? 'bg-orange-500 border-orange-500 text-white shadow-lg transform scale-105'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                >
                  {formData.amenities.includes(amenity) ? (
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  )}
              {amenity}
            </button>
          ))}
            </div>
          </div>
        </div>
        
        {/* Help Text */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Tip:</strong> Select amenities that accurately describe your property. This helps tenants find properties that match their needs and can increase your property's visibility.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Step1PropertyInfo; 