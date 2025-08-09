import { useState } from 'react';

const PropertyMediaViewer = ({ propertyImages, propertyVideo, propertyAddress, propertyType, propertySize, propertyAmenities, propertyDescription }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // Parse property images if it's a string (JSON)
  const images = typeof propertyImages === 'string' 
    ? (propertyImages ? (() => {
        try {
          return JSON.parse(propertyImages);
        } catch (error) {
          console.warn('Failed to parse propertyImages:', propertyImages, error);
          return [];
        }
      })() : [])
    : (Array.isArray(propertyImages) ? propertyImages : []);

  // Parse property amenities if it's a string (JSON)
  const amenities = typeof propertyAmenities === 'string'
    ? (propertyAmenities ? (() => {
  try {
    return typeof propertyAmenities === 'string' ? JSON.parse(propertyAmenities) : propertyAmenities;
  } catch (error) {
    console.warn('Failed to parse propertyAmenities:', propertyAmenities, error);
    return [];
  }
})() : [])
    : (Array.isArray(propertyAmenities) ? propertyAmenities : []);

  // Convert relative URLs to absolute URLs for images
  const absoluteImageUrls = images.map(imageUrl => {
    if (imageUrl.startsWith('http')) {
      return imageUrl; // Already absolute
    } else if (imageUrl.startsWith('/')) {
      return `http://localhost:3001${imageUrl}`; // Add server URL
    } else {
      return `http://localhost:3001/${imageUrl}`; // Add server URL and leading slash
    }
  });

  // Convert relative URL to absolute URL for video
  const absoluteVideoUrl = propertyVideo ? 
    (propertyVideo.startsWith('http') ? propertyVideo : 
     propertyVideo.startsWith('/') ? `http://localhost:3001${propertyVideo}` : 
     `http://localhost:3001/${propertyVideo}`) : null;

  // Debug logging
  console.log('PropertyMediaViewer props:', {
    propertyImages,
    parsedImages: images,
    propertyVideo,
    propertyAddress,
    propertyType,
    propertySize,
    propertyAmenities,
    parsedAmenities: amenities,
    propertyDescription
  });

  // Additional debugging for image URLs
  if (absoluteImageUrls.length > 0) {
    console.log('🔍 Absolute Image URLs being processed:');
    absoluteImageUrls.forEach((imageUrl, index) => {
      console.log(`Absolute Image ${index + 1}: ${imageUrl}`);
    });
  }

  const openImageModal = (imageUrl) => {
    console.log('Opening image modal with URL:', imageUrl);
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const closeImageModal = () => {
    console.log('Closing image modal');
    setShowImageModal(false);
    setSelectedImage(null);
  };

  if (!absoluteImageUrls.length && !absoluteVideoUrl && !propertyAddress && !propertyType && !propertySize && !amenities.length && !propertyDescription) {
    return null; // Don't render anything if no property information
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h4 className="text-lg font-medium text-gray-900 mb-3">Property Details</h4>
      
      {/* Property Images */}
      {absoluteImageUrls.length > 0 && (
        <div className="mb-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Property Images ({absoluteImageUrls.length})</h5>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {absoluteImageUrls.map((imageUrl, index) => (
              <div 
                key={index}
                className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => openImageModal(imageUrl)}
              >
                <img
                  src={imageUrl}
                  alt={`Property image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onLoad={() => console.log('Image loaded successfully:', imageUrl)}
                  onError={(e) => {
                    console.error('Image failed to load:', imageUrl, e);
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02MCAxMDBDNTMuMzcyNiAxMDAgNDggOTQuNjI3NCA0OCA4OEM0OCA4MS4zNzI2IDUzLjM3MjYgNzYgNjAgNzZDNjYuNjI3NCA3NiA3MiA4MS4zNzI2IDcyIDg4QzcyIDk0LjYyNzQgNjYuNjI3NCAxMDAgNjAgMTAwWiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMTYwIDEyOEg0MEMzNS44MTYgMTI4IDMyIDEyNC4xODQgMzIgMTIwVjgwQzMyIDc1LjgxNiAzNS44MTYgNzIgNDAgNzJIMTYwQzE2NC4xODQgNzIgMTY4IDc1LjgxNiAxNjggODBWMjAwQzE2OCAxMjQuMTg0IDE2NC4xODQgMTI4IDE2MCAxMjhaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white opacity-0 hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Property Video */}
      {absoluteVideoUrl && (
        <div className="mb-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Property Video</h5>
          <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden">
            <video
              controls
              className="w-full h-full object-cover"
              preload="metadata"
            >
              <source src={absoluteVideoUrl} type="video/mp4" />
              <source src={absoluteVideoUrl} type="video/webm" />
              <source src={absoluteVideoUrl} type="video/ogg" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}

      {/* Property Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {propertyAddress && (
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-1">Address</h5>
            <p className="text-sm text-gray-600">{propertyAddress}</p>
          </div>
        )}

        {propertyType && (
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-1">Property Type</h5>
            <p className="text-sm text-gray-600">{propertyType}</p>
          </div>
        )}

        {propertySize && (
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-1">Size</h5>
            <p className="text-sm text-gray-600">{propertySize}</p>
          </div>
        )}
      </div>

      {/* Property Amenities */}
      {amenities.length > 0 && (
        <div className="mt-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Amenities</h5>
          <div className="flex flex-wrap gap-2">
            {amenities.map((amenity, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {amenity}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Property Description */}
      {propertyDescription && (
        <div className="mt-4">
          <h5 className="text-sm font-medium text-gray-700 mb-1">Description</h5>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{propertyDescription}</p>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={closeImageModal}>
          <div className="relative max-w-4xl max-h-full p-4">
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedImage}
              alt="Property"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
              onLoad={() => console.log('Modal image loaded successfully:', selectedImage)}
              onError={(e) => {
                console.error('Modal image failed to load:', selectedImage, e);
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02MCAxMDBDNTMuMzcyNiAxMDAgNDggOTQuNjI3NCA0OCA4OEM0OCA4MS4zNzI2IDUzLjM3MjYgNzYgNjAgNzZDNjYuNjI3NCA3NiA3MiA4MS4zNzI2IDcyIDg4QzcyIDk0LjYyNzQgNjYuNjI3NCAxMDAgNjAgMTAwWiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMTYwIDEyOEg0MEMzNS44MTYgMTI4IDMyIDEyNC4xODQgMzIgMTIwVjgwQzMyIDc1LjgxNiAzNS44MTYgNzIgNDAgNzJIMTYwQzE2NC4xODQgNzIgMTY4IDc1LjgxNiAxNjggODBWMjAwQzE2OCAxMjQuMTg0IDE2NC4xODQgMTI4IDE2MCAxMjhaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyMediaViewer; 