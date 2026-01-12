import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Alert, Chip, Avatar, Typography, Tabs, Tab } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon, VisibilityOff as HideIcon, FilterList as FilterIcon, Image as ImageIcon } from '@mui/icons-material';
import { PageHeader, DataTable, ConfirmDialog, StatusChip } from '../../../components';
import { usePaginatedApi, useMutation, useToast, useApiQuery } from '../../../hooks';
import { productsApi, categoriesApi } from '../../../api';
import { Product, ProductStatus, ProductFormData, Category } from '../../../types';

const statusTabs: { value: ProductStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Products' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
];

const ProductsListPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [statusTab, setStatusTab] = useState<ProductStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');

  // Modal states
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    name: '', slug: '', description: '', sku: '', barcode: '', base_price: 0, sale_price: undefined,
    cost_price: 0, category: undefined, status: 'draft', is_featured: false, weight: undefined, length: undefined, width: undefined, height: undefined
  });

  // Fetch categories for filter
  const { data: categoriesData } = useApiQuery(() => categoriesApi.list({ page: 1, page_size: 100 }), []);
  const categories = categoriesData?.results || [];

  const { data: products, totalCount, loading, page, pageSize, setPage, setPageSize, updateParams, refetch } = usePaginatedApi(
    (params) => productsApi.list(params),
    { search, status: statusTab !== 'all' ? statusTab : undefined, category: categoryFilter || undefined }
  );

  const createMutation = useMutation((data: ProductFormData) => productsApi.create(data), {
    onSuccess: () => { toast.success('Product created'); setFormOpen(false); refetch(); },
    onError: (err) => setFormError(err),
  });

  const updateMutation = useMutation((data: { id: number; data: Partial<ProductFormData> }) => productsApi.update(data.id, data.data), {
    onSuccess: () => { toast.success('Product updated'); setFormOpen(false); setEditingProduct(null); refetch(); },
    onError: (err) => setFormError(err),
  });

  const deleteMutation = useMutation((id: number) => productsApi.delete(id), {
    onSuccess: () => { toast.success('Product deleted'); setDeleteConfirm(null); refetch(); },
    onError: (err) => toast.error(err),
  });

  const publishMutation = useMutation((id: number) => productsApi.publish(id), {
    onSuccess: () => { toast.success('Product published'); refetch(); },
    onError: (err) => toast.error(err),
  });

  const unpublishMutation = useMutation((id: number) => productsApi.unpublish(id), {
    onSuccess: () => { toast.success('Product unpublished'); refetch(); },
    onError: (err) => toast.error(err),
  });

  const handleTabChange = (_: any, newValue: ProductStatus | 'all') => {
    setStatusTab(newValue);
    updateParams({ status: newValue !== 'all' ? newValue : undefined });
  };

  const handleSearch = () => updateParams({ search, category: categoryFilter || undefined });

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({ name: '', slug: '', description: '', sku: '', barcode: '', base_price: 0, sale_price: undefined, cost_price: 0, category: undefined, status: 'draft', is_featured: false, weight: undefined, length: undefined, width: undefined, height: undefined });
    setFormError(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name, slug: product.slug, description: product.description || '', sku: product.sku,
      barcode: product.barcode || '', base_price: Number(product.base_price), sale_price: product.sale_price ? Number(product.sale_price) : undefined,
      cost_price: Number(product.cost_price || 0), category: product.category, status: product.status,
      is_featured: product.is_featured, weight: product.weight ? Number(product.weight) : undefined,
      length: product.length ? Number(product.length) : undefined, width: product.width ? Number(product.width) : undefined, height: product.height ? Number(product.height) : undefined
    });
    setFormError(null);
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.sku) { setFormError('Name and SKU are required'); return; }
    const data = { ...formData, slug: formData.slug || generateSlug(formData.name) };
    if (editingProduct) {
      await updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      await createMutation.mutate(data);
    }
  };

  const formatCurrency = (amount: number | string) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount));

  const columns = [
    {
      id: 'product', label: 'Product', minWidth: 300,
      format: (_: any, row: Product) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar variant="rounded" sx={{ width: 48, height: 48, bgcolor: 'grey.200' }} src={row.images?.[0]?.image}>
            <ImageIcon sx={{ color: 'grey.400' }} />
          </Avatar>
          <Box>
            <Typography variant="subtitle2">{row.name}</Typography>
            <Typography variant="caption" color="text.secondary">SKU: {row.sku}</Typography>
          </Box>
        </Box>
      )
    },
    { id: 'category_name', label: 'Category', minWidth: 120, format: (val: string) => val || '-' },
    { 
      id: 'base_price', label: 'Price', minWidth: 120,
      format: (val: string, row: Product) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>{formatCurrency(val)}</Typography>
          {row.sale_price && <Typography variant="caption" color="error.main" sx={{ textDecoration: 'line-through' }}>{formatCurrency(row.sale_price)}</Typography>}
        </Box>
      )
    },
    { id: 'total_stock', label: 'Stock', minWidth: 80, format: (val: number) => val ?? 0 },
    { id: 'status', label: 'Status', minWidth: 100, format: (val: ProductStatus) => <StatusChip status={val} category="product" /> },
    { id: 'is_featured', label: 'Featured', minWidth: 80, format: (val: boolean) => val ? <Chip label="Yes" size="small" color="primary" /> : '-' },
    { id: 'created_at', label: 'Created', minWidth: 100, format: (val: string) => new Date(val).toLocaleDateString() },
    {
      id: 'actions', label: 'Actions', minWidth: 160, align: 'right' as const,
      format: (_: any, row: Product) => (
        <Box>
          <Tooltip title="View"><IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/admin/products/${row.id}`); }}><ViewIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Edit"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenEdit(row); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title={row.status === 'active' ? 'Unpublish' : 'Publish'}>
            <IconButton size="small" color={row.status === 'active' ? 'warning' : 'success'} onClick={(e) => { e.stopPropagation(); row.status === 'active' ? unpublishMutation.mutate(row.id) : publishMutation.mutate(row.id); }}>
              {row.status === 'active' ? <HideIcon fontSize="small" /> : <ViewIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(row); }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
      )
    },
  ];

  return (
    <Box>
      <PageHeader title="Products" subtitle={`${totalCount} total products`} breadcrumbs={[{ label: 'Admin', path: '/admin' }, { label: 'Products' }]}
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>Add Product</Button>} />

      <Tabs value={statusTab} onChange={handleTabChange} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        {statusTabs.map(tab => <Tab key={tab.value} value={tab.value} label={tab.label} />)}
      </Tabs>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField placeholder="Search products..." size="small" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} sx={{ minWidth: 250 }} />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Category</InputLabel>
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as number)} label="Category">
            <MenuItem value="">All Categories</MenuItem>
            {categories.map((cat: Category) => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
          </Select>
        </FormControl>
        <Button variant="outlined" onClick={handleSearch} startIcon={<FilterIcon />}>Apply</Button>
      </Box>

      <DataTable columns={columns} data={products} loading={loading} totalCount={totalCount} page={page} rowsPerPage={pageSize}
        onPageChange={setPage} onRowsPerPageChange={setPageSize} onRowClick={(row) => navigate(`/admin/products/${row.id}`)} emptyTitle="No products found" />

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingProduct ? 'Edit Product' : 'Create Product'}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={8}><TextField fullWidth label="Product Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })} required /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="SKU" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} required /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Barcode" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={3} label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth type="number" label="Base Price" value={formData.base_price} onChange={(e) => setFormData({ ...formData, base_price: Number(e.target.value) })} required /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth type="number" label="Sale Price" value={formData.sale_price || ''} onChange={(e) => setFormData({ ...formData, sale_price: e.target.value ? Number(e.target.value) : undefined })} /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth type="number" label="Cost Price" value={formData.cost_price} onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })} /></Grid>
            <Grid item xs={6} md={3}>
              <FormControl fullWidth><InputLabel>Category</InputLabel>
                <Select value={formData.category || ''} onChange={(e) => setFormData({ ...formData, category: e.target.value as number })} label="Category">
                  <MenuItem value="">None</MenuItem>
                  {categories.map((cat: Category) => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={3}><TextField fullWidth type="number" label="Weight (kg)" value={formData.weight || ''} onChange={(e) => setFormData({ ...formData, weight: e.target.value ? Number(e.target.value) : undefined })} /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth type="number" label="Length (cm)" value={formData.length || ''} onChange={(e) => setFormData({ ...formData, length: e.target.value ? Number(e.target.value) : undefined })} /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth type="number" label="Width (cm)" value={formData.width || ''} onChange={(e) => setFormData({ ...formData, width: e.target.value ? Number(e.target.value) : undefined })} /></Grid>
            <Grid item xs={6} md={3}><TextField fullWidth type="number" label="Height (cm)" value={formData.height || ''} onChange={(e) => setFormData({ ...formData, height: e.target.value ? Number(e.target.value) : undefined })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={createMutation.loading || updateMutation.loading}>{editingProduct ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={!!deleteConfirm} title="Delete Product" message={`Delete "${deleteConfirm?.name}"?`} confirmText="Delete" confirmColor="error" loading={deleteMutation.loading} onConfirm={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)} onCancel={() => setDeleteConfirm(null)} />
    </Box>
  );
};

export default ProductsListPage;
