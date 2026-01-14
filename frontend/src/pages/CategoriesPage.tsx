import { useEffect, useState } from 'react';
import {
  Box, Button, Paper, Typography, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, IconButton, Alert
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add, Edit, Delete } from '@mui/icons-material';
import { categoryAPI } from '../utils/api';

export default function CategoriesPage() {
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
    const res = await categoryAPI.getAll();
    setCategories(res.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

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
    const payload = {
      ...form,
      slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-')
    };
    if (editing) await categoryAPI.update(editing.id, payload);
    else await categoryAPI.create(payload);
    setOpen(false);
    load();
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'slug', headerName: 'Slug', width: 200 },
    { field: 'level', headerName: 'Level', width: 80 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: p => (
        <>
          <IconButton onClick={() => openDialog(p.row)}><Edit /></IconButton>
          <IconButton onClick={() => categoryAPI.delete(p.row.id).then(load)}><Delete /></IconButton>
        </>
      )
    }
  ];

  return (
    <Box>
      <Typography variant="h4" mb={2}>Categories</Typography>
      <Button onClick={() => openDialog()} variant="contained">Add</Button>

      <Paper sx={{ mt: 2 }}>
        <DataGrid rows={categories} columns={columns} loading={loading} />
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{editing ? 'Edit' : 'Create'} Category</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Name" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />
          <TextField fullWidth label="Slug" value={form.slug}
            onChange={e => setForm({ ...form, slug: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={save}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
