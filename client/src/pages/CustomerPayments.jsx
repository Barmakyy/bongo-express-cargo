import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWallet, FaHourglassHalf, FaCheckCircle, FaFileInvoiceDollar, FaTimes, FaDownload, FaSpinner } from 'react-icons/fa';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../api/axios';
import { useNotification } from '../context/NotificationContext';

const StatCard = ({ title, value, icon, colorClass }) => (
  <motion.div
    className={`p-6 rounded-2xl shadow-md hover:shadow-xl transition-shadow flex flex-col items-center text-center ${colorClass}`}
    whileHover={{ y: -5 }}
  >
    <div className="p-3 bg-white/50 rounded-full mb-3">{icon}</div>
    <div>
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="text-2xl font-bold truncate">{value}</p>
    </div>
  </motion.div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    Completed: 'bg-green-100 text-green-700',
    Pending: 'bg-yellow-100 text-yellow-700',
    Failed: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
};

const CustomerPayments = () => {
  const [summary, setSummary] = useState(null);
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { showNotification } = useNotification();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summaryRes, paymentsRes] = await Promise.all([
          api.get('/customer-dashboard/payments/summary'),
          api.get(`/customer-dashboard/payments?page=${currentPage}`),
        ]);
        setSummary(summaryRes.data.data);
        setPayments(paymentsRes.data.data.payments);
        setPagination(paymentsRes.data.data.pagination);
      } catch (error) {
        console.error('Failed to fetch payment data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentPage]);

  const handleDownloadInvoice = (paymentId) => {
    api.get(`/customer-dashboard/payments/${paymentId}/invoice`, { responseType: 'blob' })
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `receipt-${selectedPayment.paymentId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        showNotification('Receipt download started.', 'success');
      })
      .catch(() => {
        showNotification('Failed to download receipt.', 'error');
      });
  };

  const handlePayNowClick = (payment) => {
    setSelectedPayment(payment);
    setIsPayModalOpen(true);
  };

  const handlePayNowSubmit = async () => {
    if (!selectedPayment) return;

    setIsProcessing(true);
    try {
      await api.post(`/customer-dashboard/payments/${selectedPayment._id}/pay`);
      showNotification('Payment successful!', 'success');
      setIsPayModalOpen(false);
      setSelectedPayment(null);
      // Refetch data to update the UI
      const [summaryRes, paymentsRes] = await Promise.all([
        api.get('/customer-dashboard/payments/summary'),
        api.get(`/customer-dashboard/payments?page=${currentPage}`),
      ]);
      setSummary(summaryRes.data.data);
      setPayments(paymentsRes.data.data.payments);
    } catch (err) {
      showNotification(err.response?.data?.message || 'Payment failed. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const fromResult = pagination ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const toResult = fromResult + payments.length - 1;

  if (loading && !summary) {
    return <div className="text-center p-10">Loading your payment details...</div>;
  }

  return (
    <div className="bg-gray-50 p-4 md:p-8 min-h-full">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3">
          <FaWallet className="text-3xl text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-primary">My Payments</h1>
            <p className="text-gray-500">Track your recent payments and outstanding balances.</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Pending Payments" value={`KSh ${summary?.pendingAmount.toLocaleString() || 0}`} icon={<FaHourglassHalf className="text-yellow-800" />} colorClass="bg-yellow-100 text-yellow-900" />
        <StatCard title="Completed Payments" value={summary?.completedPayments || 0} icon={<FaCheckCircle className="text-green-800" />} colorClass="bg-green-100 text-green-900" />
        <StatCard title="Total Amount Paid" value={`KSh ${summary?.totalAmountPaid.toLocaleString() || 0}`} icon={<FaFileInvoiceDollar className="text-blue-800" />} colorClass="bg-blue-100 text-blue-900" />
        <StatCard title="Invoices Generated" value={summary?.invoicesGenerated || 0} icon={<FaFileInvoiceDollar className="text-purple-800" />} colorClass="bg-purple-100 text-purple-900" />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md">
        <h3 className="text-lg font-semibold text-primary mb-4">Payment History</h3>
        {payments.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="p-3 text-sm font-semibold text-gray-600">Invoice ID</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Shipment</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Amount</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Status</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Date</th>
                    <th className="p-3 text-sm font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment, index) => (
                    <motion.tr
                      key={payment._id}
                      className="border-b hover:bg-gray-50"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="p-3 text-sm font-medium text-primary">{payment.paymentId}</td>
                      <td className="p-3 text-sm text-gray-700">{payment.shipment ? `${payment.shipment.origin} → ${payment.shipment.destination}` : 'N/A'}</td>
                      <td className="p-3 text-sm text-gray-700">KSh {payment.amount.toLocaleString()}</td>
                      <td className="p-3 text-sm"><StatusBadge status={payment.status} /></td>
                      <td className="p-3 text-sm text-gray-500">{format(new Date(payment.transactionDate), 'MMM dd, yyyy')}</td>
                      <td className="p-3 text-sm">
                        {payment.status === 'Pending' ? (
                          <button onClick={() => handlePayNowClick(payment)} className="font-semibold text-accent hover:underline">Pay Now</button>
                        ) : (
                          <button onClick={() => setSelectedPayment(payment)} className="font-semibold text-primary hover:underline">View</button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-gray-500">Showing {fromResult} to {toResult} of {pagination.total} results</p>
              <div className="flex items-center">
                <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"><FiChevronLeft /></button>
                <span className="px-4 py-2 text-sm font-medium bg-accent/20 text-accent rounded-md">{currentPage}</span>
                <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === pagination.totalPages} className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"><FiChevronRight /></button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-700">No payments found yet.</h3>
            <p className="text-gray-500 mt-2">Once you complete a shipment, your payment details will appear here.</p>
            <Link to="/customer/dashboard/shipments" className="mt-4 inline-block bg-accent text-primary font-bold py-2 px-4 rounded-lg hover:bg-yellow-400 transition-colors">
              View My Shipments
            </Link>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      <AnimatePresence>
        {selectedPayment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPayment(null)}>
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-bold text-primary">Invoice Details</h2>
                <button onClick={() => setSelectedPayment(null)} className="text-gray-400 hover:text-gray-600"><FaTimes size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Invoice: {selectedPayment.paymentId}</h3>
                  <StatusBadge status={selectedPayment.status} />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t">
                  <p><strong className="text-gray-500 block">Shipment:</strong> {selectedPayment.shipment ? `${selectedPayment.shipment.origin} → ${selectedPayment.shipment.destination}` : 'N/A'}</p>
                  <p><strong className="text-gray-500 block">Amount:</strong> KSh {selectedPayment.amount.toLocaleString()}</p>
                  <p><strong className="text-gray-500 block">Date:</strong> {format(new Date(selectedPayment.transactionDate), 'MMM dd, yyyy')}</p>
                  <p><strong className="text-gray-500 block">Method:</strong> {selectedPayment.method}</p>
                </div>
                <div className="pt-2">
                  <p><strong className="text-gray-500 block text-sm">Transaction Ref:</strong> {selectedPayment.transactionId || 'N/A'}</p>
                </div>
              </div>
              <div className="p-6 bg-gray-50 flex justify-end space-x-3 rounded-b-2xl">
                <button onClick={() => setSelectedPayment(null)} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
                  Close
                </button>
                <button
                  onClick={() => handleDownloadInvoice(selectedPayment._id)}
                  className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors flex items-center"
                >
                  <FaDownload className="mr-2" /> Download PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pay Now Modal */}
      <AnimatePresence>
        {isPayModalOpen && selectedPayment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsPayModalOpen(false)}>
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold text-primary">Confirm Payment</h2>
              </div>
              <div className="p-8 space-y-4">
                <p className="text-gray-600">You are about to pay for Invoice <strong className="text-primary">{selectedPayment.paymentId}</strong>.</p>
                <p className="text-4xl font-bold text-primary">KSh {selectedPayment.amount.toLocaleString()}</p>
                <p className="text-sm text-gray-500">This is a simulated payment process.</p>
              </div>
              <div className="p-6 bg-gray-50 flex justify-center space-x-3 rounded-b-2xl">
                <button
                  onClick={() => setIsPayModalOpen(false)}
                  disabled={isProcessing}
                  className="bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayNowSubmit}
                  disabled={isProcessing}
                  className="bg-green-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center disabled:bg-green-400"
                >
                  {isProcessing ? (
                    <><FaSpinner className="animate-spin mr-2" /> Processing...</>
                  ) : (
                    'Confirm & Pay'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomerPayments;