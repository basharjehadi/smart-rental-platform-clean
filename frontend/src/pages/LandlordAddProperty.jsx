import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Step1PropertyInfo from '../components/Step1PropertyInfo';
import Step2Location from '../components/Step2Location';
import Step3Media from '../components/Step3Media';
import LandlordSidebar from '../components/LandlordSidebar';

const LandlordAddProperty = () => {
  const { user, logout, api } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Property Info
    title: '',
    propertyType: '',
    monthlyRent: '',
    rooms: '',
    bathrooms: '',
    area: '',
    floor: '',
    buildingFloors: '',
    furnishing: '',
    parkingAvailable: false,
    petsAllowed: false,
    smokingAllowed: false,
    availableFrom: '', // When property is available for rent
    description: '',
    amenities: [],
    
    // Step 2: Location
    street: '',
    houseNumber: '',
    apartmentNumber: '',
    postcode: '',
    district: '',
    city: '',
    
    // Step 3: Media
    virtualTourVideo: null,
    propertyPhotos: []
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const propertyTypes = [
    'apartment',
    'house', 
    'studio',
    'room',
    'shared room'
  ];

  const furnishingOptions = [
    'furnished',
    'semi-furnished',
    'unfurnished'
  ];

  const cities = [
    'Warsaw',
    'Krakow',
    'Poznan',
    'Wroclaw',
    'Gdansk',
    'Lodz',
    'Szczecin',
    'Bydgoszcz',
    'Lublin',
    'Katowice'
  ];

  const suggestedAmenities = [
    'Balcony',
    'Internet',
    'Washing Machine', 
    'Dishwasher',
    'Air Conditioning',
    'Elevator',
    'Heating',
    'Garden',
    'Terrace',
    'Parking',
    'Security System',
    'Intercom',
    'Furnished',
    'Pet Friendly',
    'Bike Storage',
    'Gym',
    'Swimming Pool',
    'Sauna',
    'Playground',
    'BBQ Area',
    'Storage Room',
    'Wardrobe',
    'Built-in Wardrobe',
    'Hardwood Floors',
    'Carpeted Floors',
    'High Ceilings',
    'Large Windows',
    'South Facing',
    'Quiet Location',
    'Near Public Transport',
    'Near Shopping Center',
    'Near Park',
    'Near School',
    'Near Hospital',
    'Near Restaurant',
    'Near Bank',
    'Near Pharmacy',
    'Near Gym',
    'Near Library',
    'Near Post Office'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-set room number to 1 for specific property types
    if (field === 'propertyType') {
      const singleRoomTypes = ['room', 'shared room', 'studio'];
      if (singleRoomTypes.includes(value.toLowerCase())) {
        setFormData(prev => ({
          ...prev,
          rooms: '1'
        }));
      }
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleAmenityToggle = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleFileUpload = (field, files) => {
    if (field === 'virtualTourVideo') {
      setFormData(prev => ({
        ...prev,
        virtualTourVideo: files[0] || null
      }));
    } else if (field === 'propertyPhotos') {
      const photoFiles = Array.from(files).slice(0, 12); // Max 12 photos
      setFormData(prev => ({
        ...prev,
        propertyPhotos: photoFiles
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = 'Property title is required';
      if (!formData.propertyType) newErrors.propertyType = 'Property type is required';
      if (!formData.monthlyRent) newErrors.monthlyRent = 'Monthly rent is required';
      if (isNaN(formData.monthlyRent) || formData.monthlyRent <= 0) {
        newErrors.monthlyRent = 'Please enter a valid rent amount';
      }
      if (!formData.availableFrom) newErrors.availableFrom = 'Available from date is required';
    }
    
    if (step === 2) {
      if (!formData.street.trim()) newErrors.street = 'Street is required';
      if (!formData.houseNumber.trim()) newErrors.houseNumber = 'House number is required';
      if (!formData.postcode.trim()) newErrors.postcode = 'Postcode is required';
      if (!formData.district.trim()) newErrors.district = 'District is required';
      if (!formData.city) newErrors.city = 'City is required';
    }
    
    if (step === 3) {
      if (!formData.virtualTourVideo) {
        newErrors.virtualTourVideo = 'Virtual tour video is required';
      }
      if (!formData.propertyPhotos || formData.propertyPhotos.length === 0) {
        newErrors.propertyPhotos = 'At least one property photo is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrors({});

    try {
      // Validate current step
      if (!validateStep(currentStep)) {
        setLoading(false);
        return;
      }

      // If this is the last step, submit the form
      if (currentStep === 3) {
        const submitData = new FormData();
      
        // Map frontend fields to backend expected fields
        submitData.append('name', formData.title); // title -> name
        submitData.append('address', `${formData.street} ${formData.houseNumber}${formData.apartmentNumber ? `/${formData.apartmentNumber}` : ''}`); // Combine address
        submitData.append('city', formData.city);
        submitData.append('district', formData.district); // Add district field
        submitData.append('zipCode', formData.postcode); // postcode -> zipCode
        submitData.append('propertyType', formData.propertyType);
        submitData.append('bedrooms', formData.rooms || ''); // rooms -> bedrooms
        submitData.append('bathrooms', formData.bathrooms || '');
        submitData.append('size', formData.area || ''); // area -> size
        submitData.append('floor', formData.floor || '');
        submitData.append('totalFloors', formData.buildingFloors || ''); // buildingFloors -> totalFloors
        submitData.append('monthlyRent', formData.monthlyRent);
        submitData.append('availableFrom', formData.availableFrom); // When property is available
        submitData.append('furnished', formData.furnishing === 'furnished'); // Convert to boolean
        submitData.append('parking', formData.parkingAvailable); // Convert to boolean
        submitData.append('petsAllowed', formData.petsAllowed); // Convert to boolean
        submitData.append('smokingAllowed', formData.smokingAllowed); // Convert to boolean
        submitData.append('utilitiesIncluded', false); // Default value
        submitData.append('description', formData.description || '');
        
        // Handle amenities (send as houseRules)
        if (formData.amenities && formData.amenities.length > 0) {
          submitData.append('houseRules', JSON.stringify(formData.amenities));
        } else {
          submitData.append('houseRules', '[]'); // Send empty array if no amenities selected
        }
        
        // Handle files
        if (formData.virtualTourVideo) {
          submitData.append('propertyVideo', formData.virtualTourVideo);
        }
        
        if (formData.propertyPhotos && formData.propertyPhotos.length > 0) {
          formData.propertyPhotos.forEach((photo, index) => {
            submitData.append('propertyImages', photo);
          });
        }
        
        console.log('Submitting property data:', {
          name: formData.title,
          address: `${formData.street} ${formData.houseNumber}${formData.apartmentNumber ? `/${formData.apartmentNumber}` : ''}`,
          city: formData.city,
          district: formData.district,
          zipCode: formData.postcode,
          propertyType: formData.propertyType,
          bedrooms: formData.rooms,
          bathrooms: formData.bathrooms,
          size: formData.area,
          floor: formData.floor,
          totalFloors: formData.buildingFloors,
          monthlyRent: formData.monthlyRent,
          availableFrom: formData.availableFrom,
          furnished: formData.furnishing === 'furnished',
          parking: formData.parkingAvailable,
          petsAllowed: formData.petsAllowed,
          smokingAllowed: formData.smokingAllowed,
          description: formData.description,
          hasVideo: !!formData.virtualTourVideo,
          photoCount: formData.propertyPhotos?.length || 0
        });

        // Log FormData contents for debugging
        console.log('FormData contents:');
        for (let [key, value] of submitData.entries()) {
          console.log(`${key}:`, value);
        }
        
        // Send FormData without manually setting Content-Type so the browser adds the boundary
        const response = await api.post('/properties', submitData);
        
        if (response.data.success) {
          navigate('/landlord-my-property');
        }
      }
    } catch (error) {
      console.error('Error creating property:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to create property. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid data provided. Please check your form inputs.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to create properties.';
      } else if (error.response?.status === 413) {
        errorMessage = 'File size too large. Please use smaller files.';
      }
      
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getProgressPercentage = () => {
    return (currentStep / 3) * 100;
  };

  return (
    <div className="min-h-screen bg-primary flex">
      <LandlordSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Add Property</h1>
              <p className="text-gray-600 text-sm">Create a new property listing</p>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Form Content */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="card-modern p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">List New Property</h2>
                  <p className="text-gray-600 text-sm">Create an attractive listing to find quality tenants faster.</p>
                </div>
                <button
                  onClick={() => navigate('/landlord-my-property')}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Step {currentStep} of 3</span>
                  <span className="text-sm text-gray-500">{Math.round(getProgressPercentage())}% Complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
                
                {/* Step Indicators */}
                <div className="flex justify-between mt-4">
                  <div className={`flex flex-col items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                      {currentStep > 1 ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs font-medium">Property Info</span>
                    <span className="text-xs text-gray-500">Details & features</span>
                  </div>
                  
                  <div className={`flex flex-col items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                      {currentStep > 2 ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs font-medium">Location</span>
                    <span className="text-xs text-gray-500">Address & area</span>
                  </div>
                  
                  <div className={`flex flex-col items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium">Media</span>
                    <span className="text-xs text-gray-500">Photos & videos</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step Content */}
            <div className="card-modern p-6">
              {currentStep === 1 && (
                <Step1PropertyInfo 
                  formData={formData}
                  errors={errors}
                  propertyTypes={propertyTypes}
                  furnishingOptions={furnishingOptions}
                  suggestedAmenities={suggestedAmenities}
                  onInputChange={handleInputChange}
                  onAmenityToggle={handleAmenityToggle}
                />
              )}
              
              {currentStep === 2 && (
                <Step2Location 
                  formData={formData}
                  errors={errors}
                  cities={cities}
                  onInputChange={handleInputChange}
                />
              )}
              
              {currentStep === 3 && (
                <Step3Media 
                  formData={formData}
                  errors={errors}
                  onFileUpload={handleFileUpload}
                />
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Previous</span>
                </button>
                
                {currentStep < 3 ? (
                  <button
                    onClick={nextStep}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <span>Next</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="btn-success flex items-center space-x-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    <span>List Property</span>
                  </button>
                )}
              </div>

              {errors.submit && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{errors.submit}</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LandlordAddProperty; 