import React from 'react';
import { Link } from 'react-router-dom';

const PropertyCard = ({ property, onEdit, onDelete }) => {
  // Parse images array
  const parseImages = (images) => {
    if (!images) return [];
    try {
      return typeof images === 'string' ? JSON.parse(images) : images;
    } catch {
      return [];
    }
  };

  // Parse amenities array
  const parseAmenities = (amenities) => {
    if (!amenities) return [];
    try {
      return typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
    } catch {
      return [];
    }
  };

  const propertyImages = parseImages(property.images);
  const propertyAmenities = parseAmenities(property.amenities);
  const hasVirtualTour = property.virtualTourUrl || property.videoUrl;

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Get furnishing status
  const getFurnishingStatus = (furnished) => {
    if (furnished === true || furnished === 'true') return 'Furnished';
    if (furnished === 'partially') return 'Part. Furnished';
    return 'Unfurnished';
  };

  // Get property type display name
  const getPropertyTypeDisplay = (type) => {
    const typeMap = {
      'APARTMENT': 'Apartment',
      'HOUSE': 'House',
      'LOFT': 'Loft',
      'STUDIO': 'Studio',
      'PENTHOUSE': 'Penthouse',
      'VILLA': 'Villa'
    };
    return typeMap[type] || type;
  };

  // Format location
  const formatLocation = (property) => {
    const parts = [];
    if (property.district) parts.push(property.district);
    if (property.city) parts.push(property.city);
    return parts.join(', ');
  };

  // Format floor info
  const formatFloorInfo = (floor, totalFloors) => {
    if (!floor && !totalFloors) return '';
    if (!totalFloors) return `${floor}${getOrdinalSuffix(floor)} floor`;
    return `${floor}${getOrdinalSuffix(floor)} floor of ${totalFloors}`;
  };

  const getOrdinalSuffix = (num) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  };

  // Truncate description
  const truncateDescription = (text, maxLength = 120) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Image Section */}
      <div className="relative h-48 bg-gray-100">
        {propertyImages.length > 0 ? (
          <img 
            src={propertyImages[0]} 
            alt={property.title || property.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}

        {/* Virtual Tour Badge */}
        {hasVirtualTour && (
          <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Virtual Tour
          </div>
        )}

        {/* Price Badge */}
        <div className="absolute top-3 right-3 bg-gray-800 text-white px-2 py-1 rounded-md text-sm font-semibold">
          {property.rentAmount || property.monthlyRent} zł
        </div>

        {/* Property Type Badge */}
        <div className="absolute bottom-3 left-3 bg-gray-600 text-white px-2 py-1 rounded-md text-xs font-medium">
          {getPropertyTypeDisplay(property.propertyType)}
        </div>

        {/* Furnishing Badge */}
        <div className="absolute bottom-3 right-3 bg-gray-600 text-white px-2 py-1 rounded-md text-xs font-medium">
          {getFurnishingStatus(property.furnished)}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Title and Location */}
        <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
          {property.title || property.name}
        </h3>
        
        <div className="flex items-center text-gray-600 text-sm mb-3">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {formatLocation(property)}
        </div>

        {/* Property Specs */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
          <div className="flex items-center text-gray-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
            </svg>
            {property.bedrooms || property.rooms} {property.bedrooms === 1 ? 'room' : 'rooms'}
          </div>
          
          <div className="flex items-center text-gray-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
            {property.bathrooms || property.bath} {property.bathrooms === 1 ? 'bath' : 'bath'}
          </div>

          {property.parking && (
            <div className="flex items-center text-gray-600">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              Parking
            </div>
          )}

          {(property.floor || property.totalFloors) && (
            <div className="flex items-center text-gray-600">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {formatFloorInfo(property.floor, property.totalFloors)}
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {truncateDescription(property.description)}
        </p>

        {/* Amenities */}
        {propertyAmenities.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center text-gray-700 text-sm font-medium mb-2">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Amenities
            </div>
            <div className="flex flex-wrap gap-1">
              {propertyAmenities.slice(0, 5).map((amenity, index) => (
                <span 
                  key={index}
                  className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs"
                >
                  {amenity}
                </span>
              ))}
              {propertyAmenities.length > 5 && (
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs">
                  +{propertyAmenities.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Meta Information */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span>Added {formatDate(property.createdAt)}</span>
          <div className="flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Property #{property.id}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(property)}
            className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button
            onClick={() => onDelete(property)}
            className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard; 