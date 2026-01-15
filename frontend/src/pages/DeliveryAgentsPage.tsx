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
  Avatar,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  CheckCircle,
  Cancel,
  Block,
  PlayArrow,
  TwoWheeler,
  DirectionsCar,
  DirectionsBike,
  LocalShipping,
} from '@mui/icons-material';
import { deliveryAgentAPI } from '../utils/api';
import { PageHeader, StatusChip, ConfirmDialog, DetailDrawer, DetailSection, DetailItem } from '../components';

const VEHICLE_TYPES = [
  { value: 'bike', label: 'Bike', icon: <DirectionsBike /> },
  { value: 'scooter', label: 'Scooter', icon: <TwoWheeler /> },
  { value: 'car', label: 'Car', icon: <DirectionsCar /> },
  { value: 'van', label: 'Van', icon: <LocalShipping /> },
];

export default function DeliveryAgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [agentStats, setAgentStats] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [form, setForm] = useState({
    user_email: '',
    first_name: '',
    last_name: '',
    phone: '',
    vehicle_type: 'bike',
    vehicle_number: '',
    license_number: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await deliveryAgentAPI.getAll();
      setAgents(data.results || data.data || data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openForm = (agent?: any) => {
    if (agent) {
      setSelectedAgent(agent);
      setForm({
        user_email: agent.user?.email || '',
        first_name: agent.user?.first_name || agent.first_name || '',
        last_name: agent.user?.last_name || agent.last_name || '',
        phone: agent.phone || agent.phone_number || '',
        vehicle_type: agent.vehicle_type || 'bike',
        vehicle_number: agent.vehicle_number || '',
        license_number: agent.license_number || '',
      });
    } else {
      setSelectedAgent(null);
      setForm({
        user_email: '',
        first_name: '',
        last_name: '',
        phone: '',
        vehicle_type: 'bike',
        vehicle_number: '',
        license_number: '',
      });
    }
    setFormOpen(true);
  };

  const openDetail = async (agent: any) => {
    setSelectedAgent(agent);
    setDetailOpen(true);
    try {
      // Load agent stats if available
      const stats = await deliveryAgentAPI.getMyStats();
      setAgentStats(stats);
    } catch (err) {
      console.error('Failed to load agent stats');
    }
  };

  const handleSave = async () => {
    try {
      if (selectedAgent) {
        await deliveryAgentAPI.update(selectedAgent.id, form);
        setSuccess('Agent updated successfully');
      } else {
        await deliveryAgentAPI.create(form);
        setSuccess('Agent created successfully');
      }
      setFormOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await deliveryAgentAPI.approve(id);
      setSuccess('Agent approved successfully');
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReject = async () => {
    if (!selectedAgent) return;
    try {
      await deliveryAgentAPI.reject(selectedAgent.id);
      setSuccess('Agent rejected');
      setRejectOpen(false);
      setRejectReason('');
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSuspend = async (id: number) => {
    try {
      await deliveryAgentAPI.suspend(id);
      setSuccess('Agent suspended');
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await deliveryAgentAPI.activate(id);
      setSuccess('Agent activated');
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'suspended': return 'error';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getVehicleIcon = (type: string) => {
    const vehicle = VEHICLE_TYPES.find(v => v.value === type);
    return vehicle?.icon || <TwoWheeler />;
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'name',
      headerName: 'Agent',
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: '#06b6d4' }}>
            {params.row.user?.first_name?.[0] || params.row.user_name?.[0] || 'A'}
          </Avatar>
          <Box>
            <Typography fontWeight={600} fontSize={14}>
              {params.row.user?.first_name || ''} {params.row.user?.last_name || params.row.user_name || ''}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.user?.email || ''}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 130,
      valueGetter: (value, row) => row.phone || row.phone_number || '-',
    },
    {
      field: 'vehicle_type',
      headerName: 'Vehicle',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getVehicleIcon(params.value)}
          <Typography variant="body2" textTransform="capitalize">
            {params.value || '-'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value || 'pending'}
          color={getStatusColor(params.value) as any}
          size="small"
        />
      ),
    },
    {
      field: 'is_available',
      headerName: 'Available',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Yes' : 'No'}
          color={params.value ? 'success' : 'default'}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'total_deliveries',
      headerName: 'Deliveries',
      width: 100,
      renderCell: (params) => params.value || 0,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => openDetail(params.row)}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openForm(params.row)}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          {params.row.status === 'pending' && (
            <>
              <Tooltip title="Approve">
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => handleApprove(params.row.id)}
                >
                  <CheckCircle fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reject">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => {
                    setSelectedAgent(params.row);
                    setRejectOpen(true);
                  }}
                >
                  <Cancel fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
          {params.row.status === 'active' && (
            <Tooltip title="Suspend">
              <IconButton
                size="small"
                color="warning"
                onClick={() => handleSuspend(params.row.id)}
              >
                <Block fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {params.row.status === 'suspended' && (
            <Tooltip title="Activate">
              <IconButton
                size="small"
                color="success"
                onClick={() => handleActivate(params.row.id)}
              >
                <PlayArrow fontSize="small" />
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
        title="Delivery Agents"
        subtitle="Manage delivery agents and their assignments"
        actionLabel="Add Agent"
        onAction={() => openForm()}
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
          rows={agents}
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

      {/* Form Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)', color: 'white' }}>
          {selectedAgent ? 'Edit Delivery Agent' : 'Add New Delivery Agent'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Email"
              type="email"
              value={form.user_email}
              onChange={(e) => setForm({ ...form, user_email: e.target.value })}
              fullWidth
              required
              disabled={!!selectedAgent}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="First Name"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                fullWidth
              />
              <TextField
                label="Last Name"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                fullWidth
              />
            </Stack>
            <TextField
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              fullWidth
              required
            />
            <Stack direction="row" spacing={2}>
              <TextField
                select
                label="Vehicle Type"
                value={form.vehicle_type}
                onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}
                fullWidth
              >
                {VEHICLE_TYPES.map((v) => (
                  <MenuItem key={v.value} value={v.value}>
                    {v.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Vehicle Number"
                value={form.vehicle_number}
                onChange={(e) => setForm({ ...form, vehicle_number: e.target.value })}
                fullWidth
              />
            </Stack>
            <TextField
              label="License Number"
              value={form.license_number}
              onChange={(e) => setForm({ ...form, license_number: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {selectedAgent ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Drawer */}
      <DetailDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={`${selectedAgent?.user?.first_name || ''} ${selectedAgent?.user?.last_name || selectedAgent?.user_name || ''}`}
        subtitle={`Agent ID: ${selectedAgent?.id}`}
        width={500}
      >
        {selectedAgent && (
          <>
            <DetailSection title="Agent Information">
              <DetailItem label="Email" value={selectedAgent.user?.email} />
              <DetailItem label="Phone" value={selectedAgent.phone || selectedAgent.phone_number} />
              <DetailItem label="Status" value={selectedAgent.status} chip />
            </DetailSection>
            <DetailSection title="Vehicle Details">
              <DetailItem label="Vehicle Type" value={selectedAgent.vehicle_type} />
              <DetailItem label="Vehicle Number" value={selectedAgent.vehicle_number} />
              <DetailItem label="License Number" value={selectedAgent.license_number} />
            </DetailSection>
            <DetailSection title="Performance">
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Card sx={{ bgcolor: '#f0fdf4' }}>
                    <CardContent>
                      <Typography variant="h4" fontWeight={700} color="success.main">
                        {selectedAgent.total_deliveries || agentStats?.total_deliveries || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Deliveries
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Card sx={{ bgcolor: '#fef3c7' }}>
                    <CardContent>
                      <Typography variant="h4" fontWeight={700} color="warning.main">
                        {agentStats?.pending_deliveries || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pending
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </DetailSection>
            <DetailSection title="Availability">
              <DetailItem
                label="Currently Available"
                value={selectedAgent.is_available ? 'Yes' : 'No'}
                chip
              />
              <DetailItem
                label="Joined"
                value={
                  selectedAgent.created_at
                    ? new Date(selectedAgent.created_at).toLocaleDateString()
                    : '-'
                }
              />
            </DetailSection>
          </>
        )}
      </DetailDrawer>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Agent</DialogTitle>
        <DialogContent>
          <TextField
            label="Rejection Reason"
            multiline
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReject}>
            Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Agent"
        message="Are you sure you want to delete this agent?"
        confirmText="Delete"
        onConfirm={() => {}}
        onCancel={() => setDeleteOpen(false)}
      />
    </Box>
  );
}
