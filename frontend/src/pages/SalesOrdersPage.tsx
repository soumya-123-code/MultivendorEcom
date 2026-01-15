import { useState, useEffect } from 'react';
import { 
  Box, Paper, Typography, Chip, Alert, IconButton, Button, 
  Dialog, DialogTitle, DialogContent, Grid, Divider, List, ListItem, ListItemText 
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Visibility as ViewIcon } from '@mui/icons-material';
import { salesOrderAPI } from '../utils/api';

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Detail Dialog State
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderLogs, setOrderLogs] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const data = await salesOrderAPI.getAll();
      setOrders(data.data || data.results || data);
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

  const handleViewDetails = async (order: any) => {
    setSelectedOrder(order);
    try {
      // Fetch full details if needed (e.g. for items)
      const details = await salesOrderAPI.getOne(order.id);
      setSelectedOrder(details.data || details);

      // Fetch logs
      const logs = await salesOrderAPI.getStatusLogs(order.id);
      setOrderLogs(logs.data || logs.results || logs);
      
      setOpenDialog(true);
    } catch (error: any) {
      console.error(error);
      alert('Failed to load details');
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
      width: 250,
      renderCell: (params) => (
        <>
          <IconButton size="small" onClick={() => handleViewDetails(params.row)}><ViewIcon /></IconButton>
          {params.row.status === 'pending' && (
            <Button size="small" onClick={() => handleAction(params.row.id, 'confirm')}>Confirm</Button>
          )}
          {params.row.status === 'confirmed' && (
            <Button size="small" onClick={() => handleAction(params.row.id, 'process')}>Process</Button>
          )}
          {params.row.status === 'processing' && (
            <Button size="small" onClick={() => handleAction(params.row.id, 'pack')}>Pack</Button>
          )}
           {params.row.status === 'packed' && (
            <Button size="small" onClick={() => handleAction(params.row.id, 'ready')}>Ready</Button>
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

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="md">
        <DialogTitle>Order Details #{selectedOrder?.order_number}</DialogTitle>
        <DialogContent dividers>
<Grid container spacing={2} mb={2}>
  <Grid size={6}>
    <Typography variant="subtitle2">Customer</Typography>
    <Typography>{selectedOrder?.customer_name}</Typography>
  </Grid>
  <Grid size={6}>
    <Typography variant="subtitle2">Status</Typography>
    <Chip label={selectedOrder?.status} color={getStatusColor(selectedOrder?.status)} size="small" />
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

          <Typography variant="h6" gutterBottom>Order Items</Typography>
          <Paper variant="outlined" sx={{ mb: 3 }}>
             {/* Assuming items are in selectedOrder.items or similar */}
             <List dense>
               {selectedOrder?.items?.map((item: any, idx: number) => (
                 <ListItem key={idx} divider>
                   <ListItemText 
                      primary={item.product_name} 
                      secondary={`Qty: ${item.quantity} x ${item.unit_price} = ${item.total_price}`} 
                    />
                 </ListItem>
               ))}
               {(!selectedOrder?.items || selectedOrder?.items?.length === 0) && (
                 <ListItem><ListItemText primary="No items found" /></ListItem>
               )}
             </List>
          </Paper>

          <Typography variant="h6" gutterBottom>Status History</Typography>
          <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto' }}>
            <List dense>
              {orderLogs.map((log: any, idx: number) => (
                <ListItem key={idx} divider>
                  <ListItemText 
                    primary={log.to_status} 
                    secondary={`${new Date(log.created_at).toLocaleString()} - ${log.notes || 'Status changed'}`} 
                  />
                </ListItem>
              ))}
              {orderLogs.length === 0 && <ListItem><ListItemText primary="No history available" /></ListItem>}
            </List>
          </Paper>
        </DialogContent>
      </Dialog>
    </Box>
  );
}