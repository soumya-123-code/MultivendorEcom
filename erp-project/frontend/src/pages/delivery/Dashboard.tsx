import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Card, CardContent, CardHeader, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Skeleton, Alert, Chip, Switch, FormControlLabel, IconButton, Tooltip } from '@mui/material';
import { LocalShipping as DeliveryIcon, CheckCircle as CompletedIcon, Schedule as PendingIcon, Cancel as FailedIcon, Refresh as RefreshIcon, MyLocation as LocationIcon, Phone as PhoneIcon, Map as MapIcon, PlayArrow as StartIcon } from '@mui/icons-material';
import { PageHeader, StatsCard, StatusChip } from '../../components';
import { useAuth } from '../../contexts';
import { deliveryAgentsApi, deliveriesApi } from '../../api';
import { DeliveryAssignment, DeliveryAgentStats } from '../../types';

const DeliveryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [stats, setStats] = useState<DeliveryAgentStats | null>(null);
  const [assignedDeliveries, setAssignedDeliveries] = useState<DeliveryAssignment[]>([]);
  const [inProgressDeliveries, setInProgressDeliveries] = useState<DeliveryAssignment[]>([]);
  const [todayCompleted, setTodayCompleted] = useState<DeliveryAssignment[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, assignedRes, inProgressRes, completedRes] = await Promise.all([
        deliveryAgentsApi.getMyStats(),
        deliveriesApi.getMyDeliveries({ status: 'assigned', page: 1, page_size: 10 }),
        deliveriesApi.getMyDeliveries({ status: 'in_transit', page: 1, page_size: 10 }),
        deliveriesApi.getMyDeliveries({ status: 'delivered', page: 1, page_size: 5 })
      ]);

      setStats(statsRes.data);
      setIsAvailable(statsRes.data.is_available || false);
      setAssignedDeliveries(assignedRes.data.results);
      setInProgressDeliveries(inProgressRes.data.results);
      setTodayCompleted(completedRes.data.results);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const handleToggleAvailability = async () => {
    try {
      await deliveryAgentsApi.setAvailability(!isAvailable);
      setIsAvailable(!isAvailable);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAcceptDelivery = async (id: number) => {
    try {
      await deliveriesApi.accept(id);
      fetchDashboardData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleStartDelivery = async (id: number) => {
    try {
      await deliveriesApi.pickup(id);
      fetchDashboardData();
    } catch (err: any) {
      setError(err.message);
    }
  };

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
        title={`Hello, ${user?.first_name || 'Driver'}!`}
        subtitle="Your delivery assignments and stats"
        actions={
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControlLabel
              control={<Switch checked={isAvailable} onChange={handleToggleAvailability} color="success" />}
              label={isAvailable ? 'Available' : 'Unavailable'}
            />
            <Button startIcon={<RefreshIcon />} onClick={fetchDashboardData} variant="outlined">Refresh</Button>
          </Box>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatsCard title="Today's Deliveries" value={stats?.today_deliveries || 0} icon={DeliveryIcon} iconColor="#1976d2" iconBgColor="rgba(25,118,210,0.1)" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard title="Completed" value={stats?.completed_today || 0} icon={CompletedIcon} iconColor="#2e7d32" iconBgColor="rgba(46,125,50,0.1)" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard title="Pending" value={stats?.pending_deliveries || 0} icon={PendingIcon} iconColor="#ed6c02" iconBgColor="rgba(237,108,2,0.1)" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard title="Today's Earnings" value={formatCurrency(stats?.today_earnings || 0)} icon={CompletedIcon} iconColor="#9c27b0" iconBgColor="rgba(156,39,176,0.1)" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Assigned Deliveries - Need to Accept */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><PendingIcon color="warning" /> New Assignments</Box>}
              subheader={`${assignedDeliveries.length} deliveries awaiting acceptance`}
            />
            <CardContent sx={{ pt: 0 }}>
              {assignedDeliveries.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 3 }}>No new assignments</Typography>
              ) : assignedDeliveries.map((delivery) => (
                <Box key={delivery.id} sx={{ p: 2, mb: 2, border: 1, borderColor: 'divider', borderRadius: 2, '&:last-child': { mb: 0 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle2">{delivery.sales_order_number}</Typography>
                      <Typography variant="caption" color="text.secondary">{delivery.customer_name}</Typography>
                    </Box>
                    <Chip label={delivery.payment_method === 'cod' ? 'COD' : 'Prepaid'} size="small" color={delivery.payment_method === 'cod' ? 'warning' : 'success'} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    📍 {delivery.delivery_address?.substring(0, 50)}...
                  </Typography>
                  {delivery.payment_method === 'cod' && (
                    <Typography variant="body2" fontWeight={600} color="warning.main" sx={{ mb: 1 }}>
                      Collect: {formatCurrency(Number(delivery.cod_amount || 0))}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="contained" color="success" onClick={() => handleAcceptDelivery(delivery.id)}>Accept</Button>
                    <Button size="small" variant="outlined" onClick={() => navigate(`/delivery/assigned/${delivery.id}`)}>Details</Button>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* In Progress */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><DeliveryIcon color="primary" /> In Progress</Box>}
              subheader={`${inProgressDeliveries.length} active deliveries`}
            />
            <CardContent sx={{ pt: 0 }}>
              {inProgressDeliveries.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 3 }}>No active deliveries</Typography>
              ) : inProgressDeliveries.map((delivery) => (
                <Box key={delivery.id} sx={{ p: 2, mb: 2, border: 1, borderColor: 'primary.main', borderRadius: 2, bgcolor: 'primary.50', '&:last-child': { mb: 0 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle2">{delivery.sales_order_number}</Typography>
                      <Typography variant="caption" color="text.secondary">{delivery.customer_name}</Typography>
                    </Box>
                    <StatusChip status={delivery.status} category="delivery" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    📍 {delivery.delivery_address?.substring(0, 50)}...
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {delivery.customer_phone && (
                      <Button size="small" variant="outlined" startIcon={<PhoneIcon />} href={`tel:${delivery.customer_phone}`}>Call</Button>
                    )}
                    <Button size="small" variant="outlined" startIcon={<MapIcon />} onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(delivery.delivery_address || '')}`, '_blank')}>Navigate</Button>
                    <Button size="small" variant="contained" onClick={() => navigate(`/delivery/in-progress/${delivery.id}`)}>Update</Button>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Today's Completed */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Today's Completed Deliveries" action={<Button size="small" onClick={() => navigate('/delivery/completed')}>View All</Button>} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Order #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Address</TableCell>
                    <TableCell>Payment</TableCell>
                    <TableCell>Completed At</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {todayCompleted.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center">No completed deliveries today</TableCell></TableRow>
                  ) : todayCompleted.map((delivery) => (
                    <TableRow key={delivery.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{delivery.sales_order_number}</TableCell>
                      <TableCell>{delivery.customer_name}</TableCell>
                      <TableCell sx={{ maxWidth: 200 }}><Typography variant="body2" noWrap>{delivery.delivery_address}</Typography></TableCell>
                      <TableCell><Chip label={delivery.payment_method?.toUpperCase()} size="small" /></TableCell>
                      <TableCell>{delivery.delivered_at ? new Date(delivery.delivered_at).toLocaleTimeString() : '-'}</TableCell>
                      <TableCell><StatusChip status={delivery.status} category="delivery" /></TableCell>
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

export default DeliveryDashboard;
