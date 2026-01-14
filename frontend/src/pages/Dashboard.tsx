import { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  alpha,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
  TrendingUp as TrendingUpIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { inventoryAPI, salesOrderAPI, purchaseOrderAPI, paymentAPI } from '../utils/api';

// Beautiful gradient stat card component
const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  gradient,
  trend,
  trendValue,
  progressValue,
  progressColor,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  progressValue?: number;
  progressColor?: string;
}) => (
  <Card
    sx={{
      height: '100%',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease-in-out',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
      },
    }}
  >
    {/* Background decoration */}
    <Box
      sx={{
        position: 'absolute',
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        borderRadius: '50%',
        background: gradient,
        opacity: 0.1,
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        bottom: -30,
        left: -30,
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: gradient,
        opacity: 0.05,
      }}
    />

    <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box flex={1}>
          <Typography
            variant="body2"
            sx={{
              color: '#64748b',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontSize: '0.75rem',
              mb: 1,
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              background: gradient,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5,
            }}
          >
            {value}
          </Typography>
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Typography
              variant="body2"
              sx={{
                color: '#64748b',
                fontWeight: 500,
              }}
            >
              {subtitle}
            </Typography>
            {trend && trendValue && (
              <Chip
                size="small"
                icon={
                  trend === 'up' ? (
                    <ArrowUpwardIcon sx={{ fontSize: 14 }} />
                  ) : trend === 'down' ? (
                    <ArrowDownwardIcon sx={{ fontSize: 14 }} />
                  ) : (
                    <RefreshIcon sx={{ fontSize: 14 }} />
                  )
                }
                label={trendValue}
                sx={{
                  height: 24,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  backgroundColor:
                    trend === 'up'
                      ? alpha('#10b981', 0.1)
                      : trend === 'down'
                      ? alpha('#ef4444', 0.1)
                      : alpha('#64748b', 0.1),
                  color:
                    trend === 'up'
                      ? '#10b981'
                      : trend === 'down'
                      ? '#ef4444'
                      : '#64748b',
                  '& .MuiChip-icon': {
                    color: 'inherit',
                  },
                }}
              />
            )}
          </Box>
        </Box>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: 3,
            background: gradient,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          }}
        >
          {icon}
        </Box>
      </Box>

      {progressValue !== undefined && (
        <Box sx={{ mt: 3 }}>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
              Progress
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
              {progressValue}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressValue}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: alpha(progressColor || '#6366f1', 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                background: gradient,
              },
            }}
          />
        </Box>
      )}
    </CardContent>
  </Card>
);

// Quick action card component
const QuickActionCard = ({
  title,
  items,
  icon,
  color,
}: {
  title: string;
  items: { label: string; value: number; status: 'success' | 'warning' | 'error' | 'info' }[];
  icon: React.ReactNode;
  color: string;
}) => (
  <Paper
    sx={{
      p: 3,
      height: '100%',
      borderRadius: 4,
      border: '1px solid',
      borderColor: alpha(color, 0.1),
      transition: 'all 0.3s ease-in-out',
      '&:hover': {
        borderColor: alpha(color, 0.3),
        boxShadow: `0 8px 30px ${alpha(color, 0.15)}`,
      },
    }}
  >
    <Box display="flex" alignItems="center" gap={2} mb={3}>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2.5,
          backgroundColor: alpha(color, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
        }}
      >
        {icon}
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
        {title}
      </Typography>
    </Box>
    <Box display="flex" flexDirection="column" gap={2}>
      {items.map((item, index) => (
        <Box
          key={index}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            p: 1.5,
            borderRadius: 2,
            backgroundColor: alpha(
              item.status === 'success'
                ? '#10b981'
                : item.status === 'warning'
                ? '#f59e0b'
                : item.status === 'error'
                ? '#ef4444'
                : '#3b82f6',
              0.05
            ),
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            {item.status === 'success' && (
              <CheckCircleIcon sx={{ fontSize: 18, color: '#10b981' }} />
            )}
            {item.status === 'warning' && (
              <WarningIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
            )}
            {item.status === 'error' && (
              <WarningIcon sx={{ fontSize: 18, color: '#ef4444' }} />
            )}
            {item.status === 'info' && (
              <ScheduleIcon sx={{ fontSize: 18, color: '#3b82f6' }} />
            )}
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, color: '#475569' }}
            >
              {item.label}
            </Typography>
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color:
                item.status === 'success'
                  ? '#10b981'
                  : item.status === 'warning'
                  ? '#f59e0b'
                  : item.status === 'error'
                  ? '#ef4444'
                  : '#3b82f6',
            }}
          >
            {item.value}
          </Typography>
        </Box>
      ))}
    </Box>
  </Paper>
);

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    inventory: { total: 0, lowStock: 0, outOfStock: 0 },
    salesOrders: { total: 0, pending: 0, completed: 0 },
    purchaseOrders: { total: 0, pending: 0, approved: 0 },
    payments: { total: 0, pending: 0, completed: 0 },
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [inventory, lowStock, sales, purchases, payments] = await Promise.all([
        inventoryAPI.getSummary(),
        inventoryAPI.getLowStock(),
        salesOrderAPI.getAll({ page_size: 100 }),
        purchaseOrderAPI.getAll({ page_size: 100 }),
        paymentAPI.getSummary(),
      ]);

      const salesResults = sales.results || [];
      const purchaseResults = purchases.results || [];

      setStats({
        inventory: {
          total: inventory.total_items || 0,
          lowStock: lowStock.count || 0,
          outOfStock: inventory.out_of_stock_items || 0,
        },
        salesOrders: {
          total: sales.count || 0,
          pending: salesResults.filter((o: any) => o.status === 'pending').length || 0,
          completed: salesResults.filter((o: any) => o.status === 'delivered').length || 0,
        },
        purchaseOrders: {
          total: purchases.count || 0,
          pending: purchaseResults.filter(
            (o: any) => o.status === 'draft' || o.status === 'pending_approval'
          ).length || 0,
          approved: purchaseResults.filter((o: any) => o.status === 'approved').length || 0,
        },
        payments: {
          total: payments.total_transactions || 0,
          pending: payments.pending_transactions || 0,
          completed: payments.completed_transactions || 0,
        },
      });
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
        gap={2}
      >
        <CircularProgress
          size={48}
          sx={{
            color: '#6366f1',
          }}
        />
        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: '#1e293b',
            mb: 1,
          }}
        >
          Dashboard
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: '#64748b',
          }}
        >
          Welcome back! Here's what's happening with your business today.
        </Typography>
      </Box>

      {/* Main Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Inventory"
            value={stats.inventory.total.toLocaleString()}
            subtitle={`${stats.inventory.lowStock} low stock`}
            icon={<InventoryIcon sx={{ color: 'white', fontSize: 32 }} />}
            gradient="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
            trend={stats.inventory.lowStock > 5 ? 'down' : 'up'}
            trendValue={stats.inventory.lowStock > 5 ? 'Needs attention' : 'Healthy'}
            progressValue={Math.max(0, 100 - (stats.inventory.lowStock / Math.max(stats.inventory.total, 1)) * 100)}
            progressColor="#6366f1"
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Sales Orders"
            value={stats.salesOrders.total.toLocaleString()}
            subtitle={`${stats.salesOrders.pending} pending`}
            icon={<ShoppingCartIcon sx={{ color: 'white', fontSize: 32 }} />}
            gradient="linear-gradient(135deg, #10b981 0%, #14b8a6 100%)"
            trend="up"
            trendValue={`${stats.salesOrders.completed} completed`}
            progressValue={Math.round((stats.salesOrders.completed / Math.max(stats.salesOrders.total, 1)) * 100)}
            progressColor="#10b981"
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Purchase Orders"
            value={stats.purchaseOrders.total.toLocaleString()}
            subtitle={`${stats.purchaseOrders.pending} pending`}
            icon={<LocalShippingIcon sx={{ color: 'white', fontSize: 32 }} />}
            gradient="linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
            trend="neutral"
            trendValue={`${stats.purchaseOrders.approved} approved`}
            progressValue={Math.round((stats.purchaseOrders.approved / Math.max(stats.purchaseOrders.total, 1)) * 100)}
            progressColor="#f59e0b"
          />
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Payments"
            value={stats.payments.total.toLocaleString()}
            subtitle={`${stats.payments.pending} pending`}
            icon={<TrendingUpIcon sx={{ color: 'white', fontSize: 32 }} />}
            gradient="linear-gradient(135deg, #ec4899 0%, #f472b6 100%)"
            trend={stats.payments.pending > 0 ? 'down' : 'up'}
            trendValue={stats.payments.pending > 0 ? `${stats.payments.pending} awaiting` : 'All clear'}
            progressValue={Math.round((stats.payments.completed / Math.max(stats.payments.total, 1)) * 100)}
            progressColor="#ec4899"
          />
        </Grid>
      </Grid>

      {/* Quick Overview Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <QuickActionCard
            title="Inventory Status"
            icon={<InventoryIcon />}
            color="#6366f1"
            items={[
              {
                label: 'In Stock Items',
                value: Math.max(0, stats.inventory.total - stats.inventory.lowStock - stats.inventory.outOfStock),
                status: 'success',
              },
              {
                label: 'Low Stock Items',
                value: stats.inventory.lowStock,
                status: stats.inventory.lowStock > 0 ? 'warning' : 'success',
              },
              {
                label: 'Out of Stock',
                value: stats.inventory.outOfStock,
                status: stats.inventory.outOfStock > 0 ? 'error' : 'success',
              },
            ]}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <QuickActionCard
            title="Order Status"
            icon={<ShoppingCartIcon />}
            color="#10b981"
            items={[
              {
                label: 'Completed Orders',
                value: stats.salesOrders.completed,
                status: 'success',
              },
              {
                label: 'Pending Orders',
                value: stats.salesOrders.pending,
                status: stats.salesOrders.pending > 0 ? 'info' : 'success',
              },
              {
                label: 'Processing',
                value: Math.max(0, stats.salesOrders.total - stats.salesOrders.pending - stats.salesOrders.completed),
                status: 'info',
              },
            ]}
          />
        </Grid>

        <Grid item xs={12}>
          <Paper
            sx={{
              p: 4,
              borderRadius: 4,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Background decorations */}
            <Box
              sx={{
                position: 'absolute',
                top: -100,
                right: -100,
                width: 300,
                height: 300,
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -50,
                left: -50,
                width: 200,
                height: 200,
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              }}
            />

            <Box position="relative" zIndex={1}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                Welcome to Your ERP Dashboard
              </Typography>
              <Typography
                variant="body1"
                sx={{ opacity: 0.9, maxWidth: 600, mb: 2 }}
              >
                Manage your inventory, track orders, monitor payments, and streamline
                your entire business operations from one centralized platform.
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Chip
                  label="Real-time Analytics"
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)',
                  }}
                />
                <Chip
                  label="Multi-vendor Support"
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)',
                  }}
                />
                <Chip
                  label="Automated Workflows"
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)',
                  }}
                />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
