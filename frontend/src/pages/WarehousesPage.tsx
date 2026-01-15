import { useState, useEffect } from 'react';
import { 
  Box, Button, Paper, Typography, Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, IconButton, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Stack 
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, LocationOn } from '@mui/icons-material';
import { warehouseAPI } from '../utils/api';

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Warehouse CRUD state
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [formData, setFormData] = useState({ 
    name: '', code: '', address: '', city: '', state: '', 
    country: '', pincode: '', total_capacity: '' 
  });

  // Location Management state
  const [openLocDialog, setOpenLocDialog] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [locForm, setLocForm] = useState({ name: '', code: '', capacity: '' });

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

  // Warehouse Actions
  const handleOpen = (item?: any) => {
    if (item) {
      setEditing(item);
      setFormData({ 
        name: item.name, code: item.code || '', address: item.address || '', 
        city: item.city || '', state: item.state || '', country: item.country || '',
        pincode: item.pincode || '', total_capacity: item.total_capacity || ''
      });
    } else {
      setEditing(null);
      setFormData({ 
        name: '', code: '', address: '', city: '', state: '', 
        country: '', pincode: '', total_capacity: '' 
      });
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

  // Location Actions
  const handleManageLocations = async (warehouse: any) => {
    setSelectedWarehouse(warehouse);
    setLocForm({ name: '', code: '', capacity: '' }); // Reset form
    try {
      const res = await warehouseAPI.getLocations(warehouse.id);
      setLocations(res.data || res.results || res); // Assuming array return
      setOpenLocDialog(true);
    } catch (error: any) {
      console.error(error);
      alert('Failed to load locations');
    }
  };

  const handleSaveLocation = async () => {
    try {
      if ((locForm as any).id) {
        await warehouseAPI.updateLocation((locForm as any).id, locForm);
      } else {
        await warehouseAPI.addLocation(selectedWarehouse.id, locForm);
      }
      const res = await warehouseAPI.getLocations(selectedWarehouse.id);
      setLocations(res.data || res);
      setLocForm({ name: '', code: '', capacity: '' }); // Reset form
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleEditLocation = (loc: any) => {
    setLocForm(loc);
  };

  const handleDeleteLocation = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        await warehouseAPI.deleteLocation(id);
        const res = await warehouseAPI.getLocations(selectedWarehouse.id);
        setLocations(res.data || res);
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'code', headerName: 'Code', width: 100 },
    { field: 'city', headerName: 'City', width: 150 },
    { field: 'total_capacity', headerName: 'Capacity', width: 120 },
    { field: 'used_capacity', headerName: 'Used', width: 120 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <>
           <IconButton size="small" onClick={() => handleManageLocations(params.row)} title="Manage Locations"><LocationOn /></IconButton>
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

      {/* Warehouse Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editing ? 'Edit Warehouse' : 'Add Warehouse'}</DialogTitle>
          <DialogContent>
            <TextField margin="dense" label="Name" fullWidth required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <TextField margin="dense" label="Code" fullWidth required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
            <TextField margin="dense" label="Address" fullWidth value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            <Stack direction="row" spacing={2}>
               <TextField margin="dense" label="City" fullWidth value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
               <TextField margin="dense" label="State" fullWidth value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
            </Stack>
            <TextField margin="dense" label="Capacity" fullWidth type="number" value={formData.total_capacity} onChange={(e) => setFormData({ ...formData, total_capacity: e.target.value })} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">{editing ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Location Dialog */}
      <Dialog open={openLocDialog} onClose={() => setOpenLocDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Locations for {selectedWarehouse?.name}</DialogTitle>
        <DialogContent>
          <Box mb={3} sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
            <TextField label="Name" size="small" value={locForm.name} onChange={(e) => setLocForm({...locForm, name: e.target.value})} />
            <TextField label="Code" size="small" value={locForm.code} onChange={(e) => setLocForm({...locForm, code: e.target.value})} />
            <TextField label="Capacity" size="small" type="number" value={locForm.capacity} onChange={(e) => setLocForm({...locForm, capacity: e.target.value})} />
            <Button variant="contained" onClick={handleSaveLocation}>
              {(locForm as any).id ? 'Update' : 'Add'}
            </Button>
            {(locForm as any).id && (
              <Button onClick={() => setLocForm({ name: '', code: '', capacity: '' })}>
                Cancel
              </Button>
            )}
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Capacity</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {locations.map((loc: any) => (
                  <TableRow key={loc.id}>
                    <TableCell>{loc.name}</TableCell>
                    <TableCell>{loc.code}</TableCell>
                    <TableCell>{loc.capacity}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleEditLocation(loc)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => handleDeleteLocation(loc.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {locations.length === 0 && <TableRow><TableCell colSpan={4}>No locations found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
           <Button onClick={() => setOpenLocDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}