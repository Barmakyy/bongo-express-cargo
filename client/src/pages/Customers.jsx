import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaUsers, FaUserCheck, FaUserSlash, FaTruck, FaSpinner } from 'react-icons/fa';
import { FiChevronLeft, FiChevronRight, FiDownload } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion'; 
import { useNotification } from '../context/NotificationContext';
import api from '../api/axios';

const StatCard = ({ title, value, icon, color }) => (
  <div className={`p-6 rounded-lg shadow-md flex flex-col items-center text-center ${color}`}>
    <div className="p-3 rounded-full bg-white mb-3">{icon}</div>
    <div className="w-full">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-primary truncate">{value}</p>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const statusStyles = {
    Active: 'bg-green-100 text-green-700',
    Inactive: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
};

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { showNotification } = useNotification();
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', password: '', phone: '', location: '' });


  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  const initialFormState = { name: '', email: '', phone: '', location: '', status: 'Active' };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [customersRes, summaryRes] = await Promise.all([
        api.get(`/customers?page=${currentPage}&limit=10&search=${searchTerm}&status=${filter}`),
        api.get('/customers/summary'),
      ]);
      setCustomers(customersRes.data.data.customers);
      setPagination(customersRes.data.data.pagination);
      setSummary(summaryRes.data.data);
    } catch (err) {
      console.error(err);
      showNotification('Failed to fetch customer data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) setCurrentPage(1);
      else fetchData();
    }, 300); // Debounce search/filter
    return () => clearTimeout(timer);
  }, [searchTerm, filter]);

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const fromResult = (pagination.page - 1) * pagination.limit + 1;
  const toResult = fromResult + customers.length - 1;

  const openAddModal = () => {
    setNewCustomer({ name: '', email: '', password: '', phone: '', location: '' });
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleAddFormSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/customers', newCustomer);
      closeAddModal();
      showNotification('Customer added successfully!', 'success');
      fetchData(); // Refetch to show the new customer
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to add customer.';
      showNotification(message, 'error');
      console.error(err);
    }
  };
  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const closeAndResetModal = () => {
    setEditingCustomer(null);
    setIsModalOpen(false);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!editingCustomer) return;

    try {
      await api.put(`/customers/${editingCustomer._id}`, editingCustomer);
      closeAndResetModal();
      showNotification('Customer updated successfully!', 'success');
      fetchData(); // Refetch to show updated data
    } catch (err) {
      showNotification('Failed to update customer.', 'error');
      console.error(err);
    }
  };

  const handleExport = () => {
    if (!customers.length) {
      showNotification('No customer data to export.', 'error');
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Location', 'Total Shipments', 'Status'];
    const csvRows = [
      headers.join(','),
      ...customers.map(customer => [
        `"${customer.name}"`,
        `"${customer.email}"`,
        `"${customer.phone || 'N/A'}"`,
        `"${customer.location || 'N/A'}"`,
        customer.totalShipments,
        customer.status
      ].join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers.csv';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Customer data exported successfully!', 'success');
  };

  const handleDelete = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      try {
        await api.delete(`/customers/${customerId}`);
        showNotification('Customer deleted successfully.', 'success');
        fetchData(); // Refetch to show updated data
      } catch (err) {
        showNotification('Failed to delete customer.', 'error');
        console.error(err);
      }
    }
  };

  return (
    <div>
      {/* 1. Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Customers Management</h1>
          <p className="text-gray-500 mt-1">Manage and view all registered customers.</p>
        </div>
        <button onClick={openAddModal} className="bg-accent text-primary font-bold py-2 px-6 rounded-lg flex items-center hover:bg-yellow-400 transition-colors">
          <FaPlus className="mr-2" /> Add Customer
        </button>
      </div>

      {/* 2. Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Customers" value={summary.total || 0} icon={<FaUsers size={24} className="text-blue-500" />} color="bg-blue-50" />
        <StatCard title="Active Customers" value={summary.active || 0} icon={<FaUserCheck size={24} className="text-green-500" />} color="bg-green-50" />
        <StatCard title="Inactive / Suspended" value={summary.inactive || 0} icon={<FaUserSlash size={24} className="text-red-500" />} color="bg-red-50" />
        <StatCard title="Shipments This Month" value={summary.shipmentsThisMonth || 0} icon={<FaTruck size={24} className="text-yellow-500" />} color="bg-yellow-50" />
      </div>

      {/* 3. Customers Table */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-primary">All Customers</h3>
            <div className="relative">
              <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                className="bg-gray-100 focus:bg-white focus:ring-2 focus:ring-primary border border-gray-200 rounded-full py-2 pl-10 pr-4 transition-all w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
             <select 
                className="bg-gray-100 border border-gray-200 rounded-md py-2 px-3 text-sm"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
              <option>All</option>
              <option>Active</option>
              <option>Inactive</option>
            </select>
            <button onClick={handleExport} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md flex items-center hover:bg-gray-200 transition text-sm">
              <FiDownload className="mr-2" /> Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Total Shipments</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading && <tr><td colSpan="7" className="text-center py-12 text-gray-500"><FaSpinner className="animate-spin inline-block mr-2" />Loading...</td></tr>}
              {!loading && customers.map((customer) => (
                <tr key={customer._id} className="hover:bg-blue-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{customer.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{customer.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{customer.phone || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{customer.location || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white text-sm font-bold shadow-md">
                      {customer.totalShipments}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={customer.status} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-3">
                      <button onClick={() => openEditModal(customer)} className="text-blue-600 hover:text-blue-800 font-medium transition-colors" title="View/Edit Profile">Edit</button>
                      <button onClick={() => handleDelete(customer._id)} className="text-red-600 hover:text-red-800 font-medium transition-colors" title="Delete Customer">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && customers.length === 0 && <tr><td colSpan="7" className="text-center py-12 text-gray-500">No customers found</td></tr>}
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
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <FiChevronRight />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Edit Customer Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeAndResetModal}>
            <motion.div
              className="bg-white rounded-lg shadow-2xl w-full max-w-lg"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}              onClick={(e) => e.stopPropagation()}            >
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-primary">Edit Customer</h2>
              </div>
              <form className="p-6" onSubmit={handleFormSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input type="text" value={editingCustomer.name} onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" value={editingCustomer.email} onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input type="text" value={editingCustomer.phone || ''} onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <input type="text" value={editingCustomer.location || ''} onChange={(e) => setEditingCustomer({ ...editingCustomer, location: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select value={editingCustomer.status} onChange={(e) => setEditingCustomer({ ...editingCustomer, status: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t flex justify-end space-x-3">
                  <button type="button" onClick={closeAndResetModal} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors">
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Add Customer Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeAddModal}>
            <motion.div
              className="bg-white rounded-lg shadow-2xl w-full max-w-lg"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-primary">Add New Customer</h2>
              </div>
              <form className="p-6" onSubmit={handleAddFormSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input type="text" value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input type="password" value={newCustomer.password} onChange={(e) => setNewCustomer({ ...newCustomer, password: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone (Optional)</label>
                      <input type="text" value={newCustomer.phone} onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location (Optional)</label>
                      <input type="text" value={newCustomer.location} onChange={(e) => setNewCustomer({ ...newCustomer, location: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t flex justify-end space-x-3">
                  <button type="button" onClick={closeAddModal} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                  <button type="submit" className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors">Add Customer</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Customers;