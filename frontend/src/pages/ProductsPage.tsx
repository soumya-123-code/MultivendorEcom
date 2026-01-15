import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add, Edit } from '@mui/icons-material';
import { productAPI, categoryAPI } from '../utils/api';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: '',
    base_price: '',
    selling_price: '',
    cost_price: '',
    description: ''
  });

  const load = async () => {
    const p = await productAPI.getAll();
    const c = await categoryAPI.getAll();
    setProducts(p.data || []);
    setCategories(c.data || []);
  };

  useEffect(() => { load(); }, []);

  const openDialog = (p?: any) => {
    if (p) {
      setEditing(p);
      setForm({
        name: p.name,
        sku: p.sku,
        category: p.category.id,
        base_price: p.base_price,
        selling_price: p.selling_price,
        cost_price: p.cost_price,
        description: p.description || ''
      });
    } else {
      setEditing(null);
      setForm({
        name: '',
        sku: '',
        category: '',
        base_price: '',
        selling_price: '',
        cost_price: '',
        description: ''
      });
    }
    setOpen(true);
  };

  const save = async () => {
    if (editing) await productAPI.update(editing.id, form);
    else await productAPI.create(form);
    setOpen(false);
    load();
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    {
      field: 'name',
      headerName: 'Product',
      flex: 1,
      renderCell: p => <Typography fontWeight={600}>{p.value}</Typography>
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 180,
      renderCell: p => <Chip label={p.value?.name} size="small" />
    },
    {
      field: 'selling_price',
      headerName: 'Price',
      width: 120,
      renderCell: p => `₹${p.value}`
    },
    {
      field: 'rating',
      headerName: 'Rating',
      width: 100,
      renderCell: p => <Chip label={p.value || '—'} color="warning" size="small" />
    },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      renderCell: p => (
        <Tooltip title="Edit Product">
          <IconButton onClick={() => openDialog(p.row)} color="primary">
            <Edit />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Products</Typography>
          <Typography color="text.secondary">
            Manage all products in your store
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => openDialog()}
        >
          Add Product
        </Button>
      </Stack>

      {/* Table */}
      <Paper sx={{ height: 540, borderRadius: 3 }}>
        <DataGrid
          rows={products}
          columns={columns}
          disableRowSelectionOnClick
          sx={{
            border: 0,
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#fff1f2',
              fontWeight: 700
            }
          }}
        />
      </Paper>

      {/* Modal */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'linear-gradient(180deg,#fff,#fff5f5)',
            boxShadow: '0 30px 80px rgba(255,77,79,.25)'
          }
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(90deg,#ff4d4f,#ff7a45)',
            color: '#fff',
            fontWeight: 700
          }}
        >
          {editing ? 'Edit Product' : 'Add Product'}
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Stack spacing={2}>
              <TextField label="Product Name" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} />

              <Stack direction="row" spacing={2}>
                <TextField fullWidth label="SKU" value={form.sku}
                  onChange={e => setForm({ ...form, sku: e.target.value })} />

                <TextField select fullWidth label="Category" value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}>
                  {categories.map(c => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </TextField>
              </Stack>

              <Stack direction="row" spacing={2}>
                <TextField fullWidth label="Base Price" value={form.base_price}
                  onChange={e => setForm({ ...form, base_price: e.target.value })} />

                <TextField fullWidth label="Selling Price" value={form.selling_price}
                  onChange={e => setForm({ ...form, selling_price: e.target.value })} />

                <TextField fullWidth label="Cost Price" value={form.cost_price}
                  onChange={e => setForm({ ...form, cost_price: e.target.value })} />
              </Stack>

              <TextField
                label="Description"
                multiline
                rows={3}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </Stack>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ p: 3, background: '#fff1f2' }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>
            {editing ? 'Update Product' : 'Create Product'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
