import React, { useState, useCallback } from 'react';
import { Box, Button, Card, CardContent, Typography, Chip, Grid, Divider, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { Check as AcceptIcon, Close as RejectIcon, LocalShipping as PickupIcon, DirectionsBike as DeliveryIcon, Phone as PhoneIcon, LocationOn as LocationIcon, AttachMoney as CODIcon } from '@mui/icons-material';
import { PageHeader, StatusChip, ConfirmDialog } from '../../components';
import { usePaginatedApi, useMutation, useToast } from '../../hooks';
import { deliveryApi } from '../../api';
import { DeliveryAssignment, DeliveryStatus } from '../../types';
import { formatCurrency } from '../../utils';

const statusOptions: { value: DeliveryStatus; label: string; color: 'success' | 'error' | 'warning' | 'info' | 'default' }[] = [
  { value: 'assigned', label: 'New', color: 'warning' },
  { value: 'accepted', label: 'Accepted', color: 'info' },
  { value: 'picked_up', label: 'Picked Up', color: 'info' },
  { value: 'in_transit', label: 'In Transit', color: 'info' },
  { value: 'out_for_delivery', label: 'Out for Delivery', color: 'success' },
];

const AssignedDeliveriesPage: React.FC = () => {
  const toast = useToast();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectingDelivery, setRejectingDelivery] = useState<DeliveryAssignment | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ delivery: DeliveryAssignment; action: string } | null>(null);

  const { data: deliveries, loading, refetch } = usePaginatedApi(
    (params) => deliveryApi.deliveries.myDeliveries({ ...params, status: 'assigned,accepted,picked_up,in_transit,out_for_delivery' }),
    {}
  );

  const acceptMutation = useMutation((id: number) => deliveryApi.deliveries.accept(id), {
    onSuccess: () => { toast.success('Delivery accepted'); refetch(); },
    onError: (err) => toast.error(err),
  });

  const rejectMutation = useMutation((data: { id: number; reason: string }) => deliveryApi.deliveries.reject(data.id, data.reason), {
    onSuccess: () => { toast.success('Delivery rejected'); setRejectOpen(false); refetch(); },
    onError: (err) => toast.error(err),
  });

  const pickupMutation = useMutation((id: number) => deliveryApi.deliveries.pickup(id), {
    onSuccess: () => { toast.success('Marked as picked up'); setConfirmAction(null); refetch(); },
    onError: (err) => toast.error(err),
  });

  const inTransitMutation = useMutation((id: number) => deliveryApi.deliveries.inTransit(id), {
    onSuccess: () => { toast.success('Marked as in transit'); setConfirmAction(null); refetch(); },
    onError: (err) => toast.error(err),
  });

  const outForDeliveryMutation = useMutation((id: number) => deliveryApi.deliveries.outForDelivery(id), {
    onSuccess: () => { toast.success('Marked as out for delivery'); setConfirmAction(null); refetch(); },
    onError: (err) => toast.error(err),
  });

  const handleReject = (delivery: DeliveryAssignment) => {
    setRejectingDelivery(delivery);
    setRejectReason('');
    setRejectOpen(true);
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    const { delivery, action } = confirmAction;
    switch (action) {
      case 'pickup': pickupMutation.mutate(delivery.id); break;
      case 'in_transit': inTransitMutation.mutate(delivery.id); break;
      case 'out_for_delivery': outForDeliveryMutation.mutate(delivery.id); break;
    }
  };

  const getStatusInfo = (status: DeliveryStatus) => {
    return statusOptions.find(s => s.value === status) || { label: status, color: 'default' as const };
  };

  const getNextAction = (status: DeliveryStatus) => {
    switch (status) {
      case 'assigned': return null; // Accept/Reject buttons shown
      case 'accepted': return { label: 'Mark Picked Up', action: 'pickup' };
      case 'picked_up': return { label: 'Start Transit', action: 'in_transit' };
      case 'in_transit': return { label: 'Out for Delivery', action: 'out_for_delivery' };
      case 'out_for_delivery': return { label: 'Complete Delivery', action: 'complete' };
      default: return null;
    }
  };

  const newDeliveries = deliveries.filter(d => d.status === 'assigned');
  const activeDeliveries = deliveries.filter(d => ['accepted', 'picked_up', 'in_transit', 'out_for_delivery'].includes(d.status));

  return (
    <Box>
      <PageHeader
        title="My Deliveries"
        subtitle={`${deliveries.length} active deliveries`}
        breadcrumbs={[{ label: 'Delivery', path: '/delivery' }, { label: 'Assigned' }]}
      />

      {/* New Assignments */}
      {newDeliveries.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip label={newDeliveries.length} color="warning" size="small" />
            New Assignments
          </Typography>
          <Grid container spacing={2}>
            {newDeliveries.map((delivery) => (
              <Grid item xs={12} md={6} key={delivery.id}>
                <Card sx={{ border: '2px solid', borderColor: 'warning.main' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">{delivery.order_number}</Typography>
                      <StatusChip status={delivery.status} label="New" color="warning" />
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <LocationIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {(delivery.delivery_address as any)?.city || 'Delivery Address'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">{delivery.delivery_contact_phone}</Typography>
                      </Box>
                      {parseFloat(delivery.cod_amount) > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <CODIcon fontSize="small" color="warning" />
                          <Typography variant="body2" color="warning.main" fontWeight={600}>
                            COD: {formatCurrency(parseFloat(delivery.cod_amount))}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<AcceptIcon />}
                        onClick={() => acceptMutation.mutate(delivery.id)}
                        disabled={acceptMutation.loading}
                        fullWidth
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<RejectIcon />}
                        onClick={() => handleReject(delivery)}
                        fullWidth
                      >
                        Reject
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Active Deliveries */}
      <Typography variant="h6" sx={{ mb: 2 }}>Active Deliveries</Typography>
      {activeDeliveries.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <DeliveryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">No active deliveries</Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {activeDeliveries.map((delivery) => {
            const statusInfo = getStatusInfo(delivery.status);
            const nextAction = getNextAction(delivery.status);
            
            return (
              <Grid item xs={12} md={6} lg={4} key={delivery.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6">{delivery.order_number}</Typography>
                      <StatusChip status={delivery.status} label={statusInfo.label} color={statusInfo.color} />
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" fontWeight={600}>{delivery.delivery_contact_name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">{delivery.delivery_contact_phone}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon fontSize="small" color="action" />
                        <Typography variant="body2" noWrap>
                          {(delivery.delivery_address as any)?.address_line1 || 'Address'}
                        </Typography>
                      </Box>
                    </Box>

                    {parseFloat(delivery.cod_amount) > 0 && (
                      <Chip
                        icon={<CODIcon />}
                        label={`COD: ${formatCurrency(parseFloat(delivery.cod_amount))}`}
                        color={delivery.cod_collected ? 'success' : 'warning'}
                        size="small"
                        sx={{ mb: 2 }}
                      />
                    )}

                    {nextAction && (
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => setConfirmAction({ delivery, action: nextAction.action })}
                      >
                        {nextAction.label}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Delivery</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please provide a reason for rejecting this delivery assignment.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g., Too far, Vehicle issue, etc."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => rejectingDelivery && rejectMutation.mutate({ id: rejectingDelivery.id, reason: rejectReason })}
            disabled={!rejectReason || rejectMutation.loading}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Confirmation */}
      <ConfirmDialog
        open={!!confirmAction}
        title="Confirm Action"
        message={`Are you sure you want to ${confirmAction?.action.replace('_', ' ')} this delivery?`}
        confirmText="Confirm"
        loading={pickupMutation.loading || inTransitMutation.loading || outForDeliveryMutation.loading}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />
    </Box>
  );
};

export default AssignedDeliveriesPage;
