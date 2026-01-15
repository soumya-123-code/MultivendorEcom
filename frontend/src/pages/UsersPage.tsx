import { useState, useEffect } from 'react';
import { 
  Box, Button, Paper, Typography, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Stack, MenuItem, Chip, Alert, IconButton, Tooltip 
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add, Edit, Delete } from '@mui/icons-material';
import { userAPI } from '../utils/api';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  
  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'customer',
    password: ''
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await userAPI.getAll();
      setUsers(data.data || data.results || data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (user?: any) => {
    if (user) {
      setEditing(user);
      setForm({
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        password: ''
      });
    } else {
      setEditing(null);
      setForm({
        email: '',
        first_name: '',
        last_name: '',
        role: 'customer',
        password: ''
      });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await userAPI.update(editing.id, form);
      } else {
        await userAPI.create(form);
      }
      setOpen(false);
      loadData();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userAPI.delete(id);
        loadData();
      } catch (error: any) {
        setError(error.message);
      }
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'first_name', headerName: 'First Name', width: 150 },
    { field: 'last_name', headerName: 'Last Name', width: 150 },
    { 
      field: 'role', 
      headerName: 'Role', 
      width: 130,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={params.value === 'admin' ? 'error' : params.value === 'vendor' ? 'warning' : 'default'} 
          size="small" 
        />
      )
    },
    { field: 'is_active', headerName: 'Active', type: 'boolean', width: 100 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <>
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
        </>
      )
    }
  ];

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Users</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Add User
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Paper sx={{ height: 600 }}>
        <DataGrid rows={users} columns={columns} loading={loading} pageSizeOptions={[10, 25, 50]} disableRowSelectionOnClick />
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} fullWidth />
            <Stack direction="row" spacing={2}>
              <TextField label="First Name" value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} fullWidth />
              <TextField label="Last Name" value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} fullWidth />
            </Stack>
            <TextField select label="Role" value={form.role} onChange={e => setForm({...form, role: e.target.value})} fullWidth>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="vendor">Vendor</MenuItem>
              <MenuItem value="customer">Customer</MenuItem>
              <MenuItem value="warehouse">Warehouse</MenuItem>
              <MenuItem value="delivery_agent">Delivery Agent</MenuItem>
            </TextField>
            {!editing && (
              <TextField type="password" label="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} fullWidth />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>{editing ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
