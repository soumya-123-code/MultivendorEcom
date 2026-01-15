import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Chip, Alert } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { otpRequestAPI } from '../utils/api';

export default function OTPRequestsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await otpRequestAPI.getAll();
      setLogs(data.results || data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'email', headerName: 'Email', width: 250 },
    { 
      field: 'is_used', 
      headerName: 'Used', 
      width: 100,
      renderCell: (params) => (
        <Chip 
          label={params.value ? 'Yes' : 'No'} 
          color={params.value ? 'success' : 'warning'} 
          size="small" 
        />
      )
    },
    { field: 'attempts', headerName: 'Attempts', width: 100 },
    { field: 'ip_address', headerName: 'IP Address', width: 150 },
    { field: 'expires_at', headerName: 'Expires At', width: 200 },
    { field: 'created_at', headerName: 'Created At', width: 200 },
  ];

  return (
    <Box>
      <Typography variant="h4" mb={3}>OTP Requests Log</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper sx={{ height: 600 }}>
        <DataGrid 
          rows={logs} 
          columns={columns} 
          loading={loading} 
          pageSizeOptions={[10, 25, 50]} 
          disableRowSelectionOnClick
        />
      </Paper>
    </Box>
  );
}
