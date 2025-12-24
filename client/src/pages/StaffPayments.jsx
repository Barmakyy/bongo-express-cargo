import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaMoneyBillWave, FaSpinner, FaSearch, FaPhone, FaDownload } from 'react-icons/fa';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../api/axios';
import { useNotification } from '../context/NotificationContext';
import { format } from 'date-fns';

const statusStyles = {
  Completed: 'bg-green-100 text-green-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Failed: 'bg-red-100 text-red-700',
};

const StatusBadge = ({ status }) => (
  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-700'}`}>
    {status}
  </span>
);

const StaffPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const { showNotification } = useNotification();

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/staff-dashboard/payments?page=${currentPage}&search=${searchTerm}&status=${statusFilter}`);
      setPayments(res.data.data.payments);
      setPagination(res.data.data.pagination);
    } catch (err) {
      showNotification('Failed to fetch payment data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = (paymentId, paymentIdDisplay) => {
    api.get(`/staff-dashboard/payments/${paymentId}/invoice`, { responseType: 'blob' })
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `receipt-${paymentIdDisplay}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        showNotification('Receipt download started.', 'success');
      })
      .catch(() => showNotification('Failed to download receipt.', 'error'));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayments();
    }, 300);
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm, statusFilter]);

  const fromResult = (pagination.page - 1) * pagination.limit + 1;
  const toResult = fromResult + payments.length - 1;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-6 rounded-xl shadow-soft-lg">
      <h1 className="text-2xl font-bold text-primary mb-6">Payment Tracking</h1>

      {/* Search and Filter Section */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <div className="relative w-full md:w-auto">
          <FaSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Invoice ID, Customer, or Phone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-100 focus:bg-white focus:ring-2 focus:ring-primary border border-gray-200 rounded-full py-2 pl-10 pr-4 transition-all w-full md:w-80"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-100 border border-gray-200 rounded-md py-2 px-3 text-sm w-full md:w-auto"
        >
          <option value="All">All Statuses</option>
          <option value="Completed">Completed</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-3 text-sm font-semibold text-gray-600">Invoice ID</th>
              <th className="p-3 text-sm font-semibold text-gray-600">Shipment ID</th>
              <th className="p-3 text-sm font-semibold text-gray-600">Customer Name</th>
              <th className="p-3 text-sm font-semibold text-gray-600">Phone Number</th>
              <th className="p-3 text-sm font-semibold text-gray-600">Amount</th>
              <th className="p-3 text-sm font-semibold text-gray-600">Status</th>
              <th className="p-3 text-sm font-semibold text-gray-600">Date</th>
              <th className="p-3 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="text-center p-10"><FaSpinner className="animate-spin text-primary text-3xl mx-auto" /></td></tr>
            ) : payments.length > 0 ? (
              payments.map((payment) => (
                <tr key={payment._id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-sm font-medium text-primary">{payment.paymentId}</td>
                  <td className="p-3 text-sm text-gray-700">{payment.shipment?.shipmentId || 'N/A'}</td>
                  <td className="p-3 text-sm text-gray-700">{payment.customer?.name || 'N/A'}</td>
                  <td className="p-3 text-sm text-gray-700">
                    <span className="flex items-center gap-1">
                      <FaPhone className="text-accent" size={12} />
                      {payment.customer?.phone || 'N/A'}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-700 font-semibold">KSh {payment.amount?.toLocaleString() || 0}</td>
                  <td className="p-3 text-sm"><StatusBadge status={payment.status} /></td>
                  <td className="p-3 text-sm text-gray-500">
                    {payment.transactionDate ? format(new Date(payment.transactionDate), 'MMM dd, yyyy') : 'N/A'}
                  </td>
                  <td className="p-3 text-sm">
                    <button
                      onClick={() => handleDownloadInvoice(payment._id, payment.paymentId)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="Download Receipt"
                    >
                      <FaDownload size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="8" className="text-center p-10 text-gray-500">No payment records found for your shipments.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-gray-500">
          Showing {payments.length > 0 ? fromResult : 0} to {toResult} of {pagination.total} results
        </p>
        <div className="flex items-center">
          <button 
            onClick={() => setCurrentPage(p => p - 1)} 
            disabled={currentPage === 1} 
            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiChevronLeft />
          </button>
          <span className="px-4 py-2 text-sm font-medium bg-accent/20 text-accent rounded-md">{currentPage}</span>
          <button 
            onClick={() => setCurrentPage(p => p + 1)} 
            disabled={pagination.totalPages && currentPage === pagination.totalPages} 
            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiChevronRight />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default StaffPayments;