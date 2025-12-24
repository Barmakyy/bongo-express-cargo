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
    cost: '',
    paymentMethod: 'Cash',
    paymentStatus: 'Pending',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate cost
    if (!formData.cost || parseFloat(formData.cost) <= 0) {
      showNotification('Please enter a valid cost amount', 'error');
      return;
    }
    
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
                  <input type="number" name="weight" placeholder="e.g., 5" value={formData.weight} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Payment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Shipment Cost (KSh) *</label>
                <input 
                  type="number" 
                  name="cost" 
                  min="1" 
                  step="0.01"
                  placeholder="Enter amount" 
                  value={formData.cost} 
                  onChange={handleChange} 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Method *</label>
                <select 
                  name="paymentMethod" 
                  value={formData.paymentMethod} 
                  onChange={handleChange} 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  required
                >
                  <option value="Cash">Cash</option>
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Card</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Status *</label>
                <select 
                  name="paymentStatus" 
                  value={formData.paymentStatus} 
                  onChange={handleChange} 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  required
                >
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
            {formData.cost && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Total Amount:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    KSh {parseFloat(formData.cost).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
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