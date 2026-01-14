import React, { useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Button, TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Alert, Avatar, Typography, Tabs, Tab } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Edit as EditIcon, Delete as DeleteIcon, CheckCircle as ApproveIcon, Cancel as RejectIcon, Block as SuspendIcon, Refresh as ReactivateIcon, FilterList as FilterIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { PageHeader, DataTable, ConfirmDialog, StatusChip } from '../../../components';
import { usePaginatedApi, useMutation, useToast } from '../../../hooks';
import { vendorsApi } from '../../../api';
import { Vendor, VendorStatus, VendorFormData, BusinessType } from '../../../types';

const statusTabs: { value: VendorStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Vendors' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'suspended', label: 'Suspended' },
];

const businessTypes: { value: BusinessType; label: string }[] = [
  { value: 'individual', label: 'Individual' },
  { value: 'company', label: 'Company' },
  { value: 'partnership', label: 'Partnership' },
];

const VendorsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const initialStatus = (searchParams.get('status') as VendorStatus) || 'all';
  const [statusTab, setStatusTab] = useState<VendorStatus | 'all'>(initialStatus);
  const [search, setSearch] = useState('');

  // Modal states
  const [formOpen, setFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Vendor | null>(null);
  const [actionDialog, setActionDialog] = useState<{ vendor: Vendor; action: 'approve' | 'reject' | 'suspend' | 'reactivate' } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<VendorFormData>({
    store_name: '', store_description: '', business_type: 'individual', gst_number: '', pan_number: '',
    address_line1: '', city: '', state: '', pincode: '', country: 'India', commission_rate: 10
  });

  const { data: vendors, totalCount, loading, page, pageSize, setPage, setPageSize, updateParams, refetch } = usePaginatedApi(
    (params) => vendorsApi.list(params),
    { search, status: statusTab !== 'all' ? statusTab : undefined }
  );

  const createMutation = useMutation((data: VendorFormData) => vendorsApi.create(data), {
    onSuccess: () => { toast.success('Vendor created successfully'); setFormOpen(false); refetch(); },
    onError: (err) => setFormError(err),
  });

  const updateMutation = useMutation((data: { id: number; data: Partial<VendorFormData> }) => vendorsApi.update(data.id, data.data), {
    onSuccess: () => { toast.success('Vendor updated successfully'); setFormOpen(false); setEditingVendor(null); refetch(); },
    onError: (err) => setFormError(err),
  });

  const deleteMutation = useMutation((id: number) => vendorsApi.delete(id), {
    onSuccess: () => { toast.success('Vendor deleted successfully'); setDeleteConfirm(null); refetch(); },
    onError: (err) => toast.error(err),
  });

  const approveMutation = useMutation((id: number) => vendorsApi.approve(id), {
    onSuccess: () => { toast.success('Vendor approved'); setActionDialog(null); refetch(); },
    onError: (err) => toast.error(err),
  });

  const rejectMutation = useMutation((data: { id: number; reason: string }) => vendorsApi.reject(data.id, data.reason), {
    onSuccess: () => { toast.success('Vendor rejected'); setActionDialog(null); setRejectReason(''); refetch(); },
    onError: (err) => toast.error(err),
  });

  const suspendMutation = useMutation((id: number) => vendorsApi.suspend(id), {
    onSuccess: () => { toast.success('Vendor suspended'); setActionDialog(null); refetch(); },
    onError: (err) => toast.error(err),
  });

  const reactivateMutation = useMutation((id: number) => vendorsApi.reactivate(id), {
    onSuccess: () => { toast.success('Vendor reactivated'); setActionDialog(null); refetch(); },
    onError: (err) => toast.error(err),
  });

  const handleTabChange = (_: any, newValue: VendorStatus | 'all') => {
    setStatusTab(newValue);
    if (newValue === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', newValue);
    }
    setSearchParams(searchParams);
    updateParams({ status: newValue !== 'all' ? newValue : undefined });
  };

  const handleSearch = () => updateParams({ search });

  const handleOpenCreate = () => {
    setEditingVendor(null);
    setFormData({ store_name: '', store_description: '', business_type: 'individual', gst_number: '', pan_number: '', address_line1: '', city: '', state: '', pincode: '', country: 'India', commission_rate: 10 });
    setFormError(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      store_name: vendor.store_name, store_description: vendor.store_description || '', business_type: vendor.business_type,
      gst_number: vendor.gst_number || '', pan_number: vendor.pan_number || '', address_line1: vendor.address_line1 || '',
      city: vendor.city || '', state: vendor.state || '', pincode: vendor.pincode || '', country: vendor.country || 'India',
      commission_rate: vendor.commission_rate || 10
    });
    setFormError(null);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.store_name) { setFormError('Store name is required'); return; }
    if (editingVendor) {
      await updateMutation.mutate({ id: editingVendor.id, data: formData });
    } else {
      await createMutation.mutate(formData);
    }
  };

  const handleAction = async () => {
    if (!actionDialog) return;
    const { vendor, action } = actionDialog;
    switch (action) {
      case 'approve': await approveMutation.mutate(vendor.id); break;
      case 'reject': await rejectMutation.mutate({ id: vendor.id, reason: rejectReason }); break;
      case 'suspend': await suspendMutation.mutate(vendor.id); break;
      case 'reactivate': await reactivateMutation.mutate(vendor.id); break;
    }
  };

  const getActionButtons = (vendor: Vendor) => {
    const buttons = [];
    buttons.push(
      <Tooltip title="View" key="view"><IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/admin/vendors/${vendor.id}`); }}><ViewIcon fontSize="small" /></IconButton></Tooltip>,
      <Tooltip title="Edit" key="edit"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenEdit(vendor); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
    );
    
    if (vendor.status === 'pending') {
      buttons.push(
        <Tooltip title="Approve" key="approve"><IconButton size="small" color="success" onClick={(e) => { e.stopPropagation(); setActionDialog({ vendor, action: 'approve' }); }}><ApproveIcon fontSize="small" /></IconButton></Tooltip>,
        <Tooltip title="Reject" key="reject"><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setActionDialog({ vendor, action: 'reject' }); }}><RejectIcon fontSize="small" /></IconButton></Tooltip>
      );
    } else if (vendor.status === 'approved') {
      buttons.push(
        <Tooltip title="Suspend" key="suspend"><IconButton size="small" color="warning" onClick={(e) => { e.stopPropagation(); setActionDialog({ vendor, action: 'suspend' }); }}><SuspendIcon fontSize="small" /></IconButton></Tooltip>
      );
    } else if (vendor.status === 'suspended' || vendor.status === 'rejected') {
      buttons.push(
        <Tooltip title="Reactivate" key="reactivate"><IconButton size="small" color="success" onClick={(e) => { e.stopPropagation(); setActionDialog({ vendor, action: 'reactivate' }); }}><ReactivateIcon fontSize="small" /></IconButton></Tooltip>
      );
    }
    
    buttons.push(
      <Tooltip title="Delete" key="delete"><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(vendor); }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
    );
    return buttons;
  };

  const columns = [
    {
      id: 'store', label: 'Store', minWidth: 250,
      format: (_: any, row: Vendor) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: 'secondary.main' }} src={row.logo?.url}>{row.store_name?.[0]}</Avatar>
          <Box>
            <Typography variant="subtitle2">{row.store_name}</Typography>
            <Typography variant="caption" color="text.secondary">{row.user_email}</Typography>
          </Box>
        </Box>
      )
    },
    { id: 'business_type', label: 'Type', minWidth: 100, format: (val: BusinessType) => businessTypes.find(t => t.value === val)?.label || val },
    { id: 'city', label: 'Location', minWidth: 120, format: (val: string, row: Vendor) => val ? `${val}, ${row.state || ''}` : '-' },
    { id: 'commission_rate', label: 'Commission', minWidth: 100, format: (val: number) => `${val || 0}%` },
    { id: 'status', label: 'Status', minWidth: 120, format: (val: VendorStatus) => <StatusChip status={val} category="vendor" /> },
    { id: 'created_at', label: 'Joined', minWidth: 100, format: (val: string) => new Date(val).toLocaleDateString() },
    { id: 'actions', label: 'Actions', minWidth: 180, align: 'right' as const, format: (_: any, row: Vendor) => <Box>{getActionButtons(row)}</Box> },
  ];

  return (
    <Box>
      <PageHeader
        title="Vendors"
        subtitle={`${totalCount} total vendors`}
        breadcrumbs={[{ label: 'Admin', path: '/admin' }, { label: 'Vendors' }]}
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>Add Vendor</Button>}
      />

      <Tabs value={statusTab} onChange={handleTabChange} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        {statusTabs.map(tab => <Tab key={tab.value} value={tab.value} label={tab.label} />)}
      </Tabs>

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          placeholder="Search vendors..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          sx={{ minWidth: 300 }}
        />
        <Button variant="outlined" onClick={handleSearch} startIcon={<FilterIcon />}>Search</Button>
      </Box>

      <DataTable
        columns={columns}
        data={vendors}
        loading={loading}
        totalCount={totalCount}
        page={page}
        rowsPerPage={pageSize}
        onPageChange={setPage}
        onRowsPerPageChange={setPageSize}
        onRowClick={(row) => navigate(`/admin/vendors/${row.id}`)}
        emptyTitle="No vendors found"
      />

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingVendor ? 'Edit Vendor' : 'Create Vendor'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}><TextField fullWidth label="Store Name" value={formData.store_name} onChange={(e) => setFormData({ ...formData, store_name: e.target.value })} required /></Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth><InputLabel>Business Type</InputLabel>
                <Select value={formData.business_type} onChange={(e) => setFormData({ ...formData, business_type: e.target.value as BusinessType })} label="Business Type">
                  {businessTypes.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Store Description" value={formData.store_description} onChange={(e) => setFormData({ ...formData, store_description: e.target.value })} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="GST Number" value={formData.gst_number} onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="PAN Number" value={formData.pan_number} onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Address" value={formData.address_line1} onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })} /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth label="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth label="State" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth label="Pincode" value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth label="Commission %" type="number" value={formData.commission_rate} onChange={(e) => setFormData({ ...formData, commission_rate: Number(e.target.value) })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={createMutation.loading || updateMutation.loading}>{editingVendor ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onClose={() => setActionDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{actionDialog?.action === 'approve' ? 'Approve Vendor' : actionDialog?.action === 'reject' ? 'Reject Vendor' : actionDialog?.action === 'suspend' ? 'Suspend Vendor' : 'Reactivate Vendor'}</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to {actionDialog?.action} "{actionDialog?.vendor.store_name}"?</Typography>
          {actionDialog?.action === 'reject' && (
            <TextField fullWidth multiline rows={3} label="Rejection Reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} sx={{ mt: 2 }} required />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setActionDialog(null); setRejectReason(''); }}>Cancel</Button>
          <Button variant="contained" color={actionDialog?.action === 'approve' || actionDialog?.action === 'reactivate' ? 'success' : 'error'} onClick={handleAction}
            disabled={approveMutation.loading || rejectMutation.loading || suspendMutation.loading || reactivateMutation.loading || (actionDialog?.action === 'reject' && !rejectReason)}>
            {actionDialog?.action?.charAt(0).toUpperCase()}{actionDialog?.action?.slice(1)}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={!!deleteConfirm} title="Delete Vendor" message={`Delete "${deleteConfirm?.store_name}"? This cannot be undone.`} confirmText="Delete" confirmColor="error" loading={deleteMutation.loading} onConfirm={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)} onCancel={() => setDeleteConfirm(null)} />
    </Box>
  );
};

export default VendorsListPage;
