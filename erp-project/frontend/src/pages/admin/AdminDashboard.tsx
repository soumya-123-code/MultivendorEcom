import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  useTheme,
} from '@mui/material';
import {
  People as PeopleIcon,
  Store as StoreIcon,
  ShoppingCart as OrdersIcon,
  AttachMoney as RevenueIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { PageHeader, StatsCard, StatusChip } from '../../components';
import { useAuth } from '../../contexts';

const mockStats = {
  totalUsers: 1250,
  totalVendors: 85,
  totalOrders: 3420,
  totalRevenue: '₹45,67,890',
  pendingOrders: 23,
  pendingVendors: 5,
};

const mockRevenueChart = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 4500 },
  { name: 'May', value: 6000 },
  { name: 'Jun', value: 5500 },
  { name: 'Jul', value: 7000 },
];

const mockOrdersChart = [
  { name: 'Mon', orders: 45 },
  { name: 'Tue', orders: 52 },
  { name: 'Wed', orders: 49 },
  { name: 'Thu', orders: 63 },
  { name: 'Fri', orders: 58 },
  { name: 'Sat', orders: 71 },
  { name: 'Sun', orders: 42 },
];

const mockRecentOrders = [
  { id: 1, orderNumber: 'ORD-2024-001', customer: 'John Doe', amount: '₹2,500', status: 'pending', date: '2024-01-15' },
  { id: 2, orderNumber: 'ORD-2024-002', customer: 'Jane Smith', amount: '₹1,800', status: 'confirmed', date: '2024-01-15' },
  { id: 3, orderNumber: 'ORD-2024-003', customer: 'Bob Wilson', amount: '₹3,200', status: 'processing', date: '2024-01-14' },
  { id: 4, orderNumber: 'ORD-2024-004', customer: 'Alice Brown', amount: '₹950', status: 'delivered', date: '2024-01-14' },
  { id: 5, orderNumber: 'ORD-2024-005', customer: 'Charlie Davis', amount: '₹4,100', status: 'out_for_delivery', date: '2024-01-14' },
];

const mockPendingVendors = [
  { id: 1, storeName: 'Tech Store Pro', email: 'tech@store.com', date: '2024-01-14' },
  { id: 2, storeName: 'Fashion Hub', email: 'fashion@hub.com', date: '2024-01-13' },
  { id: 3, storeName: 'Home Essentials', email: 'home@essentials.com', date: '2024-01-12' },
];

const AdminDashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Box>
      <PageHeader
        title={`Welcome back, ${user?.first_name || 'Admin'}!`}
        subtitle="Here's what's happening with your business today"
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Revenue"
            value={mockStats.totalRevenue}
            subtitle="This month"
            icon={RevenueIcon}
            iconColor="#2e7d32"
            iconBgColor="rgba(46, 125, 50, 0.1)"
            trend={{ value: 12.5, label: 'vs last month', positive: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Orders"
            value={mockStats.totalOrders.toLocaleString()}
            subtitle={`${mockStats.pendingOrders} pending`}
            icon={OrdersIcon}
            iconColor="#1976d2"
            iconBgColor="rgba(25, 118, 210, 0.1)"
            trend={{ value: 8.2, label: 'vs last month', positive: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Vendors"
            value={mockStats.totalVendors}
            subtitle={`${mockStats.pendingVendors} pending approval`}
            icon={StoreIcon}
            iconColor="#9c27b0"
            iconBgColor="rgba(156, 39, 176, 0.1)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Users"
            value={mockStats.totalUsers.toLocaleString()}
            subtitle="Active users"
            icon={PeopleIcon}
            iconColor="#ed6c02"
            iconBgColor="rgba(237, 108, 2, 0.1)"
            trend={{ value: 5.1, label: 'vs last month', positive: true }}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Revenue Overview</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockRevenueChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                  <YAxis stroke={theme.palette.text.secondary} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke={theme.palette.primary.main} strokeWidth={2} dot={{ fill: theme.palette.primary.main }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Orders This Week</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockOrdersChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                  <YAxis stroke={theme.palette.text.secondary} />
                  <Tooltip />
                  <Bar dataKey="orders" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Recent Orders</Typography>
                <Button size="small" onClick={() => navigate('/admin/sales-orders')}>View All</Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Order ID</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockRecentOrders.map((order) => (
                      <TableRow key={order.id} hover sx={{ cursor: 'pointer' }}>
                        <TableCell>{order.orderNumber}</TableCell>
                        <TableCell>{order.customer}</TableCell>
                        <TableCell>{order.amount}</TableCell>
                        <TableCell><StatusChip status={order.status} category="order" /></TableCell>
                        <TableCell>{order.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Pending Vendors</Typography>
                <Button size="small" onClick={() => navigate('/admin/vendors')}>View All</Button>
              </Box>
              {mockPendingVendors.map((vendor) => (
                <Box key={vendor.id} sx={{ py: 1.5, borderBottom: `1px solid ${theme.palette.divider}`, '&:last-child': { borderBottom: 0 } }}>
                  <Typography variant="subtitle2">{vendor.storeName}</Typography>
                  <Typography variant="body2" color="text.secondary">{vendor.email}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button size="small" variant="contained" color="success">Approve</Button>
                    <Button size="small" variant="outlined" color="error">Reject</Button>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
