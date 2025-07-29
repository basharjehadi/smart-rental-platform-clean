import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

const FileUpload = ({ 
  onImagesUploaded, 
  onVideoUploaded, 
  onFileDeleted,
  maxImages = 10,
  maxVideoSize = 50 * 1024 * 1024, // 50MB
  maxImageSize = 10 * 1024 * 1024, // 10MB
  acceptedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  acceptedVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm']
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { api } = useAuth();
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = async (files) => {
    setError('');
    setSuccess('');
    
    const imageFiles = [];
    const videoFiles = [];

    // Separate images and videos
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        imageFiles.push(file);
      } else if (file.type.startsWith('video/')) {
        videoFiles.push(file);
      }
    });

    // Upload images
    if (imageFiles.length > 0) {
      await uploadImages(imageFiles);
    }

    // Upload video (only one)
    if (videoFiles.length > 0) {
      await uploadVideo(videoFiles[0]);
    }
  };

  const uploadImages = async (files) => {
    if (uploadedImages.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Validate file sizes
    for (const file of files) {
      if (file.size > maxImageSize) {
        setError(`Image ${file.name} is too large. Maximum size is ${maxImageSize / (1024 * 1024)}MB`);
        return;
      }
      if (!acceptedImageTypes.includes(file.type)) {
        setError(`Image ${file.name} has unsupported format`);
        return;
      }
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      files.forEach(file => {
        formData.append('propertyImages', file);
      });

      const response = await api.post('/property-upload/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const newImages = response.data.imageUrls;
      const updatedImages = [...uploadedImages, ...newImages];
      setUploadedImages(updatedImages);
      
      if (onImagesUploaded) {
        onImagesUploaded(updatedImages);
      }
      
      setSuccess(`${files.length} image(s) uploaded successfully`);
      
    } catch (error) {
      console.error('Error uploading images:', error);
      setError(error.response?.data?.error || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const uploadVideo = async (file) => {
    if (uploadedVideo) {
      setError('Only one video is allowed. Please delete the current video first.');
      return;
    }

    if (file.size > maxVideoSize) {
      setError(`Video is too large. Maximum size is ${maxVideoSize / (1024 * 1024)}MB`);
      return;
    }

    if (!acceptedVideoTypes.includes(file.type)) {
      setError('Video has unsupported format');
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('propertyVideo', file);

      const response = await api.post('/property-upload/video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const videoUrl = response.data.videoUrl;
      setUploadedVideo(videoUrl);
      
      if (onVideoUploaded) {
        onVideoUploaded(videoUrl);
      }
      
      setSuccess('Video uploaded successfully');
      
    } catch (error) {
      console.error('Error uploading video:', error);
      setError(error.response?.data?.error || 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (fileUrl, isVideo = false) => {
    try {
      await api.delete('/property-upload/file', {
        data: { fileUrl }
      });

      if (isVideo) {
        setUploadedVideo(null);
        if (onVideoUploaded) {
          onVideoUploaded(null);
        }
      } else {
        const updatedImages = uploadedImages.filter(img => img !== fileUrl);
        setUploadedImages(updatedImages);
        if (onImagesUploaded) {
          onImagesUploaded(updatedImages);
        }
      }

      if (onFileDeleted) {
        onFileDeleted(fileUrl);
      }

      setSuccess('File deleted successfully');
      
    } catch (error) {
      console.error('Error deleting file:', error);
      setError('Failed to delete file');
    }
  };

  const triggerFileInput = (type) => {
    if (type === 'images') {
      fileInputRef.current?.click();
    } else if (type === 'video') {
      videoInputRef.current?.click();
    }
  };

  return (
    <div className="space-y-6">
      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Image Upload Section */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Property Images</h4>
        
        {/* Drag & Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="text-sm text-gray-600">
              <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                <span>Upload images</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => e.target.files && uploadImages(Array.from(e.target.files))}
                />
              </label>
              <span className="ml-1">or drag and drop</span>
            </div>
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF, WEBP up to 10MB each. Max {maxImages} images.
            </p>
          </div>
        </div>

        {/* Uploaded Images Preview */}
        {uploadedImages.length > 0 && (
          <div className="mt-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Uploaded Images ({uploadedImages.length}/{maxImages})</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {uploadedImages.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`Property ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                  <button
                    onClick={() => deleteFile(imageUrl)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Video Upload Section */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Property Video</h4>
        
        {!uploadedVideo ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <div className="space-y-2">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="text-sm text-gray-600">
                <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                  <span>Upload video</span>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    className="sr-only"
                    onChange={(e) => e.target.files && uploadVideo(e.target.files[0])}
                  />
                </label>
                <span className="ml-1">or drag and drop</span>
              </div>
              <p className="text-xs text-gray-500">
                MP4, AVI, MOV, WMV, FLV, WEBM up to 50MB.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative group">
            <video
              src={uploadedVideo}
              controls
              className="w-full h-48 object-cover rounded-lg border"
            />
            <button
              onClick={() => deleteFile(uploadedVideo, true)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete video"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {uploading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Uploading...</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload; 