import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  IconButton,
  Tooltip,
  Alert,
  Chip,
  Avatar,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Block,
  CheckCircle,
} from '@mui/icons-material';
import { userAPI } from '../utils/api';
import { PageHeader, StatusChip, ConfirmDialog, DetailDrawer, DetailSection, DetailItem } from '../components';

const USER_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'customer', label: 'Customer' },
  { value: 'delivery_agent', label: 'Delivery Agent' },
  { value: 'warehouse', label: 'Warehouse Staff' },
];

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'customer',
    is_active: true,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await userAPI.getAll();
      setUsers(data.results || data.data || data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openForm = (user?: any) => {
    if (user) {
      setSelectedUser(user);
      setForm({
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        role: user.role || 'customer',
        is_active: user.is_active ?? true,
      });
    } else {
      setSelectedUser(null);
      setForm({
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        role: 'customer',
        is_active: true,
      });
    }
    setFormOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedUser) {
        await userAPI.update(selectedUser.id, form);
      } else {
        await userAPI.create(form);
      }
      setFormOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await userAPI.delete(selectedUser.id);
      setDeleteOpen(false);
      setSelectedUser(null);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (user: any) => {
    try {
      if (user.is_active) {
        await userAPI.deactivate(user.id);
      } else {
        await userAPI.activate(user.id);
      }
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'name',
      headerName: 'User',
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: '#6366f1' }}>
            {params.row.first_name?.[0] || params.row.email?.[0]?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography fontWeight={600} fontSize={14}>
              {params.row.first_name} {params.row.last_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.email}
            </Typography>
          </Box>
        </Box>
      ),
    },
    { field: 'phone', headerName: 'Phone', width: 140 },
    {
      field: 'role',
      headerName: 'Role',
      width: 140,
      renderCell: (params) => <StatusChip status={params.value} />,
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'created_at',
      headerName: 'Joined',
      width: 120,
      renderCell: (params) =>
        params.value ? new Date(params.value).toLocaleDateString() : '-',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => {
                setSelectedUser(params.row);
                setDetailOpen(true);
              }}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openForm(params.row)}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={params.row.is_active ? 'Deactivate' : 'Activate'}>
            <IconButton
              size="small"
              color={params.row.is_active ? 'warning' : 'success'}
              onClick={() => handleToggleActive(params.row)}
            >
              {params.row.is_active ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => {
                setSelectedUser(params.row);
                setDeleteOpen(true);
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Users"
        subtitle="Manage all system users and their roles"
        actionLabel="Add User"
        onAction={() => openForm()}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ borderRadius: 3 }}>
        <DataGrid
          rows={users}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          autoHeight
          sx={{
            border: 0,
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f8fafc',
            },
          }}
        />
      </Paper>

      {/* Form Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}>
          {selectedUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              fullWidth
              required
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="First Name"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                fullWidth
              />
              <TextField
                label="Last Name"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                fullWidth
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                fullWidth
              />
              <TextField
                select
                label="Role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                fullWidth
              >
                {USER_ROLES.map((role) => (
                  <MenuItem key={role.value} value={role.value}>
                    {role.label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
              }
              label="Active"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {selectedUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Drawer */}
      <DetailDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={`${selectedUser?.first_name || ''} ${selectedUser?.last_name || ''}`}
        subtitle={selectedUser?.email}
      >
        {selectedUser && (
          <>
            <DetailSection title="Basic Information">
              <DetailItem label="ID" value={selectedUser.id} />
              <DetailItem label="Email" value={selectedUser.email} />
              <DetailItem label="Phone" value={selectedUser.phone} />
              <DetailItem label="Role" value={selectedUser.role} chip />
            </DetailSection>
            <DetailSection title="Status">
              <DetailItem
                label="Account Status"
                value={selectedUser.is_active ? 'Active' : 'Inactive'}
                chip
              />
              <DetailItem
                label="Joined"
                value={
                  selectedUser.created_at
                    ? new Date(selectedUser.created_at).toLocaleString()
                    : '-'
                }
              />
              <DetailItem
                label="Last Updated"
                value={
                  selectedUser.updated_at
                    ? new Date(selectedUser.updated_at).toLocaleString()
                    : '-'
                }
              />
            </DetailSection>
          </>
        )}
      </DetailDrawer>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete User"
        message={`Are you sure you want to delete ${selectedUser?.email}? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </Box>
  );
}
