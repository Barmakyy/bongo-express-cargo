import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaShippingFast, FaCheckCircle, FaTimesCircle, FaSpinner, FaMapMarkerAlt, FaCalendarAlt } from 'react-icons/fa';
import api from '../api/axios';
import { format } from 'date-fns';

const TrackingPage = () => {
  const { trackingId } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inputValue, setInputValue] = useState(trackingId || '');

  useEffect(() => {
    if (trackingId) {
      fetchShipment(trackingId);
    } else {
      setLoading(false);
    }
  }, [trackingId]);

  const fetchShipment = async (id) => {
    setLoading(true);
    setError('');
    setShipment(null);
    try {
      const res = await api.get(`/track/${id}`);
      setShipment(res.data.data.shipment);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to track shipment.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      navigate(`/track/${inputValue.trim()}`);
    }
  };

  const getStatusIcon = (status) => {
    const iconClass = "text-2xl mr-4";
    switch (status) {
      case 'Delivered': return <FaCheckCircle className={`${iconClass} text-green-500`} />;
      case 'Pending': return <FaSpinner className={`${iconClass} text-yellow-500 animate-spin`} />;
      case 'In Transit': return <FaShippingFast className={`${iconClass} text-blue-500`} />;
      default: return <FaTimesCircle className={`${iconClass} text-red-500`} />;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h1 className="text-4xl font-bold text-primary text-center mb-2">Track Your Package</h1>
            <p className="text-center text-gray-600 mb-6">Enter your tracking ID to see the latest updates.</p>
            <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter Tracking ID (e.g., BE-XXXXXX)"
                className="grow w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
              />
              <button type="submit" disabled={loading} className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-opacity-90 transition-colors disabled:bg-primary/50 flex items-center justify-center">
                {loading ? <FaSpinner className="animate-spin" /> : 'Track'}
              </button>
            </form>
          </div>

          {loading && !shipment && (
            <div className="text-center p-8"><FaSpinner className="animate-spin text-primary text-4xl mx-auto" /></div>
          )}

          {error && (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-lg shadow-md text-center">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </motion.div>
          )}

          {shipment && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-8">
                <div className="flex items-center mb-6">
                  {getStatusIcon(shipment.status)}
                  <div>
                    <p className="text-sm text-gray-500">Tracking ID</p>
                    <h2 className="text-2xl font-bold text-primary">{shipment.shipmentId}</h2>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-sm text-gray-500">Status</p>
                    <p className={`text-xl font-bold text-${shipment.status === 'Delivered' ? 'green' : 'blue'}-500`}>{shipment.status}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700 mb-8">
                  <div><span className="font-semibold">Origin:</span> {shipment.origin}</div>
                  <div><span className="font-semibold">Destination:</span> {shipment.destination}</div>
                  <div><span className="font-semibold">Booked On:</span> {format(new Date(shipment.createdAt), 'MMM dd, yyyy')}</div>
                  {shipment.estimatedDelivery && <div><span className="font-semibold">Est. Delivery:</span> {format(new Date(shipment.estimatedDelivery), 'MMM dd, yyyy')}</div>}
                </div>

                <h3 className="text-xl font-bold text-primary mb-4 border-t pt-6">Tracking History</h3>
                <div className="space-y-6">
                  {(shipment.trackingHistory || []).slice().reverse().map((entry, index) => (
                    <div key={index} className="flex">
                      <div className="flex flex-col items-center mr-4">
                        <div>
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${index === 0 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                            <FaMapMarkerAlt />
                          </div>
                        </div>
                        {index < shipment.trackingHistory.length - 1 && <div className="w-px h-full bg-gray-200"></div>}
                      </div>
                      <div className="pb-8">
                        <p className={`font-bold ${index === 0 ? 'text-primary' : 'text-gray-800'}`}>{entry.status}</p>
                        <p className="text-sm text-gray-600">{entry.location}</p>
                        <p className="text-xs text-gray-400 mt-1 flex items-center"><FaCalendarAlt className="mr-1.5" />{format(new Date(entry.timestamp), 'MMM dd, yyyy, h:mm a')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TrackingPage;