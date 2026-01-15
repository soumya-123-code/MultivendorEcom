import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { productVariantAPI, productAPI } from '../utils/api';

export default function ProductVariantsPage() {
  const location = useLocation();
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [createForm, setCreateForm] = useState({
    name: '',
    sku: '',
    price: '',
    attributes: '{}',
  });

  const fetchVariants = async () => {
    try {
      setLoading(true);
      const response = await productVariantAPI.getAll();
      setVariants(response.data?.results || response.data || []);
    } catch (error) {
      console.error('Failed to fetch variants:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariants();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await productAPI.getAll();
      setProducts(res.data?.results || res.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true') {
      setCreateOpen(true);
    }
  }, [location.search]);

  const handleCreate = async () => {
    if (!selectedProduct) {
      alert('Please select a product');
      return;
    }
    try {
      await productVariantAPI.create(selectedProduct.id, {
        ...createForm,
        attributes: JSON.parse(createForm.attributes),
      });
      setCreateOpen(false);
      setCreateForm({ name: '', sku: '', price: '', attributes: '{}' });
      setSelectedProduct(null);
      fetchVariants();
    } catch (error) {
      console.error('Failed to create variant:', error);
      alert('Failed to create variant. Check inputs.');
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { 
      field: 'name', 
      headerName: 'Variant Name', 
      width: 200,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight={600}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'product', 
      headerName: 'Product', 
      width: 200,
      valueGetter: (params:any) => params.row.product?.name || 'N/A'
    },
    { field: 'sku', headerName: 'SKU', width: 150 },
    { 
      field: 'price', 
      headerName: 'Price', 
      width: 120,
      renderCell: (params) => `₹${params.value}`
    },
    {
      field: 'attributes',
      headerName: 'Attributes',
      width: 250,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          {Object.entries(params.value || {}).map(([key, val]: [string, any]) => (
            <Chip key={key} label={`${key}: ${val}`} size="small" variant="outlined" />
          ))}
        </Stack>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Edit">
            <IconButton size="small" color="primary">
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error">
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={3} alignItems="center">
        <Box>
          <Typography variant="h4" fontWeight={700}>Product Variants</Typography>
          <Typography color="text.secondary">Manage product variants and options</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
          Add Variant
        </Button>
      </Stack>

      <Paper sx={{ height: 600, borderRadius: 3, p: 2 }}>
        <DataGrid
          rows={variants}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          sx={{ border: 0 }}
        />
      </Paper>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add New Variant</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Autocomplete
              options={products}
              getOptionLabel={(option) => option.name || ''}
              value={selectedProduct}
              onChange={(_, newValue) => setSelectedProduct(newValue)}
              renderInput={(params) => <TextField {...params} label="Select Product" />}
            />
            <TextField
              label="Variant Name"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            />
            <TextField
              label="SKU"
              value={createForm.sku}
              onChange={(e) => setCreateForm({ ...createForm, sku: e.target.value })}
            />
            <TextField
              label="Price"
              type="number"
              value={createForm.price}
              onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })}
            />
            <TextField
              label="Attributes (JSON)"
              multiline
              rows={3}
              value={createForm.attributes}
              onChange={(e) => setCreateForm({ ...createForm, attributes: e.target.value })}
              helperText='Example: {"color": "red", "size": "L"}'
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
