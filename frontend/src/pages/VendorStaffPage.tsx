import { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Alert, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Stack, 
  IconButton, 
  Tooltip,
  MenuItem,
  Chip
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Edit, Delete } from '@mui/icons-material';
import { vendorStaffAPI, userAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export default function VendorStaffPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  
  const [form, setForm] = useState({
    user_id: '',
    role: 'staff',
    permissions: '{}'
  });

  useEffect(() => {
    loadData();
    loadUsers();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await vendorStaffAPI.getAll();
      setStaff(data.results || data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      // In a real app, we might want to search users by email
      // Here we just load first 100 users for selection if admin
      // If vendor, they might not be able to see all users, so we might need a search endpoint
      // For now, let's try to load users if allowed
      if (user?.role === 'admin' || user?.role === 'super_admin') {
         const data = await userAPI.getAll();
         setUsers(data.data || data.results || data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpen = (item?: any) => {
    if (item) {
      setEditing(item);
      setForm({
        user_id: item.user?.id || '',
        role: item.role,
        permissions: JSON.stringify(item.permissions || {}, null, 2)
      });
    } else {
      setEditing(null);
      setForm({
        user_id: '',
        role: 'staff',
        permissions: '{}'
      });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...form,
        permissions: JSON.parse(form.permissions || '{}')
      };
      
      if (editing) {
        await vendorStaffAPI.update(editing.id, payload);
      } else {
        await vendorStaffAPI.create(payload);
      }
      setOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to save staff member');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await vendorStaffAPI.delete(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete staff member');
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { 
      field: 'user', 
      headerName: 'User', 
      width: 200, 
      valueGetter: (params: any) => params.row.user?.email || params.value 
    },
    { 
        field: 'role', 
        headerName: 'Role', 
        width: 150,
        renderCell: (params) => (
            <Chip 
                label={params.value} 
                color={params.value === 'manager' ? 'primary' : 'default'}
                size="small"
            />
        )
    },
    { 
        field: 'is_active', 
        headerName: 'Active', 
        type: 'boolean', 
        width: 100 
    },
    { field: 'created_at', headerName: 'Joined', width: 180 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Edit">
            <IconButton onClick={() => handleOpen(params.row)} color="primary" size="small">
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton onClick={() => handleDelete(params.row.id)} color="error" size="small">
              <Delete />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Vendor Staff</Typography>
        <Button variant="contained" onClick={() => handleOpen()}>
          Add Staff
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={staff}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
        />
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Staff' : 'Add Staff'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            {!editing && (
                users.length > 0 ? (
                    <TextField
                        select
                        label="Select User"
                        value={form.user_id}
                        onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                        fullWidth
                    >
                        {users.map((u) => (
                            <MenuItem key={u.id} value={u.id}>
                                {u.email} ({u.first_name} {u.last_name})
                            </MenuItem>
                        ))}
                    </TextField>
                ) : (
                    <TextField
                        label="User ID"
                        value={form.user_id}
                        onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                        fullWidth
                        helperText="Enter the User ID of the staff member"
                    />
                )
            )}
            
            <TextField
              select
              label="Role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              fullWidth
            >
              <MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="staff">Staff</MenuItem>
            </TextField>

            <TextField
              label="Permissions (JSON)"
              value={form.permissions}
              onChange={(e) => setForm({ ...form, permissions: e.target.value })}
              fullWidth
              multiline
              rows={4}
              helperText="e.g. { 'can_manage_products': true }"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}