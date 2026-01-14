import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Chip, Alert } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { paymentAPI } from '../utils/api';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await paymentAPI.getAll();
      setPayments(data.results || data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'transaction_id', headerName: 'Transaction ID', width: 200 },
    { field: 'amount', headerName: 'Amount', width: 120 },
    { field: 'payment_method', headerName: 'Method', width: 130 },
    { field: 'status', headerName: 'Status', width: 130, renderCell: (params) => <Chip label={params.value} size="small" color={params.value === 'completed' ? 'success' : 'warning'} /> },
    { field: 'created_at', headerName: 'Date', width: 150 },
  ];

  return (
    <Box>
      <Typography variant="h4" mb={3}>Payments</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper><DataGrid rows={payments} columns={columns} loading={loading} pageSizeOptions={[10, 25, 50]} /></Paper>
    </Box>
  );
}
