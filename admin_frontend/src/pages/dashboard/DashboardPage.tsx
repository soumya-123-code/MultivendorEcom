import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Skeleton,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  TrendingUp,
  ShoppingCart,
  Inventory,
  People,
  Warning,
  ArrowForward,
  MoreVert,
  LocalShipping,
  AttachMoney,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../../components/common/StatsCard';
import StatusChip from '../../components/common/StatusChip';
import { usePageSetup } from '../../hooks';
import { formatCurrency, formatRelativeTime } from '../../utils';

// Mock data
const revenueData = [
  { name: 'Jan', revenue: 45000, orders: 120 },
  { name: 'Feb', revenue: 52000, orders: 145 },
  { name: 'Mar', revenue: 48000, orders: 130 },
  { name: 'Apr', revenue: 61000, orders: 165 },
  { name: 'May', revenue: 55000, orders: 150 },
  { name: 'Jun', revenue: 67000, orders: 180 },
  { name: 'Jul', revenue: 72000, orders: 195 },
];

const recentOrders = [
  { id: 'ORD-001', customer: 'Rahul Sharma', amount: 2499, status: 'processing', date: '2024-01-10T10:30:00' },
  { id: 'ORD-002', customer: 'Priya Patel', amount: 1899, status: 'delivered', date: '2024-01-10T09:15:00' },
  { id: 'ORD-003', customer: 'Amit Kumar', amount: 3299, status: 'pending', date: '2024-01-10T08:45:00' },
  { id: 'ORD-004', customer: 'Sneha Reddy', amount: 999, status: 'confirmed', date: '2024-01-09T18:20:00' },
  { id: 'ORD-005', customer: 'Vikram Singh', amount: 4599, status: 'out_for_delivery', date: '2024-01-09T15:00:00' },
];

const topProducts = [
  { id: 1, name: 'Wireless Headphones Pro', sales: 245, revenue: 122500, image: null },
  { id: 2, name: 'Smart Watch Series 5', sales: 189, revenue: 189000, image: null },
  { id: 3, name: 'Laptop Stand Aluminum', sales: 167, revenue: 50100, image: null },
  { id: 4, name: 'USB-C Hub 7-in-1', sales: 156, revenue: 31200, image: null },
];

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  usePageSetup('Dashboard', [{ label: 'Home', path: '/' }, { label: 'Dashboard' }]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} lg={3}>
          <motion.div variants={itemVariants}>
            <StatsCard
              title="Total Revenue"
              value={formatCurrency(425600)}
              subtitle="vs last month"
              icon={<AttachMoney />}
              trend={{ value: 12.5, isPositive: true }}
              color="#6366f1"
              loading={loading}
            />
          </motion.div>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <motion.div variants={itemVariants}>
            <StatsCard
              title="Total Orders"
              value="1,284"
              subtitle="vs last month"
              icon={<ShoppingCart />}
              trend={{ value: 8.2, isPositive: true }}
              color="#22d3ee"
              loading={loading}
            />
          </motion.div>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <motion.div variants={itemVariants}>
            <StatsCard
              title="Total Products"
              value="856"
              subtitle="12 added today"
              icon={<Inventory />}
              color="#10b981"
              loading={loading}
            />
          </motion.div>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <motion.div variants={itemVariants}>
            <StatsCard
              title="Total Customers"
              value="3,652"
              subtitle="vs last month"
              icon={<People />}
              trend={{ value: 4.1, isPositive: true }}
              color="#f59e0b"
              loading={loading}
            />
          </motion.div>
        </Grid>

        {/* Revenue Chart */}
        <Grid item xs={12} lg={8}>
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      Revenue Overview
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Monthly revenue and orders trend
                    </Typography>
                  </Box>
                  <Tooltip title="More options">
                    <IconButton size="small">
                      <MoreVert />
                    </IconButton>
                  </Tooltip>
                </Box>
                {loading ? (
                  <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} />
                      <YAxis stroke="#a1a1aa" fontSize={12} tickFormatter={(v) => `₹${v / 1000}k`} />
                      <RechartsTooltip
                        contentStyle={{
                          background: '#1a1a2e',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 8,
                        }}
                        formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Alerts & Quick Stats */}
        <Grid item xs={12} lg={4}>
          <motion.div variants={itemVariants}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box
                    onClick={() => navigate('/inventory?filter=low_stock')}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1),
                      border: (theme) => `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.warning.main, 0.15),
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Warning sx={{ color: 'warning.main' }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          Low Stock Alert
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          23 products below threshold
                        </Typography>
                      </Box>
                      <ArrowForward sx={{ color: 'text.secondary', fontSize: 18 }} />
                    </Box>
                  </Box>

                  <Box
                    onClick={() => navigate('/orders?status=pending')}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
                      border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.info.main, 0.15),
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <ShoppingCart sx={{ color: 'info.main' }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          Pending Orders
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          18 orders need attention
                        </Typography>
                      </Box>
                      <ArrowForward sx={{ color: 'text.secondary', fontSize: 18 }} />
                    </Box>
                  </Box>

                  <Box
                    onClick={() => navigate('/purchase-orders/new')}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                      border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15),
                        transform: 'translateX(4px)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <LocalShipping sx={{ color: 'primary.main' }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          Create Purchase Order
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Restock inventory
                        </Typography>
                      </Box>
                      <ArrowForward sx={{ color: 'text.secondary', fontSize: 18 }} />
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Recent Orders */}
        <Grid item xs={12} lg={6}>
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Recent Orders
                  </Typography>
                  <Chip
                    label="View All"
                    size="small"
                    onClick={() => navigate('/orders')}
                    sx={{ cursor: 'pointer' }}
                  />
                </Box>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 2, py: 1.5 }}>
                      <Skeleton variant="circular" width={40} height={40} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Skeleton width="60%" height={20} />
                        <Skeleton width="40%" height={16} />
                      </Box>
                      <Skeleton width={60} height={24} />
                    </Box>
                  ))
                ) : (
                  <List disablePadding>
                    {recentOrders.map((order, index) => (
                      <ListItem
                        key={order.id}
                        disablePadding
                        sx={{
                          py: 1.5,
                          borderBottom: index < recentOrders.length - 1 ? 1 : 0,
                          borderColor: 'divider',
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, fontSize: '0.875rem' }}>
                            {order.customer.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="subtitle2" fontWeight={600}>
                                {order.id}
                              </Typography>
                              <Typography variant="subtitle2" fontWeight={600}>
                                {formatCurrency(order.amount)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                {order.customer} • {formatRelativeTime(order.date)}
                              </Typography>
                              <StatusChip status={order.status} size="small" />
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Top Products */}
        <Grid item xs={12} lg={6}>
          <motion.div variants={itemVariants}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Top Products
                  </Typography>
                  <Chip
                    label="View All"
                    size="small"
                    onClick={() => navigate('/products')}
                    sx={{ cursor: 'pointer' }}
                  />
                </Box>
                {loading ? (
                  [...Array(4)].map((_, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 2, py: 1.5 }}>
                      <Skeleton variant="rounded" width={48} height={48} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Skeleton width="70%" height={20} />
                        <Skeleton width="50%" height={16} />
                      </Box>
                    </Box>
                  ))
                ) : (
                  <List disablePadding>
                    {topProducts.map((product, index) => (
                      <ListItem
                        key={product.id}
                        disablePadding
                        sx={{
                          py: 1.5,
                          borderBottom: index < topProducts.length - 1 ? 1 : 0,
                          borderColor: 'divider',
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            variant="rounded"
                            sx={{
                              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                              width: 48,
                              height: 48,
                            }}
                          >
                            <Inventory sx={{ color: 'primary.main' }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" fontWeight={600}>
                              {product.name}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                {product.sales} sold
                              </Typography>
                              <Typography variant="caption" color="success.main" fontWeight={600}>
                                {formatCurrency(product.revenue)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </motion.div>
  );
};

export default DashboardPage;
