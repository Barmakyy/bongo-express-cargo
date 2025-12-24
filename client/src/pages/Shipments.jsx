import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaSearch, FaTruck, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaBoxOpen, FaSpinner } from 'react-icons/fa';
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

const StatCard = ({ title, value, icon, color }) => (
  <div className={`bg-white p-4 rounded-lg shadow-md flex flex-col items-center ${color}`}>
    <div className="p-3 rounded-full bg-white mb-2">{icon}</div>
    <div className="text-center">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-primary">{value}</p>
    </div>
  </div>
);

const StatusBadge = ({ status }) => (
  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-700'}`}>
    {status}
  </span>
);

const Shipments = () => {
  const [shipments, setShipments] = useState([]);
  const [summary, setSummary] = useState({});
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const { showNotification } = useNotification();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const initialFormState = {
    customerName: '',
    customerPhone: '',
    origin: '',
    destination: '',
    weight: '',
    packageDetails: '',
    status: 'Pending',
    agent: '',
  };
  const [currentShipment, setCurrentShipment] = useState(initialFormState);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');
  const [staffFilter, setStaffFilter] = useState('All');
  const [editingShipment, setEditingShipment] = useState(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [shipmentsRes, summaryRes, staffRes] = await Promise.all([
        api.get(`/shipments?page=${currentPage}&limit=${limit}&search=${searchTerm}&status=${statusFilter}&branch=${branchFilter}&staff=${staffFilter}`),
        api.get('/shipments/summary'),
        api.get('/staff/list'),
      ]);
      setShipments(shipmentsRes.data.data.shipments);
      setPagination(shipmentsRes.data.data.pagination);
      setSummary(summaryRes.data.data);
      setStaffList(staffRes.data.data.staff);
    } catch (err) {
      showNotification('Failed to fetch shipment data.', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) setCurrentPage(1);
      else fetchData();
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, branchFilter, staffFilter]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingShipment) {
        // Update existing shipment
        await api.put(`/shipments/${editingShipment._id}`, currentShipment);
        showNotification('Shipment updated successfully!', 'success');
      } else {
        // Create new shipment
        await api.post('/shipments', currentShipment);
        showNotification('Shipment created successfully!', 'success');
      }
      setIsModalOpen(false);
      setEditingShipment(null);
      if (currentPage !== 1 && !editingShipment) {
        setCurrentPage(1);
      } else {
        fetchData(); // Refetch data
      }
    } catch (err) {
      const message = err.response?.data?.message || `Failed to ${editingShipment ? 'update' : 'create'} shipment.`;
      showNotification(message, 'error');
      console.error(err);
    }
  };

  const openCreateModal = () => {
    setEditingShipment(null);
    setCurrentShipment(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (shipment) => {
    setEditingShipment(shipment);
    setCurrentShipment({
      customerName: shipment.customer?.name || '',
      customerPhone: shipment.customer?.phone || shipment.guestDetails?.phone || '',
      origin: shipment.origin,
      destination: shipment.destination,
      weight: shipment.weight,
      packageDetails: shipment.packageDetails,
      agent: shipment.agent?._id || '',
      status: shipment.status,
    });
    setIsModalOpen(true);
  };

  const openViewModal = (shipment) => {
    setSelectedShipment(shipment);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedShipment(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingShipment(null);
    setCurrentShipment(initialFormState);
  };

  const handleDelete = async (shipmentId) => {
    if (window.confirm('Are you sure you want to delete this shipment?')) {
      try {
        await api.delete(`/shipments/${shipmentId}`);
        showNotification('Shipment deleted successfully.', 'success');
        fetchData(); // Refetch data
      } catch (err) {
        showNotification('Failed to delete shipment.', 'error');
        console.error(err);
      }
    }
  };

  const fromResult = (pagination.page - 1) * pagination.limit + 1;
  const toResult = fromResult + shipments.length - 1;

  return (
    <div>
      {/* 1. Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Shipments Management</h1>
          <p className="text-gray-500 mt-1">View, update, and track all shipment activities.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-accent text-primary font-bold py-2 px-4 rounded-lg flex items-center hover:bg-yellow-400 transition-colors"
        >
          <FaPlus className="mr-2" /> New Shipment
        </button>
      </div>

      {/* 2. Shipment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard title="Total Shipments" value={summary.total || 0} icon={<FaBoxOpen size={24} className="text-gray-500" />} color="bg-gray-50" />
        <StatCard title="In Transit" value={summary.inTransit || 0} icon={<FaTruck size={24} className="text-blue-500" />} color="bg-blue-50" />
        <StatCard title="Delivered" value={summary.delivered || 0} icon={<FaCheckCircle size={24} className="text-green-500" />} color="bg-green-50" />
        <StatCard title="Pending/Delayed" value={summary.pending || 0} icon={<FaExclamationTriangle size={24} className="text-yellow-500" />} color="bg-yellow-50" />
        <StatCard title="Cancelled" value={summary.cancelled || 0} icon={<FaTimesCircle size={24} className="text-red-500" />} color="bg-red-50" />
      </div>

      {/* 3. Shipment Table */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
          <h3 className="text-lg font-semibold text-primary shrink-0">All Shipments</h3>
          <div className="flex flex-wrap items-center gap-4 w-full">
          <div className="relative">
            <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-100 focus:bg-white focus:ring-2 focus:ring-primary border border-gray-200 rounded-full py-2 pl-10 pr-4 transition-all w-full md:w-auto"
            />
          </div>
            <select onChange={(e) => setStatusFilter(e.target.value)} className="bg-gray-100 border border-gray-200 rounded-md py-2 px-3 text-sm">
              <option value="All">All Statuses</option>
              <option>Pending</option>
              <option>In Transit</option>
              <option>Delivered</option>
              <option>Cancelled</option>
            </select>
            <select onChange={(e) => setBranchFilter(e.target.value)} className="bg-gray-100 border border-gray-200 rounded-md py-2 px-3 text-sm">
              <option value="All">All Branches</option>
              <option>Nairobi</option>
              <option>Mombasa</option>
              <option>Kisumu</option>
            </select>
            <select onChange={(e) => setStaffFilter(e.target.value)} className="bg-gray-100 border border-gray-200 rounded-md py-2 px-3 text-sm">
              <option value="All">All Staff</option>
              {staffList.map(staff => <option key={staff._id} value={staff._id}>{staff.name}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Shipment ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Origin</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Destination</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Branch</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Staff</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading && <tr><td colSpan="9" className="text-center py-12 text-gray-500"><FaSpinner className="animate-spin inline-block mr-2" />Loading...</td></tr>}
              {!loading && shipments.map((shipment) => (
                <tr key={shipment._id} className="hover:bg-blue-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{shipment.shipmentId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{shipment.customer?.name || shipment.guestDetails?.name || 'Guest'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{shipment.origin}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{shipment.destination}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {shipment.branch}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{shipment.createdBy?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={shipment.status} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(shipment.dispatchDate), 'MMM dd, yyyy')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-3">
                      <button onClick={() => openViewModal(shipment)} className="text-blue-600 hover:text-blue-800 font-medium transition-colors">View</button>
                      <button onClick={() => openEditModal(shipment)} className="text-green-600 hover:text-green-800 font-medium transition-colors">Edit</button>
                      <button onClick={() => handleDelete(shipment._id)} className="text-red-600 hover:text-red-800 font-medium transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-500">
            Showing {fromResult} to {toResult} of {pagination.total} results
          </p>
          <div className="flex items-center">
            <button
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiChevronLeft />
            </button>
            <span className="px-4 py-2 text-sm font-medium bg-accent/20 text-accent rounded-md">{currentPage}</span>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === pagination.totalPages}
              className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Add/Edit Shipment Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
            <motion.div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col" variants={modalVariants} initial="hidden" animate="visible" exit="hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b shrink-0">
                <h2 className="text-xl font-bold text-primary">
                  {editingShipment ? 'Edit' : 'Create New'} Shipment
                </h2>
              </div>
              <form className="p-6 overflow-y-auto" onSubmit={handleFormSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Column 1 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Shipment Info</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                        <input type="text" value={currentShipment.customerName} onChange={(e) => setCurrentShipment({ ...currentShipment, customerName: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" placeholder="e.g., John Doe" required disabled={!!editingShipment} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Customer Phone</label>
                        <input type="tel" value={currentShipment.customerPhone} onChange={(e) => setCurrentShipment({ ...currentShipment, customerPhone: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" placeholder="e.g., +254712345678" required disabled={!!editingShipment} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Origin</label>
                        <input type="text" value={currentShipment.origin} onChange={(e) => setCurrentShipment({ ...currentShipment, origin: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" placeholder="e.g., Mombasa" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Destination</label>
                        <input type="text" value={currentShipment.destination} onChange={(e) => setCurrentShipment({ ...currentShipment, destination: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" placeholder="e.g., Nairobi" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Package Details</label>
                        <textarea value={currentShipment.packageDetails} onChange={(e) => setCurrentShipment({ ...currentShipment, packageDetails: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" rows="3" placeholder="e.g., 1 box of electronics"></textarea>
                      </div>
                    </div>
                  </div>
                  {/* Column 2 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Logistics</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                        <input type="number" value={currentShipment.weight} onChange={(e) => setCurrentShipment({ ...currentShipment, weight: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" placeholder="e.g., 25" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <select value={currentShipment.status} onChange={(e) => setCurrentShipment({ ...currentShipment, status: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                          <option>Pending</option>
                          <option>In Transit</option>
                          <option>Delivered</option>
                          <option>Delayed</option>
                          <option>Cancelled</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Assign Staff</label>
                        <select value={currentShipment.agent} onChange={(e) => setCurrentShipment({ ...currentShipment, agent: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                          <option value="">Unassigned</option>
                          {staffList.map(staff => <option key={staff._id} value={staff._id}>{staff.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t flex justify-end space-x-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors"
                  >
                    {editingShipment ? 'Save Changes' : 'Create Shipment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Details Modal */}
      <AnimatePresence>
        {isViewModalOpen && selectedShipment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsViewModalOpen(false)}>
            <motion.div
              className="bg-white rounded-lg shadow-2xl w-full max-w-xl"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold text-primary">Shipment Details: {selectedShipment.shipmentId}</h2>
                <StatusBadge status={selectedShipment.status} />
              </div>
              <div className="p-6 space-y-4 text-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Customer</p>
                    <p className="font-semibold">{selectedShipment.customer?.name || selectedShipment.guestDetails?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Customer Phone</p>
                    <p className="font-semibold">{selectedShipment.customer?.phone || selectedShipment.guestDetails?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Staff</p>
                    <p className="font-semibold">{selectedShipment.agent?.name || 'Unassigned'}</p> {/* `agent` field in Shipment model is correct */}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Origin</p>
                    <p className="font-semibold">{selectedShipment.origin}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Destination</p>
                    <p className="font-semibold">{selectedShipment.destination}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Dispatch Date</p>
                    <p className="font-semibold">{format(new Date(selectedShipment.dispatchDate), 'MMM dd, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Weight</p>
                    <p className="font-semibold">{selectedShipment.weight ? `${selectedShipment.weight} kg` : 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Package Details</p>
                  <p className="font-semibold">{selectedShipment.packageDetails || 'N/A'}</p>
                </div>
              </div>
              <div className="p-6 bg-gray-50 flex justify-end rounded-b-lg">
                <button onClick={closeViewModal} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">Close</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Shipments;