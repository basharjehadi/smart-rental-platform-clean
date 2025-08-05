import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Step1PropertyInfo from '../components/Step1PropertyInfo';
import Step2Location from '../components/Step2Location';
import Step3Media from '../components/Step3Media';

const LandlordAddProperty = () => {
  const { user, logout } = useAuth();
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
    'room'
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
    'Elevator'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
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
    }
    
    if (step === 2) {
      if (!formData.street.trim()) newErrors.street = 'Street is required';
      if (!formData.houseNumber.trim()) newErrors.houseNumber = 'House number is required';
      if (!formData.postcode.trim()) newErrors.postcode = 'Postcode is required';
      if (!formData.district.trim()) newErrors.district = 'District is required';
      if (!formData.city) newErrors.city = 'City is required';
    }
    
    if (step === 3) {
      if (!formData.virtualTourVideo) newErrors.virtualTourVideo = 'Virtual tour video is required';
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
    if (!validateStep(3)) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Create FormData for file upload
      const submitData = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'virtualTourVideo' && formData[key]) {
          submitData.append('virtualTourVideo', formData[key]);
        } else if (key === 'propertyPhotos') {
          formData[key].forEach((photo, index) => {
            submitData.append(`propertyPhotos`, photo);
          });
        } else if (key === 'amenities') {
          submitData.append('amenities', JSON.stringify(formData[key]));
        } else {
          submitData.append(key, formData[key]);
        }
      });
      
      const response = await axios.post('/api/properties', submitData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        navigate('/landlord-my-property');
      }
    } catch (error) {
      console.error('Error creating property:', error);
      setErrors({ submit: 'Failed to create property. Please try again.' });
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">RentPlatform Poland</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <button
              onClick={() => navigate('/landlord-dashboard')}
              className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg w-full text-left"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Dashboard
            </button>
            
            <button
              onClick={() => navigate('/landlord-profile')}
              className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg w-full text-left"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              My Profile
            </button>
            
            <button
              onClick={() => navigate('/landlord-my-property')}
              className="flex items-center px-4 py-3 text-sm font-medium text-white bg-black rounded-lg w-full text-left"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              My Property
            </button>
            
            <button
              onClick={() => navigate('/requests')}
              className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg w-full text-left"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Requests
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h1 className="text-2xl font-bold text-gray-900">Add Property</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user?.name || 'Landlord'}</span>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center text-sm text-gray-600 hover:text-gray-900"
              >
                <span>Log out</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Form Content */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">List New Property</h1>
                  <p className="text-gray-600">Create an attractive listing to find quality tenants faster.</p>
                </div>
                <button
                  onClick={() => navigate('/landlord-my-property')}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
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
                    className="bg-black h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
                
                {/* Step Indicators */}
                <div className="flex justify-between mt-4">
                  <div className={`flex flex-col items-center ${currentStep >= 1 ? 'text-black' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${currentStep >= 1 ? 'bg-black text-white' : 'bg-gray-200'}`}>
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
                  
                  <div className={`flex flex-col items-center ${currentStep >= 2 ? 'text-black' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${currentStep >= 2 ? 'bg-black text-white' : 'bg-gray-200'}`}>
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
                  
                  <div className={`flex flex-col items-center ${currentStep >= 3 ? 'text-black' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${currentStep >= 3 ? 'bg-black text-white' : 'bg-gray-200'}`}>
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
                  className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                
                {currentStep < 3 ? (
                  <button
                    onClick={nextStep}
                    className="flex items-center px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                  >
                    Next
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? (
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    List Property
                  </button>
                )}
              </div>

              {errors.submit && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600">{errors.submit}</p>
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