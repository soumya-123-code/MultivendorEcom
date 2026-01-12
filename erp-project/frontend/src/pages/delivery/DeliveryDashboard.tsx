import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  useTheme,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondary,
  Chip,
  Divider,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  LocalShipping as DeliveryIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  AttachMoney as EarningsIcon,
  Navigation as NavigationIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { PageHeader, StatsCard, StatusChip } from '../../components';
import { useAuth } from '../../contexts';

const mockStats = {
  assignedToday: 8,
  completedToday: 5,
  pendingPickup: 2,
  inTransit: 1,
  todayEarnings: '₹850',
  weekEarnings: '₹5,200',
};

const mockAssignedDeliveries = [
  {
    id: 1,
    orderNumber: 'SO-2024-089',
    customer: 'John Doe',
    phone: '+91 98765 43210',
    address: '123 Main Street, Koramangala, Bangalore - 560034',
    status: 'assigned',
    amount: '₹4,500',
    paymentMode: 'COD',
    items: 3,
    estimatedTime: '30 mins',
  },
  {
    id: 2,
    orderNumber: 'SO-2024-088',
    customer: 'Jane Smith',
    phone: '+91 98765 43211',
    address: '456 Park Avenue, Indiranagar, Bangalore - 560038',
    status: 'picked_up',
    amount: '₹1,200',
    paymentMode: 'Prepaid',
    items: 1,
    estimatedTime: '45 mins',
  },
  {
    id: 3,
    orderNumber: 'SO-2024-087',
    customer: 'Bob Wilson',
    phone: '+91 98765 43212',
    address: '789 Lake View, HSR Layout, Bangalore - 560102',
    status: 'in_transit',
    amount: '₹8,900',
    paymentMode: 'COD',
    items: 5,
    estimatedTime: '15 mins',
  },
];

const mockCompletedToday = [
  { id: 1, orderNumber: 'SO-2024-085', customer: 'Alice Brown', completedAt: '10:30 AM', amount: '₹2,300' },
  { id: 2, orderNumber: 'SO-2024-084', customer: 'Charlie Davis', completedAt: '11:45 AM', amount: '₹1,500' },
  { id: 3, orderNumber: 'SO-2024-083', customer: 'Eva Green', completedAt: '1:15 PM', amount: '₹3,800' },
  { id: 4, orderNumber: 'SO-2024-082', customer: 'Frank Miller', completedAt: '2:30 PM', amount: '₹950' },
  { id: 5, orderNumber: 'SO-2024-081', customer: 'Grace Lee', completedAt: '3:45 PM', amount: '₹2,100' },
];

const DeliveryDashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAvailable, setIsAvailable] = useState(true);

  const handleAvailabilityToggle = () => {
    setIsAvailable(!isAvailable);
    // TODO: Call API to update availability
  };

  const getStatusPriority = (status: string) => {
    const priorities: Record<string, number> = {
      in_transit: 1,
      picked_up: 2,
      accepted: 3,
      assigned: 4,
    };
    return priorities[status] || 5;
  };

  const sortedDeliveries = [...mockAssignedDeliveries].sort(
    (a, b) => getStatusPriority(a.status) - getStatusPriority(b.status)
  );

  return (
    <Box>
      <PageHeader
        title="My Deliveries"
        subtitle={`Hello ${user?.first_name || 'Driver'}! Here's your delivery schedule for today`}
        actions={
          <FormControlLabel
            control={
              <Switch
                checked={isAvailable}
                onChange={handleAvailabilityToggle}
                color="success"
              />
            }
            label={isAvailable ? 'Available' : 'Offline'}
            sx={{
              bgcolor: isAvailable ? 'success.light' : 'grey.300',
              px: 2,
              py: 0.5,
              borderRadius: 2,
              '& .MuiTypography-root': { fontWeight: 600 },
            }}
          />
        }
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}>
          <StatsCard
            title="Assigned"
            value={mockStats.assignedToday}
            icon={DeliveryIcon}
            iconColor="#1976d2"
            iconBgColor="rgba(25, 118, 210, 0.1)"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatsCard
            title="Completed"
            value={mockStats.completedToday}
            icon={CompletedIcon}
            iconColor="#2e7d32"
            iconBgColor="rgba(46, 125, 50, 0.1)"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatsCard
            title="Pending"
            value={mockStats.pendingPickup}
            icon={PendingIcon}
            iconColor="#ed6c02"
            iconBgColor="rgba(237, 108, 2, 0.1)"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatsCard
            title="In Transit"
            value={mockStats.inTransit}
            icon={DeliveryIcon}
            iconColor="#9c27b0"
            iconBgColor="rgba(156, 39, 176, 0.1)"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatsCard
            title="Today's Earnings"
            value={mockStats.todayEarnings}
            icon={EarningsIcon}
            iconColor="#0288d1"
            iconBgColor="rgba(2, 136, 209, 0.1)"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatsCard
            title="This Week"
            value={mockStats.weekEarnings}
            icon={EarningsIcon}
            iconColor="#00897b"
            iconBgColor="rgba(0, 137, 123, 0.1)"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Active Deliveries</Typography>
              {sortedDeliveries.map((delivery, index) => (
                <Box key={delivery.id}>
                  <Box sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle1" fontWeight={600}>{delivery.orderNumber}</Typography>
                          <StatusChip status={delivery.status} category="delivery" />
                          {delivery.paymentMode === 'COD' && (
                            <Chip label="COD" size="small" color="warning" variant="outlined" />
                          )}
                        </Box>
                        <Typography variant="body2">{delivery.customer}</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="subtitle1" fontWeight={600}>{delivery.amount}</Typography>
                        <Typography variant="caption" color="text.secondary">{delivery.items} items</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1, color: 'text.secondary' }}>
                      <LocationIcon fontSize="small" />
                      <Typography variant="body2">{delivery.address}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PhoneIcon />}
                        href={`tel:${delivery.phone}`}
                      >
                        Call
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<NavigationIcon />}
                        href={`https://maps.google.com/?q=${encodeURIComponent(delivery.address)}`}
                        target="_blank"
                      >
                        Navigate
                      </Button>
                      {delivery.status === 'assigned' && (
                        <Button size="small" variant="contained" color="primary">Accept</Button>
                      )}
                      {delivery.status === 'accepted' && (
                        <Button size="small" variant="contained" color="info">Pick Up</Button>
                      )}
                      {delivery.status === 'picked_up' && (
                        <Button size="small" variant="contained" color="secondary">Start Delivery</Button>
                      )}
                      {delivery.status === 'in_transit' && (
                        <Button size="small" variant="contained" color="success">Mark Delivered</Button>
                      )}
                    </Box>
                  </Box>
                  {index < sortedDeliveries.length - 1 && <Divider />}
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Completed Today</Typography>
                <Button size="small" onClick={() => navigate('/delivery/history')}>History</Button>
              </Box>
              <List disablePadding>
                {mockCompletedToday.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <ListItem disablePadding sx={{ py: 1 }}>
                      <Avatar sx={{ bgcolor: 'success.light', color: 'success.main', mr: 2, width: 36, height: 36 }}>
                        <CompletedIcon fontSize="small" />
                      </Avatar>
                      <ListItemText
                        primary={item.orderNumber}
                        secondary={`${item.customer} • ${item.completedAt}`}
                        primaryTypographyProps={{ variant: 'subtitle2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                      <Typography variant="body2" fontWeight={600}>{item.amount}</Typography>
                    </ListItem>
                    {index < mockCompletedToday.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DeliveryDashboard;
