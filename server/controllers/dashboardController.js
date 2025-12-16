import User from '../models/User.js';
import Shipment from '../models/Shipment.js';
import Payment from '../models/Payment.js';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export const getDashboardStats = async (req, res) => {
  try {
    // 1. Metric Cards Data
    const totalShipments = await Shipment.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    const totalRevenueResult = await Payment.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } },
    ]);
    const totalRevenue = totalRevenueResult[0]?.totalRevenue || 0;

    const deliveredResult = await Shipment.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          delivered: {
            $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] },
          },
        },
      },
    ]);
    const deliverySuccessRate =
      deliveredResult[0]?.total > 0
        ? (deliveredResult[0].delivered / deliveredResult[0].total) * 100
        : 0;

    // 2. Shipment Status Distribution
    const statusDistribution = await Shipment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
    const statusDistributionData = statusDistribution.map(item => ({
      name: item._id || 'Unknown',
      value: item.count,
    }));

    // 3. Shipment Growth Over Time (Last 6 months)
    const shipmentGrowthData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = endOfMonth(subMonths(new Date(), i));
      
      const monthShipments = await Shipment.aggregate([
        {
          $match: {
            createdAt: { $gte: monthStart, $lte: monthEnd },
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      const monthData = {
        name: monthStart.toLocaleString('default', { month: 'short' }),
        Delivered: 0,
        Pending: 0,
        Cancelled: 0,
      };

      monthShipments.forEach(item => {
        if (item._id === 'Delivered') monthData.Delivered = item.count;
        else if (item._id === 'Pending') monthData.Pending = item.count;
        else if (item._id === 'Cancelled') monthData.Cancelled = item.count;
      });

      shipmentGrowthData.push(monthData);
    }

    // 4. Revenue Data (Last 6 months)
    const revenueData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = endOfMonth(subMonths(new Date(), i));

      const monthRevenue = await Payment.aggregate([
        {
          $match: {
            status: 'Completed',
            createdAt: { $gte: monthStart, $lte: monthEnd },
          },
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$amount' },
          },
        },
      ]);

      revenueData.push({
        name: monthStart.toLocaleString('default', { month: 'short' }),
        revenue: monthRevenue[0]?.revenue || 0,
      });
    }

    // 5. Customer Growth Data (Last 6 months)
    const customerGrowthData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = endOfMonth(subMonths(new Date(), i));

      const monthCustomers = await User.countDocuments({
        role: 'customer',
        createdAt: { $lte: monthEnd },
      });

      customerGrowthData.push({
        name: monthStart.toLocaleString('default', { month: 'short' }),
        customers: monthCustomers,
      });
    }

    // 6. Recent Activities
    const recentShipments = await Shipment.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('customer', 'name');

    const recentCustomers = await User.find({ role: 'customer' })
      .sort({ createdAt: -1 })
      .limit(2);

    const activities = [
      ...recentShipments.map(s => ({
        id: s._id,
        type: 'shipment',
        text: `New shipment created for ${s.customer?.name || s.guestDetails?.name || 'a customer'}.`,
        timestamp: s.createdAt,
      })),
      ...recentCustomers.map(c => ({
        id: c._id,
        type: 'customer',
        text: `New customer registered: ${c.name}.`,
        timestamp: c.createdAt,
      })),
    ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 4);

    res.status(200).json({
      status: 'success',
      data: {
        metrics: {
          totalShipments,
          totalCustomers,
          totalRevenue: totalRevenueResult.length > 0 ? totalRevenueResult[0].totalRevenue : 0,
          deliverySuccessRate,
        },
        charts: {
          shipmentData: shipmentGrowthData,
          statusDistribution: statusDistributionData,
          revenueData,
          customerGrowthData,
        },
        recentActivities: activities,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard stats.',
      error: error.message,
    });
  }
};