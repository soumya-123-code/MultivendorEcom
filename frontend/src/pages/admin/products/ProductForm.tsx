import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Grid, Typography, TextField, Button, Divider,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  CircularProgress, Alert, InputAdornment, Chip,
} from '@mui/material';
import { ArrowBack as BackIcon, Save as SaveIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { PageHeader, ConfirmDialog } from '../../../components';
import { useApiQuery, useMutation, useToast } from '../../../hooks';
import { productsApi } from '../../../api';
import { Product, ProductStatus, Category } from '../../../types';

interface ProductFormData {
  name: string;
  sku: string;
  slug: string;
  description: string;
  short_description: string;
  category: number | '';
  base_price: string;
  selling_price: string;
  compare_at_price: string;
  cost_price: string;
  tax_percentage: string;
  status: ProductStatus;
  is_featured: boolean;
  is_digital: boolean;
  manage_stock: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  weight: string;
  length: string;
  width: string;
  height: string;
  meta_title: string;
  meta_description: string;
}

const initialFormData: ProductFormData = {
  name: '',
  sku: '',
  slug: '',
  description: '',
  short_description: '',
  category: '',
  base_price: '',
  selling_price: '',
  compare_at_price: '',
  cost_price: '',
  tax_percentage: '18',
  status: 'draft',
  is_featured: false,
  is_digital: false,
  manage_stock: true,
  stock_quantity: 0,
  low_stock_threshold: 10,
  weight: '',
  length: '',
  width: '',
  height: '',
  meta_title: '',
  meta_description: '',
};

const ProductFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: product, loading: loadingProduct } = useApiQuery(
    () => (isEdit ? productsApi.getById(Number(id)) : Promise.resolve({ data: null })),
    [id]
  );

  const { data: categories } = useApiQuery(
    () => productsApi.categories.list({ page_size: 100 }),
    []
  );

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        slug: product.slug || '',
        description: product.description || '',
        short_description: product.short_description || '',
        category: product.category || '',
        base_price: product.base_price || '',
        selling_price: product.selling_price || '',
        compare_at_price: product.compare_at_price || '',
        cost_price: product.cost_price || '',
        tax_percentage: product.tax_percentage || '18',
        status: product.status || 'draft',
        is_featured: product.is_featured || false,
        is_digital: product.is_digital || false,
        manage_stock: product.manage_stock ?? true,
        stock_quantity: product.stock_quantity || 0,
        low_stock_threshold: product.low_stock_threshold || 10,
        weight: product.weight || '',
        length: product.dimensions?.length?.toString() || '',
        width: product.dimensions?.width?.toString() || '',
        height: product.dimensions?.height?.toString() || '',
        meta_title: product.meta_title || '',
        meta_description: product.meta_description || '',
      });
    }
  }, [product]);

  const createMutation = useMutation((data: any) => productsApi.create(data), {
    onSuccess: (data) => { toast.success('Product created'); navigate(`/admin/products/${data.id}`); },
    onError: (err) => toast.error(err),
  });

  const updateMutation = useMutation((data: any) => productsApi.update(Number(id), data), {
    onSuccess: () => { toast.success('Product updated'); navigate('/admin/products'); },
    onError: (err) => toast.error(err),
  });

  const deleteMutation = useMutation(() => productsApi.delete(Number(id)), {
    onSuccess: () => { toast.success('Product deleted'); navigate('/admin/products'); },
    onError: (err) => toast.error(err),
  });

  const handleChange = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.sku) newErrors.sku = 'SKU is required';
    if (!formData.base_price) newErrors.base_price = 'Base price is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const data = {
      ...formData,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
      category: formData.category || null,
      dimensions: formData.length || formData.width || formData.height
        ? { length: parseFloat(formData.length) || 0, width: parseFloat(formData.width) || 0, height: parseFloat(formData.height) || 0 }
        : null,
    };

    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (loadingProduct) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <PageHeader
        title={isEdit ? 'Edit Product' : 'New Product'}
        breadcrumbs={[
          { label: 'Products', path: '/admin/products' },
          { label: isEdit ? 'Edit' : 'New' },
        ]}
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button startIcon={<BackIcon />} onClick={() => navigate('/admin/products')}>Cancel</Button>
            {isEdit && (
              <Button color="error" startIcon={<DeleteIcon />} onClick={() => setDeleteOpen(true)}>Delete</Button>
            )}
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSubmit}
              disabled={createMutation.loading || updateMutation.loading}
            >
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </Box>
        }
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {/* Basic Info */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Basic Information</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Product Name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="SKU"
                  value={formData.sku}
                  onChange={(e) => handleChange('sku', e.target.value)}
                  error={!!errors.sku}
                  helperText={errors.sku}
                  required
                  disabled={isEdit}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Slug"
                  value={formData.slug}
                  onChange={(e) => handleChange('slug', e.target.value)}
                  helperText="Leave empty to auto-generate"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Short Description"
                  value={formData.short_description}
                  onChange={(e) => handleChange('short_description', e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  multiline
                  rows={4}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Pricing */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Pricing</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Base Price"
                  type="number"
                  value={formData.base_price}
                  onChange={(e) => handleChange('base_price', e.target.value)}
                  error={!!errors.base_price}
                  helperText={errors.base_price}
                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                  required
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Selling Price"
                  type="number"
                  value={formData.selling_price}
                  onChange={(e) => handleChange('selling_price', e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Compare At"
                  type="number"
                  value={formData.compare_at_price}
                  onChange={(e) => handleChange('compare_at_price', e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  label="Cost Price"
                  type="number"
                  value={formData.cost_price}
                  onChange={(e) => handleChange('cost_price', e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Tax %"
                  type="number"
                  value={formData.tax_percentage}
                  onChange={(e) => handleChange('tax_percentage', e.target.value)}
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Inventory */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Inventory</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={formData.manage_stock} onChange={(e) => handleChange('manage_stock', e.target.checked)} />}
                  label="Track inventory"
                />
              </Grid>
              {formData.manage_stock && (
                <>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Stock Quantity"
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => handleChange('stock_quantity', parseInt(e.target.value) || 0)}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Low Stock Threshold"
                      type="number"
                      value={formData.low_stock_threshold}
                      onChange={(e) => handleChange('low_stock_threshold', parseInt(e.target.value) || 0)}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Paper>

          {/* Shipping */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Shipping</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={formData.is_digital} onChange={(e) => handleChange('is_digital', e.target.checked)} />}
                  label="Digital product (no shipping)"
                />
              </Grid>
              {!formData.is_digital && (
                <>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      label="Weight"
                      type="number"
                      value={formData.weight}
                      onChange={(e) => handleChange('weight', e.target.value)}
                      InputProps={{ endAdornment: <InputAdornment position="end">kg</InputAdornment> }}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      label="Length"
                      type="number"
                      value={formData.length}
                      onChange={(e) => handleChange('length', e.target.value)}
                      InputProps={{ endAdornment: <InputAdornment position="end">cm</InputAdornment> }}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      label="Width"
                      type="number"
                      value={formData.width}
                      onChange={(e) => handleChange('width', e.target.value)}
                      InputProps={{ endAdornment: <InputAdornment position="end">cm</InputAdornment> }}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      label="Height"
                      type="number"
                      value={formData.height}
                      onChange={(e) => handleChange('height', e.target.value)}
                      InputProps={{ endAdornment: <InputAdornment position="end">cm</InputAdornment> }}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Status</Typography>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Category</Typography>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                label="Category"
              >
                <MenuItem value="">None</MenuItem>
                {(categories as any)?.results?.map((cat: Category) => (
                  <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Options</Typography>
            <FormControlLabel
              control={<Switch checked={formData.is_featured} onChange={(e) => handleChange('is_featured', e.target.checked)} />}
              label="Featured product"
            />
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>SEO</Typography>
            <TextField
              fullWidth
              label="Meta Title"
              value={formData.meta_title}
              onChange={(e) => handleChange('meta_title', e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Meta Description"
              value={formData.meta_description}
              onChange={(e) => handleChange('meta_description', e.target.value)}
              multiline
              rows={3}
            />
          </Paper>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
        confirmColor="error"
        loading={deleteMutation.loading}
        onConfirm={() => deleteMutation.mutate(undefined)}
        onCancel={() => setDeleteOpen(false)}
      />
    </Box>
  );
};

export default ProductFormPage;
