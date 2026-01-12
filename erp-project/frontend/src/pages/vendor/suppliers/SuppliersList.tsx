import React, { useState, useCallback } from 'react';
import { Box, Button, TextField, InputAdornment, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Alert, Chip, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Edit as EditIcon, Delete as DeleteIcon, FilterList as FilterIcon, Business as SupplierIcon, Phone as PhoneIcon, Email as EmailIcon } from '@mui/icons-material';
import { PageHeader, DataTable, ConfirmDialog, StatusChip } from '../../components';
import { usePaginatedApi, useMutation, useToast } from '../../hooks';
import { vendorsApi } from '../../api';
import { Supplier } from '../../types';

interface SupplierFormData {
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  tax_id: string;
  payment_terms: string;
  status: 'active' | 'inactive';
  notes: string;
}

const VendorSuppliersListPage: React.FC = () => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '', contact_person: '', email: '', phone: '', address: '', city: '', state: '', country: 'India', pincode: '', tax_id: '', payment_terms: '', status: 'active', notes: ''
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { data: suppliers, totalCount, loading, page, pageSize, setPage, setPageSize, updateParams, refetch } = usePaginatedApi(
    (params) => vendorsApi.suppliers.list(params),
    { search, status: statusFilter || undefined }
  );

  const createMutation = useMutation((data: SupplierFormData) => vendorsApi.suppliers.create(data), {
    onSuccess: () => { toast.success('Supplier created'); setFormOpen(false); refetch(); },
    onError: (err) => setFormError(err),
  });

  const updateMutation = useMutation((data: { id: number; data: Partial<SupplierFormData> }) => vendorsApi.suppliers.update(data.id, data.data), {
    onSuccess: () => { toast.success('Supplier updated'); setFormOpen(false); setEditingSupplier(null); refetch(); },
    onError: (err) => setFormError(err),
  });

  const deleteMutation = useMutation((id: number) => vendorsApi.suppliers.delete(id), {
    onSuccess: () => { toast.success('Supplier deleted'); setDeleteConfirm(null); refetch(); },
    onError: (err) => toast.error(err),
  });

  const handleSearch = useCallback(() => {
    updateParams({ search, status: statusFilter || undefined });
  }, [search, statusFilter, updateParams]);

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setFormData({ name: '', contact_person: '', email: '', phone: '', address: '', city: '', state: '', country: 'India', pincode: '', tax_id: '', payment_terms: '', status: 'active', notes: '' });
    setFormError(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      city: supplier.city || '',
      state: supplier.state || '',
      country: supplier.country,
      pincode: supplier.pincode || '',
      tax_id: supplier.tax_id || '',
      payment_terms: supplier.payment_terms || '',
      status: supplier.status,
      notes: supplier.notes || '',
    });
    setFormError(null);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name) { setFormError('Name is required'); return; }
    if (editingSupplier) {
      await updateMutation.mutate({ id: editingSupplier.id, data: formData });
    } else {
      await createMutation.mutate(formData);
    }
  };

  const columns = [
    {
      id: 'name', label: 'Supplier', minWidth: 200,
      format: (val: string, row: Supplier) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SupplierIcon sx={{ color: 'primary.main' }} />
          <Box>
            <Box sx={{ fontWeight: 600 }}>{val}</Box>
            <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{row.contact_person || 'No contact'}</Box>
          </Box>
        </Box>
      ),
    },
    {
      id: 'contact', label: 'Contact', minWidth: 180,
      format: (_: any, row: Supplier) => (
        <Box>
          {row.email && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem' }}><EmailIcon sx={{ fontSize: 16 }} />{row.email}</Box>}
          {row.phone && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.875rem' }}><PhoneIcon sx={{ fontSize: 16 }} />{row.phone}</Box>}
        </Box>
      ),
    },
    {
      id: 'city', label: 'Location', minWidth: 120,
      format: (val: string, row: Supplier) => val ? `${val}, ${row.state}` : '-',
    },
    {
      id: 'payment_terms', label: 'Payment Terms', minWidth: 120,
      format: (val: string) => val || '-',
    },
    {
      id: 'status', label: 'Status', minWidth: 100,
      format: (val: string) => <StatusChip status={val} label={val === 'active' ? 'Active' : 'Inactive'} color={val === 'active' ? 'success' : 'default'} />,
    },
    {
      id: 'actions', label: '', minWidth: 100, align: 'right' as const,
      format: (_: any, row: Supplier) => (
        <Box>
          <Tooltip title="Edit"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenEdit(row); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(row); }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Suppliers"
        subtitle={`${totalCount} suppliers`}
        breadcrumbs={[{ label: 'Vendor', path: '/vendor' }, { label: 'Suppliers' }]}
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>Add Supplier</Button>}
      />

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField placeholder="Search suppliers..." size="small" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} sx={{ minWidth: 250 }} />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
            <MenuItem value="">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" onClick={handleSearch} startIcon={<FilterIcon />}>Apply</Button>
      </Box>

      <DataTable columns={columns} data={suppliers} loading={loading} totalCount={totalCount} page={page} rowsPerPage={pageSize} onPageChange={setPage} onRowsPerPageChange={setPageSize} emptyTitle="No suppliers found" emptyDescription="Add your first supplier to get started" />

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}><TextField fullWidth label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Contact Person" value={formData.contact_person} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Address" multiline rows={2} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="State" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Pincode" value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Tax ID" value={formData.tax_id} onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })} /></Grid>
            <Grid item xs={4}><TextField fullWidth label="Payment Terms" value={formData.payment_terms} onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })} placeholder="e.g., Net 30" /></Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })} label="Status">
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}><TextField fullWidth label="Notes" multiline rows={2} value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={createMutation.loading || updateMutation.loading}>{editingSupplier ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={!!deleteConfirm} title="Delete Supplier" message={`Delete "${deleteConfirm?.name}"? This may affect related purchase orders.`} confirmText="Delete" confirmColor="error" loading={deleteMutation.loading} onConfirm={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)} onCancel={() => setDeleteConfirm(null)} />
    </Box>
  );
};

export default VendorSuppliersListPage;
