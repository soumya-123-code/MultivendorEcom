import React, { useState, useCallback } from 'react';
import { Box, Button, TextField, InputAdornment, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Alert, Chip, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Edit as EditIcon, Delete as DeleteIcon, FilterList as FilterIcon, Warehouse as WarehouseIcon, LocationOn as LocationIcon } from '@mui/icons-material';
import { PageHeader, DataTable, ConfirmDialog, StatusChip } from '../../components';
import { usePaginatedApi, useMutation, useToast } from '../../hooks';
import { warehousesApi } from '../../api';
import { Warehouse, WarehouseStatus, WarehouseType } from '../../types';

const statusOptions = [{ value: 'active', label: 'Active', color: 'success' as const }, { value: 'inactive', label: 'Inactive', color: 'default' as const }, { value: 'maintenance', label: 'Maintenance', color: 'warning' as const }];
const typeOptions = [{ value: 'owned', label: 'Owned' }, { value: 'leased', label: 'Leased' }, { value: 'third_party', label: 'Third Party' }];

const VendorWarehousesListPage: React.FC = () => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Warehouse | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', address: '', city: '', state: '', country: 'India', pincode: '', phone: '', email: '', warehouse_type: 'owned' as WarehouseType, status: 'active' as WarehouseStatus, total_capacity: null as number | null });
  const [formError, setFormError] = useState<string | null>(null);

  const { data: warehouses, totalCount, loading, page, pageSize, setPage, setPageSize, updateParams, refetch } = usePaginatedApi((params) => warehousesApi.list(params), { search });
  const createMutation = useMutation((data: typeof formData) => warehousesApi.create(data), { onSuccess: () => { toast.success('Warehouse created'); setFormOpen(false); refetch(); }, onError: (err) => setFormError(err) });
  const updateMutation = useMutation((data: { id: number; data: Partial<typeof formData> }) => warehousesApi.update(data.id, data.data), { onSuccess: () => { toast.success('Warehouse updated'); setFormOpen(false); setEditingWarehouse(null); refetch(); }, onError: (err) => setFormError(err) });
  const deleteMutation = useMutation((id: number) => warehousesApi.delete(id), { onSuccess: () => { toast.success('Warehouse deleted'); setDeleteConfirm(null); refetch(); }, onError: (err) => toast.error(err) });

  const handleSearch = useCallback(() => { updateParams({ search }); }, [search, updateParams]);
  const handleOpenCreate = () => { setEditingWarehouse(null); setFormData({ name: '', code: '', address: '', city: '', state: '', country: 'India', pincode: '', phone: '', email: '', warehouse_type: 'owned', status: 'active', total_capacity: null }); setFormError(null); setFormOpen(true); };
  const handleOpenEdit = (w: Warehouse) => { setEditingWarehouse(w); setFormData({ name: w.name, code: w.code, address: w.address, city: w.city, state: w.state, country: w.country, pincode: w.pincode, phone: w.phone || '', email: w.email || '', warehouse_type: w.warehouse_type, status: w.status, total_capacity: w.total_capacity }); setFormError(null); setFormOpen(true); };
  const handleSubmit = async () => { if (!formData.name || !formData.code) { setFormError('Name and Code required'); return; } if (editingWarehouse) { await updateMutation.mutate({ id: editingWarehouse.id, data: formData }); } else { await createMutation.mutate(formData); } };

  const columns = [
    { id: 'name', label: 'Warehouse', minWidth: 200, format: (_: any, row: Warehouse) => (<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><WarehouseIcon sx={{ color: 'primary.main' }} /><Box><Box sx={{ fontWeight: 600 }}>{row.name}</Box><Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{row.code}</Box></Box></Box>) },
    { id: 'location', label: 'Location', minWidth: 150, format: (_: any, row: Warehouse) => (<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><LocationIcon fontSize="small" sx={{ color: 'text.secondary' }} />{row.city}, {row.state}</Box>) },
    { id: 'warehouse_type', label: 'Type', minWidth: 100, format: (val: WarehouseType) => <Chip label={typeOptions.find(t => t.value === val)?.label || val} size="small" variant="outlined" /> },
    { id: 'status', label: 'Status', minWidth: 100, format: (val: WarehouseStatus) => { const s = statusOptions.find(x => x.value === val); return <StatusChip status={val} label={s?.label || val} color={s?.color} />; } },
    { id: 'actions', label: '', minWidth: 100, align: 'right' as const, format: (_: any, row: Warehouse) => (<Box><Tooltip title="Edit"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenEdit(row); }}><EditIcon fontSize="small" /></IconButton></Tooltip><Tooltip title="Delete"><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(row); }}><DeleteIcon fontSize="small" /></IconButton></Tooltip></Box>) },
  ];

  return (
    <Box>
      <PageHeader title="Warehouses" subtitle={`${totalCount} warehouses`} breadcrumbs={[{ label: 'Vendor', path: '/vendor' }, { label: 'Warehouses' }]} actions={<Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>Add Warehouse</Button>} />
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}><TextField placeholder="Search..." size="small" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} sx={{ minWidth: 250 }} /><Button variant="outlined" onClick={handleSearch} startIcon={<FilterIcon />}>Search</Button></Box>
      <DataTable columns={columns} data={warehouses} loading={loading} totalCount={totalCount} page={page} rowsPerPage={pageSize} onPageChange={setPage} onRowsPerPageChange={setPageSize} emptyTitle="No warehouses" emptyDescription="Add your first warehouse" />
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingWarehouse ? 'Edit Warehouse' : 'Add Warehouse'}</DialogTitle>
        <DialogContent>{formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}<Grid container spacing={2} sx={{ mt: 1 }}><Grid item xs={6}><TextField fullWidth label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></Grid><Grid item xs={6}><TextField fullWidth label="Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required disabled={!!editingWarehouse} /></Grid><Grid item xs={12}><TextField fullWidth label="Address" multiline rows={2} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></Grid><Grid item xs={4}><TextField fullWidth label="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} /></Grid><Grid item xs={4}><TextField fullWidth label="State" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} /></Grid><Grid item xs={4}><TextField fullWidth label="Pincode" value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} /></Grid><Grid item xs={6}><FormControl fullWidth><InputLabel>Type</InputLabel><Select value={formData.warehouse_type} onChange={(e) => setFormData({ ...formData, warehouse_type: e.target.value as WarehouseType })} label="Type">{typeOptions.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}</Select></FormControl></Grid><Grid item xs={6}><FormControl fullWidth><InputLabel>Status</InputLabel><Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as WarehouseStatus })} label="Status">{statusOptions.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}</Select></FormControl></Grid></Grid></DialogContent>
        <DialogActions><Button onClick={() => setFormOpen(false)}>Cancel</Button><Button onClick={handleSubmit} variant="contained" disabled={createMutation.loading || updateMutation.loading}>{editingWarehouse ? 'Update' : 'Create'}</Button></DialogActions>
      </Dialog>
      <ConfirmDialog open={!!deleteConfirm} title="Delete Warehouse" message={`Delete "${deleteConfirm?.name}"?`} confirmText="Delete" confirmColor="error" loading={deleteMutation.loading} onConfirm={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)} onCancel={() => setDeleteConfirm(null)} />
    </Box>
  );
};

export default VendorWarehousesListPage;
