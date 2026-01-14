import { useState, useEffect } from 'react';
import { Box, Button, Paper, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Alert } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { warehouseAPI } from '../utils/api';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', location: '', capacity: '', is_active: true });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await warehouseAPI.getAll();
      setWarehouses(data.results || data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (item?: any) => {
    if (item) {
      setEditing(item);
      setFormData({ name: item.name, location: item.location, capacity: item.capacity, is_active: item.is_active });
    } else {
      setEditing(null);
      setFormData({ name: '', location: '', capacity: '', is_active: true });
    }
    setOpenDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await warehouseAPI.update(editing.id, formData);
      } else {
        await warehouseAPI.create(formData);
      }
      setOpenDialog(false);
      loadData();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure?')) {
      try {
        await warehouseAPI.delete(id);
        loadData();
      } catch (error: any) {
        setError(error.message);
      }
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'location', headerName: 'Location', width: 300 },
    { field: 'capacity', headerName: 'Capacity', width: 120 },
    { field: 'is_active', headerName: 'Active', width: 100, type: 'boolean' },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <>
          <IconButton size="small" onClick={() => handleOpen(params.row)}><EditIcon /></IconButton>
          <IconButton size="small" onClick={() => handleDelete(params.row.id)}><DeleteIcon /></IconButton>
        </>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Warehouses</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>Add Warehouse</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper><DataGrid rows={warehouses} columns={columns} loading={loading} pageSizeOptions={[10, 25, 50]} /></Paper>
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editing ? 'Edit Warehouse' : 'Add Warehouse'}</DialogTitle>
          <DialogContent>
            <TextField margin="dense" label="Name" fullWidth required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <TextField margin="dense" label="Location" fullWidth required value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
            <TextField margin="dense" label="Capacity" fullWidth type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">{editing ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
