import { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { inventoryAPI, salesOrderAPI, purchaseOrderAPI, paymentAPI } from '../utils/api';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    inventory: { total: 0, lowStock: 0 },
    salesOrders: { total: 0, pending: 0 },
    purchaseOrders: { total: 0, pending: 0 },
    payments: { total: 0, pending: 0 },
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [inventory, lowStock, sales, purchases, payments] = await Promise.all([
        inventoryAPI.getSummary(),
        inventoryAPI.getLowStock(),
        salesOrderAPI.getAll({ page_size: 1 }),
        purchaseOrderAPI.getAll({ page_size: 1 }),
        paymentAPI.getSummary(),
      ]);

      setStats({
        inventory: {
          total: inventory.total_items || 0,
          lowStock: lowStock.count || 0,
        },
        salesOrders: {
          total: sales.count || 0,
          pending: sales.results?.filter((o: any) => o.status === 'pending').length || 0,
        },
        purchaseOrders: {
          total: purchases.count || 0,
          pending: purchases.results?.filter((o: any) => o.status === 'draft' || o.status === 'pending_approval').length || 0,
        },
        payments: {
          total: payments.total_transactions || 0,
          pending: payments.pending_transactions || 0,
        },
      });
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color }: any) => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4">{value}</Typography>
            <Typography variant="body2" color="textSecondary">
              {subtitle}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: '50%',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Inventory"
            value={stats.inventory.total}
            subtitle={`${stats.inventory.lowStock} low stock items`}
            icon={<InventoryIcon sx={{ color: 'white', fontSize: 40 }} />}
            color="#1976d2"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Sales Orders"
            value={stats.salesOrders.total}
            subtitle={`${stats.salesOrders.pending} pending`}
            icon={<ShoppingCartIcon sx={{ color: 'white', fontSize: 40 }} />}
            color="#2e7d32"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Purchase Orders"
            value={stats.purchaseOrders.total}
            subtitle={`${stats.purchaseOrders.pending} pending approval`}
            icon={<LocalShippingIcon sx={{ color: 'white', fontSize: 40 }} />}
            color="#ed6c02"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Payments"
            value={stats.payments.total}
            subtitle={`${stats.payments.pending} pending`}
            icon={<TrendingUpIcon sx={{ color: 'white', fontSize: 40 }} />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Stats Overview
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Welcome to your ERP dashboard. Use the sidebar to navigate to different sections.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
