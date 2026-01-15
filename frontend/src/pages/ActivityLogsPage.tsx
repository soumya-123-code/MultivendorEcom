import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Chip, Alert } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { activityLogAPI } from '../utils/api';

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await activityLogAPI.getAll();
      setLogs(data.results || data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { 
      field: 'user', 
      headerName: 'User', 
      width: 200, 
      valueGetter: (params) => params.row.user?.email || 'Unknown' 
    },
    { field: 'action', headerName: 'Action', width: 200 },
    { 
      field: 'action_type', 
      headerName: 'Type', 
      width: 120, 
      renderCell: (params) => <Chip label={params.value} size="small" variant="outlined" /> 
    },
    { field: 'ip_address', headerName: 'IP Address', width: 150 },
    { field: 'created_at', headerName: 'Time', width: 200 },
  ];

  return (
    <Box>
      <Typography variant="h4" mb={3}>Activity Logs</Typography>
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
