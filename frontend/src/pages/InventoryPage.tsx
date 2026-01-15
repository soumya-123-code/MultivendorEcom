import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Chip, Alert, Tabs, Tab, IconButton, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, Divider } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Visibility } from '@mui/icons-material';
import { inventoryAPI } from '../utils/api';

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);
  const [logsOpen, setLogsOpen] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => { loadData(); }, [tab]);

  const loadData = async () => {
    try {
      let data;
      if (tab === 1) data = await inventoryAPI.getLowStock();
      else if (tab === 2) data = await inventoryAPI.getOutOfStock();
      else data = await inventoryAPI.getAll();
      setInventory(data.results || data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewLogs = async (item: any) => {
    setSelectedItem(item);
    try {
      const res = await inventoryAPI.getLogs(item.id);
      setLogs(res.data || []);
      setLogsOpen(true);
    } catch (error: any) {
      console.error(error);
      alert('Failed to load logs');
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'product_name', headerName: 'Product', width: 200 },
    { field: 'warehouse_name', headerName: 'Warehouse', width: 150 },
    { field: 'quantity', headerName: 'Quantity', width: 100 },
    { field: 'reserved_quantity', headerName: 'Reserved', width: 100 },
    { field: 'available_quantity', headerName: 'Available', width: 100 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
        const qty = params.row.available_quantity;
        const reorder = params.row.reorder_level || 10;
        if (qty === 0) return <Chip label="Out of Stock" color="error" size="small" />;
        if (qty < reorder) return <Chip label="Low Stock" color="warning" size="small" />;
        return <Chip label="In Stock" color="success" size="small" />;
      },
    },
    {
      field: 'actions',
      headerName: 'Logs',
      width: 80,
      renderCell: (params) => (
        <IconButton size="small" onClick={() => handleViewLogs(params.row)}>
          <Visibility />
        </IconButton>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" mb={3}>Inventory</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="All" />
        <Tab label="Low Stock" />
        <Tab label="Out of Stock" />
      </Tabs>
      <Paper><DataGrid rows={inventory} columns={columns} loading={loading} pageSizeOptions={[10, 25, 50]} /></Paper>

      <Dialog open={logsOpen} onClose={() => setLogsOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Inventory Logs - {selectedItem?.product_name}</DialogTitle>
        <DialogContent>
          <List>
            {logs.length > 0 ? logs.map((log: any, index: number) => (
              <Box key={index}>
                <ListItem>
                  <ListItemText
                    primary={`${log.movement_type} - Qty: ${log.quantity}`}
                    secondary={`${new Date(log.created_at).toLocaleString()} - ${log.notes || ''}`}
                  />
                </ListItem>
                <Divider />
              </Box>
            )) : <Typography p={2}>No logs found.</Typography>}
          </List>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
