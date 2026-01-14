import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Grid, Typography, Avatar, Chip, Button, Divider,
  Card, CardContent, IconButton, Tooltip, CircularProgress,
} from '@mui/material';
import {
  ArrowBack as BackIcon, Edit as EditIcon, Email as EmailIcon,
  Phone as PhoneIcon, CalendarToday as CalendarIcon, Security as RoleIcon,
} from '@mui/icons-material';
import { PageHeader, StatusChip } from '../../../components';
import { useApiQuery } from '../../../hooks';
import { usersApi } from '../../../api';
import { formatDate } from '../../../utils';

const UserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: user, loading, error } = useApiQuery(
    () => usersApi.getById(Number(id)),
    [id]
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !user) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color="error">User not found</Typography>
        <Button onClick={() => navigate('/admin/users')} sx={{ mt: 2 }}>Back to Users</Button>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="User Details"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Users', path: '/admin/users' },
          { label: user.first_name || user.email },
        ]}
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button startIcon={<BackIcon />} onClick={() => navigate('/admin/users')}>Back</Button>
            <Button variant="contained" startIcon={<EditIcon />} onClick={() => navigate(`/admin/users/${id}/edit`)}>Edit</Button>
          </Box>
        }
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              src={user.avatar?.url}
              sx={{ width: 120, height: 120, mx: 'auto', mb: 2, fontSize: 48 }}
            >
              {user.first_name?.[0] || user.email[0].toUpperCase()}
            </Avatar>
            <Typography variant="h5" gutterBottom>
              {user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'No Name'}
            </Typography>
            <Chip
              label={user.role.replace('_', ' ').toUpperCase()}
              color="primary"
              sx={{ mb: 2 }}
            />
            <Box>
              <StatusChip
                status={user.is_active ? 'active' : 'inactive'}
                label={user.is_active ? 'Active' : 'Inactive'}
                color={user.is_active ? 'success' : 'default'}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Contact Information</Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <EmailIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Email</Typography>
                    <Typography>{user.email}</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PhoneIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Phone</Typography>
                    <Typography>{user.phone || 'Not provided'}</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <RoleIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Role</Typography>
                    <Typography>{user.role.replace('_', ' ')}</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CalendarIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Joined</Typography>
                    <Typography>{formatDate(user.date_joined, 'long')}</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>Account Settings</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Verified</Typography>
                <Typography>{user.is_verified ? 'Yes' : 'No'}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Staff</Typography>
                <Typography>{user.is_staff ? 'Yes' : 'No'}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Language</Typography>
                <Typography>{user.language || 'English'}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Timezone</Typography>
                <Typography>{user.timezone || 'UTC'}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserDetailPage;
