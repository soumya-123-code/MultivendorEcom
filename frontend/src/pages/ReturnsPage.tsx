import { useEffect, useState } from 'react';
import { Box, Stack, Typography, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { returnsAPI } from '../utils/api';

export default function ReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const load = async () => {
    const res = await returnsAPI.getAll();
    setReturns(res.data || res.results || res || []);
  };

  useEffect(() => { load(); }, []);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'order', headerName: 'Order', width: 140, valueGetter: p => p.row.order?.order_number },
    { field: 'customer', headerName: 'Customer', width: 200, valueGetter: p => p.row.customer?.email },
    { field: 'status', headerName: 'Status', width: 120 },
    {
      field: 'actions', headerName: 'Actions', width: 160,
      renderCell: p => (
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={() => { setSelected(p.row); setOpen(true); }}>View</Button>
        </Stack>
      )
    }
  ];

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={3} alignItems="center">
        <Box>
          <Typography variant="h4" fontWeight={700}>Return Requests</Typography>
          <Typography color="text.secondary">Manage customer returns</Typography>
        </Box>
      </Stack>

      <Paper sx={{ p: 2 }}>
        <DataGrid autoHeight rows={returns} columns={columns} pageSizeOptions={[10, 25, 50]} />
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Return Details</DialogTitle>
        <DialogContent>
          {selected && (
            <Stack spacing={1} mt={1}>
              <Typography>Order: {selected.order?.order_number}</Typography>
              <Typography>Customer: {selected.customer?.email}</Typography>
              <Typography>Reason: {selected.reason}</Typography>
              <Typography>Description: {selected.description}</Typography>
              <Typography>Status: {selected.status}</Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
