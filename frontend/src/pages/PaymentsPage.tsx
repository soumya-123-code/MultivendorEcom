import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Paper, Typography, Chip, Alert, Tabs, Tab, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { paymentAPI, refundAPI } from '../utils/api';

export default function PaymentsPage() {
  const location = useLocation();
  const [tab, setTab] = useState(0);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Refund processing state
  const [openRefundDialog, setOpenRefundDialog] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<any>(null);
  const [refundAction, setRefundAction] = useState<'approve' | 'reject'>('approve');
  const [refundNotes, setRefundNotes] = useState('');

  // Request Refund state
  const [openRequestDialog, setOpenRequestDialog] = useState(false);
  const [requestForm, setRequestForm] = useState({ payment_id: '', amount: '', reason: '' });

  useEffect(() => { loadData(); }, [tab]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'refunds' || location.pathname.endsWith('/refunds')) {
      setTab(1);
    } else {
      setTab(0);
    }
  }, [location.pathname, location.search]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 0) {
        const res = await paymentAPI.getAll();
        setData(res.data || res.results || res);
      } else {
        const res = await refundAPI.getAll();
        setData(res.data || res.results || res);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = (refund: any, action: 'approve' | 'reject') => {
    setSelectedRefund(refund);
    setRefundAction(action);
    setRefundNotes('');
    setOpenRefundDialog(true);
  };

  const submitRefundProcess = async () => {
    try {
      await refundAPI.process(selectedRefund.id, refundAction, refundNotes);
      setOpenRefundDialog(false);
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleSubmitRequest = async () => {
    try {
      await refundAPI.request(requestForm);
      setOpenRequestDialog(false);
      setRequestForm({ payment_id: '', amount: '', reason: '' });
      loadData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const paymentColumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'transaction_id', headerName: 'Transaction ID', width: 200 },
    { field: 'amount', headerName: 'Amount', width: 120 },
    { field: 'payment_method', headerName: 'Method', width: 130 },
    { field: 'status', headerName: 'Status', width: 130, renderCell: (params) => <Chip label={params.value} size="small" color={params.value === 'completed' ? 'success' : 'warning'} /> },
    { field: 'created_at', headerName: 'Date', width: 180 },
  ];

  const refundColumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'refund_transaction_id', headerName: 'Refund Tx ID', width: 200 },
    { field: 'amount', headerName: 'Amount', width: 120 },
    { field: 'status', headerName: 'Status', width: 130, renderCell: (params) => (
      <Chip 
        label={params.value} 
        size="small" 
        color={params.value === 'approved' ? 'success' : params.value === 'rejected' ? 'error' : 'warning'} 
      />
    )},
    { field: 'reason', headerName: 'Reason', width: 200 },
    { field: 'created_at', headerName: 'Date', width: 180 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <>
          {params.row.status === 'pending' && (
            <>
              <IconButton color="success" onClick={() => handleProcessRefund(params.row, 'approve')}><CheckCircle /></IconButton>
              <IconButton color="error" onClick={() => handleProcessRefund(params.row, 'reject')}><Cancel /></IconButton>
            </>
          )}
        </>
      ),
    }
  ];

  return (
    <Box>
      <Typography variant="h4" mb={3}>Payments & Refunds</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Payments" />
        <Tab label="Refunds" />
      </Tabs>
      
      {tab === 1 && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={() => setOpenRequestDialog(true)}>
            Request Refund
          </Button>
        </Box>
      )}

      <Paper>
        <DataGrid 
          rows={data} 
          columns={tab === 0 ? paymentColumns : refundColumns} 
          loading={loading} 
          pageSizeOptions={[10, 25, 50]} 
        />
      </Paper>

      <Dialog open={openRefundDialog} onClose={() => setOpenRefundDialog(false)}>
        <DialogTitle>Process Refund #{selectedRefund?.id}</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Action: <strong>{refundAction.toUpperCase()}</strong>
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Notes (Optional)"
            fullWidth
            multiline
            rows={3}
            value={refundNotes}
            onChange={(e) => setRefundNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRefundDialog(false)}>Cancel</Button>
          <Button onClick={submitRefundProcess} variant="contained" color={refundAction === 'approve' ? 'success' : 'error'}>
            Confirm {refundAction}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Request Refund Dialog */}
      <Dialog open={openRequestDialog} onClose={() => setOpenRequestDialog(false)}>
        <DialogTitle>Request Refund</DialogTitle>
        <DialogContent>
          <TextField
            label="Payment ID"
            fullWidth
            margin="normal"
            type="number"
            value={requestForm.payment_id}
            onChange={(e) => setRequestForm({ ...requestForm, payment_id: e.target.value })}
          />
          <TextField
            label="Amount"
            fullWidth
            margin="normal"
            type="number"
            value={requestForm.amount}
            onChange={(e) => setRequestForm({ ...requestForm, amount: e.target.value })}
          />
          <TextField
            label="Reason"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            value={requestForm.reason}
            onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRequestDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitRequest}>Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
