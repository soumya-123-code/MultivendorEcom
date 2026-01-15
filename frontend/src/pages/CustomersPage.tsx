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
  FormControlLabel,
  Checkbox,
  Chip
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Edit, Delete, Visibility } from '@mui/icons-material';
import { customerAPI } from '../utils/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    preferred_payment_method: '',
    marketing_consent: false
  });

  const [addressForm, setAddressForm] = useState({
    label: 'home',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    is_default: false,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await customerAPI.getAll();
      setCustomers(data.data || data.results || data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (customer: any) => {
    setSelectedCustomer(customer);
    setViewDialogOpen(true);
  };

  const handleEdit = (customer: any) => {
    setSelectedCustomer(customer);
    setFormData({
      preferred_payment_method: customer.preferred_payment_method || '',
      marketing_consent: customer.marketing_consent || false
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customerAPI.delete(id);
        loadData();
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      await customerAPI.update(selectedCustomer.id, formData);
      setOpenDialog(false);
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'full_name', headerName: 'Name', width: 200 },
    { field: 'email', headerName: 'Email', width: 250 },
    { field: 'total_orders', headerName: 'Orders', width: 100 },
    { field: 'total_spent', headerName: 'Spent', width: 120 },
    { field: 'loyalty_points', headerName: 'Loyalty Points', width: 150 },
    { 
      field: 'marketing_consent', 
      headerName: 'Marketing', 
      width: 100,
      renderCell: (params) => (
        <Chip 
          label={params.value ? 'Yes' : 'No'} 
          color={params.value ? 'success' : 'default'} 
          size="small" 
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="View Details">
            <IconButton onClick={() => handleView(params.row)} color="info" size="small">
              <Visibility />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton onClick={() => handleEdit(params.row)} color="primary" size="small">
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
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Customers</Typography>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <DataGrid 
          rows={customers} 
          columns={columns} 
          loading={loading} 
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          autoHeight
        />
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Edit Customer</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 300 }}>
            <TextField
              label="Preferred Payment Method"
              value={formData.preferred_payment_method}
              onChange={(e) => setFormData({ ...formData, preferred_payment_method: e.target.value })}
              fullWidth
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.marketing_consent}
                  onChange={(e) => setFormData({ ...formData, marketing_consent: e.target.checked })}
                />
              }
              label="Marketing Consent"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Customer Details</DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography><strong>ID:</strong> {selectedCustomer.id}</Typography>
              <Typography><strong>Name:</strong> {selectedCustomer.full_name}</Typography>
              <Typography><strong>Email:</strong> {selectedCustomer.email}</Typography>
              <Typography><strong>Total Orders:</strong> {selectedCustomer.total_orders}</Typography>
              <Typography><strong>Total Spent:</strong> {selectedCustomer.total_spent}</Typography>
              <Typography><strong>Loyalty Points:</strong> {selectedCustomer.loyalty_points}</Typography>
              <Typography><strong>Preferred Payment:</strong> {selectedCustomer.preferred_payment_method || 'N/A'}</Typography>
              <Typography><strong>Marketing Consent:</strong> {selectedCustomer.marketing_consent ? 'Yes' : 'No'}</Typography>
              <Typography><strong>Registered At:</strong> {new Date(selectedCustomer.created_at).toLocaleString()}</Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
