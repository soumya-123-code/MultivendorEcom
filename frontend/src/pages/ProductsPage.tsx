import { useEffect, useState } from 'react';
import {
  Box, Button, Paper, Typography, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
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
      setForm({ name:'', sku:'', category:'', base_price:'', selling_price:'', cost_price:'', description:'' });
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
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'selling_price', headerName: 'Price', width: 120 },
    { field: 'rating', headerName: 'Rating', width: 100 },
  ];

  return (
    <Box>
      <Typography variant="h4">Products</Typography>
      <Button onClick={() => openDialog()} variant="contained">Add</Button>

      <Paper sx={{ mt: 2 }}>
        <DataGrid rows={products} columns={columns} />
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Product</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
          <TextField fullWidth label="SKU" value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})}/>
          <TextField select fullWidth label="Category" value={form.category}
            onChange={e=>setForm({...form,category:e.target.value})}>
            {categories.map(c=><MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
          <TextField fullWidth label="Base Price" value={form.base_price} onChange={e=>setForm({...form,base_price:e.target.value})}/>
          <TextField fullWidth label="Selling Price" value={form.selling_price} onChange={e=>setForm({...form,selling_price:e.target.value})}/>
        </DialogContent>
        <DialogActions>
          <Button onClick={save}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
