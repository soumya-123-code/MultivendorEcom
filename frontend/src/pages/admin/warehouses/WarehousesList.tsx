import React, { useState, useCallback } from 'react';
import {
  Box, Button, TextField, InputAdornment, MenuItem, Select, FormControl,
  InputLabel, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, Grid, Alert, Chip,
} from '@mui/material';
import {
  Add as AddIcon, Search as SearchIcon, Edit as EditIcon, Delete as DeleteIcon,
  FilterList as FilterIcon, Warehouse as WarehouseIcon, LocationOn as LocationIcon,
} from '@mui/icons-material';
import { PageHeader, DataTable, ConfirmDialog, StatusChip } from '../../components';
import { usePaginatedApi, useMutation, useToast } from '../../hooks';
import { warehousesApi } from '../../api';
import { Warehouse, WarehouseStatus, WarehouseType } from '../../types';

const statusOptions: { value: WarehouseStatus; label: string; color: 'success' | 'error' | 'warning' | 'default' }[] = [
  { value: 'active', label: 'Active', color: 'success' },
  { value: 'inactive', label: 'Inactive', color: 'default' },
  { value: 'maintenance', label: 'Maintenance', color: 'warning' },
];

const typeOptions: { value: WarehouseType; label: string }[] = [
  { value: 'owned', label: 'Owned' },
  { value: 'leased', label: 'Leased' },
  { value: 'third_party', label: 'Third Party' },
];

interface WarehouseFormData {
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  phone: string;
  email: string;
  warehouse_type: WarehouseType;
  status: WarehouseStatus;
  total_capacity: number | null;
}

const WarehousesListPage: React.FC = () => {
  const toast = useToast();

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<WarehouseStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<WarehouseType | ''>('');

  // Modal states
  const [formOpen, setFormOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Warehouse | null>(null);
  const [formData, setFormData] = useState<WarehouseFormData>({
    name: '', code: '', address: '', city: '', state: '', country: 'India', pincode: '',
    phone: '', email: '', warehouse_type: 'owned', status: 'active', total_capacity: null,
  });
  const [formError, setFormError] = useState<string | null>(null);

  // API hooks
  const { data: warehouses, totalCount, loading, page, pageSize, setPage, setPageSize, updateParams, refetch } = usePaginatedApi(
    (params) => warehousesApi.list(params),
    { search, status: statusFilter || undefined, warehouse_type: typeFilter || undefined }
  );

  const createMutation = useMutation((data: WarehouseFormData) => warehousesApi.create(data), {
    onSuccess: () => { toast.success('Warehouse created successfully'); setFormOpen(false); refetch(); },
    onError: (err) => setFormError(err),
  });

  const updateMutation = useMutation((data: { id: number; data: Partial<WarehouseFormData> }) => warehousesApi.update(data.id, data.data), {
    onSuccess: () => { toast.success('Warehouse updated successfully'); setFormOpen(false); setEditingWarehouse(null); refetch(); },
    onError: (err) => setFormError(err),
  });

  const deleteMutation = useMutation((id: number) => warehousesApi.delete(id), {
    onSuccess: () => { toast.success('Warehouse deleted successfully'); setDeleteConfirm(null); refetch(); },
    onError: (err) => toast.error(err),
  });

  const handleSearch = useCallback(() => {
    updateParams({ search, status: statusFilter || undefined, warehouse_type: typeFilter || undefined });
  }, [search, statusFilter, typeFilter, updateParams]);

  const handleOpenCreate = () => {
    setEditingWarehouse(null);
    setFormData({
      name: '', code: '', address: '', city: '', state: '', country: 'India', pincode: '',
      phone: '', email: '', warehouse_type: 'owned', status: 'active', total_capacity: null,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address,
      city: warehouse.city,
      state: warehouse.state,
      country: warehouse.country,
      pincode: warehouse.pincode,
      phone: warehouse.phone || '',
      email: warehouse.email || '',
      warehouse_type: warehouse.warehouse_type,
      status: warehouse.status,
      total_capacity: warehouse.total_capacity,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!formData.name || !formData.code) {
      setFormError('Name and Code are required');
      return;
    }
    if (editingWarehouse) {
      await updateMutation.mutate({ id: editingWarehouse.id, data: formData });
    } else {
      await createMutation.mutate(formData);
    }
  };

  const columns = [
    {
      id: 'name', label: 'Warehouse', minWidth: 200,
      format: (_: any, row: Warehouse) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <WarehouseIcon sx={{ color: 'primary.main' }} />
          <Box>
            <Box sx={{ fontWeight: 600 }}>{row.name}</Box>
            <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{row.code}</Box>
          </Box>
        </Box>
      ),
    },
    {
      id: 'location', label: 'Location', minWidth: 150,
      format: (_: any, row: Warehouse) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <LocationIcon fontSize="small" sx={{ color: 'text.secondary' }} />
          <span>{row.city}, {row.state}</span>
        </Box>
      ),
    },
    {
      id: 'warehouse_type', label: 'Type', minWidth: 100,
      format: (val: WarehouseType) => (
        <Chip label={typeOptions.find(t => t.value === val)?.label || val} size="small" variant="outlined" />
      ),
    },
    {
      id: 'capacity', label: 'Capacity', minWidth: 120,
      format: (_: any, row: Warehouse) => (
        row.total_capacity
          ? `${row.used_capacity} / ${row.total_capacity}`
          : '-'
      ),
    },
    {
      id: 'status', label: 'Status', minWidth: 100,
      format: (val: WarehouseStatus) => {
        const status = statusOptions.find(s => s.value === val);
        return <StatusChip status={val} label={status?.label || val} color={status?.color} />;
      },
    },
    {
      id: 'created_at', label: 'Created', minWidth: 100,
      format: (val: string) => new Date(val).toLocaleDateString(),
    },
    {
      id: 'actions', label: 'Actions', minWidth: 100, align: 'right' as const,
      format: (_: any, row: Warehouse) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenEdit(row); }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(row); }} color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Warehouses"
        subtitle={`${totalCount} total warehouses`}
        breadcrumbs={[{ label: 'Admin', path: '/admin' }, { label: 'Warehouses' }]}
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>Add Warehouse</Button>}
      />

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search warehouses..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          sx={{ minWidth: 250 }}
        />
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as WarehouseStatus)} label="Status">
            <MenuItem value="">All</MenuItem>
            {statusOptions.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Type</InputLabel>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as WarehouseType)} label="Type">
            <MenuItem value="">All Types</MenuItem>
            {typeOptions.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
          </Select>
        </FormControl>
        <Button variant="outlined" onClick={handleSearch} startIcon={<FilterIcon />}>Apply</Button>
      </Box>

      <DataTable
        columns={columns}
        data={warehouses}
        loading={loading}
        totalCount={totalCount}
        page={page}
        rowsPerPage={pageSize}
        onPageChange={setPage}
        onRowsPerPageChange={setPageSize}
        emptyTitle="No warehouses found"
        emptyDescription="Try adjusting your search or filters"
      />

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingWarehouse ? 'Edit Warehouse' : 'Add Warehouse'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField fullWidth label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required disabled={!!editingWarehouse} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Address" multiline rows={2} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="State" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Country" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Pincode" value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select value={formData.warehouse_type} onChange={(e) => setFormData({ ...formData, warehouse_type: e.target.value as WarehouseType })} label="Type">
                  {typeOptions.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as WarehouseStatus })} label="Status">
                  {statusOptions.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label="Total Capacity" type="number" value={formData.total_capacity || ''} onChange={(e) => setFormData({ ...formData, total_capacity: e.target.value ? parseInt(e.target.value) : null })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={createMutation.loading || updateMutation.loading}>
            {editingWarehouse ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete Warehouse"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="error"
        loading={deleteMutation.loading}
        onConfirm={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </Box>
  );
};

export default WarehousesListPage;
