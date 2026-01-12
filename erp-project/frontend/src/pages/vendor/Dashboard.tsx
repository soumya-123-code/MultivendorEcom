import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Card, CardContent, CardHeader, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Skeleton, Alert, LinearProgress, Chip } from '@mui/material';
import { ShoppingCart as OrdersIcon, Inventory as InventoryIcon, AttachMoney as RevenueIcon, TrendingUp as TrendingIcon, Refresh as RefreshIcon, Warning as WarningIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { PageHeader, StatsCard, StatusChip } from '../../components';
import { useAuth } from '../../contexts';
import { vendorsApi, salesOrdersApi, inventoryApi, productsApi } from '../../api';
import { SalesOrder, Inventory, Product, VendorStats } from '../../types';

const VendorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<SalesOrder[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Inventory[]>([]);
  const [topProducts, setTopProducts] = useState<Product[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, ordersRes, lowStockRes, productsRes] = await Promise.all([
        vendorsApi.getStats(),
        salesOrdersApi.list({ page: 1, page_size: 5, ordering: '-created_at' }),
        inventoryApi.getLowStock(),
        productsApi.list({ page: 1, page_size: 5, ordering: '-total_sales' })
      ]);

      setStats(statsRes.data);
      setRecentOrders(ordersRes.data.results);
      setLowStockProducts(lowStockRes.data.slice(0, 5));
      setTopProducts(productsRes.data.results);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          {[1,2,3,4].map(i => <Grid item xs={12} sm={6} md={3} key={i}><Skeleton variant="rounded" height={140} /></Grid>)}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={`Welcome, ${user?.first_name || 'Vendor'}!`}
        subtitle="Your store performance at a glance"
        actions={<Button startIcon={<RefreshIcon />} onClick={fetchDashboardData} variant="outlined">Refresh</Button>}
      />

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard title="Total Revenue" value={formatCurrency(stats?.total_revenue || 0)} subtitle="This month" icon={RevenueIcon} iconColor="#2e7d32" iconBgColor="rgba(46,125,50,0.1)"
            trend={stats?.revenue_growth ? { value: stats.revenue_growth, label: 'vs last month', positive: stats.revenue_growth > 0 } : undefined} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard title="Total Orders" value={stats?.total_orders || 0} subtitle={`${stats?.pending_orders || 0} pending`} icon={OrdersIcon} iconColor="#1976d2" iconBgColor="rgba(25,118,210,0.1)" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard title="Total Products" value={stats?.total_products || 0} subtitle={`${stats?.active_products || 0} active`} icon={InventoryIcon} iconColor="#9c27b0" iconBgColor="rgba(156,39,176,0.1)" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard title="Avg Order Value" value={formatCurrency(stats?.avg_order_value || 0)} icon={TrendingIcon} iconColor="#ed6c02" iconBgColor="rgba(237,108,2,0.1)" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Orders */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardHeader title="Recent Orders" action={<Button size="small" onClick={() => navigate('/vendor/sales-orders')}>View All</Button>} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Order #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Items</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentOrders.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center">No orders yet</TableCell></TableRow>
                  ) : recentOrders.map((order) => (
                    <TableRow key={order.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/vendor/sales-orders/${order.id}`)}>
                      <TableCell sx={{ fontWeight: 600 }}>{order.order_number}</TableCell>
                      <TableCell>{order.customer_name || `#${order.customer}`}</TableCell>
                      <TableCell>{order.items_count}</TableCell>
                      <TableCell>{formatCurrency(Number(order.total_amount))}</TableCell>
                      <TableCell><StatusChip status={order.status} category="order" /></TableCell>
                      <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* Low Stock */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardHeader title={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><WarningIcon color="warning" /> Low Stock</Box>} action={<Button size="small" onClick={() => navigate('/vendor/inventory')}>View All</Button>} />
            <CardContent sx={{ pt: 0 }}>
              {lowStockProducts.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 3 }}>All stock levels healthy</Typography>
              ) : lowStockProducts.map((item) => (
                <Box key={item.id} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: '70%' }}>{item.product_name}</Typography>
                    <Chip label={`${item.quantity} left`} size="small" color={item.quantity === 0 ? 'error' : 'warning'} />
                  </Box>
                  <LinearProgress variant="determinate" value={Math.min((item.quantity / (item.reorder_level || 10)) * 100, 100)} color={item.quantity === 0 ? 'error' : 'warning'} sx={{ height: 4, borderRadius: 1 }} />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Products */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Top Products" action={<Button size="small" onClick={() => navigate('/vendor/products')}>View All</Button>} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Stock</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topProducts.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center">No products yet</TableCell></TableRow>
                  ) : topProducts.map((product) => (
                    <TableRow key={product.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/vendor/products/${product.id}`)}>
                      <TableCell sx={{ fontWeight: 500 }}>{product.name}</TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>{formatCurrency(Number(product.base_price))}</TableCell>
                      <TableCell>{product.total_stock ?? 0}</TableCell>
                      <TableCell><StatusChip status={product.status} category="product" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default VendorDashboard;
