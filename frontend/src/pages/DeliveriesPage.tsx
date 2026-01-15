import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  IconButton,
  Tooltip,
  Alert,
  Chip,
  Tab,
  Tabs,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Visibility,
  LocalShipping,
  CheckCircle,
  Cancel,
  PlayArrow,
  DirectionsCar,
  Done,
  History,
  SwapHoriz,
} from '@mui/icons-material';
import { deliveryAPI, deliveryAgentAPI } from '../utils/api';
import { PageHeader, StatusChip, ConfirmDialog, DetailDrawer, DetailSection, DetailItem, StatusLogsTimeline } from '../components';

const DELIVERY_STATUSES = [
  'assigned',
  'accepted',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
];

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [statusLogs, setStatusLogs] = useState<any[]>([]);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [newAgentId, setNewAgentId] = useState('');
  const [tabValue, setTabValue] = useState(0);

  const loadData = async () => {
    try {
      setLoading(true);
      const [deliveriesData, agentsData] = await Promise.all([
        deliveryAPI.getAll(),
        deliveryAgentAPI.getAvailable().catch(() => []),
      ]);
      setDeliveries(deliveriesData.results || deliveriesData.data || deliveriesData || []);
      setAgents(agentsData.results || agentsData.data || agentsData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadStatusLogs = async (id: number) => {
    try {
      const data = await deliveryAPI.getStatusLogs(id);
      setStatusLogs(data.results || data.data || data || []);
    } catch (err) {
      console.error('Failed to load status logs');
    }
  };

  const openDetail = (delivery: any) => {
    setSelectedDelivery(delivery);
    setDetailOpen(true);
    setTabValue(0);
    loadStatusLogs(delivery.id);
  };

  const handleAction = async () => {
    if (!selectedDelivery) return;
    try {
      switch (currentAction) {
        case 'accept':
          await deliveryAPI.accept(selectedDelivery.id);
          break;
        case 'reject':
          await deliveryAPI.reject(selectedDelivery.id, actionReason);
          break;
        case 'pickup':
          await deliveryAPI.pickup(selectedDelivery.id);
          break;
        case 'in_transit':
          await deliveryAPI.inTransit(selectedDelivery.id);
          break;
        case 'out_for_delivery':
          await deliveryAPI.outForDelivery(selectedDelivery.id);
          break;
        case 'complete':
          await deliveryAPI.complete(selectedDelivery.id, { delivery_otp: actionReason });
          break;
        case 'fail':
          await deliveryAPI.fail(selectedDelivery.id, actionReason);
          break;
      }
      setSuccess(`Action '${currentAction}' completed successfully`);
      setActionDialogOpen(false);
      setActionReason('');
      loadData();
      if (detailOpen) {
        loadStatusLogs(selectedDelivery.id);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReassign = async () => {
    if (!selectedDelivery || !newAgentId) return;
    try {
      await deliveryAPI.reassign(selectedDelivery.id, parseInt(newAgentId));
      setSuccess('Delivery reassigned successfully');
      setReassignDialogOpen(false);
      setNewAgentId('');
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openActionDialog = (delivery: any, action: string) => {
    setSelectedDelivery(delivery);
    setCurrentAction(action);
    setActionReason('');
    setActionDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'assigned': return 'info';
      case 'accepted': return 'info';
      case 'picked_up': return 'primary';
      case 'in_transit': return 'secondary';
      case 'out_for_delivery': return 'warning';
      case 'delivered': return 'success';
      case 'failed': return 'error';
      case 'rejected': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const getActiveStep = (status: string) => {
    const idx = DELIVERY_STATUSES.indexOf(status?.toLowerCase());
    return idx >= 0 ? idx : 0;
  };

  const getActionLabel = () => {
    switch (currentAction) {
      case 'reject': return 'Rejection Reason';
      case 'fail': return 'Failure Reason';
      case 'complete': return 'Delivery OTP';
      default: return 'Notes';
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'order_number',
      headerName: 'Order #',
      width: 140,
      renderCell: (params) => (
        <Typography fontWeight={600}>{params.value || params.row.sales_order?.order_number || '-'}</Typography>
      ),
    },
    {
      field: 'agent',
      headerName: 'Agent',
      width: 180,
      renderCell: (params) => params.row.agent_name || params.row.agent?.user?.first_name || '-',
    },
    {
      field: 'customer',
      headerName: 'Customer',
      width: 180,
      renderCell: (params) => params.row.customer_name || params.row.sales_order?.customer_name || '-',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.value?.replace(/_/g, ' ')}
          color={getStatusColor(params.value) as any}
          size="small"
          sx={{ textTransform: 'capitalize' }}
        />
      ),
    },
    {
      field: 'estimated_delivery',
      headerName: 'Est. Delivery',
      width: 130,
      renderCell: (params) =>
        params.value ? new Date(params.value).toLocaleDateString() : '-',
    },
    {
      field: 'created_at',
      headerName: 'Assigned',
      width: 120,
      renderCell: (params) =>
        params.value ? new Date(params.value).toLocaleDateString() : '-',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 250,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => openDetail(params.row)}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          {params.row.status === 'assigned' && (
            <>
              <Tooltip title="Accept">
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => openActionDialog(params.row, 'accept')}
                >
                  <CheckCircle fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reject">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => openActionDialog(params.row, 'reject')}
                >
                  <Cancel fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
          {params.row.status === 'accepted' && (
            <Tooltip title="Mark Picked Up">
              <IconButton
                size="small"
                color="primary"
                onClick={() => openActionDialog(params.row, 'pickup')}
              >
                <PlayArrow fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {params.row.status === 'picked_up' && (
            <Tooltip title="In Transit">
              <IconButton
                size="small"
                color="info"
                onClick={() => openActionDialog(params.row, 'in_transit')}
              >
                <DirectionsCar fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {params.row.status === 'in_transit' && (
            <Tooltip title="Out for Delivery">
              <IconButton
                size="small"
                color="warning"
                onClick={() => openActionDialog(params.row, 'out_for_delivery')}
              >
                <LocalShipping fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {params.row.status === 'out_for_delivery' && (
            <>
              <Tooltip title="Complete">
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => openActionDialog(params.row, 'complete')}
                >
                  <Done fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Failed">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => openActionDialog(params.row, 'fail')}
                >
                  <Cancel fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
          {!['delivered', 'failed', 'cancelled'].includes(params.row.status) && (
            <Tooltip title="Reassign">
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedDelivery(params.row);
                  setReassignDialogOpen(true);
                }}
              >
                <SwapHoriz fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Deliveries"
        subtitle="Track and manage delivery assignments"
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper sx={{ borderRadius: 3 }}>
        <DataGrid
          rows={deliveries}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          autoHeight
          sx={{
            border: 0,
            '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f8fafc' },
          }}
        />
      </Paper>

      {/* Detail Drawer */}
      <DetailDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={`Delivery #${selectedDelivery?.id}`}
        subtitle={selectedDelivery?.order_number || selectedDelivery?.sales_order?.order_number}
        width={600}
      >
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
          <Tab icon={<Visibility />} label="Details" iconPosition="start" />
          <Tab icon={<History />} label="Status History" iconPosition="start" />
        </Tabs>

        {tabValue === 0 && selectedDelivery && (
          <>
            <Box sx={{ mb: 3 }}>
              <Stepper activeStep={getActiveStep(selectedDelivery.status)} alternativeLabel>
                {DELIVERY_STATUSES.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label.replace(/_/g, ' ')}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
            <DetailSection title="Delivery Information">
              <DetailItem label="Status" value={selectedDelivery.status} chip />
              <DetailItem label="Order Number" value={selectedDelivery.order_number || selectedDelivery.sales_order?.order_number} />
              <DetailItem label="Assigned Date" value={selectedDelivery.created_at ? new Date(selectedDelivery.created_at).toLocaleString() : '-'} />
              <DetailItem label="Est. Delivery" value={selectedDelivery.estimated_delivery ? new Date(selectedDelivery.estimated_delivery).toLocaleDateString() : '-'} />
            </DetailSection>
            <DetailSection title="Agent">
              <DetailItem label="Name" value={selectedDelivery.agent_name || selectedDelivery.agent?.user?.first_name} />
              <DetailItem label="Phone" value={selectedDelivery.agent?.phone || selectedDelivery.agent_phone} />
            </DetailSection>
            <DetailSection title="Customer">
              <DetailItem label="Name" value={selectedDelivery.customer_name || selectedDelivery.sales_order?.customer_name} />
              <DetailItem label="Address" value={selectedDelivery.delivery_address || selectedDelivery.sales_order?.shipping_address} />
            </DetailSection>
            {selectedDelivery.delivery_proof && (
              <DetailSection title="Proof of Delivery">
                <DetailItem label="OTP Verified" value={selectedDelivery.delivery_proof.otp_verified ? 'Yes' : 'No'} />
                <DetailItem label="Notes" value={selectedDelivery.delivery_proof.notes} />
              </DetailSection>
            )}
          </>
        )}

        {tabValue === 1 && (
          <StatusLogsTimeline logs={statusLogs} title="Delivery Status History" />
        )}
      </DetailDrawer>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textTransform: 'capitalize' }}>
          {currentAction?.replace(/_/g, ' ')} Delivery
        </DialogTitle>
        <DialogContent>
          {['reject', 'fail', 'complete'].includes(currentAction) && (
            <TextField
              label={getActionLabel()}
              multiline={currentAction !== 'complete'}
              rows={currentAction !== 'complete' ? 3 : 1}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              fullWidth
              sx={{ mt: 2 }}
              required
            />
          )}
          {!['reject', 'fail', 'complete'].includes(currentAction) && (
            <Typography sx={{ mt: 2 }}>
              Are you sure you want to mark this delivery as "{currentAction?.replace(/_/g, ' ')}"?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAction}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reassign Dialog */}
      <Dialog open={reassignDialogOpen} onClose={() => setReassignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reassign Delivery</DialogTitle>
        <DialogContent>
          <TextField
            select
            label="New Agent"
            value={newAgentId}
            onChange={(e) => setNewAgentId(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          >
            {agents.map((agent) => (
              <MenuItem key={agent.id} value={agent.id}>
                {agent.user?.first_name || agent.user_name} - {agent.vehicle_type}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReassignDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleReassign} disabled={!newAgentId}>
            Reassign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
