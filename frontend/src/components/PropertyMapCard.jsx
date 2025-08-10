import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icon
const customIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

  const PropertyMapCard = ({ address }) => {
    const [coordinates, setCoordinates] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

  console.log('🗺️ PropertyMapCard received address:', address);

  // Simple geocoding function with fallback
  const geocodeAddress = async (address) => {
    try {
      console.log('🗺️ Geocoding address:', address);
      
      if (!address || address.trim() === '') {
        console.log('🗺️ No address provided');
        return null;
      }
      
      // Try different address formats
      const addressFormats = [
        address, // Full address
        address.split(',')[0] + ', ' + address.split(',').pop(), // Street + City
        address.split(',').pop().trim() // Just city
      ];
      
      for (const format of addressFormats) {
        console.log('🗺️ Trying format:', format);
        
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(format)}&format=json&limit=1&countrycodes=pl`,
          {
            headers: {
              'User-Agent': 'SmartRentalSystem/1.0'
            }
          }
        );
        
        if (!response.ok) {
          console.log('🗺️ Geocoding failed with status:', response.status);
          continue;
        }
        
        const data = await response.json();
        console.log('🗺️ Geocoding response:', data);
        
        if (data.length > 0) {
          const coords = {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
            displayName: data[0].display_name,
            address: address
          };
          console.log('🗺️ Geocoding successful with format:', format, coords);
          return coords;
        }
      }
      
      console.log('🗺️ No geocoding results found');
      return null;
    } catch (error) {
      console.error('Geocoding failed:', error);
      return null;
    }
  };

  useEffect(() => {
    const getCoordinates = async () => {
      console.log('🗺️ useEffect triggered with address:', address);
      
      if (!address) {
        console.log('🗺️ No address provided');
        setLoading(false);
        setError('No address provided');
        return;
      }

      try {
        console.log('🗺️ Starting geocoding...');
        setLoading(true);
        setError(null);
        
        // Geocoding with 5-second timeout for better accuracy
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        
        const geocodePromise = geocodeAddress(address);
        const coords = await Promise.race([geocodePromise, timeoutPromise]);
        
        console.log('🗺️ Setting coordinates:', coords);
        if (coords) {
          setCoordinates(coords);
        } else {
          setError('Location not found');
        }
      } catch (err) {
        console.error('🗺️ Map loading error:', err);
        setError('Failed to load location');
      } finally {
        console.log('🗺️ Setting loading to false');
        setLoading(false);
      }
    };

    getCoordinates();
  }, [address]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  // Show error state if no coordinates
  if (error || !coordinates) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-600">Location not available</p>
          <p className="text-xs text-gray-500 mt-1">{error || 'Unable to display map'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <MapContainer 
        center={[coordinates.lat, coordinates.lng]} 
        zoom={15} 
        style={{ height: '300px', width: '100%' }}
        className="rounded-lg overflow-hidden"
        zoomControl={true}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        dragging={true}
        touchZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />
        <Marker position={[coordinates.lat, coordinates.lng]} icon={customIcon}>
          <Popup>
            <div className="text-center">
              <div className="font-semibold text-gray-900">Property Location</div>
              <div className="text-sm text-gray-600 mt-1">{address}</div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
      
      {/* Map attribution */}
      <div className="text-xs text-gray-500 mt-2 text-center">
        © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="hover:underline">OpenStreetMap</a> contributors
      </div>
    </div>
  );
};

export default PropertyMapCard;
