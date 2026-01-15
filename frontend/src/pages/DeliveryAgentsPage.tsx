import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Chip, Alert, IconButton } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { CheckCircle as ApproveIcon, Cancel as RejectIcon } from '@mui/icons-material';
import { deliveryAgentAPI } from '../utils/api';

export default function DeliveryAgentsPage() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await deliveryAgentAPI.getAll();
      setAgents(data.data || data.results || data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await deliveryAgentAPI.approve(id);
      loadData();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleReject = async (id: number) => {
    if (window.confirm('Are you sure you want to reject this agent?')) {
      try {
        await deliveryAgentAPI.reject(id);
        loadData();
      } catch (error: any) {
        setError(error.message);
      }
    }
  };

  const handleSuspend = async (id: number) => {
    if (window.confirm('Are you sure you want to suspend this agent?')) {
      try {
        await deliveryAgentAPI.suspend(id);
        loadData();
      } catch (error: any) {
        setError(error.message);
      }
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await deliveryAgentAPI.activate(id);
      loadData();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'user_name', headerName: 'Name', width: 200 },
    { field: 'phone_number', headerName: 'Phone', width: 150 },
    { field: 'vehicle_type', headerName: 'Vehicle', width: 130 },
    { field: 'status', headerName: 'Status', width: 120, renderCell: (params) => <Chip label={params.value} size="small" color={params.value === 'active' ? 'success' : params.value === 'suspended' ? 'warning' : 'default'} /> },
    { field: 'is_available', headerName: 'Available', width: 100, type: 'boolean' },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 250,
      renderCell: (params) => (
        <>
          {params.row.status === 'pending' && (
            <>
              <IconButton size="small" onClick={() => handleApprove(params.row.id)} title="Approve"><ApproveIcon color="success" /></IconButton>
              <IconButton size="small" onClick={() => handleReject(params.row.id)} title="Reject"><RejectIcon color="error" /></IconButton>
            </>
          )}
          {params.row.status === 'active' && (
            <IconButton size="small" onClick={() => handleSuspend(params.row.id)} title="Suspend"><RejectIcon color="warning" /></IconButton>
          )}
          {params.row.status === 'suspended' && (
            <IconButton size="small" onClick={() => handleActivate(params.row.id)} title="Activate"><ApproveIcon color="success" /></IconButton>
          )}
        </>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" mb={3}>Delivery Agents</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper><DataGrid rows={agents} columns={columns} loading={loading} pageSizeOptions={[10, 25, 50]} /></Paper>
    </Box>
  );
}
