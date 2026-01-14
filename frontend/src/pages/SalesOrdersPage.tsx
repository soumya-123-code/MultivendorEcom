import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Chip, Alert, IconButton, Button } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Visibility as ViewIcon } from '@mui/icons-material';
import { salesOrderAPI } from '../utils/api';

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await salesOrderAPI.getAll();
      setOrders(data.results || data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      pending: 'warning',
      confirmed: 'info',
      processing: 'info',
      packed: 'primary',
      ready_for_pickup: 'primary',
      out_for_delivery: 'secondary',
      delivered: 'success',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  const handleAction = async (id: number, action: string) => {
    try {
      if (action === 'confirm') await salesOrderAPI.confirm(id);
      else if (action === 'process') await salesOrderAPI.process(id);
      else if (action === 'pack') await salesOrderAPI.pack(id);
      else if (action === 'ready') await salesOrderAPI.readyForPickup(id);
      loadData();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'Order ID', width: 100 },
    { field: 'order_number', headerName: 'Order #', width: 150 },
    { field: 'customer_name', headerName: 'Customer', width: 200 },
    { field: 'total_amount', headerName: 'Amount', width: 120 },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => <Chip label={params.value} color={getStatusColor(params.value)} size="small" />,
    },
    { field: 'created_at', headerName: 'Date', width: 150 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <>
          <IconButton size="small"><ViewIcon /></IconButton>
          {params.row.status === 'pending' && (
            <Button size="small" onClick={() => handleAction(params.row.id, 'confirm')}>Confirm</Button>
          )}
          {params.row.status === 'confirmed' && (
            <Button size="small" onClick={() => handleAction(params.row.id, 'process')}>Process</Button>
          )}
        </>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" mb={3}>Sales Orders</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper><DataGrid rows={orders} columns={columns} loading={loading} pageSizeOptions={[10, 25, 50]} /></Paper>
    </Box>
  );
}
