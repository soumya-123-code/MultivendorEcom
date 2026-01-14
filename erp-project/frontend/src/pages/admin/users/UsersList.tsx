// @ts-nocheck 
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Alert, Chip, Avatar } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Edit as EditIcon, Delete as DeleteIcon, Block as BlockIcon, CheckCircle as ActivateIcon, FilterList as FilterIcon } from '@mui/icons-material';
import { PageHeader, DataTable, ConfirmDialog, StatusChip } from '../../components';
import { usePaginatedApi, useMutation, useToast } from '../../hooks';
import { usersApi } from '../../api';
import { User, UserRole } from '../../types';

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'staff', label: 'Staff' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'customer', label: 'Customer' },
  { value: 'delivery_agent', label: 'Delivery Agent' },
  { value: 'warehouse', label: 'Warehouse' },
];

const UsersListPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | ''>('');

  // Modal states
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [formData, setFormData] = useState<any>({ email: '', first_name: '', last_name: '', phone: '', role: 'customer' });
  const [formError, setFormError] = useState<string | null>(null);

  // API hooks
  const { data: users, totalCount, loading, page, pageSize, setPage, setPageSize, updateParams, refetch } = usePaginatedApi(
    (params):any => usersApi.list(params),
    { search, role: roleFilter || undefined, is_active: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined }
  );

  const createMutation = useMutation((data: any) => usersApi.create(data), {
    onSuccess: () => { toast.success('User created successfully'); setFormOpen(false); refetch(); },
    onError: (err) => setFormError(err),
  });

  const updateMutation = useMutation((data: { id: number; data: Partial<any> }) => usersApi.update(data.id, data.data), {
    onSuccess: () => { toast.success('User updated successfully'); setFormOpen(false); setEditingUser(null); refetch(); },
    onError: (err) => setFormError(err),
  });

  const deleteMutation = useMutation((id: number) => usersApi.delete(id), {
    onSuccess: () => { toast.success('User deleted successfully'); setDeleteConfirm(null); refetch(); },
    onError: (err) => toast.error(err),
  });

  const toggleActiveMutation = useMutation(
    (data: { id: number; activate: boolean }) => data.activate ? usersApi.activate(data.id) : usersApi.deactivate(data.id),
    { onSuccess: () => { toast.success('User status updated'); refetch(); }, onError: (err) => toast.error(err) }
  );

  const handleSearch = useCallback(() => {
    updateParams({ search, role: roleFilter || undefined, is_active: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined });
  }, [search, roleFilter, statusFilter, updateParams]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({ email: '', first_name: '', last_name: '', phone: '', role: 'customer' });
    setFormError(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({ email: user.email, first_name: user.first_name || '', last_name: user.last_name || '', phone: user.phone || '', role: user.role });
    setFormError(null);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!formData.email) { setFormError('Email is required'); return; }
    if (editingUser) {
      await updateMutation.mutate({ id: editingUser.id, data: formData });
    } else {
      await createMutation.mutate(formData);
    }
  };

  const columns = [
    { 
      id: 'user', label: 'User', minWidth: 200,
      format: (_: any, row: User) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }} src={row.avatar?.url}>
            {row.first_name?.[0] || row.email[0].toUpperCase()}
          </Avatar>
          <Box>
            <Box sx={{ fontWeight: 600 }}>{row.first_name ? `${row.first_name} ${row.last_name || ''}`.trim() : row.email.split('@')[0]}</Box>
            <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{row.email}</Box>
          </Box>
        </Box>
      )
    },
    { id: 'phone', label: 'Phone', minWidth: 120, format: (val: string) => val || '-' },
    { 
      id: 'role', label: 'Role', minWidth: 120, sortable: true,
      format: (val: UserRole) => <Chip label={roleOptions.find(r => r.value === val)?.label || val} size="small" variant="outlined" />
    },
    { 
      id: 'is_active', label: 'Status', minWidth: 100,
      format: (val: boolean) => <Chip label={val ? 'Active' : 'Inactive'} size="small" color={val ? 'success' : 'default'} />
    },
    { id: 'created_at', label: 'Joined', minWidth: 100, sortable: true, format: (val: string) => new Date(val).toLocaleDateString() },
    {
      id: 'actions', label: 'Actions', minWidth: 120, align: 'right' as const,
      format: (_: any, row: User) => (
        <Box>
          <Tooltip title="Edit"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenEdit(row); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title={row.is_active ? 'Deactivate' : 'Activate'}>
            <IconButton size="small" color={row.is_active ? 'warning' : 'success'} onClick={(e) => { e.stopPropagation(); toggleActiveMutation.mutate({ id: row.id, activate: !row.is_active }); }}>
              {row.is_active ? <BlockIcon fontSize="small" /> : <ActivateIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(row); }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
      )
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Users"
        subtitle={`${totalCount} total users`}
        breadcrumbs={[{ label: 'Admin', path: '/admin' }, { label: 'Users' }]}
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>Add User</Button>}
      />

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search users..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          sx={{ minWidth: 250 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Role</InputLabel>
          <Select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value as UserRole); }} label="Role">
            <MenuItem value="">All Roles</MenuItem>
            {roleOptions.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} label="Status">
            <MenuItem value="">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" onClick={handleSearch} startIcon={<FilterIcon />}>Apply</Button>
      </Box>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        totalCount={totalCount}
        page={page}
        rowsPerPage={pageSize}
        onPageChange={setPage}
        onRowsPerPageChange={setPageSize}
        onRowClick={(row) => navigate(`/admin/users/${row.id}`)}
        emptyTitle="No users found"
        emptyDescription="Try adjusting your search or filters"
      />

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Edit User' : 'Create User'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required disabled={!!editingUser} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="First Name" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Last Name" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })} label="Role">
                  {roleOptions.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={createMutation.loading || updateMutation.loading}>
            {editingUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteConfirm?.email}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="error"
        loading={deleteMutation.loading}
        onConfirm={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </Box>
  );
};

export default UsersListPage;
