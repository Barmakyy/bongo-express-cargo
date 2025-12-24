import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaPlus, FaTimes } from 'react-icons/fa';
import { FiChevronLeft, FiChevronRight, FiExternalLink } from 'react-icons/fi';
import { format } from 'date-fns';
import api from '../api/axios';
import { useNotification } from '../context/NotificationContext';

const statusStyles = {
  Delivered: 'bg-green-100 text-green-700',
  'In Transit': 'bg-blue-100 text-blue-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Delayed: 'bg-orange-100 text-orange-700',
  Cancelled: 'bg-red-100 text-red-700',
};

import { Link } from 'react-router-dom';
const StatusBadge = ({ status }) => (
  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-700'}`}>
    {status}
  </span>
);

const CustomerShipments = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showNotification } = useNotification();
  const initialFormState = {
    origin: '',
    destination: '',
    weight: '',
    packageDetails: '',
  };
  const [newShipment, setNewShipment] = useState(initialFormState);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/customer-dashboard/shipments?page=${currentPage}&search=${searchTerm}&status=${statusFilter}`);
        setShipments(res.data.data.shipments);
        setPagination(res.data.data.pagination);
      } catch (err) {
        console.error('Failed to fetch shipments:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchShipments();
    }, 300); // Debounce search/filter

    return () => clearTimeout(timer);
  }, [currentPage, searchTerm, statusFilter]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/customer-dashboard/shipments', newShipment);
      setIsModalOpen(false);
      setNewShipment(initialFormState);
      showNotification('Shipment booked successfully!', 'success');
      // Refetch data to show the new shipment
      if (currentPage !== 1) setCurrentPage(1);
      else {
        // Manually trigger refetch if already on page 1
        const res = await api.get(`/customer-dashboard/shipments?page=1&search=${searchTerm}&status=${statusFilter}`);
        setShipments(res.data.data.shipments);
        setPagination(res.data.data.pagination);
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to book shipment.';
      showNotification(message, 'error');
    }
  };

  const fromResult = (pagination.page - 1) * pagination.limit + 1;
  const toResult = fromResult + shipments.length - 1;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-6 rounded-xl shadow-soft-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold text-primary">My Shipments</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-accent text-primary font-bold py-2 px-4 rounded-lg flex items-center hover:bg-yellow-400 transition-colors mt-4 md:mt-0">
          <FaPlus className="mr-2" /> Book New Shipment
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <div className="relative w-full md:w-auto">
          <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Tracking Number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-100 focus:bg-white focus:ring-2 focus:ring-primary border border-gray-200 rounded-full py-2 pl-10 pr-4 transition-all w-full md:w-64"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-100 border border-gray-200 rounded-md py-2 px-3 text-sm w-full md:w-auto"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="In Transit">In Transit</option>
          <option value="Delivered">Delivered</option>
          <option value="Delayed">Delayed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Shipments Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-3 text-sm font-semibold text-gray-600">Tracking #</th>
              <th className="p-3 text-sm font-semibold text-gray-600">Origin</th>
              <th className="p-3 text-sm font-semibold text-gray-600">Destination</th>
              <th className="p-3 text-sm font-semibold text-gray-600">Status</th>
              <th className="p-3 text-sm font-semibold text-gray-600">Date</th>
              <th className="p-3 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center p-6 text-gray-500">Loading shipments...</td></tr>
            ) : shipments.length > 0 ? (
              shipments.map((shipment) => (
                <tr key={shipment._id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-3 text-sm font-medium text-primary">{shipment.shipmentId}</td>
                  <td className="p-3 text-sm text-gray-700">{shipment.origin}</td>
                  <td className="p-3 text-sm text-gray-700">{shipment.destination}</td>
                  <td className="p-3 text-sm"><StatusBadge status={shipment.status} /></td>
                  <td className="p-3 text-sm text-gray-500">{format(new Date(shipment.dispatchDate), 'MMM dd, yyyy')}</td>
                  <td className="p-3 text-sm">
                    <Link to={`/customer/dashboard/shipments/${shipment._id}/track`} className="text-primary hover:underline font-semibold flex items-center">
                      Track <FiExternalLink className="ml-1" />
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" className="text-center p-6 text-gray-500">No shipments found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-gray-500">
          Showing {shipments.length > 0 ? fromResult : 0} to {toResult} of {pagination.total} results
        </p>
        <div className="flex items-center">
          <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50">
            <FiChevronLeft />
          </button>
          <span className="px-4 py-2 text-sm font-medium bg-accent/20 text-accent rounded-md">{currentPage}</span>
          <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === pagination.totalPages} className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50">
            <FiChevronRight />
          </button>
        </div>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
            <motion.div
              className="bg-white rounded-lg shadow-2xl w-full max-w-lg"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold text-primary">Book a New Shipment</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <FaTimes size={20} />
                </button>
              </div>
              <form onSubmit={handleBookingSubmit}>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Origin</label>
                      <input type="text" placeholder="e.g., Nairobi" value={newShipment.origin} onChange={(e) => setNewShipment({ ...newShipment, origin: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Destination</label>
                      <input type="text" placeholder="e.g., Mombasa" value={newShipment.destination} onChange={(e) => setNewShipment({ ...newShipment, destination: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                    <input type="number" placeholder="e.g., 5" value={newShipment.weight} onChange={(e) => setNewShipment({ ...newShipment, weight: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Package Details</label>
                    <textarea
                      rows="3"
                      placeholder="e.g., 1 box of documents"
                      value={newShipment.packageDetails}
                      onChange={(e) => setNewShipment({ ...newShipment, packageDetails: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="p-6 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors">Book Shipment</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CustomerShipments;