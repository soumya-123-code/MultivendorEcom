import React, { useState, useCallback } from 'react';
import {
  Box, Button, TextField, InputAdornment, IconButton, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid, Alert, Chip, Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon, Search as SearchIcon, Edit as EditIcon, Delete as DeleteIcon,
  FilterList as FilterIcon, Category as CategoryIcon, Star as FeaturedIcon,
} from '@mui/icons-material';
import { PageHeader, DataTable, ConfirmDialog } from '../../components';
import { usePaginatedApi, useMutation, useToast } from '../../hooks';
import { productsApi } from '../../api';
import { Category } from '../../types';

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  parent: number | null;
  is_featured: boolean;
  display_order: number;
}

const CategoriesListPage: React.FC = () => {
  const toast = useToast();

  // Filters
  const [search, setSearch] = useState('');

  // Modal states
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '', slug: '', description: '', parent: null, is_featured: false, display_order: 0,
  });
  const [formError, setFormError] = useState<string | null>(null);

  // API hooks
  const { data: categories, totalCount, loading, page, pageSize, setPage, setPageSize, updateParams, refetch } = usePaginatedApi(
    (params) => productsApi.categories.list(params),
    { search }
  );

  const createMutation = useMutation((data: CategoryFormData) => productsApi.categories.create(data), {
    onSuccess: () => { toast.success('Category created'); setFormOpen(false); refetch(); },
    onError: (err) => setFormError(err),
  });

  const updateMutation = useMutation((data: { id: number; data: Partial<CategoryFormData> }) => productsApi.categories.update(data.id, data.data), {
    onSuccess: () => { toast.success('Category updated'); setFormOpen(false); setEditingCategory(null); refetch(); },
    onError: (err) => setFormError(err),
  });

  const deleteMutation = useMutation((id: number) => productsApi.categories.delete(id), {
    onSuccess: () => { toast.success('Category deleted'); setDeleteConfirm(null); refetch(); },
    onError: (err) => toast.error(err),
  });

  const handleSearch = useCallback(() => {
    updateParams({ search });
  }, [search, updateParams]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({ name: '', slug: '', description: '', parent: null, is_featured: false, display_order: 0 });
    setFormError(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parent: category.parent,
      is_featured: category.is_featured,
      display_order: category.display_order,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!formData.name) { setFormError('Name is required'); return; }
    
    // Auto-generate slug if not provided
    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const dataToSubmit = { ...formData, slug };
    
    if (editingCategory) {
      await updateMutation.mutate({ id: editingCategory.id, data: dataToSubmit });
    } else {
      await createMutation.mutate(dataToSubmit);
    }
  };

  const columns = [
    {
      id: 'name', label: 'Category', minWidth: 200,
      format: (_: any, row: Category) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CategoryIcon sx={{ color: 'primary.main' }} />
          <Box>
            <Box sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {row.name}
              {row.is_featured && <FeaturedIcon sx={{ color: 'warning.main', fontSize: 16 }} />}
            </Box>
            <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{row.slug}</Box>
          </Box>
        </Box>
      ),
    },
    {
      id: 'parent', label: 'Parent', minWidth: 150,
      format: (val: number | null, row: Category) => row.path || (val ? `Parent ID: ${val}` : 'Root'),
    },
    {
      id: 'level', label: 'Level', minWidth: 80, align: 'center' as const,
      format: (val: number) => <Chip label={val} size="small" variant="outlined" />,
    },
    {
      id: 'display_order', label: 'Order', minWidth: 80, align: 'center' as const,
    },
    {
      id: 'is_featured', label: 'Featured', minWidth: 100, align: 'center' as const,
      format: (val: boolean) => (
        <Chip label={val ? 'Yes' : 'No'} size="small" color={val ? 'warning' : 'default'} variant={val ? 'filled' : 'outlined'} />
      ),
    },
    {
      id: 'created_at', label: 'Created', minWidth: 100,
      format: (val: string) => new Date(val).toLocaleDateString(),
    },
    {
      id: 'actions', label: 'Actions', minWidth: 100, align: 'right' as const,
      format: (_: any, row: Category) => (
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
        title="Categories"
        subtitle={`${totalCount} total categories`}
        breadcrumbs={[{ label: 'Admin', path: '/admin' }, { label: 'Categories' }]}
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>Add Category</Button>}
      />

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search categories..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          sx={{ minWidth: 250 }}
        />
        <Button variant="outlined" onClick={handleSearch} startIcon={<FilterIcon />}>Search</Button>
      </Box>

      <DataTable
        columns={columns}
        data={categories}
        loading={loading}
        totalCount={totalCount}
        page={page}
        rowsPerPage={pageSize}
        onPageChange={setPage}
        onRowsPerPageChange={setPageSize}
        emptyTitle="No categories found"
        emptyDescription="Start by creating your first category"
      />

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                helperText="Leave empty to auto-generate from name"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Display Order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  />
                }
                label="Featured"
                sx={{ mt: 1 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={createMutation.loading || updateMutation.loading}>
            {editingCategory ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This may affect products in this category.`}
        confirmText="Delete"
        confirmColor="error"
        loading={deleteMutation.loading}
        onConfirm={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </Box>
  );
};

export default CategoriesListPage;
