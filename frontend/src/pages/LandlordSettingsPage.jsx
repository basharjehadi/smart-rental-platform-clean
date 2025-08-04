import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LandlordSettingsPage = () => {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [landlordProfile, setLandlordProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  // Landlord profile form state
  const [landlordFormData, setLandlordFormData] = useState({
    preferredLocations: [],
    maxTenants: 5,
    manualAvailability: true,
    autoAvailability: true,
    propertyRules: '',
    propertyDescription: '',
    autoFillRules: true,
    autoFillDescription: true
  });

  // Available options
  const availableLocations = [
    'Poznań', 'Warsaw', 'Kraków', 'Wrocław', 'Gdańsk', 
    'Łódź', 'Szczecin', 'Bydgoszcz', 'Lublin', 'Katowice'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch user profile
      const userResponse = await api.get('/users/profile');
      setProfileData(userResponse.data.user);

      // Fetch landlord profile
      try {
        const landlordResponse = await api.get('/landlord-profile/profile');
        const landlordData = landlordResponse.data.profile;
        setLandlordProfile(landlordData);
        setLandlordFormData({
          preferredLocations: landlordData.preferredLocations || [],
          maxTenants: landlordData.maxTenants || 5,
          manualAvailability: landlordData.manualAvailability !== false,
          autoAvailability: landlordData.autoAvailability !== false,
          propertyRules: landlordData.propertyRules || '',
          propertyDescription: landlordData.propertyDescription || '',
          autoFillRules: landlordData.autoFillRules !== false,
          autoFillDescription: landlordData.autoFillDescription !== false
        });
      } catch (landlordError) {
        console.error('Error fetching landlord profile:', landlordError);
        // If landlord profile doesn't exist, create default form data
        setLandlordFormData({
          preferredLocations: [],
          maxTenants: 5,
          manualAvailability: true,
          autoAvailability: true,
          propertyRules: '',
          propertyDescription: '',
          autoFillRules: true,
          autoFillDescription: true
        });
        setError('Landlord profile not found. Please save your settings to create a profile.');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.message || 'Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setLandlordFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field, value, action) => {
    setLandlordFormData(prev => ({
      ...prev,
      [field]: action === 'add' 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await api.put('/landlord-profile/profile', landlordFormData);
      
      setSuccess('Settings saved successfully!');
      setLandlordProfile(response.data.profile);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating settings:', error);
      setError(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailability = async () => {
    try {
      const newAvailability = !landlordFormData.manualAvailability;
      
      const response = await api.put('/landlord-profile/availability', {
        manualAvailability: newAvailability
      });
      
      setLandlordFormData(prev => ({
        ...prev,
        manualAvailability: newAvailability
      }));
      
      setSuccess(`Availability ${newAvailability ? 'enabled' : 'disabled'} successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error toggling availability:', error);
      setError('Failed to toggle availability');
    }
  };

  const handleBackToProfile = () => {
          navigate('/landlord-profile');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                🏠 Landlord Settings
              </h1>
              <p className="text-gray-600 text-lg">
                Manage your rental preferences and automation settings
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                landlordFormData.manualAvailability 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {landlordFormData.manualAvailability ? '🟢 Available' : '🔴 Not Available'}
              </span>
              <button
                onClick={handleBackToProfile}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                ← Back to Profile
              </button>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-800">{success}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Quick Actions & Status */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Status Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Quick Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Tenants:</span>
                  <span className="font-medium text-blue-900">{profileData?.currentTenants || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Capacity:</span>
                  <span className="font-medium text-blue-900">{landlordFormData.maxTenants}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Available Slots:</span>
                  <span className="font-medium text-green-600">
                    {Math.max(0, landlordFormData.maxTenants - (profileData?.currentTenants || 0))}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleToggleAvailability}
                  className={`w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    landlordFormData.manualAvailability
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {landlordFormData.manualAvailability ? '🔴 Pause Requests' : '🟢 Resume Requests'}
                </button>
              </div>
            </div>
          </div>

          {/* Main Settings Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Location Preferences */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📍 Preferred Locations
              </h3>
              <p className="text-gray-600 mb-4">
                Select cities where you want to receive rental requests
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableLocations.map(location => (
                  <label key={location} className="flex items-center p-3 bg-gray-50 rounded-lg border hover:bg-blue-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={landlordFormData.preferredLocations.includes(location)}
                      onChange={(e) => handleArrayChange(
                        'preferredLocations', 
                        location, 
                        e.target.checked ? 'add' : 'remove'
                      )}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-gray-700">{location}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Capacity Management */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                👥 Tenant Capacity
              </h3>
              <p className="text-gray-600 mb-4">
                Set how many tenants you can manage simultaneously
              </p>
              <div className="flex items-center space-x-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Tenants
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={landlordFormData.maxTenants}
                    onChange={(e) => handleInputChange('maxTenants', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {Math.max(0, landlordFormData.maxTenants - (profileData?.currentTenants || 0))}
                  </div>
                  <div className="text-sm text-gray-500">Available Slots</div>
                </div>
              </div>
            </div>

            {/* Auto-fill Preferences */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ⚙️ Smart Auto-fill
              </h3>
              <p className="text-gray-600 mb-4">
                Automatically fill offer details from your templates
              </p>
              <div className="grid grid-cols-1 gap-3">
                <label className="flex items-center p-3 bg-gray-50 rounded-lg border">
                  <input
                    type="checkbox"
                    checked={landlordFormData.autoFillRules}
                    onChange={(e) => handleInputChange('autoFillRules', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-700">Auto-fill house rules template</span>
                </label>
                <label className="flex items-center p-3 bg-gray-50 rounded-lg border">
                  <input
                    type="checkbox"
                    checked={landlordFormData.autoFillDescription}
                    onChange={(e) => handleInputChange('autoFillDescription', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-700">Auto-fill property description template</span>
                </label>
              </div>
            </div>

            {/* Templates Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📝 Offer Templates
              </h3>
              <p className="text-gray-600 mb-4">
                Create reusable templates for your offers
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Property Rules Template */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    House Rules Template
                  </label>
                  <textarea
                    value={landlordFormData.propertyRules}
                    onChange={(e) => handleInputChange('propertyRules', e.target.value)}
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., No smoking, No pets, Quiet hours 10 PM - 8 AM..."
                  />
                </div>

                {/* Property Description Template */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Description Template
                  </label>
                  <textarea
                    value={landlordFormData.propertyDescription}
                    onChange={(e) => handleInputChange('propertyDescription', e.target.value)}
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Beautiful apartment with modern amenities..."
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandlordSettingsPage; 