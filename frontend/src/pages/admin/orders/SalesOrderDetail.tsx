import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Grid, Typography, Chip, Button, Divider, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, CircularProgress, Stepper,
  Step, StepLabel, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import {
  ArrowBack as BackIcon, Print as PrintIcon, LocalShipping as ShipIcon,
  Cancel as CancelIcon, CheckCircle as ConfirmIcon,
} from '@mui/icons-material';
import { PageHeader, StatusChip, ConfirmDialog } from '../../../components';
import { useApiQuery, useMutation, useToast } from '../../../hooks';
import { salesOrdersApi, deliveryApi } from '../../../api';
import { formatCurrency, formatDate } from '../../../utils';
import { SOStatus, DeliveryAgent } from '../../../types';

const statusSteps = ['pending', 'confirmed', 'processing', 'packed', 'ready_for_pickup', 'out_for_delivery', 'delivered'];

const SalesOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<number | ''>('');

  const { data: order, loading, refetch } = useApiQuery(
    () => salesOrdersApi.getById(Number(id)),
    [id]
  );

  const { data: agents } = useApiQuery(
    () => deliveryApi.agents.list({ status: 'active', is_available: true }),
    []
  );

  const confirmMutation = useMutation(() => salesOrdersApi.confirm(Number(id)), {
    onSuccess: () => { toast.success('Order confirmed'); refetch(); },
    onError: (err) => toast.error(err),
  });

  const processMutation = useMutation(() => salesOrdersApi.process(Number(id)), {
    onSuccess: () => { toast.success('Order is being processed'); refetch(); },
    onError: (err) => toast.error(err),
  });

  const packMutation = useMutation(() => salesOrdersApi.pack(Number(id)), {
    onSuccess: () => { toast.success('Order packed'); refetch(); },
    onError: (err) => toast.error(err),
  });

  const readyMutation = useMutation(() => salesOrdersApi.readyForPickup(Number(id)), {
    onSuccess: () => { toast.success('Order ready for pickup'); refetch(); },
    onError: (err) => toast.error(err),
  });

  const cancelMutation = useMutation((reason: string) => salesOrdersApi.cancel(Number(id), reason), {
    onSuccess: () => { toast.success('Order cancelled'); setCancelOpen(false); refetch(); },
    onError: (err) => toast.error(err),
  });

  const assignMutation = useMutation((agentId: number) => salesOrdersApi.assignDelivery(Number(id), agentId), {
    onSuccess: () => { toast.success('Delivery assigned'); setAssignOpen(false); refetch(); },
    onError: (err) => toast.error(err),
  });

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  if (!order) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color="error">Order not found</Typography>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>Go Back</Button>
      </Box>
    );
  }

  const currentStep = statusSteps.indexOf(order.status);
  const canConfirm = order.status === 'pending';
  const canProcess = order.status === 'confirmed';
  const canPack = order.status === 'processing';
  const canReady = order.status === 'packed';
  const canAssign = order.status === 'ready_for_pickup';
  const canCancel = ['pending', 'confirmed', 'processing'].includes(order.status);

  return (
    <Box>
      <PageHeader
        title={`Order ${order.order_number}`}
        breadcrumbs={[
          { label: 'Orders', path: '/admin/sales-orders' },
          { label: order.order_number },
        ]}
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button startIcon={<BackIcon />} onClick={() => navigate(-1)}>Back</Button>
            <Button startIcon={<PrintIcon />} variant="outlined">Print</Button>
          </Box>
        }
      />

      {/* Status Stepper */}
      {order.status !== 'cancelled' && (
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
        {/* Order Info */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Order Details</Typography>
              <StatusChip status={order.status} label={order.status.replace('_', ' ')} />
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Order Date</Typography>
                <Typography>{formatDate(order.order_date)}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Payment Method</Typography>
                <Typography>{order.payment_method?.toUpperCase()}</Typography>
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
                    <TableCell align="center">Qty</TableCell>
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
              <Typography>Shipping: {formatCurrency(parseFloat(order.shipping_amount))}</Typography>
              {parseFloat(order.discount_amount) > 0 && (
                <Typography color="error">Discount: -{formatCurrency(parseFloat(order.discount_amount))}</Typography>
              )}
              <Typography variant="h6" sx={{ mt: 1 }}>Total: {formatCurrency(parseFloat(order.total_amount))}</Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Customer */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Customer</Typography>
            <Typography fontWeight={500}>{order.customer_name || 'Guest'}</Typography>
            <Typography variant="body2" color="text.secondary">{order.customer_email}</Typography>
            <Typography variant="body2">{order.customer_phone}</Typography>
          </Paper>

          {/* Shipping Address */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Shipping Address</Typography>
            {order.shipping_address_snapshot ? (
              <>
                <Typography>{order.shipping_address_snapshot.full_name}</Typography>
                <Typography variant="body2">{order.shipping_address_snapshot.address_line1}</Typography>
                <Typography variant="body2">
                  {order.shipping_address_snapshot.city}, {order.shipping_address_snapshot.state}
                </Typography>
                <Typography variant="body2">{order.shipping_address_snapshot.pincode}</Typography>
              </>
            ) : (
              <Typography color="text.secondary">No address</Typography>
            )}
          </Paper>

          {/* Actions */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Actions</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {canConfirm && (
                <Button variant="contained" startIcon={<ConfirmIcon />} onClick={() => confirmMutation.mutate(undefined)} disabled={confirmMutation.loading}>
                  Confirm Order
                </Button>
              )}
              {canProcess && (
                <Button variant="contained" onClick={() => processMutation.mutate(undefined)} disabled={processMutation.loading}>
                  Start Processing
                </Button>
              )}
              {canPack && (
                <Button variant="contained" onClick={() => packMutation.mutate(undefined)} disabled={packMutation.loading}>
                  Mark Packed
                </Button>
              )}
              {canReady && (
                <Button variant="contained" onClick={() => readyMutation.mutate(undefined)} disabled={readyMutation.loading}>
                  Ready for Pickup
                </Button>
              )}
              {canAssign && (
                <Button variant="contained" color="info" startIcon={<ShipIcon />} onClick={() => setAssignOpen(true)}>
                  Assign Delivery
                </Button>
              )}
              {canCancel && (
                <Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => setCancelOpen(true)}>
                  Cancel Order
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Cancel Dialog */}
      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Order</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Cancellation Reason"
            placeholder="Enter reason for cancellation"
            sx={{ mt: 2 }}
            id="cancel-reason"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOpen(false)}>Back</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              const reason = (document.getElementById('cancel-reason') as HTMLTextAreaElement)?.value;
              cancelMutation.mutate(reason || 'Cancelled by admin');
            }}
            disabled={cancelMutation.loading}
          >
            Cancel Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Delivery Dialog */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Delivery Agent</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Agent</InputLabel>
            <Select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value as number)}
              label="Select Agent"
            >
              {(agents as any)?.results?.map((agent: DeliveryAgent) => (
                <MenuItem key={agent.id} value={agent.id}>
                  {agent.user_details?.first_name} {agent.user_details?.last_name} - {agent.vehicle_type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => selectedAgent && assignMutation.mutate(selectedAgent as number)}
            disabled={!selectedAgent || assignMutation.loading}
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalesOrderDetailPage;
