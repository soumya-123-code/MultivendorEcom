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
  Grid,
  Chip
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add, Edit, Delete } from '@mui/icons-material';
import { supplierAPI } from '../utils/api';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  
  const [form, setForm] = useState({
    name: '',
    code: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    tax_id: '',
    payment_terms: 'net_30',
    bank_name: '',
    bank_account: '',
    bank_ifsc: '',
    status: 'active',
    notes: ''
  });

  const paymentTermsOptions = [
    { value: 'cod', label: 'Cash on Delivery' },
    { value: 'net_15', label: 'Net 15' },
    { value: 'net_30', label: 'Net 30' },
    { value: 'net_60', label: 'Net 60' },
    { value: 'advance', label: 'Advance Payment' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await supplierAPI.getAll();
      setSuppliers(data.data || data.results || data);
      setError('');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (supplier?: any) => {
    if (supplier) {
      setEditing(supplier);
      setForm({
        name: supplier.name || '',
        code: supplier.code || '',
        contact_person: supplier.contact_person || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        city: supplier.city || '',
        state: supplier.state || '',
        country: supplier.country || 'India',
        pincode: supplier.pincode || '',
        tax_id: supplier.tax_id || '',
        payment_terms: supplier.payment_terms || 'net_30',
        bank_name: supplier.bank_name || '',
        bank_account: supplier.bank_account || '',
        bank_ifsc: supplier.bank_ifsc || '',
        status: supplier.status || 'active',
        notes: supplier.notes || ''
      });
    } else {
      setEditing(null);
      setForm({
        name: '',
        code: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: 'India',
        pincode: '',
        tax_id: '',
        payment_terms: 'net_30',
        bank_name: '',
        bank_account: '',
        bank_ifsc: '',
        status: 'active',
        notes: ''
      });
    }
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await supplierAPI.update(editing.id, form);
      } else {
        await supplierAPI.create(form);
      }
      setOpen(false);
      loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to save supplier');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await supplierAPI.delete(id);
        loadData();
      } catch (error: any) {
        alert(error.message || 'Failed to delete supplier');
      }
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'code', headerName: 'Code', width: 100 },
    { field: 'contact_person', headerName: 'Contact Person', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'phone', headerName: 'Phone', width: 150 },
    { field: 'city', headerName: 'City', width: 120 },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 100,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={params.value === 'active' ? 'success' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
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
      <Stack direction="row" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Suppliers</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Add Supplier
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid 
          rows={suppliers} 
          columns={columns} 
          loading={loading} 
          disableRowSelectionOnClick
        />
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editing ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3} mt={1}>
            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom>Basic Information</Typography>
            <Grid container spacing={2}>
  <Grid size={{ xs: 12, sm: 6 }}>
    <TextField label="Name" fullWidth required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
  </Grid>
  <Grid size={{ xs: 12, sm: 6 }}>
    <TextField label="Code" fullWidth value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
  </Grid>
  <Grid size={{ xs: 12, sm: 6 }}>
    <TextField label="Contact Person" fullWidth value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} />
  </Grid>
  <Grid size={{ xs: 12, sm: 6 }}>
    <TextField label="Status" select fullWidth value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
      <MenuItem value="active">Active</MenuItem>
      <MenuItem value="inactive">Inactive</MenuItem>
    </TextField>
  </Grid>
</Grid>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom>Contact Details</Typography>
             <Grid container spacing={2}>
  <Grid size={{ xs: 12, sm: 6 }}>
    <TextField label="Email" fullWidth value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
  </Grid>
  <Grid size={{ xs: 12, sm: 6 }}>
    <TextField label="Phone" fullWidth value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
  </Grid>
  <Grid size={{ xs: 12 }}>
    <TextField label="Address" fullWidth multiline rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
  </Grid>
  <Grid size={{ xs: 6, sm: 3 }}>
    <TextField label="City" fullWidth value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
  </Grid>
  <Grid size={{ xs: 6, sm: 3 }}>
    <TextField label="State" fullWidth value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
  </Grid>
  <Grid size={{ xs: 6, sm: 3 }}>
    <TextField label="Country" fullWidth value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
  </Grid>
  <Grid size={{ xs: 6, sm: 3 }}>
    <TextField label="Pincode" fullWidth value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} />
  </Grid>
</Grid>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom>Financial Details</Typography>
              <Grid container spacing={2}>
  <Grid size={{ xs: 12, sm: 6 }}>
    <TextField label="Tax ID" fullWidth value={form.tax_id} onChange={e => setForm({ ...form, tax_id: e.target.value })} />
  </Grid>
  <Grid size={{ xs: 12, sm: 6 }}>
    <TextField label="Payment Terms" select fullWidth value={form.payment_terms} onChange={e => setForm({ ...form, payment_terms: e.target.value })}>
      {paymentTermsOptions.map(option => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  </Grid>
  <Grid size={{ xs: 12, sm: 4 }}>
    <TextField label="Bank Name" fullWidth value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} />
  </Grid>
  <Grid size={{ xs: 12, sm: 4 }}>
    <TextField label="Account Number" fullWidth value={form.bank_account} onChange={e => setForm({ ...form, bank_account: e.target.value })} />
  </Grid>
  <Grid size={{ xs: 12, sm: 4 }}>
    <TextField label="IFSC Code" fullWidth value={form.bank_ifsc} onChange={e => setForm({ ...form, bank_ifsc: e.target.value })} />
  </Grid>
</Grid>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="primary" gutterBottom>Additional Information</Typography>
              <TextField 
                label="Notes" 
                fullWidth 
                multiline 
                rows={3} 
                value={form.notes} 
                onChange={e => setForm({ ...form, notes: e.target.value })} 
              />
            </Box>
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