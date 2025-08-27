import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2, FileText, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

const BusinessUpgradePage = () => {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [signaturePad, setSignaturePad] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    companyName: '',
    taxId: '',
    regNumber: '',
    address: '',
    city: '',
    zipCode: '',
    country: 'Poland'
  });
  
  // Form validation
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Check if user already has an organization
  const [hasOrganization, setHasOrganization] = useState(false);
  const [organizationData, setOrganizationData] = useState(null);

  useEffect(() => {
    checkExistingOrganization();
  }, []);

  const checkExistingOrganization = async () => {
    try {
      const response = await api.get('/organizations/my-organization');
      if (response.data.organization) {
        setHasOrganization(true);
        setOrganizationData(response.data.organization);
      }
    } catch (error) {
      // User doesn't have an organization yet, which is fine
      console.log('No existing organization found');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Mark field as touched
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    
    if (!formData.taxId.trim()) {
      newErrors.taxId = 'Tax ID (NIP) is required';
    } else if (!/^\d{10}$/.test(formData.taxId.replace(/\s/g, ''))) {
      newErrors.taxId = 'Tax ID must be 10 digits';
    }
    
    if (!formData.regNumber.trim()) {
      newErrors.regNumber = 'Registration number is required';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    }
    
    if (!signaturePad || signaturePad.isEmpty()) {
      newErrors.signature = 'Company signature is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Get signature data
      const signatureData = signaturePad.toDataURL();
      
      const upgradeData = {
        ...formData,
        signature: signatureData
      };
      
      const response = await api.post('/organizations/upgrade-to-business', upgradeData);
      
      setSuccess('Successfully upgraded to business account! Your properties have been transferred to the new organization.');
      
      // Redirect to profile page after a short delay
      setTimeout(() => {
        navigate(user.role === 'LANDLORD' ? '/landlord-profile' : '/tenant-profile');
      }, 3000);
      
    } catch (error) {
      console.error('Error upgrading to business account:', error);
      setError(error.response?.data?.message || 'Failed to upgrade to business account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignatureClear = () => {
    if (signaturePad) {
      signaturePad.clear();
    }
    if (errors.signature) {
      setErrors(prev => ({ ...prev, signature: '' }));
    }
  };

  const handleBackToProfile = () => {
    navigate(user.role === 'LANDLORD' ? '/landlord-profile' : '/tenant-profile');
  };

  // If user already has an organization, show success message
  if (hasOrganization) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Business Account Already Active
              </h1>
              <p className="text-gray-600 mb-6">
                You have already upgraded to a business account. Your organization is ready to use.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
                <h3 className="font-semibold text-gray-900 mb-3">Organization Details:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Company Name</p>
                    <p className="font-medium">{organizationData?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tax ID (NIP)</p>
                    <p className="font-medium">{organizationData?.taxId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Registration Number</p>
                    <p className="font-medium">{organizationData?.regNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Address</p>
                    <p className="font-medium">{organizationData?.address}</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleBackToProfile}
                className="btn-primary"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBackToProfile}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </button>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Building2 className="w-12 h-12 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">
                Upgrade to Business Account
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Transform your account into a business entity to manage properties and tenants 
              under your company name. This will create a professional presence for your rental business.
            </p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              {success}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        {/* Business Upgrade Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Information Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                Company Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Name */}
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    className={`input-modern ${errors.companyName ? 'border-red-300' : ''}`}
                    placeholder="Enter company name"
                  />
                  {errors.companyName && touched.companyName && (
                    <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
                  )}
                </div>

                {/* Tax ID (NIP) */}
                <div>
                  <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 mb-2">
                    Tax ID (NIP) *
                  </label>
                  <input
                    type="text"
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => handleInputChange('taxId', e.target.value)}
                    className={`input-modern ${errors.taxId ? 'border-red-300' : ''}`}
                    placeholder="1234567890"
                    maxLength="10"
                  />
                  {errors.taxId && touched.taxId && (
                    <p className="mt-1 text-sm text-red-600">{errors.taxId}</p>
                  )}
                </div>

                {/* Registration Number */}
                <div>
                  <label htmlFor="regNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Number *
                  </label>
                  <input
                    type="text"
                    id="regNumber"
                    value={formData.regNumber}
                    onChange={(e) => handleInputChange('regNumber', e.target.value)}
                    className={`input-modern ${errors.regNumber ? 'border-red-300' : ''}`}
                    placeholder="Enter registration number"
                  />
                  {errors.regNumber && touched.regNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.regNumber}</p>
                  )}
                </div>

                {/* Country */}
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="input-modern"
                    placeholder="Country"
                  />
                </div>
              </div>

              {/* Address Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className={`input-modern ${errors.address ? 'border-red-300' : ''}`}
                    placeholder="Enter street address"
                  />
                  {errors.address && touched.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className={`input-modern ${errors.city ? 'border-red-300' : ''}`}
                    placeholder="Enter city"
                  />
                  {errors.city && touched.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    className={`input-modern ${errors.zipCode ? 'border-red-300' : ''}`}
                    placeholder="00-000"
                  />
                  {errors.zipCode && touched.zipCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Company Signature Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Company Signature
              </h2>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Draw your company's authorized signature below
                  </p>
                  <p className="text-xs text-gray-500">
                    This signature will be used on all business contracts and documents
                  </p>
                </div>
                
                <SignatureCanvas
                  ref={(ref) => setSignaturePad(ref)}
                  canvasProps={{
                    className: 'w-full h-32 border border-gray-300 rounded mx-auto'
                  }}
                />
                
                <div className="flex justify-center space-x-3 mt-4">
                  <button
                    type="button"
                    onClick={handleSignatureClear}
                    className="btn-secondary"
                  >
                    Clear Signature
                  </button>
                </div>
                
                {errors.signature && (
                  <p className="mt-2 text-sm text-red-600 text-center">{errors.signature}</p>
                )}
              </div>
            </div>

            {/* Benefits Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                Benefits of Business Account
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                  Professional business presence in rental contracts
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                  Company details displayed on all business documents
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                  Automatic property ownership transfer to organization
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                  Enhanced credibility with tenants and partners
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary px-8 py-3 text-lg disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Upgrading Account...
                  </>
                ) : (
                  <>
                    <Building2 className="w-5 h-5 mr-2" />
                    Upgrade to Business Account
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BusinessUpgradePage;
