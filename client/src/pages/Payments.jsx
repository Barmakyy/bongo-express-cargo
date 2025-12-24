import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { FaDollarSign, FaFileCsv, FaPlus, FaReceipt, FaSpinner, FaTimes, FaCheckCircle, FaExclamationCircle, FaDownload } from 'react-icons/fa';
import { format } from 'date-fns';
import api from '../api/axios';
import { useNotification } from '../context/NotificationContext';

const StatCard = ({ title, value, color, icon }) => (
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
    Completed: 'bg-green-100 text-green-800',
    Pending: 'bg-yellow-100 text-yellow-800',
    Failed: 'bg-red-100 text-red-800',
  };
  const icons = {
    Completed: <FaCheckCircle className="mr-1" />,
    Pending: <FaSpinner className="mr-1 animate-spin" />,
    Failed: <FaExclamationCircle className="mr-1" />,
  };
  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {icons[status]} {status}
    </span>
  );
};

const Payments = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({});
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPayment, setNewPayment] = useState({ shipmentId: '', amount: '', method: 'M-Pesa', status: 'Completed' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const { showNotification } = useNotification();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, summaryRes, chartRes] = await Promise.all([
        api.get(`/payments?page=${currentPage}&limit=10&search=${searchTerm}&status=${statusFilter}`),
        api.get('/payments/summary'),
        api.get('/payments/chart-data'),
      ]);
      setPayments(paymentsRes.data.data.payments);
      setPagination(paymentsRes.data.data.pagination);
      setSummary(summaryRes.data.data);
      setChartData(chartRes.data.data.chartData);
    } catch (err) {
      console.error(err);
      showNotification('Failed to fetch payment data.', 'error');
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
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const openModal = (payment) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPayment(null);
  };

  const openAddModal = () => {
    setNewPayment({ shipmentId: '', amount: '', method: 'M-Pesa', status: 'Completed' });
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleAddFormSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments', newPayment);
      closeAddModal();
      showNotification('Payment added successfully!', 'success');
      // Refetch data, resetting to page 1 to see the new payment if it affects sorting/filtering
      if (currentPage !== 1) setCurrentPage(1);
      else fetchData();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to add payment.';
      showNotification(message, 'error');
      console.error(err);
    }
  };

  const handleApprovePayment = async (paymentId) => {
    try {
      await api.patch(`/payments/${paymentId}`, { status: 'Completed' });
      showNotification('Payment approved successfully!', 'success');
      // Refetch data to update the UI
      if (currentPage !== 1) setCurrentPage(1);
      else fetchData();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to approve payment.';
      showNotification(message, 'error');
      console.error(err);
    }
  };

  const handleRetryPayment = async (paymentId) => {
    try {
      // Set the status back to 'Pending' to allow for another payment attempt
      await api.patch(`/payments/${paymentId}`, { status: 'Pending' });
      showNotification('Payment status reset to Pending.', 'success');
      // Refetch data to update the UI
      if (currentPage !== 1) setCurrentPage(1);
      else fetchData();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to retry payment.';
      showNotification(message, 'error');
      console.error(err);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.delete(`/payments/${paymentId}`);
      showNotification('Payment deleted successfully!', 'success');
      // Refetch data to update the UI
      fetchData();
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete payment.';
      showNotification(message, 'error');
      console.error(err);
    }
  };

  const handleDownloadInvoice = (paymentId) => {
    api.get(`/payments/${paymentId}/invoice`, { responseType: 'blob' })
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `receipt-${selectedPayment.paymentId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        showNotification('Invoice download started.', 'success');
      })
      .catch(() => showNotification('Failed to download invoice.', 'error'));
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  const handleExport = () => {
    if (!payments.length) {
      showNotification('No payment data to export.', 'error');
      return;
    }

    const headers = ['Payment ID', 'Customer', 'Amount', 'Method', 'Date', 'Status'];
    const csvRows = [
      headers.join(','),
      ...payments.map(p => [
        `"${p.paymentId}"`,
        `"${p.customer?.name || 'N/A'}"`,
        p.amount,
        `"${p.method}"`,
        `"${format(new Date(p.transactionDate), 'yyyy-MM-dd')}"`,
        `"${p.status}"`
      ].join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payments.csv';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Payments data exported successfully!', 'success');
  };

  return (
    <div className="bg-gray-50 p-4 md:p-8">
      {/* 1. Header Section */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Payments Overview</h1>
        <div className="flex gap-4">
          <button onClick={openAddModal} className="bg-accent text-primary px-5 py-2 rounded-lg font-bold hover:bg-yellow-400 transition flex items-center">
            <FaPlus className="mr-2" /> New Payment
          </button>
          <button onClick={handleExport} className="bg-white border border-gray-300 px-5 py-2 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center">
            <FaFileCsv className="mr-2" /> Export CSV
          </button>
        </div>
      </div>

      {/* 2. Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Revenue" value={`KSh ${Number(summary.totalRevenue || 0).toLocaleString()}`} color="bg-green-50" icon={<FaDollarSign size={24} className="text-green-500" />} />
        <StatCard title="Pending Payments" value={`KSh ${Number(summary.pendingPayments || 0).toLocaleString()}`} color="bg-yellow-50" icon={<FaSpinner size={24} className="text-yellow-500" />} />
        <StatCard title="Completed Payments" value={summary.completedCount || 0} color="bg-blue-50" icon={<FaReceipt size={24} className="text-blue-500" />} />
        <StatCard title="Failed / Refunded" value={summary.failedOrRefundedCount || 0} color="bg-red-50" icon={<FaTimes size={24} className="text-red-500" />} />
      </div>

      {/* 3. Filter Bar & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-md">
          <h3 className="text-lg font-semibold text-primary mb-4">Transaction Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(val) => `KSh ${val / 1000}k`} />
              <Tooltip formatter={(val) => [`KSh ${val.toLocaleString()}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#FACC15" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-md flex flex-col">
          <h3 className="text-lg font-semibold text-primary mb-4">Filters</h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Search by customer or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-yellow-400 outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-yellow-400 outline-none">
              <option>All Status</option>
              <option>Completed</option>
              <option>Pending</option>
              <option>Failed</option>
            </select>
            <input type="date" className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-yellow-400 outline-none" />
          </div>
        </div>
      </div>

      {/* 4. Payments Table */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-primary">Recent Payments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Payment ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Method</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading && <tr><td colSpan="7" className="text-center py-12 text-gray-500"><FaSpinner className="animate-spin inline-block mr-2" />Loading...</td></tr>}
              {!loading && payments.map((payment) => (
                <tr key={payment._id} className="hover:bg-blue-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{payment.paymentId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{payment.customer?.name || 'Guest'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">KSh {payment.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100">
                      {payment.method}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(payment.transactionDate), 'MMM dd, yyyy')}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={payment.status} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-3">
                      <button onClick={() => openModal(payment)} className="text-blue-600 hover:text-blue-800 font-medium transition-colors">View</button>
                      {payment.status === 'Pending' && <button onClick={() => handleApprovePayment(payment._id)} className="text-green-600 hover:text-green-800 font-medium transition-colors">Approve</button>}
                      {payment.status === 'Failed' && <button onClick={() => handleRetryPayment(payment._id)} className="text-yellow-600 hover:text-yellow-800 font-medium transition-colors">Retry</button>}
                      <button onClick={() => handleDeletePayment(payment._id)} className="text-red-600 hover:text-red-800 font-medium transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && payments.length === 0 && <tr><td colSpan="7" className="text-center py-12 text-gray-500">No payments found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Payment Details Modal */}
      <AnimatePresence>
        {isModalOpen && selectedPayment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold text-primary">Payment Details</h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><FaTimes size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">{selectedPayment.customer?.name || 'N/A'}</h3>
                  <StatusBadge status={selectedPayment.status} />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t">
                  <p><strong className="text-gray-500 block">Payment ID:</strong> {selectedPayment.paymentId}</p>
                  <p><strong className="text-gray-500 block">Shipment Ref:</strong> {selectedPayment.shipment?.shipmentId || 'N/A'}</p>
                  <p><strong className="text-gray-500 block">Amount:</strong> KSh {selectedPayment.amount.toLocaleString()}</p>
                  <p><strong className="text-gray-500 block">Date:</strong> {format(new Date(selectedPayment.transactionDate), 'MMM dd, yyyy')}</p>
                  <p><strong className="text-gray-500 block">Method:</strong> {selectedPayment.method}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" rows="2" placeholder="Add notes here..."></textarea>
                </div>
              </div>
              <div className="p-6 bg-gray-50 flex justify-end space-x-3 rounded-b-2xl">
                <button onClick={closeModal} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                  Close
                </button>
                <button
                  onClick={() => handleDownloadInvoice(selectedPayment._id)}
                  className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors flex items-center"
                >
                  <FaDownload className="mr-2" /> Download Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add New Payment Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold text-primary">Add New Payment</h2>
                <button onClick={closeAddModal} className="text-gray-400 hover:text-gray-600"><FaTimes size={20} /></button>
              </div>
              <form onSubmit={handleAddFormSubmit}>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Shipment ID</label>
                    <input type="text" placeholder="e.g., SHP12345" value={newPayment.shipmentId} onChange={(e) => setNewPayment({ ...newPayment, shipmentId: e.target.value.toUpperCase() })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount (KSh)</label>
                      <input type="number" placeholder="e.g., 3500" value={newPayment.amount} onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                      <select value={newPayment.method} onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                        <option>M-Pesa</option>
                        <option>Cash</option>
                        <option>Card</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-gray-50 flex justify-end space-x-3 rounded-b-2xl">
                  <button type="button" onClick={closeAddModal} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors">Add Payment</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Payments;