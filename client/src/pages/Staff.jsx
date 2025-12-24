import React, { useState, useEffect } from 'react';
import { FaPlus, FaSearch, FaUsers, FaUserCheck, FaUserSlash, FaUserTie, FaStar, FaSort, FaSortUp, FaSortDown, FaSpinner } from 'react-icons/fa';
import { FiChevronLeft, FiChevronRight, FiDownload } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import { useNotification } from '../context/NotificationContext';
import { format } from 'date-fns';

const StatCard = ({ title, value, icon, color }) => (
  <div className={`p-6 rounded-2xl shadow-md flex flex-col items-center text-center ${color}`}>
    <div className="p-3 rounded-full bg-white mb-3">{icon}</div>
    <div className="w-full">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-2xl font-bold text-primary truncate">{value}</p>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    Active: 'bg-green-100 text-green-800',
    Idle: 'bg-yellow-100 text-yellow-800',
    Inactive: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
};

const Staff = () => {
  const [staffList, setStaffList] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedStaffMember, setSelectedStaffMember] = useState(null);
  const [newStaffMember, setNewStaffMember] = useState({ name: '', email: '', password: '', phone: '', role: 'staff', status: 'Active' });
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const { showNotification } = useNotification();

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  const fetchData = async () => {
    // Only fetch summary on the first page load to avoid refetching on pagination
    const shouldFetchSummary = currentPage === 1 && !Object.keys(summary).length;

    try {
      setLoading(true);
      const [staffRes, summaryRes] = await Promise.all([
        api.get(`/staff?page=${currentPage}&limit=10&search=${searchTerm}&status=${filter}&role=${roleFilter}`),
        api.get('/staff/summary'),
      ]);
      setStaffList(staffRes.data.data.staff);
      setPagination(staffRes.data.data.pagination);
      if (shouldFetchSummary) setSummary(summaryRes.data.data);
    } catch (err) {
      console.error(err);
      showNotification('Failed to fetch staff data.', 'error');
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
  }, [searchTerm, filter, roleFilter]);

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const handleExport = () => {
    if (!staffList.length) {
      showNotification('No staff data to export.', 'error');
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Role', 'Status', 'Assigned Shipments', 'Last Login'];
    const csvRows = [
      headers.join(','),
      ...staffList.map(staffMember => [
        `"${staffMember.name}"`,
        `"${staffMember.email}"`,
        `"${staffMember.phone || 'N/A'}"`,
        `"${staffMember.role}"`,
        staffMember.status,
        staffMember.assignedShipments,
        staffMember.lastLogin ? `"${format(new Date(staffMember.lastLogin), 'yyyy-MM-dd HH:mm')}"` : 'N/A'
      ].join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'staff_export.csv';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Staff data exported successfully!', 'success');
  };

  const openAddModal = () => {
    setNewStaffMember({ name: '', email: '', password: '', phone: '', role: 'staff', status: 'Active' });
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleAddFormSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/staff', newStaffMember);
      closeAddModal();
      showNotification('Staff member added successfully!', 'success');
      fetchData(); // Refetch to show the new staff member
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to add staff member.';
      showNotification(message, 'error');
    }
  };

  const openEditModal = (staffMember) => {
    setSelectedStaffMember({ ...staffMember });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedStaffMember(null);
  };

  const handleEditFormSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaffMember) return;
    try {
      await api.put(`/staff/${selectedStaffMember._id}`, selectedStaffMember);
      closeEditModal();
      showNotification('Staff member updated successfully!', 'success');
      fetchData();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update staff member.';
      showNotification(message, 'error');
    }
  };

  const handleDelete = async (staffId) => {
    if (window.confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) {
      try {
        await api.delete(`/staff/${staffId}`);
        showNotification('Staff member deleted successfully.', 'success');
        fetchData();
      } catch (err) {
        showNotification('Failed to delete staff member.', 'error');
      }
    }
  };

  const openViewModal = (staffMember) => {
    setSelectedStaffMember(staffMember);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedStaffMember(null);
  };

  const sortedStaff = React.useMemo(() => {
    let sortableItems = [...staffList];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [staffList, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };

  const fromResult = (pagination.page - 1) * pagination.limit + 1;
  const toResult = fromResult + staffList.length - 1;

  return (
    <div>
      {/* 1. Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Staff Management</h1>
          <p className="text-gray-500 mt-1">Manage all internal users, roles, and permissions.</p>
        </div>
        <button onClick={openAddModal} className="bg-accent text-primary font-bold py-2 px-6 rounded-lg flex items-center hover:bg-yellow-400 transition-colors">
          <FaPlus className="mr-2" /> Add New Staff
        </button>
      </div>

      {/* 2. Quick Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Staff" value={summary.totalAgents || 0} icon={<FaUsers size={24} className="text-blue-500" />} color="bg-blue-50" />
        <StatCard title="Active Staff" value={summary.activeOnDelivery || 0} icon={<FaUserCheck size={24} className="text-green-500" />} color="bg-green-50" />
        <StatCard title="Suspended" value={summary.suspended || 0} icon={<FaUserSlash size={24} className="text-red-500" />} color="bg-red-50" />
        <StatCard title="Admin Roles" value={summary.rolesBreakdown?.find(r => r.name === 'admin')?.value || 0} icon={<FaUserTie size={24} className="text-purple-500" />} color="bg-purple-50" />
      </div>

      {/* 3. Staff Table */}
      <div className="bg-white p-6 rounded-2xl shadow-md">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-primary">All Staff</h3>
            <div className="relative">
              <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or region..."
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
              <option>Idle</option>
              <option>Inactive</option>
            </select>
             <select
                className="bg-gray-100 border border-gray-200 rounded-md py-2 px-3 text-sm"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
              <option value="All">All Roles</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
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
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Photo</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('name')}>Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Email & Phone</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Assigned Shipments</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading && <tr><td colSpan="8" className="text-center py-12 text-gray-500"><FaSpinner className="animate-spin inline-block mr-2" />Loading...</td></tr>}
              {!loading && sortedStaff.map((staffMember) => (
                <tr key={staffMember._id} className="hover:bg-blue-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img src={staffMember.profilePicture ? `http://localhost:5000${staffMember.profilePicture}` : `https://ui-avatars.com/api/?name=${staffMember.name}&background=random`} alt={staffMember.name} className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 shadow-sm" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{staffMember.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="font-medium">{staffMember.email}</div>
                    <div className="text-gray-500">{staffMember.phone || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 capitalize">
                      {staffMember.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={staffMember.status} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white text-sm font-bold shadow-md">
                      {staffMember.assignedShipments}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staffMember.lastLogin ? format(new Date(staffMember.lastLogin), 'MMM dd, yyyy') : 'Never'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-3">
                      <button onClick={() => openViewModal(staffMember)} className="text-blue-600 hover:text-blue-800 font-medium transition-colors" title="View Details">View</button>
                      <button onClick={() => openEditModal(staffMember)} className="text-green-600 hover:text-green-800 font-medium transition-colors" title="Edit Staff">Edit</button>
                      <button onClick={() => handleDelete(staffMember._id)} className="text-red-600 hover:text-red-800 font-medium transition-colors" title="Delete Staff">Delete</button>
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

      {/* Add/Edit Modals etc. */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsAddModalOpen(false)}>
            <motion.div
              className="bg-white rounded-lg shadow-2xl w-full max-w-lg"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-primary">Add New Staff Member</h2>
              </div>
              <form className="p-6" onSubmit={handleAddFormSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label><input type="text" value={newStaffMember.name} onChange={(e) => setNewStaffMember({ ...newStaffMember, name: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label><input type="email" value={newStaffMember.email} onChange={(e) => setNewStaffMember({ ...newStaffMember, email: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <input type="password" value={newStaffMember.password} onChange={(e) => setNewStaffMember({ ...newStaffMember, password: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" minLength="8" placeholder="Auto-generate if empty" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input type="text" value={newStaffMember.phone} onChange={(e) => setNewStaffMember({ ...newStaffMember, phone: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                    </div>
                     <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <select value={newStaffMember.role} onChange={(e) => setNewStaffMember({ ...newStaffMember, role: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select value={newStaffMember.status} onChange={(e) => setNewStaffMember({ ...newStaffMember, status: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                        <option>Active</option>
                        <option>Idle</option>
                        <option>Inactive</option>
                      </select>
                    </div>
                </div>
                <div className="mt-6 pt-4 border-t flex justify-end space-x-3">
                  <button type="button" onClick={closeAddModal} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors">
                    Add Staff Member
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && selectedStaffMember && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsEditModalOpen(false)}>
            <motion.div
              className="bg-white rounded-lg shadow-2xl w-full max-w-lg"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-primary">Edit Staff Member</h2>
              </div>
              <form className="p-6" onSubmit={handleEditFormSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input type="text" value={selectedStaffMember.name} onChange={(e) => setSelectedStaffMember({ ...selectedStaffMember, name: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" value={selectedStaffMember.email} onChange={(e) => setSelectedStaffMember({ ...selectedStaffMember, email: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input type="text" value={selectedStaffMember.phone || ''} onChange={(e) => setSelectedStaffMember({ ...selectedStaffMember, phone: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      <select value={selectedStaffMember.role} onChange={(e) => setSelectedStaffMember({ ...selectedStaffMember, role: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select value={selectedStaffMember.status} onChange={(e) => setSelectedStaffMember({ ...selectedStaffMember, status: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                      <option>Active</option>
                      <option>Idle</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t flex justify-end space-x-3">
                  <button type="button" onClick={closeEditModal} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
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

      {/* View Modal */}
      <AnimatePresence>
        {isViewModalOpen && selectedStaffMember && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsViewModalOpen(false)}>
            <motion.div
              className="bg-white rounded-lg shadow-2xl w-full max-w-lg"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold text-primary">Staff Details</h2>
                <StatusBadge status={selectedStaffMember.status} />
              </div>
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <h3 className="text-2xl font-bold">{selectedStaffMember.name}</h3>
                  <p className="text-gray-500">{selectedStaffMember.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t">
                  <p><strong className="text-gray-500 block">Phone:</strong> {selectedStaffMember.phone || 'N/A'}</p>
                  <p><strong className="text-gray-500 block">Role:</strong> <span className="capitalize">{selectedStaffMember.role}</span></p>
                  <p><strong className="text-gray-500 block">Assigned Shipments:</strong> {selectedStaffMember.assignedShipments}</p>
                  <p><strong className="text-gray-500 block">Last Login:</strong> {selectedStaffMember.lastLogin ? format(new Date(selectedStaffMember.lastLogin), 'PPpp') : 'Never'}</p>
                </div>
              </div>
              <div className="p-4 bg-gray-50 flex justify-end rounded-b-lg">
                <button onClick={closeViewModal} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Staff;