import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPaperPlane, FaSpinner } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useNotification } from '../context/NotificationContext';

const GuestBooking = () => {
  const [formData, setFormData] = useState({
    // Sender Info
    senderName: '',
    senderEmail: '',
    senderPhone: '',
    // Shipment Info
    origin: '',
    destination: '',
    weight: '',
    packageDetails: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.post('/shipments/guest-booking', formData);
      showNotification('Shipment booked successfully! You will receive an email with tracking details shortly.', 'success');
      // Redirect to a tracking page with the new shipment ID
      const shipmentId = res.data.data.shipment.shipmentId;
      navigate(`/track/${shipmentId}`);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to book shipment. Please try again.';
      showNotification(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-4xl font-bold text-primary text-center mb-2">Book a Shipment</h1>
            <p className="text-center text-gray-600 mb-8">No account required. Fill in the details below to get started.</p>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Sender Information */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Your Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input type="text" name="senderName" value={formData.senderName} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input type="email" name="senderEmail" value={formData.senderEmail} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input type="tel" name="senderPhone" value={formData.senderPhone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                  </div>
                </div>
              </div>

              {/* Shipment Details */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Shipment Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Origin</label>
                    <input type="text" name="origin" placeholder="e.g., Nairobi" value={formData.origin} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Destination</label>
                    <input type="text" name="destination" placeholder="e.g., Mombasa" value={formData.destination} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                  <input type="number" name="weight" placeholder="e.g., 5" value={formData.weight} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                </div>
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700">Package Details</label>
                  <textarea name="packageDetails" rows="3" placeholder="e.g., 1 box of documents, fragile" value={formData.packageDetails} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required></textarea>
                </div>
              </div>

              <div className="text-right pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center ml-auto disabled:bg-primary/70"
                >
                  {isSubmitting ? <FaSpinner className="animate-spin mr-2" /> : <FaPaperPlane className="mr-2" />}
                  Book Shipment
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GuestBooking;