import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import api from '../api/axios';
import { FaShippingFast, FaUsers, FaDollarSign, FaCheckCircle } from 'react-icons/fa';
import {
  ResponsiveContainer,
  AreaChart,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  CartesianGrid,
  BarChart,
  LineChart,
  Bar,
  Legend,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const MetricCard = ({ icon, title, value }) => {
  return (
    <motion.div
      className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      whileHover={{ scale: 1.03 }}
    >
      <div className="bg-accent/20 text-accent p-4 rounded-full">
        {icon}
      </div>
      <div className="mt-4">
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-primary">{value}</p>
      </div>
    </motion.div>
  );
};

const DashboardOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/dashboard/stats'); // This should be the correct endpoint
        setStats(response.data.data);
        setError('');
      } catch (err) {
        setError('Failed to fetch dashboard data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center p-10">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">{error}</div>;
  }

  const metrics = [
    {
      icon: <FaShippingFast size={24} />,
      title: 'Total Shipments',
      value: stats?.metrics?.totalShipments || 0,
    },
    {
      icon: <FaUsers size={24} />,
      title: 'Total Customers',
      value: stats?.metrics?.totalCustomers || 0,
    },
    {
      icon: <FaDollarSign size={24} />,
      title: 'Total Revenue',
      value: `KSh ${(stats?.metrics?.totalRevenue || 0).toLocaleString()}`,
    },
    {
      icon: <FaCheckCircle size={24} />,
      title: 'Delivery Success',
      value: `${(stats?.metrics?.deliverySuccessRate || 0).toFixed(1)}%`,
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <MetricCard {...metric} />
          </motion.div>
        ))}
      </div>

      {/* Row 1: Shipment Growth & Status Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mt-8">
        <motion.div className="xl:col-span-3 bg-white p-6 rounded-lg shadow-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h3 className="text-lg font-semibold text-primary mb-4">Shipment Growth Over Time</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={stats?.charts?.shipmentData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" tick={{ fill: '#6b7280' }} />
              <YAxis tick={{ fill: '#6b7280' }} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '0.5rem', border: '1px solid #e0e0e0' }} />
              <Legend />
              <Line type="monotone" dataKey="Delivered" stroke="#2FC25B" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Pending" stroke="#FACC14" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Cancelled" stroke="#F04864" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div className="xl:col-span-2 bg-white p-6 rounded-lg shadow-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h3 className="text-lg font-semibold text-primary mb-4">Shipment Status Distribution</h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie data={stats?.charts?.statusDistribution || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} innerRadius={80} paddingAngle={5} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {(stats?.charts?.statusDistribution || []).map((entry, index) => <Cell key={`cell-${index}`} fill={['#2FC25B', '#1890FF', '#FACC14', '#F04864', '#8543E0'][index % 5]} />)}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Row 2: Revenue & Customer Growth */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mt-8">
        <motion.div className="xl:col-span-3 bg-white p-6 rounded-lg shadow-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <h3 className="text-lg font-semibold text-primary mb-4">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={stats?.charts?.revenueData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" tick={{ fill: '#6b7280' }} />
              <YAxis tickFormatter={(value) => `KSh ${value / 1000}k`} tick={{ fill: '#6b7280' }} />
              <Tooltip formatter={(value) => [`KSh ${value.toLocaleString()}`, 'Revenue']} contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '0.5rem', border: '1px solid #e0e0e0' }} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div className="xl:col-span-2 bg-white p-6 rounded-lg shadow-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <h3 className="text-lg font-semibold text-primary mb-4">Customer Growth</h3>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={stats?.charts?.customerGrowthData || []}>
              <defs>
                <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="name" tick={{ fill: '#6b7280' }} />
              <YAxis tick={{ fill: '#6b7280' }} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '0.5rem', border: '1px solid #e0e0e0' }} />
              <Area type="monotone" dataKey="customers" stroke="#82ca9d" fillOpacity={1} fill="url(#colorCustomers)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Row 3: Top Agents & Recent Activity */}
      <div className="grid grid-cols-1 gap-6 mt-8">
        <motion.div className="bg-white p-6 rounded-lg shadow-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <h3 className="text-lg font-semibold text-primary mb-4">Recent Activity</h3>
          <ul className="space-y-4">
            {(stats?.recentActivities || []).map(activity => (
              <li key={activity.id} className="flex items-start">
                <div className={`bg-accent/20 text-accent rounded-full h-8 w-8 shrink-0 flex items-center justify-center`}>
                  {activity.type === 'shipment' ? (
                    <FaShippingFast size={16} />
                  ) : (
                    <FaUsers size={16} />
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-600">{activity.text}</p>
                  <p className="text-xs text-gray-400">
                    {activity.timestamp ? format(new Date(activity.timestamp), 'MMM d, yyyy, h:mm a') : 'just now'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default DashboardOverview;