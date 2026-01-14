import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Alert } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { vendorAPI } from '../utils/api';

export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await vendorAPI.getAll();
      setVendors(data.results || data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'business_name', headerName: 'Business Name', width: 250 },
    { field: 'contact_email', headerName: 'Email', width: 200 },
    { field: 'phone_number', headerName: 'Phone', width: 150 },
    { field: 'address', headerName: 'Address', width: 300 },
  ];

  return (
    <Box>
      <Typography variant="h4" mb={3}>Vendors</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper><DataGrid rows={vendors} columns={columns} loading={loading} pageSizeOptions={[10, 25, 50]} /></Paper>
    </Box>
  );
}
