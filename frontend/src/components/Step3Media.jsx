const Step3Media = ({ formData, errors, onFileUpload }) => {
  const handleFileChange = (field, event) => {
    const files = event.target.files;
    onFileUpload(field, files);
  };

  const handleDrop = (field, event) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    onFileUpload(field, files);
  };

  const handleDragOver = event => {
    event.preventDefault();
  };

  const removeFile = (field, index = null) => {
    try {
      console.log('🗑️ Removing file:', field, index);
      if (field === 'virtualTourVideo') {
        onFileUpload(field, null);
      } else if (field === 'propertyPhotos') {
        const newPhotos = formData.propertyPhotos.filter((_, i) => i !== index);
        onFileUpload(field, newPhotos);
      }
    } catch (error) {
      console.error('Error in removeFile:', error);
    }
  };

  const addMorePhotos = event => {
    try {
      const files = event.target.files;
      console.log('📸 Adding more photos:', files);
      if (files && files.length > 0) {
        const currentPhotos = formData.propertyPhotos || [];
        const newPhotos = Array.from(files);
        const totalPhotos = [...currentPhotos, ...newPhotos].slice(0, 12);
        console.log('📸 Total photos after adding:', totalPhotos.length);
        onFileUpload('propertyPhotos', totalPhotos);
      }
    } catch (error) {
      console.error('Error in addMorePhotos:', error);
    }
  };

  const formatFileSize = bytes => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div>
      {/* Header */}
      <div className='text-center mb-8'>
        <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
          <svg
            className='w-8 h-8 text-gray-600'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z'
            />
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M15 13a3 3 0 11-6 0 3 3 0 016 0z'
            />
          </svg>
        </div>
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>
          Showcase your property
        </h2>
        <p className='text-gray-600'>
          Add photos and virtual tour videos to attract more tenants.
        </p>
      </div>

      {/* Virtual Tour Section */}
      <div className='mb-8'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-gray-900'>
            Virtual Tour Video *Required*
          </h3>
          {!formData.virtualTourVideo && (
            <div className='flex items-center text-red-600'>
              <svg
                className='w-4 h-4 mr-1'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
              <span className='text-sm font-medium'>Video required</span>
            </div>
          )}
        </div>

        {/* Virtual Tour Instructions */}
        <div className='mb-6 p-4 bg-green-50 border border-green-200 rounded-lg'>
          <div className='flex items-start'>
            <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0'>
              <svg
                className='w-4 h-4 text-green-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            </div>
            <div>
              <h4 className='text-sm font-semibold text-green-900 mb-2'>
                Virtual Tour Required
              </h4>
              <p className='text-sm text-green-800 mb-3'>
                Listings with virtual tour videos get{' '}
                <strong>3x more responses</strong> and{' '}
                <strong>5x more trust</strong> from potential tenants.
              </p>
              <ul className='text-sm text-green-800 space-y-1'>
                <li>• All rooms and living spaces</li>
                <li>• Closets and storage areas</li>
                <li>• Bathroom facilities (toilet flush demo)</li>
                <li>• Window views and natural light</li>
                <li>• Ambient noise levels</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Video Upload Area */}
        {formData.virtualTourVideo ? (
          <div className='border-2 border-green-300 bg-green-50 rounded-lg p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h4 className='text-lg font-semibold text-green-900'>
                Video Uploaded Successfully!
              </h4>
              <button
                onClick={() => removeFile('virtualTourVideo')}
                className='text-red-600 hover:text-red-800 p-2'
              >
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                  />
                </svg>
              </button>
            </div>

            <div className='bg-white rounded-lg p-4 border border-green-200'>
              <div className='flex items-center space-x-4'>
                <div className='w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                  <svg
                    className='w-8 h-8 text-green-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
                    />
                  </svg>
                </div>
                <div className='flex-1'>
                  <h5 className='font-medium text-gray-900'>
                    {formData.virtualTourVideo.name || 'Virtual Tour Video'}
                  </h5>
                  <p className='text-sm text-gray-600'>
                    {formData.virtualTourVideo.size ? (
                      <>
                        Size: {formatFileSize(formData.virtualTourVideo.size)}{' '}
                        |{' '}
                      </>
                    ) : (
                      <>Existing video | </>
                    )}
                    Type: {formData.virtualTourVideo.type || 'video/mp4'}
                  </p>
                </div>
              </div>

              {/* Video Preview */}
              <div className='mt-4'>
                <video
                  controls
                  className='w-full h-48 object-cover rounded-lg bg-gray-100'
                  src={
                    formData.virtualTourVideo.url ||
                    URL.createObjectURL(formData.virtualTourVideo)
                  }
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              errors.virtualTourVideo
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400'
            }`}
            onDrop={e => handleDrop('virtualTourVideo', e)}
            onDragOver={handleDragOver}
          >
            {errors.virtualTourVideo && (
              <div className='mb-4 p-3 bg-red-100 border border-red-300 rounded-lg'>
                <div className='flex items-center text-red-700'>
                  <svg
                    className='w-5 h-5 mr-2'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                    />
                  </svg>
                  <span className='font-medium'>
                    Virtual tour video is required
                  </span>
                </div>
              </div>
            )}
            <input
              type='file'
              accept='video/*'
              onChange={e => handleFileChange('virtualTourVideo', e)}
              className='hidden'
              id='virtualTourVideo'
            />
            <label htmlFor='virtualTourVideo' className='cursor-pointer'>
              <div className='flex flex-col items-center'>
                <svg
                  className='w-12 h-12 text-gray-400 mb-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
                  />
                </svg>
                <div>
                  <p className='text-sm font-medium text-gray-600 mb-2'>
                    Listings with video walkthrough get{' '}
                    <strong>3x more rent</strong> and{' '}
                    <strong>5x more trust</strong>. Upload now to boost your
                    listing.
                  </p>
                  <p className='text-sm text-gray-500'>
                    No editing needed. Just walk & talk with your phone camera.
                  </p>
                </div>
              </div>
            </label>
          </div>
        )}
        {errors.virtualTourVideo && (
          <p className='mt-2 text-sm text-red-600'>{errors.virtualTourVideo}</p>
        )}
      </div>

      {/* Property Photos Section */}
      <div className='mb-8'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-gray-900'>
            Property Photos Recommended
          </h3>
          <span className='text-sm text-gray-500'>
            {formData.propertyPhotos.length}/12 photos
          </span>
        </div>

        {/* Complementary Photos Prompt */}
        <div className='mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
          <div className='flex items-center'>
            <svg
              className='w-5 h-5 text-blue-600 mr-3'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z'
              />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 13a3 3 0 11-6 0 3 3 0 016 0z'
              />
            </svg>
            <div>
              <p className='text-sm font-medium text-blue-900'>
                Add photos to complement your virtual tour
              </p>
              <p className='text-sm text-blue-800'>
                Show specific details, room angles, and features that highlight
                your property's best aspects.
              </p>
            </div>
          </div>
        </div>

        {/* Photo Upload Area */}
        {formData.propertyPhotos.length > 0 ? (
          <div className='border-2 border-green-300 bg-green-50 rounded-lg p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h4 className='text-lg font-semibold text-green-900'>
                {formData.propertyPhotos.length} Photo
                {formData.propertyPhotos.length !== 1 ? 's' : ''} Uploaded!
              </h4>
              <button
                onClick={() => onFileUpload('propertyPhotos', [])}
                className='text-red-600 hover:text-red-800 p-2'
              >
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                  />
                </svg>
              </button>
            </div>

            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
              {formData.propertyPhotos.map((photo, index) => (
                <div key={index} className='relative group'>
                  <img
                    src={photo.url || URL.createObjectURL(photo)}
                    alt={`Property photo ${index + 1}`}
                    className='w-full h-32 object-cover rounded-lg border border-green-200'
                  />
                  <button
                    onClick={() => removeFile('propertyPhotos', index)}
                    className='absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
                  >
                    <svg
                      className='w-4 h-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M6 18L18 6M6 6l12 12'
                      />
                    </svg>
                  </button>
                  <div className='mt-2 text-xs text-gray-600'>
                    <p className='truncate'>
                      {photo.name || `Photo ${index + 1}`}
                    </p>
                    <p>
                      {photo.size
                        ? formatFileSize(photo.size)
                        : 'Existing photo'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add More Photos Button */}
            <div className='mt-4'>
              <input
                type='file'
                accept='image/*'
                multiple
                onChange={addMorePhotos}
                className='hidden'
                id='addMorePhotos'
              />
              <label
                htmlFor='addMorePhotos'
                className='cursor-pointer inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50'
              >
                <svg
                  className='w-4 h-4 mr-2'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                  />
                </svg>
                Add More Photos
              </label>
            </div>
          </div>
        ) : (
          <div
            className='border-2 border-dashed rounded-lg p-8 text-center transition-colors border-gray-300 bg-gray-50 hover:border-gray-400'
            onDrop={e => handleDrop('propertyPhotos', e)}
            onDragOver={handleDragOver}
          >
            <input
              type='file'
              accept='image/*'
              multiple
              onChange={e => handleFileChange('propertyPhotos', e)}
              className='hidden'
              id='propertyPhotos'
            />
            <label htmlFor='propertyPhotos' className='cursor-pointer'>
              <div className='flex flex-col items-center'>
                <svg
                  className='w-12 h-12 text-gray-400 mb-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
                  />
                </svg>
                <div>
                  <p className='text-sm font-medium text-gray-600 mb-2'>
                    Drop property photos here, or click to browse
                  </p>
                  <p className='text-sm text-gray-500'>
                    Supports: JPG, PNG, WebP (max 10MB each)
                  </p>
                </div>
              </div>
            </label>
          </div>
        )}

        {/* Photo Recommendations */}
        <div className='mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg'>
          <h4 className='text-sm font-semibold text-gray-900 mb-3'>
            Photo recommendations:
          </h4>
          <ul className='text-sm text-gray-700 space-y-1'>
            <li>• Take photos in good natural light</li>
            <li>• Show different angles of each room</li>
            <li>• Highlight unique features and amenities</li>
            <li>• Keep photos clean and uncluttered</li>
            <li>• First photo will be used as the main listing image</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Step3Media;
