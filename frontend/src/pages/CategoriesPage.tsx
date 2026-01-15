/* This code snippet is a TypeScript React component called `CategoriesPage` that manages product
categories. Here's a breakdown of what the code does: */
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
  IconButton,
  Stack,
  Chip,
  Tooltip,
  Alert
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import { categoryAPI } from '../utils/api';

export default function CategoriesPage() {
  const location = useLocation();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    slug: '',
    display_order: 0,
    is_featured: false
  });

  const load = async () => {
    try {
      setLoading(true);
      const res = await categoryAPI.getAll();
      setCategories(res.data || []);
    } catch {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true') {
      openDialog();
    }
  }, [location.search]);

  const openDialog = (cat?: any) => {
    if (cat) {
      setEditing(cat);
      setForm({
        name: cat.name,
        slug: cat.slug,
        display_order: cat.display_order || 0,
        is_featured: cat.is_featured || false
      });
    } else {
      setEditing(null);
      setForm({ name: '', slug: '', display_order: 0, is_featured: false });
    }
    setOpen(true);
  };

  const save = async () => {
    try {
      const payload = {
        ...form,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-')
      };
      if (editing) await categoryAPI.update(editing.id, payload);
      else await categoryAPI.create(payload);
      setOpen(false);
      load();
    } catch {
      setError('Failed to save category');
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this category?')) return;
    await categoryAPI.delete(id);
    load();
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    {
      field: 'name',
      headerName: 'Category',
      flex: 1,
      renderCell: p => (
        <Typography fontWeight={600}>{p.value}</Typography>
      )
    },
    {
      field: 'slug',
      headerName: 'Slug',
      flex: 1,
      renderCell: p => (
        <Chip label={p.value} size="small" />
      )
    },
    {
      field: 'level',
      headerName: 'Level',
      width: 100,
      renderCell: p => (
        <Chip
          label={`L${p.value}`}
          size="small"
          color="primary"
          variant="outlined"
        />
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      renderCell: p => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Edit">
            <IconButton onClick={() => openDialog(p.row)} color="primary">
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton onClick={() => remove(p.row.id)} color="error">
              <Delete />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ];

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Categories</Typography>
          <Typography color="text.secondary">
            Manage product categories
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => openDialog()}
        >
          Add Category
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Table */}
      <Paper sx={{ height: 520, borderRadius: 3 }}>
        <DataGrid
          rows={categories}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          sx={{
            border: 0,
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#fff1f2',
              fontWeight: 700
            }
          }}
        />
      </Paper>

      {/* Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? 'Edit Category' : 'Create Category'}
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Category Name"
              fullWidth
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />

            <TextField
              label="Slug"
              fullWidth
              value={form.slug}
              onChange={e => setForm({ ...form, slug: e.target.value })}
              helperText="Leave empty to auto-generate"
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>
            {editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
