import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Chip, Alert, IconButton, Button } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Visibility as ViewIcon } from '@mui/icons-material';
import { purchaseOrderAPI } from '../utils/api';

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await purchaseOrderAPI.getAll();
      setOrders(data.results || data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'PO ID', width: 100 },
    { field: 'po_number', headerName: 'PO #', width: 150 },
    { field: 'supplier_name', headerName: 'Supplier', width: 200 },
    { field: 'total_amount', headerName: 'Amount', width: 120 },
    { field: 'status', headerName: 'Status', width: 150, renderCell: (params) => <Chip label={params.value} size="small" /> },
    { field: 'created_at', headerName: 'Date', width: 150 },
    { field: 'actions', headerName: 'Actions', width: 100, renderCell: () => <IconButton size="small"><ViewIcon /></IconButton> },
  ];

  return (
    <Box>
      <Typography variant="h4" mb={3}>Purchase Orders</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper><DataGrid rows={orders} columns={columns} loading={loading} pageSizeOptions={[10, 25, 50]} /></Paper>
    </Box>
  );
}
