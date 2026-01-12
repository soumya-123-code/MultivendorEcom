import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Grid, Typography, Chip, Button, Divider, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, CircularProgress, Stepper,
  Step, StepLabel, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import {
  ArrowBack as BackIcon, Print as PrintIcon, Send as SendIcon,
  Cancel as CancelIcon, CheckCircle as ApproveIcon, Download as ReceiveIcon,
} from '@mui/icons-material';
import { PageHeader, StatusChip, ConfirmDialog } from '../../../components';
import { useApiQuery, useMutation, useToast } from '../../../hooks';
import { purchaseOrdersApi } from '../../../api';
import { formatCurrency, formatDate } from '../../../utils';
import { POStatus } from '../../../types';

const statusSteps = ['draft', 'pending_approval', 'approved', 'sent', 'confirmed', 'received', 'complete'];

const PurchaseOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [receiveItems, setReceiveItems] = useState<Record<number, number>>({});

  const { data: order, loading, refetch } = useApiQuery(
    () => purchaseOrdersApi.getById(Number(id)),
    [id]
  );

  const submitMutation = useMutation(() => purchaseOrdersApi.submit(Number(id)), {
    onSuccess: () => { toast.success('PO submitted for approval'); refetch(); },
    onError: (err) => toast.error(err),
  });

  const approveMutation = useMutation(() => purchaseOrdersApi.approve(Number(id)), {
    onSuccess: () => { toast.success('PO approved'); refetch(); },
    onError: (err) => toast.error(err),
  });

  const rejectMutation = useMutation((reason: string) => purchaseOrdersApi.reject(Number(id), reason), {
    onSuccess: () => { toast.success('PO rejected'); setRejectOpen(false); refetch(); },
    onError: (err) => toast.error(err),
  });

  const sendMutation = useMutation(() => purchaseOrdersApi.send(Number(id)), {
    onSuccess: () => { toast.success('PO sent to supplier'); refetch(); },
    onError: (err) => toast.error(err),
  });

  const confirmMutation = useMutation(() => purchaseOrdersApi.confirm(Number(id)), {
    onSuccess: () => { toast.success('PO confirmed'); refetch(); },
    onError: (err) => toast.error(err),
  });

  const receiveMutation = useMutation((items: { item_id: number; quantity: number }[]) => purchaseOrdersApi.receive(Number(id), items), {
    onSuccess: () => { toast.success('Items received'); setReceiveOpen(false); refetch(); },
    onError: (err) => toast.error(err),
  });

  const cancelMutation = useMutation((reason: string) => purchaseOrdersApi.cancel(Number(id), reason), {
    onSuccess: () => { toast.success('PO cancelled'); setCancelOpen(false); refetch(); },
    onError: (err) => toast.error(err),
  });

  const completeMutation = useMutation(() => purchaseOrdersApi.complete(Number(id)), {
    onSuccess: () => { toast.success('PO completed'); refetch(); },
    onError: (err) => toast.error(err),
  });

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  if (!order) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color="error">Purchase order not found</Typography>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>Go Back</Button>
      </Box>
    );
  }

  const currentStep = statusSteps.indexOf(order.status);
  const canSubmit = order.status === 'draft';
  const canApprove = order.status === 'pending_approval';
  const canSend = order.status === 'approved';
  const canConfirm = order.status === 'sent';
  const canReceive = ['confirmed', 'receiving', 'partial_received'].includes(order.status);
  const canComplete = order.status === 'received';
  const canCancel = ['draft', 'pending_approval', 'approved', 'sent'].includes(order.status);

  const handleReceive = () => {
    const items = Object.entries(receiveItems)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, qty]) => ({ item_id: parseInt(itemId), quantity: qty }));
    if (items.length === 0) {
      toast.error('Please enter quantities to receive');
      return;
    }
    receiveMutation.mutate(items);
  };

  return (
    <Box>
      <PageHeader
        title={`PO ${order.po_number}`}
        breadcrumbs={[
          { label: 'Purchase Orders', path: '/admin/purchase-orders' },
          { label: order.po_number },
        ]}
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button startIcon={<BackIcon />} onClick={() => navigate(-1)}>Back</Button>
            <Button startIcon={<PrintIcon />} variant="outlined">Print</Button>
          </Box>
        }
      />

      {/* Status Stepper */}
      {!['cancelled', 'rejected'].includes(order.status) && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stepper activeStep={currentStep} alternativeLabel>
            {statusSteps.map((step) => (
              <Step key={step}>
                <StepLabel>{step.replace('_', ' ').toUpperCase()}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Order Details</Typography>
              <StatusChip status={order.status} label={order.status.replace('_', ' ')} />
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">PO Date</Typography>
                <Typography>{formatDate(order.po_date)}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Expected Date</Typography>
                <Typography>{order.expected_date ? formatDate(order.expected_date) : '-'}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Payment Status</Typography>
                <Chip label={order.payment_status} size="small" color={order.payment_status === 'completed' ? 'success' : 'warning'} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Items</Typography>
                <Typography>{order.items_count}</Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Order Items */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Items</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="center">Ordered</TableCell>
                    <TableCell align="center">Received</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items?.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Typography fontWeight={500}>{item.product_name}</Typography>
                        <Typography variant="caption" color="text.secondary">SKU: {item.product_sku}</Typography>
                      </TableCell>
                      <TableCell align="center">{item.quantity_ordered}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={item.quantity_received}
                          size="small"
                          color={item.quantity_received >= item.quantity_ordered ? 'success' : 'warning'}
                        />
                      </TableCell>
                      <TableCell align="right">{formatCurrency(parseFloat(item.unit_price))}</TableCell>
                      <TableCell align="right">{formatCurrency(parseFloat(item.total))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ textAlign: 'right' }}>
              <Typography>Subtotal: {formatCurrency(parseFloat(order.subtotal))}</Typography>
              <Typography>Tax: {formatCurrency(parseFloat(order.tax_amount))}</Typography>
              <Typography>Shipping: {formatCurrency(parseFloat(order.shipping_amount || '0'))}</Typography>
              <Typography variant="h6" sx={{ mt: 1 }}>Total: {formatCurrency(parseFloat(order.total_amount))}</Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Supplier</Typography>
            <Typography fontWeight={500}>{order.supplier_name}</Typography>
            {order.supplier_contact && <Typography variant="body2">{order.supplier_contact}</Typography>}
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Warehouse</Typography>
            <Typography fontWeight={500}>{order.warehouse_name}</Typography>
            {order.warehouse_code && <Typography variant="body2">Code: {order.warehouse_code}</Typography>}
          </Paper>

          {/* Actions */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Actions</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {canSubmit && (
                <Button variant="contained" onClick={() => submitMutation.mutate(undefined)} disabled={submitMutation.loading}>
                  Submit for Approval
                </Button>
              )}
              {canApprove && (
                <>
                  <Button variant="contained" color="success" startIcon={<ApproveIcon />} onClick={() => approveMutation.mutate(undefined)} disabled={approveMutation.loading}>
                    Approve
                  </Button>
                  <Button variant="outlined" color="error" onClick={() => setRejectOpen(true)}>
                    Reject
                  </Button>
                </>
              )}
              {canSend && (
                <Button variant="contained" startIcon={<SendIcon />} onClick={() => sendMutation.mutate(undefined)} disabled={sendMutation.loading}>
                  Send to Supplier
                </Button>
              )}
              {canConfirm && (
                <Button variant="contained" onClick={() => confirmMutation.mutate(undefined)} disabled={confirmMutation.loading}>
                  Mark Confirmed
                </Button>
              )}
              {canReceive && (
                <Button variant="contained" color="info" startIcon={<ReceiveIcon />} onClick={() => {
                  const items: Record<number, number> = {};
                  order.items?.forEach((item: any) => { items[item.id] = 0; });
                  setReceiveItems(items);
                  setReceiveOpen(true);
                }}>
                  Receive Items
                </Button>
              )}
              {canComplete && (
                <Button variant="contained" color="success" onClick={() => completeMutation.mutate(undefined)} disabled={completeMutation.loading}>
                  Complete PO
                </Button>
              )}
              {canCancel && (
                <Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => setCancelOpen(true)}>
                  Cancel PO
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Receive Dialog */}
      <Dialog open={receiveOpen} onClose={() => setReceiveOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Receive Items</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="center">Ordered</TableCell>
                  <TableCell align="center">Already Received</TableCell>
                  <TableCell align="center">Receive Now</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {order.items?.map((item: any) => {
                  const remaining = item.quantity_ordered - item.quantity_received;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell align="center">{item.quantity_ordered}</TableCell>
                      <TableCell align="center">{item.quantity_received}</TableCell>
                      <TableCell align="center">
                        <TextField
                          type="number"
                          size="small"
                          value={receiveItems[item.id] || 0}
                          onChange={(e) => setReceiveItems(prev => ({ ...prev, [item.id]: Math.min(parseInt(e.target.value) || 0, remaining) }))}
                          inputProps={{ min: 0, max: remaining }}
                          sx={{ width: 80 }}
                        />
                        <Typography variant="caption" sx={{ ml: 1 }}>/ {remaining}</Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReceiveOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleReceive} disabled={receiveMutation.loading}>Receive</Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Purchase Order</DialogTitle>
        <DialogContent>
          <TextField fullWidth multiline rows={3} label="Reason" placeholder="Enter cancellation reason" sx={{ mt: 2 }} id="cancel-reason" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOpen(false)}>Back</Button>
          <Button color="error" variant="contained" onClick={() => {
            const reason = (document.getElementById('cancel-reason') as HTMLTextAreaElement)?.value;
            cancelMutation.mutate(reason || 'Cancelled');
          }} disabled={cancelMutation.loading}>
            Cancel PO
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Purchase Order</DialogTitle>
        <DialogContent>
          <TextField fullWidth multiline rows={3} label="Rejection Reason" sx={{ mt: 2 }} id="reject-reason" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => {
            const reason = (document.getElementById('reject-reason') as HTMLTextAreaElement)?.value;
            rejectMutation.mutate(reason || 'Rejected');
          }} disabled={rejectMutation.loading}>
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PurchaseOrderDetailPage;
