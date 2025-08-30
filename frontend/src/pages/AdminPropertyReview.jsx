import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import PropertyMapCard from '../components/PropertyMapCard';

const AdminPropertyReview = () => {
  const { offerId } = useParams();
  const navigate = useNavigate();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const baseUrl = useMemo(
    () => import.meta.env.VITE_API_URL || 'http://localhost:3001',
    []
  );

  const getFullUrl = path => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${baseUrl}${path}`;
  };

  const parseMaybeJson = value => {
    if (!value) return null;
    if (Array.isArray(value)) return value;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/admin/move-in/offers/${offerId}`);
        setOffer(res.data.offer);
      } catch (e) {
        setError('Failed to load offer details');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [offerId]);

  const images = useMemo(() => {
    const src = offer?.property?.images ?? offer?.propertyImages;
    const arr = parseMaybeJson(src) || [];
    return Array.isArray(arr) ? arr : [];
  }, [offer]);

  const video = useMemo(() => {
    const src = offer?.property?.videos ?? offer?.propertyVideo;
    const parsed = parseMaybeJson(src);
    if (Array.isArray(parsed)) return parsed[0];
    return src || null;
  }, [offer]);

  // Merge property details with offer fallbacks
  const propertyData = useMemo(() => offer?.property || {}, [offer]);

  const getOrdinalSuffix = num => {
    if (!num && num !== 0) return '';
    if (num >= 11 && num <= 13) return 'th';
    switch (num % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };

  const propertySpecs = useMemo(() => {
    const bedrooms =
      propertyData.bedrooms ?? offer?.rentalRequest?.bedrooms ?? '—';
    const bathrooms =
      propertyData.bathrooms ?? offer?.rentalRequest?.bathrooms ?? '—';
    const rawSize = propertyData.size ?? (Number(offer?.propertySize) || null);
    const size = rawSize ? `${rawSize} m²` : '—';
    const floor =
      propertyData.floor && propertyData.totalFloors
        ? `${propertyData.floor}${getOrdinalSuffix(propertyData.floor)} of ${propertyData.totalFloors}`
        : propertyData.floor
          ? `${propertyData.floor}${getOrdinalSuffix(propertyData.floor)}`
          : '—';
    const furnished =
      propertyData.furnished === true
        ? 'Furnished'
        : propertyData.furnished === false
          ? 'Unfurnished'
          : '—';
    const parking =
      propertyData.parking === true
        ? 'Available'
        : propertyData.parking === false
          ? 'Not available'
          : '—';
    return { bedrooms, bathrooms, size, floor, furnished, parking };
  }, [propertyData, offer]);

  const policies = useMemo(
    () => ({
      petsAllowed: propertyData.petsAllowed,
      smokingAllowed: propertyData.smokingAllowed,
    }),
    [propertyData]
  );

  const amenities = useMemo(() => {
    // Prefer property.houseRules (existing app convention), fallback to offer.propertyAmenities
    const fromProperty = propertyData?.houseRules
      ? parseMaybeJson(propertyData.houseRules)
      : null;
    const fromOffer = offer?.propertyAmenities
      ? parseMaybeJson(offer.propertyAmenities)
      : null;
    return Array.isArray(fromProperty) && fromProperty.length > 0
      ? fromProperty
      : Array.isArray(fromOffer)
        ? fromOffer
        : [];
  }, [propertyData, offer]);

  const approve = async () => {
    if (!window.confirm('Approve cancellation for this offer?')) return;
    await api.post(`/move-in/offers/${offerId}/admin/approve`);
    navigate('/admin?tab=movein');
  };

  const reject = async () => {
    if (!window.confirm('Reject cancellation and mark as successful move-in?'))
      return;
    await api.post(`/move-in/offers/${offerId}/admin/reject`);
    navigate('/admin?tab=movein');
  };

  if (loading) return <div className='p-6'>Loading…</div>;
  if (error) return <div className='p-6 text-red-600'>{error}</div>;
  if (!offer) return <div className='p-6'>Not found</div>;

  return (
    <div className='min-h-screen bg-white'>
      <div className='border-b px-6 py-4 flex items-center justify-between'>
        <div>
          <div className='text-sm text-gray-500'>Admin • Property Review</div>
          <h1 className='text-xl font-semibold'>Offer {offer.id}</h1>
        </div>
        <div className='space-x-2'>
          <button
            onClick={() => navigate('/admin?tab=movein')}
            className='px-3 py-1 rounded border'
          >
            Back
          </button>
          <button
            onClick={approve}
            className='px-3 py-1 rounded bg-green-600 text-white'
          >
            Approve
          </button>
          <button
            onClick={reject}
            className='px-3 py-1 rounded bg-red-600 text-white'
          >
            Reject
          </button>
        </div>
      </div>

      <div className='p-6 max-w-6xl mx-auto space-y-6'>
        {/* Summary */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='p-4 bg-gray-50 rounded border'>
            <div className='text-xs text-gray-500'>Tenant</div>
            <div className='font-medium'>
              {offer.tenant?.name} ({offer.tenant?.email})
            </div>
          </div>
          <div className='p-4 bg-gray-50 rounded border'>
            <div className='text-xs text-gray-500'>Landlord</div>
            <div className='font-medium'>
              {offer.landlord?.name} ({offer.landlord?.email})
            </div>
          </div>
          <div className='p-4 bg-gray-50 rounded border'>
            <div className='text-xs text-gray-500'>Status</div>
            <div className='font-medium'>{offer.moveInVerificationStatus}</div>
          </div>
        </div>

        {/* Tenant Original Request + Location side-by-side */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <div className='bg-white rounded border p-4'>
            <h2 className='text-lg font-semibold mb-3'>
              Tenant's Original Request
            </h2>
            {offer.rentalRequest ? (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                <div className='space-y-1'>
                  <div className='text-gray-500'>Budget</div>
                  <div className='font-medium'>
                    {(() => {
                      const from =
                        offer.rentalRequest.budgetFrom ??
                        offer.rentalRequest.budget;
                      const to =
                        offer.rentalRequest.budgetTo ??
                        offer.rentalRequest.budget;
                      const fmt = v =>
                        new Intl.NumberFormat('pl-PL', {
                          style: 'currency',
                          currency: 'PLN',
                          minimumFractionDigits: 0,
                        }).format(v || 0);
                      return from && to && from !== to
                        ? `${fmt(from)} - ${fmt(to)}`
                        : fmt(to || from);
                    })()}
                  </div>
                </div>
                <div className='space-y-1'>
                  <div className='text-gray-500'>Preferred Move-in Date</div>
                  <div className='font-medium'>
                    {new Date(
                      offer.rentalRequest.moveInDate
                    ).toLocaleDateString()}
                  </div>
                </div>
                <div className='space-y-1 md:col-span-2'>
                  <div className='text-gray-500'>Requirements</div>
                  <div className='font-medium whitespace-pre-wrap'>
                    {[
                      offer.rentalRequest.propertyType &&
                        `Property Type: ${offer.rentalRequest.propertyType}`,
                      offer.rentalRequest.bedrooms &&
                        `Bedrooms: ${offer.rentalRequest.bedrooms}`,
                      offer.rentalRequest.bathrooms &&
                        `Bathrooms: ${offer.rentalRequest.bathrooms}`,
                      offer.rentalRequest.location &&
                        `Location: ${offer.rentalRequest.location}`,
                      offer.rentalRequest.preferredNeighborhood &&
                        `Preferred Neighborhood: ${offer.rentalRequest.preferredNeighborhood}`,
                      offer.rentalRequest.additionalRequirements &&
                        `Additional: ${offer.rentalRequest.additionalRequirements}`,
                    ]
                      .filter(Boolean)
                      .join('\n') || '—'}
                  </div>
                </div>
              </div>
            ) : (
              <div className='text-sm text-gray-600'>
                No rental request found for this offer.
              </div>
            )}
          </div>

          <div className='bg-white rounded border p-4'>
            <h2 className='text-lg font-semibold mb-3'>Location</h2>
            <div className='text-sm text-gray-700 mb-3'>
              {propertyData.address ? (
                <>
                  <div>{propertyData.address}</div>
                  <div className='text-gray-500'>
                    {[
                      propertyData.district,
                      propertyData.zipCode,
                      propertyData.city,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                </>
              ) : (
                <div>Address not available</div>
              )}
            </div>
            {propertyData.address && (
              <PropertyMapCard
                address={`${propertyData.address}, ${propertyData.district || ''}, ${propertyData.zipCode || ''}, ${propertyData.city || ''}`}
              />
            )}
          </div>
        </div>

        {/* Specifications + Policies side-by-side */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <div className='bg-white rounded border p-4'>
            <h2 className='text-lg font-semibold mb-3'>Specifications</h2>
            <div className='grid grid-cols-2 md:grid-cols-3 gap-4 text-sm'>
              <div>
                <div className='text-gray-500'>Rooms</div>
                <div className='font-medium'>{propertySpecs.bedrooms}</div>
              </div>
              <div>
                <div className='text-gray-500'>Bathrooms</div>
                <div className='font-medium'>{propertySpecs.bathrooms}</div>
              </div>
              <div>
                <div className='text-gray-500'>Area</div>
                <div className='font-medium'>{propertySpecs.size}</div>
              </div>
              <div>
                <div className='text-gray-500'>Floor</div>
                <div className='font-medium'>{propertySpecs.floor}</div>
              </div>
              <div>
                <div className='text-gray-500'>Furnishing</div>
                <div className='font-medium'>{propertySpecs.furnished}</div>
              </div>
              <div>
                <div className='text-gray-500'>Parking</div>
                <div className='font-medium'>{propertySpecs.parking}</div>
              </div>
            </div>
          </div>
          {(policies.petsAllowed || policies.smokingAllowed) && (
            <div className='bg-white rounded border p-4'>
              <h2 className='text-lg font-semibold mb-3'>Property Policies</h2>
              <div className='space-y-2 text-sm'>
                {policies.petsAllowed && (
                  <div className='p-2 rounded bg-green-50 border border-green-200'>
                    Pets Allowed
                  </div>
                )}
                {policies.smokingAllowed && (
                  <div className='p-2 rounded bg-orange-50 border border-orange-200'>
                    Smoking Allowed
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Available Amenities */}
        <div className='bg-white rounded border p-4'>
          <h2 className='text-lg font-semibold mb-3'>Available Amenities</h2>
          {amenities.length > 0 ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
              {amenities.map((a, i) => (
                <div key={i} className='text-sm p-2 rounded bg-gray-50 border'>
                  {a}
                </div>
              ))}
            </div>
          ) : (
            <div className='text-sm text-gray-600'>No amenities listed.</div>
          )}
        </div>

        {/* Property Media */}
        <div className='bg-white rounded border p-4'>
          <h2 className='text-lg font-semibold mb-3'>Property Media</h2>
          {video && (
            <div className='mb-3'>
              <video
                src={getFullUrl(video)}
                className='w-full rounded'
                controls
              />
            </div>
          )}
          {images.length > 0 ? (
            <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={getFullUrl(img)}
                  alt='property'
                  className='h-40 w-full object-cover rounded border'
                />
              ))}
            </div>
          ) : (
            <div className='text-sm text-gray-600'>No images provided.</div>
          )}
        </div>

        {/* Property Description */}
        <div className='bg-white rounded border p-4'>
          <h2 className='text-lg font-semibold mb-2'>Property Description</h2>
          <div className='text-gray-700 whitespace-pre-wrap'>
            {propertyData.description || offer.propertyDescription || '—'}
          </div>
        </div>

        {/* Additional Terms & Conditions (from landlord) */}
        {(offer.description || offer.rulesText || offer.rulesPdf) && (
          <div className='bg-white rounded border p-4'>
            <h2 className='text-lg font-semibold mb-2'>
              Additional Terms & Conditions
            </h2>
            {offer.description && (
              <ul className='list-disc ml-5 space-y-1 text-sm text-gray-700'>
                {offer.description
                  .split('.')
                  .map(s => s.trim())
                  .filter(Boolean)
                  .map((s, i) => (
                    <li key={i}>{s}.</li>
                  ))}
              </ul>
            )}
            {offer.rulesText && (
              <div className='mt-3 text-sm text-gray-700 whitespace-pre-wrap'>
                {offer.rulesText}
              </div>
            )}
            {offer.rulesPdf && (
              <div className='mt-3'>
                <a
                  href={getFullUrl(offer.rulesPdf)}
                  target='_blank'
                  rel='noreferrer'
                  className='text-blue-600 underline text-sm'
                >
                  View Rules PDF
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPropertyReview;
