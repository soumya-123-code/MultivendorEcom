import { useState, useEffect } from 'react';
import { Box, Paper, Typography, List, ListItem, ListItemText, IconButton, Alert, Button, Chip } from '@mui/material';
import { Delete as DeleteIcon, CheckCircle as ReadIcon } from '@mui/icons-material';
import { notificationAPI } from '../utils/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await notificationAPI.getAll();
      setNotifications(data.results || data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await notificationAPI.markRead(id);
      loadData();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      loadData();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await notificationAPI.delete(id);
      loadData();
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Notifications</Typography>
        <Button variant="outlined" onClick={handleMarkAllRead}>Mark All Read</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper>
        <List>
          {notifications.length === 0 ? (
            <ListItem><ListItemText primary="No notifications" /></ListItem>
          ) : (
            notifications.map((notif: any) => (
              <ListItem
                key={notif.id}
                secondaryAction={
                  <>
                    {!notif.is_read && (
                      <IconButton edge="end" onClick={() => handleMarkRead(notif.id)}>
                        <ReadIcon />
                      </IconButton>
                    )}
                    <IconButton edge="end" onClick={() => handleDelete(notif.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </>
                }
                sx={{ bgcolor: notif.is_read ? 'inherit' : 'action.hover' }}
              >
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      {notif.title}
                      {!notif.is_read && <Chip label="New" size="small" color="primary" />}
                    </Box>
                  }
                  secondary={notif.message}
                />
              </ListItem>
            ))
          )}
        </List>
      </Paper>
    </Box>
  );
}
