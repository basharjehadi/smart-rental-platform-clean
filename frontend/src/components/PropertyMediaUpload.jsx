import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PropertyMediaUpload = () => {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [autoFillMedia, setAutoFillMedia] = useState(true);

  // File states
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [videoPreview, setVideoPreview] = useState([]);

  // Existing media states
  const [existingImages, setExistingImages] = useState([]);
  const [existingVideos, setExistingVideos] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  const handleBackToProfile = () => {
    navigate('/landlord-profile');
  };

  // Fetch current auto-fill setting and existing media
  useEffect(() => {
    fetchAutoFillSetting();
    fetchExistingMedia();
  }, []);

  const fetchAutoFillSetting = async () => {
    try {
      const response = await api.get('/landlord-profile/profile');
      setAutoFillMedia(response.data.profile.autoFillMedia !== false);
    } catch (error) {
      console.error('Error fetching auto-fill setting:', error);
    }
  };

  const fetchExistingMedia = async () => {
    try {
      setLoadingMedia(true);
      const response = await api.get('/landlord-profile/profile');
      const profile = response.data.profile;
      
      setExistingImages(profile.propertyImages || []);
      setExistingVideos(profile.propertyVideos || []);
    } catch (error) {
      console.error('Error fetching existing media:', error);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleAutoFillToggle = async () => {
    try {
      const newValue = !autoFillMedia;
      await api.put('/landlord-profile/profile', {
        autoFillMedia: newValue,
        preferredLocations: ['Poznań'], // Keep existing settings
        maxTenants: 5,
        manualAvailability: true,
        autoAvailability: true,
        autoFillRules: true,
        autoFillDescription: true
      });
      setAutoFillMedia(newValue);
      setSuccess(`Auto-fill media ${newValue ? 'enabled' : 'disabled'} successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating auto-fill setting:', error);
      setError('Failed to update auto-fill setting');
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(files);
    
    // Create previews
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview(previews);
  };

  const handleVideoSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedVideos(files);
    
    // Create previews
    const previews = files.map(file => URL.createObjectURL(file));
    setVideoPreview(previews);
  };

  const handleImageUpload = async () => {
    if (selectedImages.length === 0) {
      setError('Please select images to upload');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      console.log('Starting image upload...', selectedImages.length, 'images');

      const formData = new FormData();
      selectedImages.forEach((image, index) => {
        formData.append('propertyImages', image);
        console.log('Added image to formData:', image.name, image.type, image.size);
      });

      console.log('Sending request to /property-upload/images');
      const response = await api.post('/property-upload/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Upload response:', response.data);

      // Add uploaded images to landlord profile
      console.log('Adding images to landlord profile...');
      await api.post('/landlord-profile/property-images', {
        images: response.data.imageUrls
      });

      setSuccess(`${selectedImages.length} images uploaded successfully!`);
      setSelectedImages([]);
      setImagePreview([]);
      
      // Refresh existing media list
      await fetchExistingMedia();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error uploading images:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setError(error.response?.data?.error || error.response?.data?.message || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async () => {
    if (selectedVideos.length === 0) {
      setError('Please select videos to upload');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      console.log('Starting video upload...', selectedVideos.length, 'videos');

      // Upload videos one by one since backend only supports single video upload
      const uploadedVideos = [];
      
      for (let i = 0; i < selectedVideos.length; i++) {
        const video = selectedVideos[i];
        console.log(`Uploading video ${i + 1}/${selectedVideos.length}:`, video.name, video.type, video.size);
        
        const formData = new FormData();
        formData.append('propertyVideo', video);

        const response = await api.post('/property-upload/video', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        console.log(`Video ${i + 1} upload response:`, response.data);
        uploadedVideos.push(response.data.videoUrl);
      }

      // Add all uploaded videos to landlord profile
      if (uploadedVideos.length > 0) {
        console.log('Adding videos to landlord profile...', uploadedVideos);
        await api.post('/landlord-profile/property-videos', {
          videos: uploadedVideos
        });
      }

      setSuccess(`${selectedVideos.length} videos uploaded successfully!`);
      setSelectedVideos([]);
      setVideoPreview([]);
      
      // Refresh existing media list
      await fetchExistingMedia();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error uploading videos:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setError(error.response?.data?.error || error.response?.data?.message || 'Failed to upload videos');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index) => {
    setSelectedVideos(prev => prev.filter((_, i) => i !== index));
    setVideoPreview(prev => prev.filter((_, i) => i !== index));
  };

  const deleteExistingImage = async (imageUrl) => {
    try {
      // Remove from landlord profile
      const updatedImages = existingImages.filter(img => img !== imageUrl);
      
      await api.delete('/landlord-profile/property-images', {
        data: { images: updatedImages }
      });
      
      // Update local state
      setExistingImages(updatedImages);
      setSuccess('Image deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting image:', error);
      setError('Failed to delete image');
    }
  };

  const deleteExistingVideo = async (videoUrl) => {
    try {
      // Remove from landlord profile
      const updatedVideos = existingVideos.filter(video => video !== videoUrl);
      
      await api.delete('/landlord-profile/property-videos', {
        data: { videos: updatedVideos }
      });
      
      // Update local state
      setExistingVideos(updatedVideos);
      setSuccess('Video deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting video:', error);
      setError('Failed to delete video');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              🖼️ Property Media Library
            </h2>
            <button
              onClick={handleBackToProfile}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Back to Profile
            </button>
          </div>

          {/* Auto-fill Media Setting */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-1">
                  🎯 Auto-fill Media Setting
                </h3>
                <p className="text-sm text-blue-700">
                  Automatically include your media library when creating offers
                </p>
              </div>
              <label className="flex items-center p-3 bg-white rounded-lg border border-blue-300 hover:bg-blue-50 transition-colors">
                <input
                  type="checkbox"
                  checked={autoFillMedia}
                  onChange={handleAutoFillToggle}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-3 text-blue-800 font-medium">
                  {autoFillMedia ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex">
                <svg className="w-5 h-5 text-green-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-800">{success}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Upload Section */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📸 Property Images
              </h3>
              
              <div className="space-y-4">
                {/* File Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Images (JPG, PNG, max 5MB each)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Image Previews */}
                {imagePreview.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Selected Images:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {imagePreview.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <button
                  onClick={handleImageUpload}
                  disabled={uploading || selectedImages.length === 0}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : `Upload ${selectedImages.length} Images`}
                </button>
              </div>
            </div>

            {/* Video Upload Section */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🎥 Property Videos
              </h3>
              
              <div className="space-y-4">
                {/* File Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Videos (MP4, MOV, max 50MB each)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="video/*"
                    onChange={handleVideoSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Video Previews */}
                {videoPreview.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Selected Videos:</h4>
                    <div className="space-y-2">
                      {videoPreview.map((preview, index) => (
                        <div key={index} className="relative">
                          <video
                            src={preview}
                            controls
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removeVideo(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <button
                  onClick={handleVideoUpload}
                  disabled={uploading || selectedVideos.length === 0}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : `Upload ${selectedVideos.length} Videos`}
                </button>
              </div>
            </div>
          </div>

          {/* Existing Media Library */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                📚 Your Media Library
              </h3>
              <button
                onClick={fetchExistingMedia}
                disabled={loadingMedia}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                title="Refresh media library"
              >
                {loadingMedia ? '🔄' : '🔄 Refresh'}
              </button>
            </div>
            
            {loadingMedia ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Existing Images */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    📸 Uploaded Images ({existingImages.length})
                  </h4>
                  
                  {existingImages.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No images uploaded yet. Upload some images above!
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {existingImages.map((imageUrl, index) => (
                        <div key={index} className="relative group">
                                                     <img
                             src={`http://localhost:3001${imageUrl}`}
                             alt={`Property Image ${index + 1}`}
                             className="w-full h-32 object-cover rounded-lg"
                             onError={(e) => {
                               e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';
                             }}
                           />
                          <button
                            onClick={() => deleteExistingImage(imageUrl)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete image"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Existing Videos */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    🎥 Uploaded Videos ({existingVideos.length})
                  </h4>
                  
                  {existingVideos.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No videos uploaded yet. Upload some videos above!
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {existingVideos.map((videoUrl, index) => (
                        <div key={index} className="relative group">
                          <video
                            src={`http://localhost:3001${videoUrl}`}
                            controls
                            className="w-full h-32 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                          <div 
                            className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500"
                            style={{ display: 'none' }}
                          >
                            Video not found
                          </div>
                          <button
                            onClick={() => deleteExistingVideo(videoUrl)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete video"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Information Section */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              💡 How it works
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Upload property images and videos to your media library</li>
              <li>• View all your uploaded media in the Media Library section below</li>
              <li>• Hover over media items to see the delete button (×)</li>
              <li>• Enable auto-fill to automatically include media in your offers</li>
              <li>• You can select which media to include in each offer</li>
              <li>• Supported formats: JPG, PNG for images; MP4, MOV for videos</li>
              <li>• Maximum file sizes: 5MB for images, 50MB for videos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyMediaUpload; 