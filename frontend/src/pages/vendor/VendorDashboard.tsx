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
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  ShoppingCart as OrdersIcon,
  AttachMoney as RevenueIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PageHeader, StatsCard, StatusChip } from '../../components';
import { useAuth } from '../../contexts';

const mockStats = {
  totalProducts: 156,
  activeProducts: 142,
  totalOrders: 89,
  pendingOrders: 12,
  totalRevenue: '₹12,45,000',
  lowStockItems: 8,
};

const mockSalesChart = [
  { name: 'Week 1', sales: 12000 },
  { name: 'Week 2', sales: 19000 },
  { name: 'Week 3', sales: 15000 },
  { name: 'Week 4', sales: 22000 },
];

const mockCategoryData = [
  { name: 'Electronics', value: 35 },
  { name: 'Clothing', value: 25 },
  { name: 'Home', value: 20 },
  { name: 'Other', value: 20 },
];

const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0'];

const mockRecentOrders = [
  { id: 1, orderNumber: 'SO-2024-089', customer: 'John Doe', items: 3, amount: '₹4,500', status: 'pending' },
  { id: 2, orderNumber: 'SO-2024-088', customer: 'Jane Smith', items: 1, amount: '₹1,200', status: 'processing' },
  { id: 3, orderNumber: 'SO-2024-087', customer: 'Bob Wilson', items: 5, amount: '₹8,900', status: 'packed' },
  { id: 4, orderNumber: 'SO-2024-086', customer: 'Alice Brown', items: 2, amount: '₹3,200', status: 'delivered' },
];

const mockLowStockItems = [
  { id: 1, name: 'Wireless Mouse', sku: 'WM-001', stock: 5, threshold: 10 },
  { id: 2, name: 'USB Cable', sku: 'UC-003', stock: 8, threshold: 20 },
  { id: 3, name: 'Phone Case', sku: 'PC-012', stock: 3, threshold: 15 },
];

const VendorDashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Box>
      <PageHeader
        title={`Welcome back, ${user?.first_name || 'Vendor'}!`}
        subtitle="Here's your store performance overview"
        actions={
          <Button variant="contained" startIcon={<InventoryIcon />} onClick={() => navigate('/vendor/products/new')}>
            Add Product
          </Button>
        }
      />

      {mockStats.lowStockItems > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningIcon />}>
          You have {mockStats.lowStockItems} products with low stock. <Button size="small" onClick={() => navigate('/vendor/inventory')}>View Now</Button>
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Revenue"
            value={mockStats.totalRevenue}
            subtitle="This month"
            icon={RevenueIcon}
            iconColor="#2e7d32"
            iconBgColor="rgba(46, 125, 50, 0.1)"
            trend={{ value: 15.2, label: 'vs last month', positive: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Orders"
            value={mockStats.totalOrders}
            subtitle={`${mockStats.pendingOrders} pending`}
            icon={OrdersIcon}
            iconColor="#1976d2"
            iconBgColor="rgba(25, 118, 210, 0.1)"
            trend={{ value: 8.5, label: 'vs last month', positive: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Active Products"
            value={mockStats.activeProducts}
            subtitle={`of ${mockStats.totalProducts} total`}
            icon={InventoryIcon}
            iconColor="#9c27b0"
            iconBgColor="rgba(156, 39, 176, 0.1)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Low Stock Items"
            value={mockStats.lowStockItems}
            subtitle="Need attention"
            icon={WarningIcon}
            iconColor="#ed6c02"
            iconBgColor="rgba(237, 108, 2, 0.1)"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Sales Overview</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockSalesChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                  <YAxis stroke={theme.palette.text.secondary} />
                  <Tooltip />
                  <Line type="monotone" dataKey="sales" stroke={theme.palette.primary.main} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Products by Category</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={mockCategoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {mockCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2, justifyContent: 'center' }}>
                {mockCategoryData.map((entry, index) => (
                  <Box key={entry.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: COLORS[index] }} />
                    <Typography variant="caption">{entry.name}</Typography>
                  </Box>
                ))}
              </Box>
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
                <Button size="small" onClick={() => navigate('/vendor/sales-orders')}>View All</Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Order ID</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Items</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockRecentOrders.map((order) => (
                      <TableRow key={order.id} hover sx={{ cursor: 'pointer' }}>
                        <TableCell>{order.orderNumber}</TableCell>
                        <TableCell>{order.customer}</TableCell>
                        <TableCell>{order.items}</TableCell>
                        <TableCell>{order.amount}</TableCell>
                        <TableCell><StatusChip status={order.status} category="order" /></TableCell>
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
                <Typography variant="h6">Low Stock Alert</Typography>
                <Button size="small" onClick={() => navigate('/vendor/inventory')}>View All</Button>
              </Box>
              {mockLowStockItems.map((item) => (
                <Box key={item.id} sx={{ py: 1.5, borderBottom: `1px solid ${theme.palette.divider}`, '&:last-child': { borderBottom: 0 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="subtitle2">{item.name}</Typography>
                    <Typography variant="body2" color="error.main" fontWeight={600}>{item.stock} left</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">SKU: {item.sku}</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(item.stock / item.threshold) * 100}
                    sx={{ mt: 1, height: 6, borderRadius: 1 }}
                    color="warning"
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default VendorDashboard;
