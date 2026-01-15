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
  Stack,
  IconButton,
  Tooltip,
  Alert,
  Chip,
  Avatar,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  MenuItem,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  LocationOn,
  Favorite,
  Home,
  Work,
  Star,
} from '@mui/icons-material';
import { customerAPI, customerAddressAPI, wishlistAPI } from '../utils/api';
import { PageHeader, ConfirmDialog, DetailDrawer, DetailSection, DetailItem } from '../components';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [tabValue, setTabValue] = useState(0);

  const [form, setForm] = useState({
    user_email: '',
    phone: '',
    first_name: '',
    last_name: '',
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
      setCustomers(data.results || data.data || data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerDetails = async (customer: any) => {
    try {
      const [addressData, wishlistData] = await Promise.all([
        customerAddressAPI.getAll(customer.id).catch(() => []),
        wishlistAPI.getAll(customer.id).catch(() => []),
      ]);
      setAddresses(addressData.results || addressData.data || addressData || []);
      setWishlist(wishlistData.results || wishlistData.data || wishlistData || []);
    } catch (err: any) {
      console.error('Failed to load customer details:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openForm = (customer?: any) => {
    if (customer) {
      setSelectedCustomer(customer);
      setForm({
        user_email: customer.user?.email || customer.email || customer.user_email || '',
        phone: customer.phone || customer.phone_number || '',
        first_name: customer.first_name || customer.user?.first_name || '',
        last_name: customer.last_name || customer.user?.last_name || '',
      });
    } else {
      setSelectedCustomer(null);
      setForm({
        user_email: '',
        phone: '',
        first_name: '',
        last_name: '',
      });
    }
    setFormOpen(true);
  };

  const openDetail = (customer: any) => {
    setSelectedCustomer(customer);
    setTabValue(0);
    loadCustomerDetails(customer);
    setDetailOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedCustomer) {
        await customerAPI.update(selectedCustomer.id, form);
      } else {
        await customerAPI.create(form);
      }
      setFormOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    try {
      await customerAPI.delete(selectedCustomer.id);
      setDeleteOpen(false);
      setSelectedCustomer(null);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openAddressForm = (address?: any) => {
    if (address) {
      setSelectedAddress(address);
      setAddressForm({
        label: address.label || 'home',
        address_line1: address.address_line1 || '',
        address_line2: address.address_line2 || '',
        city: address.city || '',
        state: address.state || '',
        postal_code: address.postal_code || '',
        country: address.country || 'India',
        is_default: address.is_default || false,
      });
    } else {
      setSelectedAddress(null);
      setAddressForm({
        label: 'home',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'India',
        is_default: false,
      });
    }
    setAddressFormOpen(true);
  };

  const handleSaveAddress = async () => {
    if (!selectedCustomer) return;
    try {
      if (selectedAddress) {
        await customerAddressAPI.update(selectedCustomer.id, selectedAddress.id, addressForm);
      } else {
        await customerAddressAPI.create(selectedCustomer.id, addressForm);
      }
      setAddressFormOpen(false);
      loadCustomerDetails(selectedCustomer);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!selectedCustomer) return;
    try {
      await customerAddressAPI.delete(selectedCustomer.id, addressId);
      loadCustomerDetails(selectedCustomer);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSetDefaultAddress = async (addressId: number) => {
    if (!selectedCustomer) return;
    try {
      await customerAddressAPI.setDefault(selectedCustomer.id, addressId);
      loadCustomerDetails(selectedCustomer);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'name',
      headerName: 'Customer',
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: '#10b981' }}>
            {params.row.first_name?.[0] || params.row.user?.email?.[0]?.toUpperCase() || 'C'}
          </Avatar>
          <Box>
            <Typography fontWeight={600} fontSize={14}>
              {params.row.first_name || params.row.user?.first_name || ''}{' '}
              {params.row.last_name || params.row.user?.last_name || ''}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.user?.email || params.row.email || params.row.user_email}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 140,
      valueGetter: (value, row) => row.phone || row.phone_number || '-'
    },
    {
      field: 'total_orders',
      headerName: 'Orders',
      width: 100,
      renderCell: (params) => (
        <Chip label={params.value || 0} size="small" color="primary" />
      ),
    },
    {
      field: 'total_spent',
      headerName: 'Total Spent',
      width: 130,
      renderCell: (params) => `₹${params.value?.toLocaleString() || 0}`,
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
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => openDetail(params.row)}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openForm(params.row)}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => {
                setSelectedCustomer(params.row);
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
        title="Customers"
        subtitle="Manage customer profiles and addresses"
        actionLabel="Add Customer"
        onAction={() => openForm()}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ borderRadius: 3 }}>
        <DataGrid
          rows={customers}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          autoHeight
          sx={{
            border: 0,
            '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f8fafc' },
          }}
        />
      </Paper>

      {/* Customer Form Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}>
          {selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Email"
              type="email"
              value={form.user_email}
              onChange={(e) => setForm({ ...form, user_email: e.target.value })}
              fullWidth
              required
              disabled={!!selectedCustomer}
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
            <TextField
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleSave}>
            {selectedCustomer ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Drawer */}
      <DetailDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={`${selectedCustomer?.first_name || ''} ${selectedCustomer?.last_name || ''}`}
        subtitle={selectedCustomer?.user?.email || selectedCustomer?.email || selectedCustomer?.user_email}
        width={600}
      >
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
          <Tab icon={<Visibility />} label="Details" iconPosition="start" />
          <Tab icon={<LocationOn />} label="Addresses" iconPosition="start" />
          <Tab icon={<Favorite />} label="Wishlist" iconPosition="start" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <DetailSection title="Basic Information">
            <DetailItem label="Customer ID" value={selectedCustomer?.id} />
            <DetailItem label="Email" value={selectedCustomer?.user?.email || selectedCustomer?.email || selectedCustomer?.user_email} />
            <DetailItem label="Phone" value={selectedCustomer?.phone || selectedCustomer?.phone_number} />
          </DetailSection>
          <DetailSection title="Order Statistics">
            <DetailItem label="Total Orders" value={selectedCustomer?.total_orders || 0} />
            <DetailItem label="Total Spent" value={`₹${selectedCustomer?.total_spent?.toLocaleString() || 0}`} />
          </DetailSection>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" fontWeight={600}>
              Saved Addresses
            </Typography>
            <Button size="small" startIcon={<Add />} onClick={() => openAddressForm()}>
              Add Address
            </Button>
          </Stack>
          <List>
            {addresses.map((address, index) => (
              <Box key={address.id}>
                <ListItem>
                  <ListItemIcon>
                    {address.label === 'home' ? <Home /> : <Work />}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography fontWeight={600} textTransform="capitalize">
                          {address.label}
                        </Typography>
                        {address.is_default && (
                          <Chip label="Default" size="small" color="primary" />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        {address.address_line1}
                        {address.address_line2 && `, ${address.address_line2}`}
                        <br />
                        {address.city}, {address.state} {address.postal_code}
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Stack direction="row" spacing={0.5}>
                      {!address.is_default && (
                        <Tooltip title="Set as Default">
                          <IconButton
                            size="small"
                            onClick={() => handleSetDefaultAddress(address.id)}
                          >
                            <Star fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <IconButton size="small" onClick={() => openAddressForm(address)}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteAddress(address.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Stack>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < addresses.length - 1 && <Divider />}
              </Box>
            ))}
            {addresses.length === 0 && (
              <Typography color="text.secondary" textAlign="center" py={3}>
                No addresses saved
              </Typography>
            )}
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="subtitle1" fontWeight={600} mb={2}>
            Wishlist Items
          </Typography>
          <List>
            {wishlist.map((item, index) => (
              <Box key={item.id}>
                <ListItem>
                  <ListItemIcon>
                    <Favorite color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.product?.name || item.product_name}
                    secondary={`₹${item.product?.selling_price || item.price}`}
                  />
                </ListItem>
                {index < wishlist.length - 1 && <Divider />}
              </Box>
            ))}
            {wishlist.length === 0 && (
              <Typography color="text.secondary" textAlign="center" py={3}>
                No items in wishlist
              </Typography>
            )}
          </List>
        </TabPanel>
      </DetailDrawer>

      {/* Address Form Dialog */}
      <Dialog open={addressFormOpen} onClose={() => setAddressFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedAddress ? 'Edit Address' : 'Add New Address'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Label"
              value={addressForm.label}
              onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
              fullWidth
            >
              <MenuItem value="home">Home</MenuItem>
              <MenuItem value="work">Work</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
            <TextField
              label="Address Line 1"
              value={addressForm.address_line1}
              onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Address Line 2"
              value={addressForm.address_line2}
              onChange={(e) => setAddressForm({ ...addressForm, address_line2: e.target.value })}
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="City"
                value={addressForm.city}
                onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="State"
                value={addressForm.state}
                onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                fullWidth
                required
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Postal Code"
                value={addressForm.postal_code}
                onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Country"
                value={addressForm.country}
                onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                fullWidth
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddressFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveAddress}>
            {selectedAddress ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Customer"
        message={`Are you sure you want to delete this customer? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </Box>
  );
}
