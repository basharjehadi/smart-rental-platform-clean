import React from 'react';
import { Link } from 'react-router-dom';

const PropertyCard = ({ property, onEdit, onDelete }) => {
  // Check if property has open move-in issues
  const hasOpenMoveInIssues = property.leases?.some(lease => 
    lease.moveInIssues?.some(issue => issue.status === 'OPEN')
  );
  
  // Get the first open issue for navigation
  const firstOpenIssue = property.leases?.flatMap(lease => 
    lease.moveInIssues?.filter(issue => issue.status === 'OPEN') || []
  )[0];
  // Parse images array
  const parseImages = images => {
    if (!images) return [];
    try {
      return typeof images === 'string' ? JSON.parse(images) : images;
    } catch {
      return [];
    }
  };

  // Parse amenities array
  const parseAmenities = amenities => {
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
  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get furnishing status
  const getFurnishingStatus = furnished => {
    if (furnished === true || furnished === 'true') return 'Furnished';
    if (furnished === 'partially') return 'Part. Furnished';
    return 'Unfurnished';
  };

  // Get property type display name
  const getPropertyTypeDisplay = type => {
    const typeMap = {
      APARTMENT: 'Apartment',
      HOUSE: 'House',
      LOFT: 'Loft',
      STUDIO: 'Studio',
      PENTHOUSE: 'Penthouse',
      VILLA: 'Villa',
      ROOM: 'Room',
      SHARED_ROOM: 'Shared Room',
    };
    return typeMap[type] || type;
  };

  // Format location
  const formatLocation = property => {
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

  const getOrdinalSuffix = num => {
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
    <div className='bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group'>
      {/* Image Section */}
      <div className='relative h-56 bg-gradient-to-br from-gray-100 to-gray-200'>
        {propertyImages.length > 0 ? (
          <img
            src={propertyImages[0]}
            alt={property.title || property.name}
            className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
          />
        ) : (
          <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200'>
            <div className='text-center'>
              <svg
                className='w-16 h-16 text-gray-400 mx-auto mb-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                />
              </svg>
              <p className='text-gray-500 text-sm'>No Image Available</p>
            </div>
          </div>
        )}

        {/* Overlay Gradient */}
        <div className='absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent'></div>

        {/* Virtual Tour Badge */}
        {hasVirtualTour && (
          <div className='absolute top-4 left-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center shadow-lg backdrop-blur-sm'>
            <svg
              className='w-3 h-3 mr-1.5'
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
            Virtual Tour
          </div>
        )}

        {/* Price Badge */}
        <div className='absolute top-4 right-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg backdrop-blur-sm'>
          {property.rentAmount || property.monthlyRent} zł
        </div>

        {/* Property Type Badge */}
        <div className='absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg'>
          {getPropertyTypeDisplay(property.propertyType)}
        </div>

        {/* Furnishing Badge */}
        <div className='absolute bottom-4 right-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm flex items-center'>
          <svg
            className='w-3 h-3 mr-1.5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
            />
          </svg>
          {getFurnishingStatus(property.furnished)}
        </div>

        {/* Move-In Issue Badge */}
        {hasOpenMoveInIssues && firstOpenIssue && (
          <Link
            to={`/landlord/issue/${firstOpenIssue.id}`}
            className='absolute top-4 left-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center shadow-lg backdrop-blur-sm z-10'
          >
            <svg
              className='w-3 h-3 mr-1.5'
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
            Move-In Issue Reported
          </Link>
        )}
      </div>

      {/* Content Section */}
      <div className='p-6'>
        {/* Title and Location */}
        <h3 className='text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors duration-200'>
          {property.title || property.name}
        </h3>

        <div className='flex items-center text-gray-600 text-sm mb-4'>
          <svg
            className='w-4 h-4 mr-2 text-blue-500'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
            />
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
            />
          </svg>
          <span className='font-medium'>{formatLocation(property)}</span>
        </div>

        {/* Property Specs */}
        <div className='grid grid-cols-2 gap-3 mb-4'>
          <div className='flex items-center p-2 bg-blue-50 rounded-lg'>
            <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3'>
              <svg
                className='w-4 h-4 text-blue-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
                />
              </svg>
            </div>
            <div>
              <p className='text-xs text-gray-500'>Rooms</p>
              <p className='text-sm font-semibold text-gray-900'>
                {property.bedrooms || property.rooms}
              </p>
            </div>
          </div>

          <div className='flex items-center p-2 bg-green-50 rounded-lg'>
            <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3'>
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
                  d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                />
              </svg>
            </div>
            <div>
              <p className='text-xs text-gray-500'>Bath</p>
              <p className='text-sm font-semibold text-gray-900'>
                {property.bathrooms || property.bath}
              </p>
            </div>
          </div>

          {property.parking && (
            <div className='flex items-center p-2 bg-purple-50 rounded-lg'>
              <div className='w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3'>
                <svg
                  className='w-4 h-4 text-purple-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4'
                  />
                </svg>
              </div>
              <div>
                <p className='text-xs text-gray-500'>Parking</p>
                <p className='text-sm font-semibold text-gray-900'>Yes</p>
              </div>
            </div>
          )}

          {property.petsAllowed && (
            <div className='flex items-center p-2 bg-pink-50 rounded-lg'>
              <div className='w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center mr-3'>
                <svg
                  className='w-4 h-4 text-pink-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
                  />
                </svg>
              </div>
              <div>
                <p className='text-xs text-gray-500'>Pets</p>
                <p className='text-sm font-semibold text-gray-900'>Allowed</p>
              </div>
            </div>
          )}

          {property.smokingAllowed && (
            <div className='flex items-center p-2 bg-red-50 rounded-lg'>
              <div className='w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3'>
                <svg
                  className='w-4 h-4 text-red-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z'
                  />
                </svg>
              </div>
              <div>
                <p className='text-xs text-gray-500'>Smoking</p>
                <p className='text-sm font-semibold text-gray-900'>Allowed</p>
              </div>
            </div>
          )}

          {(property.floor || property.totalFloors) && (
            <div className='flex items-center p-2 bg-orange-50 rounded-lg'>
              <div className='w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3'>
                <svg
                  className='w-4 h-4 text-orange-600'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                  />
                </svg>
              </div>
              <div>
                <p className='text-xs text-gray-500'>Floor</p>
                <p className='text-sm font-semibold text-gray-900'>
                  {formatFloorInfo(property.floor, property.totalFloors)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <p className='text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed'>
          {truncateDescription(property.description)}
        </p>

        {/* Amenities */}
        {propertyAmenities.length > 0 && (
          <div className='mb-4'>
            <div className='flex items-center text-gray-700 text-sm font-semibold mb-3'>
              <svg
                className='w-4 h-4 mr-2 text-green-500'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M5 13l4 4L19 7'
                />
              </svg>
              Amenities
            </div>
            <div className='flex flex-wrap gap-2'>
              {propertyAmenities.slice(0, 4).map((amenity, index) => (
                <span
                  key={index}
                  className='bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-xs font-medium border border-gray-200'
                >
                  {amenity}
                </span>
              ))}
              {propertyAmenities.length > 4 && (
                <span className='bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium border border-blue-200'>
                  +{propertyAmenities.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Meta Information */}
        <div className='flex items-center justify-between text-xs text-gray-500 mb-5 p-3 bg-gray-50 rounded-lg'>
          <div className='flex items-center'>
            <svg
              className='w-3 h-3 mr-1.5 text-gray-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
              />
            </svg>
            Added {formatDate(property.createdAt)}
          </div>
          <div className='flex items-center'>
            <svg
              className='w-3 h-3 mr-1.5 text-yellow-500'
              fill='currentColor'
              viewBox='0 0 24 24'
            >
              <path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' />
            </svg>
            Property #{property.id}
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex space-x-3'>
          <Link
            to={`/landlord-property-details/${property.id}`}
            className='flex-1 px-4 py-2.5 text-sm font-semibold text-blue-600 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow-md'
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
                d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
              />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
              />
            </svg>
            View Details
          </Link>
          <button
            onClick={() => onEdit(property)}
            className='px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl hover:from-gray-100 hover:to-gray-200 transition-all duration-200 shadow-sm hover:shadow-md'
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
                d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete(property)}
            className='px-4 py-2.5 text-sm font-semibold text-red-600 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl hover:from-red-100 hover:to-red-200 transition-all duration-200 shadow-sm hover:shadow-md'
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
                d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
