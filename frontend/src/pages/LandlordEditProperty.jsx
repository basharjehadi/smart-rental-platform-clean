import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Step1PropertyInfo from '../components/Step1PropertyInfo';
import Step2Location from '../components/Step2Location';
import Step3Media from '../components/Step3Media';
import LandlordSidebar from '../components/LandlordSidebar';

const LandlordEditProperty = () => {
  const { user, logout, api } = useAuth();
  const navigate = useNavigate();
  const { propertyId } = useParams();
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
  const [fetching, setFetching] = useState(true);

  // Convert relative URLs to absolute URLs (same as PropertyCard)
  const getAbsoluteUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url; // Already absolute
    if (url.startsWith('/')) return `http://localhost:3001${url}`; // Add server URL
    return `http://localhost:3001/${url}`; // Add server URL and leading slash
  };

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

  useEffect(() => {
    fetchProperty();
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      setFetching(true);
      const response = await api.get(`/properties/${propertyId}`);

      if (response.data.success) {
        const property = response.data.property;
        console.log('📋 Received property data:', property);
        
        // Parse address into separate components
        let street = '';
        let houseNumber = '';
        let apartmentNumber = '';
        
        if (property.address) {
          // Try to parse address like "Street Name 123/45" or "Street Name 123"
          const addressParts = property.address.trim().split(' ');
          
          if (addressParts.length >= 2) {
            const lastPart = addressParts[addressParts.length - 1];
            
            // Check if last part contains house number and apartment (e.g., "123/45")
            if (lastPart.includes('/')) {
              const [house, apartment] = lastPart.split('/');
              if (!isNaN(house) && !isNaN(apartment)) {
                houseNumber = house;
                apartmentNumber = apartment;
                street = addressParts.slice(0, -1).join(' ');
              } else {
                // If not numeric, treat as street name
                street = property.address;
              }
            } else if (!isNaN(lastPart)) {
              // Last part is just a house number
              houseNumber = lastPart;
              street = addressParts.slice(0, -1).join(' ');
            } else {
              // No clear house number pattern, use full address as street
              street = property.address;
            }
          } else {
            street = property.address;
          }
        }

        // Parse existing amenities (stored in houseRules field)
        let existingAmenities = [];
        try {
          if (property.houseRules) {
            existingAmenities = typeof property.houseRules === 'string' 
              ? JSON.parse(property.houseRules) 
              : property.houseRules;
            console.log('🏠 Parsed amenities from houseRules:', existingAmenities);
          }
        } catch (error) {
          console.error('Error parsing amenities from houseRules:', error);
          existingAmenities = [];
        }

        // Parse existing images
        let existingImages = [];
        try {
          if (property.images) {
            const imageUrls = typeof property.images === 'string' 
              ? JSON.parse(property.images) 
              : property.images;
            existingImages = imageUrls.map(url => ({
              name: url.split('/').pop(),
              url: getAbsoluteUrl(url),
              size: 0 // We don't have file size for existing images
            }));
          }
        } catch (error) {
          console.error('Error parsing images:', error);
          existingImages = [];
        }
        console.log('📸 Parsed images:', existingImages);
        console.log('📸 Image URLs:', existingImages.map(img => img.url));

        // Parse existing videos
        let existingVideo = null;
        try {
          if (property.videos) {
            const videoUrls = typeof property.videos === 'string' 
              ? JSON.parse(property.videos) 
              : property.videos;
            if (videoUrls.length > 0) {
              existingVideo = {
                name: videoUrls[0].split('/').pop(),
                url: getAbsoluteUrl(videoUrls[0]),
                size: 0 // We don't have file size for existing video
              };
            }
          }
        } catch (error) {
          console.error('Error parsing videos:', error);
          existingVideo = null;
        }
        console.log('🎥 Parsed video:', existingVideo);
        console.log('🎥 Video URL:', existingVideo?.url);

        const formDataToSet = {
          title: property.name || '',
          propertyType: property.propertyType || '',
          monthlyRent: property.monthlyRent || '',
          rooms: property.bedrooms || '',
          bathrooms: property.bathrooms || '',
          area: property.size || '',
          floor: property.floor || '',
          buildingFloors: property.totalFloors || '',
          furnishing: property.furnished ? 'furnished' : 'unfurnished',
          parkingAvailable: property.parking || false,
          availableFrom: property.availableFrom ? new Date(property.availableFrom).toISOString().split('T')[0] : '',
          description: property.description || '',
          amenities: existingAmenities,
          street: street,
          houseNumber: houseNumber,
          apartmentNumber: apartmentNumber,
          postcode: property.zipCode || '',
          district: property.district || '',
          city: property.city || '',
          virtualTourVideo: existingVideo,
          propertyPhotos: existingImages
        };
        
        console.log('📝 Setting form data:', formDataToSet);
        setFormData(formDataToSet);
      }
    } catch (error) {
      console.error('❌ Error fetching property:', error);
      console.error('❌ Error response:', error.response?.data);
      setErrors({ fetch: 'Failed to fetch property details.' });
    } finally {
      setFetching(false);
    }
  };

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
    try {
      if (field === 'virtualTourVideo') {
        setFormData(prev => ({
          ...prev,
          virtualTourVideo: files ? (files[0] || null) : null
        }));
        
        // Handle video error state
        if (files && files[0]) {
          // Clear video error when a video is uploaded
          setErrors(prev => ({
            ...prev,
            virtualTourVideo: ''
          }));
        } else if (!files) {
          // Set video error when video is removed
          setErrors(prev => ({
            ...prev,
            virtualTourVideo: 'Virtual tour video is required'
          }));
        }
      } else if (field === 'propertyPhotos') {
        if (Array.isArray(files)) {
          // Handle array of files (new uploads)
          const photoFiles = Array.from(files).slice(0, 12);
          setFormData(prev => ({
            ...prev,
            propertyPhotos: photoFiles
          }));
        } else if (files && files.length > 0) {
          // Handle FileList from input
          const photoFiles = Array.from(files).slice(0, 12);
          setFormData(prev => ({
            ...prev,
            propertyPhotos: photoFiles
          }));
        } else {
          // Clear photos
          setFormData(prev => ({
            ...prev,
            propertyPhotos: []
          }));
        }
      }
    } catch (error) {
      console.error('Error in handleFileUpload:', error);
      // Set to null/empty array to prevent crashes
      if (field === 'virtualTourVideo') {
        setFormData(prev => ({
          ...prev,
          virtualTourVideo: null
        }));
      } else if (field === 'propertyPhotos') {
        setFormData(prev => ({
          ...prev,
          propertyPhotos: []
        }));
      }
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
      // Virtual tour video is required (either existing or new)
      if (!formData.virtualTourVideo) {
        newErrors.virtualTourVideo = 'Virtual tour video is required';
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
    if (!validateStep(3)) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
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
      submitData.append('petsAllowed', false); // Default value
      submitData.append('smokingAllowed', false); // Default value
      submitData.append('utilitiesIncluded', false); // Default value
      submitData.append('description', formData.description || '');
      
      // Handle amenities (send as houseRules)
      if (formData.amenities && formData.amenities.length > 0) {
        submitData.append('houseRules', JSON.stringify(formData.amenities));
      } else {
        submitData.append('houseRules', '[]'); // Send empty array if no amenities selected
      }
      
      // Handle files: Separate new files from existing ones
      let newVideoFile = null;
      let retainedVideoUrl = null;
      if (formData.virtualTourVideo) {
        if (formData.virtualTourVideo instanceof File) {
          newVideoFile = formData.virtualTourVideo;
        } else if (formData.virtualTourVideo.url) {
          retainedVideoUrl = formData.virtualTourVideo.url;
        }
      }

      let newPhotoFiles = [];
      let retainedImageUrls = [];
      if (formData.propertyPhotos && formData.propertyPhotos.length > 0) {
        formData.propertyPhotos.forEach(photo => {
          if (photo instanceof File) {
            newPhotoFiles.push(photo);
          } else if (photo.url) {
            retainedImageUrls.push(photo.url);
          }
        });
      }

      // Append new files to FormData for Multer
      if (newVideoFile) {
        submitData.append('propertyVideo', newVideoFile);
      }
      newPhotoFiles.forEach((photo, index) => {
        submitData.append('propertyImages', photo);
      });

      // Append retained file URLs as JSON strings
      if (retainedVideoUrl) {
        submitData.append('retainedVideoUrl', retainedVideoUrl);
      }
      if (retainedImageUrls.length > 0) {
        submitData.append('retainedImageUrls', JSON.stringify(retainedImageUrls));
      }

      // Debugging FormData content
      for (let pair of submitData.entries()) {
        console.log(pair[0]+ ', ' + pair[1]); 
      }
      
      const response = await api.put(`/properties/${propertyId}`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        navigate('/landlord-my-property');
      }
    } catch (error) {
      console.error('Error updating property:', error);
      setErrors({ submit: 'Failed to update property. Please try again.' });
    } finally {
      setLoading(false);
    }
  };



  const getProgressPercentage = () => {
    return (currentStep / 3) * 100;
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <LandlordSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Property</h1>
              <p className="text-gray-600 mt-1">Update your property listing to attract more tenants</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-900">{user?.name || 'Landlord'}</span>
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-base font-bold text-white">
                    {user?.name?.charAt(0) || 'L'}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Form Content */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Progress Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 relative">
              {/* Cancel Button */}
              <button
                onClick={() => navigate('/landlord-my-property')}
                className="absolute top-4 right-4 px-6 py-3 text-white bg-red-500 rounded-lg hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
              >
                Cancel
              </button>

              {/* Progress Bar */}
              <div className="mb-6 pr-32">
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
                    Update Property
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

export default LandlordEditProperty; 