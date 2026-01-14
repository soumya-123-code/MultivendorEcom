import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Chip, Alert } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { deliveryAPI } from '../utils/api';

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await deliveryAPI.getAll();
      setDeliveries(data.results || data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'order_number', headerName: 'Order #', width: 150 },
    { field: 'agent_name', headerName: 'Agent', width: 200 },
    { field: 'customer_name', headerName: 'Customer', width: 200 },
    { field: 'status', headerName: 'Status', width: 150, renderCell: (params) => <Chip label={params.value} size="small" /> },
    { field: 'created_at', headerName: 'Date', width: 150 },
  ];

  return (
    <Box>
      <Typography variant="h4" mb={3}>Deliveries</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper><DataGrid rows={deliveries} columns={columns} loading={loading} pageSizeOptions={[10, 25, 50]} /></Paper>
    </Box>
  );
}
