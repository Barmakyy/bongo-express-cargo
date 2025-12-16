import React, { useEffect, useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { FaTruckLoading, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { format } from 'date-fns';

const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'from-blue-400 to-blue-500',
    green: 'from-green-400 to-green-500',
    yellow: 'from-yellow-400 to-yellow-500',
  };

  return (
    <motion.div
      className={`p-6 rounded-xl shadow-soft-lg flex items-center space-x-4 bg-linear-to-br ${colorClasses[color]}`}
      whileHover={{ y: -5, scale: 1.02 }}
    >
      <div className="p-3 bg-white/30 rounded-full">{icon}</div>
      <div>
        <p className="text-sm font-medium text-white/80">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
    </motion.div>
  );
};

const StatusBadge = ({ status }) => {
    const statusStyles = {
      'In Transit': 'bg-blue-100 text-blue-700',
      Pending: 'bg-yellow-100 text-yellow-700',
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    );
  };

const StaffDashboardOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/staff-dashboard/stats');
        setStats(response.data.data);
      } catch (err) {
        console.error('Failed to fetch staff dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center p-10">Loading your dashboard...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <h1 className="text-3xl font-bold text-primary mb-2">Welcome, {user?.name}!</h1>
      <p className="text-gray-500 mb-8">Here are your tasks and performance summary.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Assigned Shipments" value={stats?.metrics?.assignedShipments || 0} icon={<FaTruckLoading size={24} className="text-white" />} color="blue" />
        <StatCard title="Completed Today" value={stats?.metrics?.completedToday || 0} icon={<FaCheckCircle size={24} className="text-white" />} color="green" />
        <StatCard title="Pending Deliveries" value={stats?.metrics?.pendingDeliveries || 0} icon={<FaExclamationTriangle size={24} className="text-white" />} color="yellow" />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-soft-lg">
        <h3 className="text-lg font-semibold text-primary mb-4">Your Priority Shipments</h3>
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
              </tr>
            </thead>
            <tbody>
              {stats?.priorityShipments?.length > 0 ? (
                stats.priorityShipments.map((shipment) => (
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center p-6 text-gray-500">No priority shipments at the moment.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default StaffDashboardOverview;