import User from '../models/User.js';
import Shipment from '../models/Shipment.js';
import Payment from '../models/Payment.js';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export const getDashboardStats = async (req, res) => {
  try {
    const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));

    // Run all aggregations in parallel for better performance
    const [
      metricsResult,
      statusDistribution,
      shipmentGrowthResult,
      revenueResult,
      customerGrowthResult,
      recentShipments,
      recentCustomers
    ] = await Promise.all([
      // 1. All metrics in one aggregation
      Shipment.aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            delivered: [
              { $match: { status: 'Delivered' } },
              { $count: 'count' }
            ]
          }
        }
      ]),
      
      // 2. Status Distribution
      Shipment.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      
      // 3. Shipment Growth (Last 6 months) - Single aggregation
      Shipment.aggregate([
        {
          $match: { createdAt: { $gte: sixMonthsAgo } }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              status: '$status'
            },
            count: { $sum: 1 }
          }
        }
      ]),
      
      // 4. Revenue Data (Last 6 months) - Single aggregation
      Payment.aggregate([
        {
          $match: {
            status: 'Completed',
            createdAt: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            revenue: { $sum: '$amount' }
          }
        }
      ]),
      
      // 5. Customer Growth (Last 6 months) - Single aggregation
      User.aggregate([
        {
          $match: { role: 'customer' }
        },
        {
          $facet: {
            total: [{ $count: 'count' }],
            monthly: [
              { $match: { createdAt: { $gte: sixMonthsAgo } } },
              {
                $group: {
                  _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                  },
                  count: { $sum: 1 }
                }
              }
            ]
          }
        }
      ]),
      
      // 6. Recent Activities
      Shipment.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .select('_id customer guestDetails createdAt')
        .populate('customer', 'name')
        .lean(),
      
      User.find({ role: 'customer' })
        .sort({ createdAt: -1 })
        .limit(2)
        .select('_id name createdAt')
        .lean()
    ]);

    // Process metrics
    const totalShipments = metricsResult[0]?.total[0]?.count || 0;
    const deliveredShipments = metricsResult[0]?.delivered[0]?.count || 0;
    const deliverySuccessRate = totalShipments > 0 
      ? (deliveredShipments / totalShipments) * 100 
      : 0;

    // Get total revenue and customers
    const [totalRevenueResult, totalCustomers] = await Promise.all([
      Payment.aggregate([
        { $match: { status: 'Completed' } },
        { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
      ]),
      User.countDocuments({ role: 'customer' })
    ]);
    const totalRevenue = totalRevenueResult[0]?.totalRevenue || 0;

    // Process status distribution
    const statusDistributionData = statusDistribution.map(item => ({
      name: item._id || 'Unknown',
      value: item.count,
    }));

    // Process shipment growth data
    const shipmentGrowthData = [];
    for (let i = 5; i >= 0; i--) {
      const targetDate = subMonths(new Date(), i);
      const monthData = {
        name: targetDate.toLocaleString('default', { month: 'short' }),
        Delivered: 0,
        Pending: 0,
        Cancelled: 0,
      };
      
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      
      shipmentGrowthResult.forEach(item => {
        if (item._id.year === year && item._id.month === month) {
          const status = item._id.status;
          if (status === 'Delivered') monthData.Delivered = item.count;
          else if (status === 'Pending') monthData.Pending = item.count;
          else if (status === 'Cancelled') monthData.Cancelled = item.count;
        }
      });
      
      shipmentGrowthData.push(monthData);
    }

    // Process revenue data
    const revenueData = [];
    for (let i = 5; i >= 0; i--) {
      const targetDate = subMonths(new Date(), i);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      
      const monthRevenue = revenueResult.find(
        item => item._id.year === year && item._id.month === month
      );
      
      revenueData.push({
        name: targetDate.toLocaleString('default', { month: 'short' }),
        revenue: monthRevenue?.revenue || 0,
      });
    }

    // Process customer growth data (cumulative)
    const customerGrowthData = [];
    let cumulativeCustomers = totalCustomers;
    const monthlyNewCustomers = customerGrowthResult[0]?.monthly || [];
    
    for (let i = 5; i >= 0; i--) {
      const targetDate = subMonths(new Date(), i);
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth() + 1;
      
      const monthCustomers = monthlyNewCustomers.find(
        item => item._id.year === year && item._id.month === month
      );
      
      if (i === 0) {
        // Current month - use total
        cumulativeCustomers = totalCustomers;
      } else {
        // Subtract customers from more recent months
        for (let j = 0; j < i; j++) {
          const futureDate = subMonths(new Date(), j);
          const futureYear = futureDate.getFullYear();
          const futureMonth = futureDate.getMonth() + 1;
          const futureCustomers = monthlyNewCustomers.find(
            item => item._id.year === futureYear && item._id.month === futureMonth
          );
          if (futureCustomers) {
            cumulativeCustomers -= futureCustomers.count;
          }
        }
      }
      
      customerGrowthData.push({
        name: targetDate.toLocaleString('default', { month: 'short' }),
        customers: Math.max(0, cumulativeCustomers),
      });
    }

    // Process activities
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
          totalRevenue,
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