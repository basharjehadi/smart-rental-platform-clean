import React, { useEffect, useState } from 'react';
import api from '../utils/api';

const AdminMoveInIssues = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/move-in/issues');
      setOffers(res.data.offers || []);
    } catch (e) {
      setError('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const takeAction = async (offerId, action) => {
    if (action === 'approve') {
      await api.post(`/move-in/offers/${offerId}/admin/approve`);
    } else {
      await api.post(`/move-in/offers/${offerId}/admin/reject`);
    }
    await load();
  };

  if (loading) return <div className='p-6'>Loading…</div>;
  if (error) return <div className='p-6 text-red-600'>{error}</div>;

  return (
    <div className='p-6'>
      <h1 className='text-2xl font-semibold mb-4'>Move-in Issues</h1>
      {offers.length === 0 ? (
        <div className='text-gray-600'>No pending issues.</div>
      ) : (
        <div className='space-y-3'>
          {offers.map(o => (
            <div key={o.id} className='p-4 bg-white rounded border'>
              <div className='flex items-center justify-between'>
                <div>
                  <div className='font-medium'>Offer {o.id}</div>
                  <div className='text-sm text-gray-600'>
                    Reason: {o.cancellationReason || '—'}
                  </div>
                  {Array.isArray(o.cancellationEvidence) &&
                    o.cancellationEvidence.length > 0 && (
                      <div className='mt-2 text-xs text-gray-700'>
                        Evidence:
                        <ul className='list-disc ml-5'>
                          {o.cancellationEvidence.map((p, idx) => (
                            <li key={idx}>
                              <a
                                className='text-blue-600 hover:underline'
                                href={`http://localhost:3001${p}`}
                                target='_blank'
                                rel='noreferrer'
                              >
                                {p}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
                <div className='flex items-center space-x-2'>
                  <button
                    className='px-3 py-1 rounded bg-green-600 text-white'
                    onClick={() => takeAction(o.id, 'approve')}
                  >
                    Approve
                  </button>
                  <button
                    className='px-3 py-1 rounded bg-red-600 text-white'
                    onClick={() => takeAction(o.id, 'reject')}
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMoveInIssues;
