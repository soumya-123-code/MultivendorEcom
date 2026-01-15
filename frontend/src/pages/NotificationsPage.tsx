import { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  Divider
} from '@mui/material';
import { 
  Notifications as NotificationsIcon,
  CheckCircle as ReadIcon,
  Delete as DeleteIcon,
  LocalShipping as DeliveryIcon,
  Payment as PaymentIcon,
  ShoppingCart as OrderIcon,
  Info as SystemIcon
} from '@mui/icons-material';
import { notificationAPI } from '../utils/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationAPI.getAll();
      setNotifications(data.data || data.results || []);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await notificationAPI.markRead(id);
      loadNotifications();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      loadNotifications();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await notificationAPI.delete(id);
      loadNotifications();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) return;
    try {
      await notificationAPI.clearAll();
      loadNotifications();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <OrderIcon color="primary" />;
      case 'payment': return <PaymentIcon color="secondary" />;
      case 'delivery': return <DeliveryIcon color="success" />;
      default: return <SystemIcon color="info" />;
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">My Notifications</Typography>
        <Box>
          <Button onClick={handleMarkAllRead} sx={{ mr: 1 }}>
            Mark All Read
          </Button>
          <Button color="error" onClick={handleClearAll}>
            Clear All
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {notifications.length === 0 ? (
          <Box p={3} textAlign="center">
            <Typography color="text.secondary">No notifications</Typography>
          </Box>
        ) : (
          <List>
            {notifications.map((notification: any, index) => (
              <Box key={notification.id}>
                <ListItem 
                  alignItems="flex-start"
                  sx={{ 
                    bgcolor: notification.is_read ? 'transparent' : 'action.hover',
                    transition: '0.3s'
                  }}
                >
                  <ListItemIcon sx={{ mt: 1 }}>
                    {getIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1" fontWeight={notification.is_read ? 'normal' : 'bold'}>
                          {notification.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(notification.created_at).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                        sx={{ display: 'block', mt: 0.5 }}
                      >
                        {notification.message}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    {!notification.is_read && (
                      <IconButton edge="end" onClick={() => handleMarkRead(notification.id)} title="Mark as read">
                        <ReadIcon color="primary" fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton edge="end" onClick={() => handleDelete(notification.id)} title="Delete">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < notifications.length - 1 && <Divider component="li" />}
              </Box>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}
