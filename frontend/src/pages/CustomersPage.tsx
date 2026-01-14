import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Alert } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { customerAPI } from '../utils/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await customerAPI.getAll();
      setCustomers(data.results || data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'user_email', headerName: 'Email', width: 250 },
    { field: 'phone_number', headerName: 'Phone', width: 150 },
    { field: 'address', headerName: 'Address', width: 300 },
    { field: 'created_at', headerName: 'Registered', width: 150 },
  ];

  return (
    <Box>
      <Typography variant="h4" mb={3}>Customers</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper><DataGrid rows={customers} columns={columns} loading={loading} pageSizeOptions={[10, 25, 50]} /></Paper>
    </Box>
  );
}
