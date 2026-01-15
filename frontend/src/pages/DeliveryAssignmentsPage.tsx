import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Stack,
  Button
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Visibility, LocalShipping } from '@mui/icons-material';
import { deliveryAPI, deliveryAgentAPI } from '../utils/api';

export default function DeliveryAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [proofs, setProofs] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await deliveryAPI.getAll();
      setAssignments(data.results || data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (assignment: any) => {
    setSelectedAssignment(assignment);
    try {
      // Fetch status logs and proofs
      const detail = await deliveryAPI.getOne(assignment.id);
      setSelectedAssignment(detail.data || detail);
      setLogs(detail.data?.status_logs || detail.status_logs || []);
      
      // Try to get proofs if available in detail or fetch separately
      if (detail.data?.proofs || detail.proofs) {
        setProofs(detail.data?.proofs || detail.proofs);
      } else {
        // If not in detail, try separate endpoint if it exists
        try {
           const proofsData = await deliveryAPI.getProofs(assignment.id);
           setProofs(proofsData.data || proofsData);
        } catch (e) {
           console.log("Could not fetch proofs separately", e);
           setProofs([]);
        }
      }
    } catch (error) {
      console.error(error);
    }
    setOpen(true);
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'sales_order_number', headerName: 'Order #', width: 150 },
    { field: 'agent_name', headerName: 'Agent', width: 200 },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 150,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={
            params.value === 'delivered' ? 'success' : 
            params.value === 'failed' ? 'error' : 
            params.value === 'in_transit' ? 'primary' : 'default'
          }
          size="small"
        />
      )
    },
    { field: 'delivery_contact_name', headerName: 'Customer', width: 150 },
    { field: 'cod_amount', headerName: 'COD Amount', width: 120 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (params) => (
        <Tooltip title="View Details">
          <IconButton onClick={() => handleView(params.row)} color="primary" size="small">
            <Visibility />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  return (
    <Box>
      <Typography variant="h4" mb={3}>Delivery Assignments</Typography>
      
      <Paper sx={{ height: 600 }}>
        <DataGrid 
          rows={assignments} 
          columns={columns} 
          loading={loading}
          disableRowSelectionOnClick
        />
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Assignment Details #{selectedAssignment?.id}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Order Number</Typography>
              <Typography variant="body1">{selectedAssignment?.sales_order_number}</Typography>
            </Box>
            
            <Stack direction="row" spacing={4}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Agent</Typography>
                <Typography variant="body1">{selectedAssignment?.agent_name || 'Unassigned'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Typography variant="body1" textTransform="capitalize">{selectedAssignment?.status}</Typography>
              </Box>
            </Stack>

            <Box>
              <Typography variant="subtitle2" color="text.secondary">Delivery Address</Typography>
              <Typography variant="body1">
                {typeof selectedAssignment?.delivery_address === 'object' 
                  ? JSON.stringify(selectedAssignment.delivery_address) 
                  : selectedAssignment?.delivery_address}
              </Typography>
            </Box>

            <Typography variant="h6" mt={2}>Status Logs</Typography>
            <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto' }}>
              <List dense>
                {logs.length > 0 ? logs.map((log: any, index: number) => (
                  <ListItem key={index} divider>
                    <ListItemText 
                      primary={log.status} 
                      secondary={`${new Date(log.created_at).toLocaleString()} - ${log.notes || ''}`} 
                    />
                  </ListItem>
                )) : (
                  <ListItem><ListItemText primary="No logs available" /></ListItem>
                )}
              </List>
            </Paper>

            <Typography variant="h6" mt={2}>Delivery Proofs</Typography>
            <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto', p: 1 }}>
              {proofs.length > 0 ? (
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  {proofs.map((proof: any, index: number) => (
                    <Box key={index} sx={{ border: '1px solid #eee', p: 1, borderRadius: 1 }}>
                       <Typography variant="caption" display="block">{proof.proof_type}</Typography>
                       {proof.proof_type === 'photo' || proof.proof_type === 'signature' ? (
                         <img src={proof.proof_data} alt="Proof" style={{ width: 100, height: 100, objectFit: 'cover' }} />
                       ) : (
                         <Typography variant="body2">{JSON.stringify(proof.proof_data)}</Typography>
                       )}
                       <Typography variant="caption" display="block" color="text.secondary">
                         {new Date(proof.captured_at).toLocaleString()}
                       </Typography>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" p={2}>No proofs available</Typography>
              )}
            </Paper>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}