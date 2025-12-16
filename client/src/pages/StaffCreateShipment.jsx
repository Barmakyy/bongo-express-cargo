import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPaperPlane, FaSpinner } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useNotification } from '../context/NotificationContext';

const StaffCreateShipment = () => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
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
      const res = await api.post('/staff-dashboard/shipments', formData);
      showNotification('Shipment created successfully!', 'success');
      navigate('/staff/dashboard/shipments');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create shipment.';
      showNotification(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-primary mb-6 border-b pb-4">Create New Shipment</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Column 1: Customer & Shipment Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Customer & Shipment Info</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                  <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" placeholder="e.g., John Doe" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer Phone</label>
                  <input type="tel" name="customerPhone" value={formData.customerPhone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" placeholder="e.g., +254712345678" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Package Details</label>
                  <textarea name="packageDetails" rows="4" placeholder="e.g., 1 box of documents, fragile" value={formData.packageDetails} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required></textarea>
                </div>
              </div>
            </div>

            {/* Column 2: Logistics */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Logistics</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Origin</label>
                  <input type="text" name="origin" placeholder="e.g., Nairobi" value={formData.origin} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Destination</label>
                  <input type="text" name="destination" placeholder="e.g., Mombasa" value={formData.destination} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                  <input type="number" name="weight" placeholder="e.g., 5" value={formData.weight} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center disabled:bg-primary/70"
            >
              {isSubmitting ? <FaSpinner className="animate-spin mr-2" /> : <FaPaperPlane className="mr-2" />}
              Create Shipment
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default StaffCreateShipment;