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
  Chip,
  Menu,
  MenuItem
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Edit, Delete, Visibility, MoreVert, CheckCircle, Cancel, Block, Restore } from '@mui/icons-material';
import { vendorAPI } from '../utils/api';

export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuVendor, setMenuVendor] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    store_name: '',
    business_phone: '',
    address: '',
    city: '',
    state: '',
    description: ''
  });
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await vendorAPI.getAll();
      setVendors(data.data || data.results || data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, vendor: any) => {
    setAnchorEl(event.currentTarget);
    setMenuVendor(vendor);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuVendor(null);
  };

  const handleView = (vendor: any) => {
    setSelectedVendor(vendor);
    setViewDialogOpen(true);
    handleMenuClose();
  };

  const handleEdit = (vendor: any) => {
    setSelectedVendor(vendor);
    setFormData({
      store_name: vendor.store_name || '',
      business_phone: vendor.business_phone || '',
      address: vendor.address || '',
      city: vendor.city || '',
      state: vendor.state || '',
      description: vendor.description || ''
    });
    setOpenDialog(true);
    handleMenuClose();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      try {
        await vendorAPI.delete(id);
        loadData();
      } catch (error: any) {
        alert(error.message);
      }
    }
    handleMenuClose();
  };

  const handleApprove = async (id: number) => {
    try {
      await vendorAPI.approve(id);
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
    handleMenuClose();
  };

  const handleRejectClick = (vendor: any) => {
    setSelectedVendor(vendor);
    setRejectDialogOpen(true);
    handleMenuClose();
  };

  const handleRejectSubmit = async () => {
    try {
      await vendorAPI.reject(selectedVendor.id, rejectReason);
      setRejectDialogOpen(false);
      setRejectReason('');
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleSuspend = async (id: number) => {
    if (window.confirm('Are you sure you want to suspend this vendor?')) {
      try {
        await vendorAPI.suspend(id);
        loadData();
      } catch (error: any) {
        alert(error.message);
      }
    }
    handleMenuClose();
  };

  const handleReactivate = async (id: number) => {
    try {
      await vendorAPI.reactivate(id);
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
    handleMenuClose();
  };

  const handleSubmit = async () => {
    try {
      await vendorAPI.update(selectedVendor.id, formData);
      setOpenDialog(false);
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'suspended': return 'warning';
      default: return 'default';
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'store_name', headerName: 'Store Name', width: 200 },
    { field: 'business_email', headerName: 'Email', width: 250 },
    { field: 'business_phone', headerName: 'Phone', width: 150 },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={getStatusColor(params.value)} 
          size="small" 
        />
      )
    },
    { field: 'rating', headerName: 'Rating', width: 100 },
    { field: 'total_orders', headerName: 'Orders', width: 100 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (params) => (
        <>
          <IconButton onClick={(e) => handleMenuClick(e, params.row)} size="small">
            <MoreVert />
          </IconButton>
        </>
      )
    }
  ];

  return (
    <Box>
      <Typography variant="h4" mb={3}>Vendors</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <DataGrid 
          rows={vendors} 
          columns={columns} 
          loading={loading} 
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          autoHeight
        />
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleView(menuVendor)}>
          <Visibility sx={{ mr: 1 }} fontSize="small" /> View Details
        </MenuItem>
        <MenuItem onClick={() => handleEdit(menuVendor)}>
          <Edit sx={{ mr: 1 }} fontSize="small" /> Edit Profile
        </MenuItem>
        
        {menuVendor?.status === 'pending' && (
          <MenuItem onClick={() => handleApprove(menuVendor.id)}>
            <CheckCircle sx={{ mr: 1, color: 'success.main' }} fontSize="small" /> Approve
          </MenuItem>
        )}
        
        {menuVendor?.status === 'pending' && (
          <MenuItem onClick={() => handleRejectClick(menuVendor)}>
            <Cancel sx={{ mr: 1, color: 'error.main' }} fontSize="small" /> Reject
          </MenuItem>
        )}

        {menuVendor?.status === 'approved' && (
          <MenuItem onClick={() => handleSuspend(menuVendor.id)}>
            <Block sx={{ mr: 1, color: 'warning.main' }} fontSize="small" /> Suspend
          </MenuItem>
        )}

        {menuVendor?.status === 'suspended' && (
          <MenuItem onClick={() => handleReactivate(menuVendor.id)}>
            <Restore sx={{ mr: 1, color: 'success.main' }} fontSize="small" /> Reactivate
          </MenuItem>
        )}

        <MenuItem onClick={() => handleDelete(menuVendor?.id)}>
          <Delete sx={{ mr: 1, color: 'error.main' }} fontSize="small" /> Delete
        </MenuItem>
      </Menu>

      {/* Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Edit Vendor</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 300 }}>
            <TextField
              label="Store Name"
              value={formData.store_name}
              onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Phone"
              value={formData.business_phone}
              onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
              fullWidth
            />
            <TextField
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                fullWidth
              />
              <TextField
                label="State"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                fullWidth
              />
            </Stack>
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Reject Vendor</DialogTitle>
        <DialogContent>
          <TextField
            label="Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            fullWidth
            multiline
            rows={3}
            sx={{ mt: 1, minWidth: 300 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRejectSubmit} variant="contained" color="error">Reject</Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Vendor Details</DialogTitle>
        <DialogContent>
          {selectedVendor && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="h6">{selectedVendor.store_name}</Typography>
              <Typography><strong>Status:</strong> <Chip label={selectedVendor.status} size="small" color={getStatusColor(selectedVendor.status)} /></Typography>
              <Typography><strong>Business Name:</strong> {selectedVendor.business_name}</Typography>
              <Typography><strong>Email:</strong> {selectedVendor.business_email}</Typography>
              <Typography><strong>Phone:</strong> {selectedVendor.business_phone}</Typography>
              <Typography><strong>Address:</strong> {selectedVendor.address}, {selectedVendor.city}, {selectedVendor.state}, {selectedVendor.pincode}</Typography>
              <Typography><strong>Rating:</strong> {selectedVendor.rating} ({selectedVendor.total_reviews} reviews)</Typography>
              <Typography><strong>Total Orders:</strong> {selectedVendor.total_orders}</Typography>
              <Typography><strong>Total Revenue:</strong> {selectedVendor.total_revenue}</Typography>
              <Typography><strong>Joined:</strong> {new Date(selectedVendor.created_at).toLocaleDateString()}</Typography>
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
