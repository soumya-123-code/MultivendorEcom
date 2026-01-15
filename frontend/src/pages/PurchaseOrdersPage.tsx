import { useState, useEffect } from 'react';
import { 
  Box, Paper, Typography, Chip, Alert, IconButton, Button, 
  Dialog, DialogTitle, DialogContent, Grid, List, ListItem, ListItemText, Stack 
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Visibility as ViewIcon } from '@mui/icons-material';
import { purchaseOrderAPI } from '../utils/api';

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await purchaseOrderAPI.getAll();
      setOrders(data.data || data.results || data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: number, action: string) => {
    try {
      if (action === 'submit') await purchaseOrderAPI.submit(id);
      else if (action === 'approve') await purchaseOrderAPI.approve(id);
      else if (action === 'send') await purchaseOrderAPI.send(id);
      else if (action === 'complete') await purchaseOrderAPI.complete(id);
      // For reject/cancel/receive, we might need inputs, but for "simple logic" we might skip or use prompt
      else if (action === 'reject') {
         const reason = prompt("Reason for rejection:");
         if (reason) await purchaseOrderAPI.reject(id, reason);
      }
      else if (action === 'cancel') {
         const reason = prompt("Reason for cancellation:");
         if (reason) await purchaseOrderAPI.cancel(id, reason);
      }
      
      loadData();
      if (openDialog) setOpenDialog(false); // Close dialog if open
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleViewDetails = async (order: any) => {
    setSelectedOrder(order);
    try {
      const details = await purchaseOrderAPI.getOne(order.id);
      setSelectedOrder(details.data || details);
      
      const logData = await purchaseOrderAPI.getStatusLogs(order.id);
      setLogs(logData.data || logData);
      
      setOpenDialog(true);
    } catch (error: any) {
      console.error(error);
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'PO ID', width: 100 },
    { field: 'po_number', headerName: 'PO #', width: 150 },
    { field: 'supplier_name', headerName: 'Supplier', width: 200 },
    { field: 'total_amount', headerName: 'Amount', width: 120 },
    { field: 'status', headerName: 'Status', width: 150, renderCell: (params) => <Chip label={params.value} size="small" /> },
    { field: 'created_at', headerName: 'Date', width: 150 },
    { 
      field: 'actions', 
      headerName: 'Actions', 
      width: 100, 
      renderCell: (params) => (
        <IconButton size="small" onClick={() => handleViewDetails(params.row)}>
          <ViewIcon />
        </IconButton>
      ) 
    },
  ];

  return (
    <Box>
      <Typography variant="h4" mb={3}>Purchase Orders</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper><DataGrid rows={orders} columns={columns} loading={loading} pageSizeOptions={[10, 25, 50]} /></Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="md">
        <DialogTitle>PO Details #{selectedOrder?.po_number}</DialogTitle>
        <DialogContent dividers>
     <Grid container spacing={2} mb={2}>
  <Grid size={6}>
    <Typography variant="subtitle2">Supplier</Typography>
    <Typography>{selectedOrder?.supplier_name}</Typography>
  </Grid>
  <Grid size={6}>
    <Typography variant="subtitle2">Status</Typography>
    <Chip label={selectedOrder?.status} size="small" />
  </Grid>
  <Grid size={6}>
    <Typography variant="subtitle2">Total Amount</Typography>
    <Typography>{selectedOrder?.total_amount}</Typography>
  </Grid>
  <Grid size={6}>
    <Typography variant="subtitle2">Date</Typography>
    <Typography>{new Date(selectedOrder?.created_at).toLocaleString()}</Typography>
  </Grid>
</Grid>
          

          <Stack direction="row" spacing={1} mb={3}>
            {selectedOrder?.status === 'draft' && (
               <Button variant="contained" color="primary" onClick={() => handleAction(selectedOrder.id, 'submit')}>Submit</Button>
            )}
            {selectedOrder?.status === 'submitted' && (
               <>
                 <Button variant="contained" color="success" onClick={() => handleAction(selectedOrder.id, 'approve')}>Approve</Button>
                 <Button variant="contained" color="error" onClick={() => handleAction(selectedOrder.id, 'reject')}>Reject</Button>
               </>
            )}
            {selectedOrder?.status === 'approved' && (
               <Button variant="contained" color="primary" onClick={() => handleAction(selectedOrder.id, 'send')}>Send to Supplier</Button>
            )}
             {selectedOrder?.status === 'sent' && (
               <Button variant="contained" color="info" onClick={() => alert("Use 'Receive' API with items payload - simplified for now")}>Receive Items</Button>
            )}
             {selectedOrder?.status === 'received' && (
               <Button variant="contained" color="success" onClick={() => handleAction(selectedOrder.id, 'complete')}>Complete</Button>
            )}
          </Stack>

          <Typography variant="h6" gutterBottom>Items</Typography>
          <Paper variant="outlined" sx={{ mb: 3 }}>
            <List dense>
              {selectedOrder?.items?.map((item: any, idx: number) => (
                <ListItem key={idx} divider>
                   <ListItemText 
                      primary={item.product_name || `Item ${item.id}`} 
                      secondary={`Qty: ${item.quantity} x ${item.unit_price} = ${item.total_price}`} 
                    />
                </ListItem>
              ))}
              {(!selectedOrder?.items || selectedOrder?.items.length === 0) && <ListItem><ListItemText primary="No items" /></ListItem>}
            </List>
          </Paper>

          <Typography variant="h6" gutterBottom>Status History</Typography>
           <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto' }}>
            <List dense>
              {logs.map((log: any, idx: number) => (
                <ListItem key={idx} divider>
                  <ListItemText 
                    primary={log.to_status} 
                    secondary={`${new Date(log.created_at).toLocaleString()} - ${log.notes || 'Status changed'}`} 
                  />
                </ListItem>
              ))}
              {logs.length === 0 && <ListItem><ListItemText primary="No history available" /></ListItem>}
            </List>
          </Paper>
        </DialogContent>
      </Dialog>
    </Box>
  );
}