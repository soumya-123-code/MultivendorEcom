import React from 'react';
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
  Chip,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Input as InboundIcon,
  Output as OutboundIcon,
  Warning as WarningIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHeader, StatsCard, StatusChip } from '../../components';
import { useAppSelector } from '../../store';
import { selectUser } from '../../store/slices/authSlice';

const mockStats = {
  totalItems: 15420,
  lowStock: 23,
  outOfStock: 5,
  pendingInbound: 8,
  pendingOutbound: 15,
  processedToday: 42,
};

const mockActivityChart = [
  { name: 'Mon', inbound: 45, outbound: 32 },
  { name: 'Tue', inbound: 52, outbound: 48 },
  { name: 'Wed', inbound: 38, outbound: 55 },
  { name: 'Thu', inbound: 61, outbound: 42 },
  { name: 'Fri', inbound: 55, outbound: 58 },
  { name: 'Sat', inbound: 28, outbound: 35 },
  { name: 'Sun', inbound: 15, outbound: 18 },
];

const mockPendingInbound = [
  { id: 1, poNumber: 'PO-2024-045', vendor: 'Tech Supplies Co', items: 120, expectedDate: '2024-01-16' },
  { id: 2, poNumber: 'PO-2024-044', vendor: 'Fashion Wholesale', items: 85, expectedDate: '2024-01-17' },
  { id: 3, poNumber: 'PO-2024-043', vendor: 'Home Goods Ltd', items: 200, expectedDate: '2024-01-18' },
];

const mockPendingOutbound = [
  { id: 1, soNumber: 'SO-2024-089', customer: 'John Doe', items: 3, status: 'ready_for_pickup' },
  { id: 2, soNumber: 'SO-2024-088', customer: 'Jane Smith', items: 1, status: 'processing' },
  { id: 3, soNumber: 'SO-2024-087', customer: 'Bob Wilson', items: 5, status: 'packed' },
  { id: 4, soNumber: 'SO-2024-086', customer: 'Alice Brown', items: 2, status: 'processing' },
];

const mockLowStock = [
  { id: 1, name: 'Wireless Mouse', location: 'A1-S2', current: 5, minimum: 20 },
  { id: 2, name: 'USB-C Cable', location: 'B3-S1', current: 8, minimum: 30 },
  { id: 3, name: 'Phone Case Pro', location: 'C2-S4', current: 3, minimum: 15 },
];

const WarehouseDashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);

  return (
    <Box>
      <PageHeader
        title={`Warehouse Dashboard`}
        subtitle={`Welcome back, ${user?.first_name || 'Operator'}! Here's today's overview`}
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard
            title="Total Items"
            value={mockStats.totalItems.toLocaleString()}
            icon={InventoryIcon}
            iconColor="#1976d2"
            iconBgColor="rgba(25, 118, 210, 0.1)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard
            title="Pending Inbound"
            value={mockStats.pendingInbound}
            icon={InboundIcon}
            iconColor="#2e7d32"
            iconBgColor="rgba(46, 125, 50, 0.1)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard
            title="Pending Outbound"
            value={mockStats.pendingOutbound}
            icon={OutboundIcon}
            iconColor="#9c27b0"
            iconBgColor="rgba(156, 39, 176, 0.1)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard
            title="Low Stock"
            value={mockStats.lowStock}
            icon={WarningIcon}
            iconColor="#ed6c02"
            iconBgColor="rgba(237, 108, 2, 0.1)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard
            title="Out of Stock"
            value={mockStats.outOfStock}
            icon={WarningIcon}
            iconColor="#d32f2f"
            iconBgColor="rgba(211, 47, 47, 0.1)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatsCard
            title="Processed Today"
            value={mockStats.processedToday}
            icon={CheckIcon}
            iconColor="#0288d1"
            iconBgColor="rgba(2, 136, 209, 0.1)"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Weekly Activity</Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={mockActivityChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                  <YAxis stroke={theme.palette.text.secondary} />
                  <Tooltip />
                  <Bar dataKey="inbound" fill="#2e7d32" name="Inbound" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outbound" fill="#1976d2" name="Outbound" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Pending Inbound</Typography>
                <Button size="small" onClick={() => navigate('/warehouse/inbound')}>View All</Button>
              </Box>
              {mockPendingInbound.map((item) => (
                <Box key={item.id} sx={{ py: 1.5, borderBottom: `1px solid ${theme.palette.divider}`, '&:last-child': { borderBottom: 0 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="subtitle2">{item.poNumber}</Typography>
                    <Chip label={`${item.items} items`} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">{item.vendor}</Typography>
                  <Typography variant="caption" color="text.secondary">Expected: {item.expectedDate}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Pending Outbound</Typography>
                <Button size="small" onClick={() => navigate('/warehouse/outbound')}>View All</Button>
              </Box>
              {mockPendingOutbound.map((item) => (
                <Box key={item.id} sx={{ py: 1.5, borderBottom: `1px solid ${theme.palette.divider}`, '&:last-child': { borderBottom: 0 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="subtitle2">{item.soNumber}</Typography>
                    <StatusChip status={item.status} category="order" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">{item.customer}</Typography>
                  <Typography variant="caption" color="text.secondary">{item.items} items</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Low Stock Alert</Typography>
                <Button size="small" onClick={() => navigate('/warehouse/stock')}>View All</Button>
              </Box>
              {mockLowStock.map((item) => (
                <Box key={item.id} sx={{ py: 1.5, borderBottom: `1px solid ${theme.palette.divider}`, '&:last-child': { borderBottom: 0 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="subtitle2">{item.name}</Typography>
                    <Typography variant="body2" color="error.main" fontWeight={600}>{item.current}/{item.minimum}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">Location: {item.location}</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(item.current / item.minimum) * 100}
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

export default WarehouseDashboard;
