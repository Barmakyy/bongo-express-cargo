import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch, FaTimes, FaEye, FaPhone, FaUser, FaMapMarkerAlt, FaBox, FaCalendar } from 'react-icons/fa';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
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

const StatusBadge = ({ status }) => (
  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-700'}`}>
    {status}
  </span>
);

const StaffShipments = () => {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const { showNotification } = useNotification();

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/staff-dashboard/shipments?page=${currentPage}&search=${searchTerm}&status=${statusFilter}`);
      setShipments(res.data.data.shipments);
      setPagination(res.data.data.pagination);
    } catch (err) {
      showNotification('Failed to fetch shipments.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchShipments();
    }, 300);
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm, statusFilter]);

  const handleStatusUpdate = async (shipmentId, newStatus) => {
    try {
      // For this simple update, we won't ask for location.
      // A more complex implementation could open a modal.
      await api.patch(`/staff-dashboard/shipments/${shipmentId}`, { status: newStatus });
      showNotification('Shipment status updated!', 'success');
      fetchShipments(); // Refresh the list
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update status.', 'error');
    }
  };

  const handleViewDetails = async (shipmentId) => {
    try {
      setViewLoading(true);
      setViewModalOpen(true);
      const res = await api.get(`/staff-dashboard/shipments/${shipmentId}`);
      setSelectedShipment(res.data.data.shipment);
    } catch (err) {
      showNotification('Failed to load shipment details.', 'error');
      setViewModalOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setSelectedShipment(null);
  };

  const fromResult = (pagination.page - 1) * pagination.limit + 1;
  const toResult = fromResult + shipments.length - 1;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-6 rounded-xl shadow-soft-lg">
      <h1 className="text-2xl font-bold text-primary mb-6">My Assigned Shipments</h1>

      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <div className="relative w-full md:w-auto">
          <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Tracking #"
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
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-3 text-sm font-semibold text-gray-600">Tracking #</th>
              <th className="p-3 text-sm font-semibold text-gray-600">Customer</th>
              <th className="p-3 text-sm font-semibold text-gray-600">Phone</th>
              <th className="p-3 text-sm font-semibold text-gray-600">Origin</th>
              <th className="p-3 text-sm font-semibold text-gray-600">Destination</th>
              <th className="p-3 text-sm font-semibold text-gray-600">Status</th>
              <th className="p-3 text-sm font-semibold text-gray-600">Created</th>
              <th className="p-3 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="text-center p-6 text-gray-500">Loading shipments...</td></tr>
            ) : shipments.length > 0 ? (
              shipments.map((shipment) => (
                <tr key={shipment._id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-sm font-medium text-primary">{shipment.shipmentId}</td>
                  <td className="p-3 text-sm text-gray-700">
                    {shipment.customer?.name || shipment.guestDetails?.name || 'N/A'}
                  </td>
                  <td className="p-3 text-sm text-gray-700">
                    {shipment.customer?.phone || shipment.guestDetails?.phone || 'N/A'}
                  </td>
                  <td className="p-3 text-sm text-gray-700">{shipment.origin}</td>
                  <td className="p-3 text-sm text-gray-700">{shipment.destination}</td>
                  <td className="p-3 text-sm"><StatusBadge status={shipment.status} /></td>
                  <td className="p-3 text-sm text-gray-500">
                    {shipment.createdAt ? format(new Date(shipment.createdAt), 'MMM dd, yyyy') : 'N/A'}
                  </td>
                  <td className="p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetails(shipment._id)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                        title="View Details"
                      >
                        <FaEye size={16} />
                      </button>
                      <select
                        value={shipment.status}
                        onChange={(e) => handleStatusUpdate(shipment._id, e.target.value)}
                        className="bg-white border border-gray-300 rounded-md py-1 px-2 text-xs"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Delayed">Delayed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="8" className="text-center p-6 text-gray-500">No shipments assigned to you.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-gray-500">
          Showing {shipments.length > 0 ? fromResult : 0} to {toResult} of {pagination.total} results
        </p>
        <div className="flex items-center">
          <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50">
            <FiChevronLeft />
          </button>
          <span className="px-4 py-2 text-sm font-medium bg-accent/20 text-accent rounded-md">{currentPage}</span>
          <button onClick={() => setCurrentPage(p => p + 1)} disabled={pagination.totalPages && currentPage === pagination.totalPages} className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50">
            <FiChevronRight />
          </button>
        </div>
      </div>

      {/* View Details Modal */}
      <AnimatePresence>
        {viewModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-opacity-10 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={closeViewModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-primary">Shipment Details</h2>
                <button
                  onClick={closeViewModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes size={24} />
                </button>
              </div>

              {viewLoading ? (
                <div className="p-8 text-center text-gray-500">Loading shipment details...</div>
              ) : selectedShipment ? (
                <div className="p-6 space-y-6">
                  {/* Shipment ID & Status */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Tracking Number</p>
                      <p className="text-2xl font-bold text-primary">{selectedShipment.shipmentId}</p>
                    </div>
                    <StatusBadge status={selectedShipment.status} />
                  </div>

                  {/* Customer Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <FaUser className="text-accent" /> Customer Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium text-gray-800">
                          {selectedShipment.customer?.name || selectedShipment.guestDetails?.name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium text-gray-800 flex items-center gap-1">
                          <FaPhone className="text-accent" size={12} />
                          {selectedShipment.customer?.phone || selectedShipment.guestDetails?.phone || 'N/A'}
                        </p>
                      </div>
                      {selectedShipment.customer?.email && (
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium text-gray-800">{selectedShipment.customer.email}</p>
                        </div>
                      )}
                      {selectedShipment.customer?.location && (
                        <div>
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="font-medium text-gray-800">{selectedShipment.customer.location}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Shipment Details */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <FaBox className="text-accent" /> Shipment Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Origin</p>
                        <p className="font-medium text-gray-800 flex items-center gap-1">
                          <FaMapMarkerAlt className="text-green-600" size={12} />
                          {selectedShipment.origin}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Destination</p>
                        <p className="font-medium text-gray-800 flex items-center gap-1">
                          <FaMapMarkerAlt className="text-red-600" size={12} />
                          {selectedShipment.destination}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Weight</p>
                        <p className="font-medium text-gray-800">{selectedShipment.weight || 'N/A'} kg</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Cost</p>
                        <p className="font-medium text-gray-800">KSh {selectedShipment.cost?.toLocaleString() || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Created Date</p>
                        <p className="font-medium text-gray-800 flex items-center gap-1">
                          <FaCalendar className="text-accent" size={12} />
                          {selectedShipment.createdAt ? format(new Date(selectedShipment.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Estimated Delivery</p>
                        <p className="font-medium text-gray-800">
                          {selectedShipment.estimatedDelivery ? format(new Date(selectedShipment.estimatedDelivery), 'MMM dd, yyyy') : 'N/A'}
                        </p>
                      </div>
                      {selectedShipment.packageDetails && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-500">Package Details</p>
                          <p className="font-medium text-gray-800">{selectedShipment.packageDetails}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tracking History */}
                  {selectedShipment.trackingHistory && selectedShipment.trackingHistory.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Tracking History</h3>
                      <div className="space-y-3">
                        {selectedShipment.trackingHistory.map((track, index) => (
                          <div key={index} className="flex items-start gap-3 border-l-2 border-accent pl-4 py-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <StatusBadge status={track.status} />
                                <span className="text-sm text-gray-600">{track.location}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {track.timestamp ? format(new Date(track.timestamp), 'MMM dd, yyyy HH:mm') : 'N/A'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  {selectedShipment.staff && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Staff Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Assigned Staff</p>
                          <p className="font-medium text-gray-800">{selectedShipment.staff.name}</p>
                        </div>
                        {selectedShipment.staff.email && (
                          <div>
                            <p className="text-sm text-gray-500">Staff Email</p>
                            <p className="font-medium text-gray-800">{selectedShipment.staff.email}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">No shipment data available</div>
              )}

              <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end">
                <button
                  onClick={closeViewModal}
                  className="bg-accent text-white px-6 py-2 rounded-md hover:bg-accent/90 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StaffShipments;