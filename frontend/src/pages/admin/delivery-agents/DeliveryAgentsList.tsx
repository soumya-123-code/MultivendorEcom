import React, { useState, useCallback } from 'react';
import {
  Box, Button, TextField, InputAdornment, MenuItem, Select, FormControl,
  InputLabel, IconButton, Tooltip, Chip, Avatar, Tabs, Tab,
} from '@mui/material';
import {
  Search as SearchIcon, Edit as EditIcon, CheckCircle as ApproveIcon,
  Block as SuspendIcon, FilterList as FilterIcon, LocalShipping as DeliveryIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { PageHeader, DataTable, ConfirmDialog, StatusChip } from '../../components';
import { usePaginatedApi, useMutation, useToast } from '../../hooks';
import { deliveryApi } from '../../api';
import { DeliveryAgent, DeliveryAgentStatus, VehicleType } from '../../types';

const statusOptions: { value: DeliveryAgentStatus; label: string; color: 'success' | 'error' | 'warning' | 'info' | 'default' }[] = [
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'approved', label: 'Approved', color: 'info' },
  { value: 'active', label: 'Active', color: 'success' },
  { value: 'inactive', label: 'Inactive', color: 'default' },
  { value: 'suspended', label: 'Suspended', color: 'error' },
];

const vehicleOptions: { value: VehicleType; label: string }[] = [
  { value: 'bike', label: 'Bike' },
  { value: 'scooter', label: 'Scooter' },
  { value: 'bicycle', label: 'Bicycle' },
  { value: 'van', label: 'Van' },
  { value: 'car', label: 'Car' },
];

const statusTabs = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

const DeliveryAgentsListPage: React.FC = () => {
  const toast = useToast();

  // Filters
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [vehicleFilter, setVehicleFilter] = useState<VehicleType | ''>('');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('');

  // Action state
  const [actionConfirm, setActionConfirm] = useState<{ agent: DeliveryAgent; action: string } | null>(null);

  // API hooks
  const { data: agents, totalCount, loading, page, pageSize, setPage, setPageSize, updateParams, refetch } = usePaginatedApi(
    (params) => deliveryApi.agents.list(params),
    {
      search,
      status: statusFilter || undefined,
      vehicle_type: vehicleFilter || undefined,
      is_available: availabilityFilter ? availabilityFilter === 'available' : undefined,
    }
  );

  const approveMutation = useMutation((id: number) => deliveryApi.agents.approve(id), {
    onSuccess: () => { toast.success('Agent approved'); setActionConfirm(null); refetch(); },
    onError: (err) => toast.error(err),
  });

  const suspendMutation = useMutation((id: number) => deliveryApi.agents.suspend(id), {
    onSuccess: () => { toast.success('Agent suspended'); setActionConfirm(null); refetch(); },
    onError: (err) => toast.error(err),
  });

  const activateMutation = useMutation((id: number) => deliveryApi.agents.activate(id), {
    onSuccess: () => { toast.success('Agent activated'); setActionConfirm(null); refetch(); },
    onError: (err) => toast.error(err),
  });

  const handleSearch = useCallback(() => {
    updateParams({
      search,
      status: statusFilter || undefined,
      vehicle_type: vehicleFilter || undefined,
      is_available: availabilityFilter ? availabilityFilter === 'available' : undefined,
    });
  }, [search, statusFilter, vehicleFilter, availabilityFilter, updateParams]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setStatusTab(newValue);
    const newStatus = statusTabs[newValue].value;
    setStatusFilter(newStatus);
    updateParams({ status: newStatus || undefined });
  };

  const handleAction = () => {
    if (!actionConfirm) return;
    const { agent, action } = actionConfirm;
    switch (action) {
      case 'approve': approveMutation.mutate(agent.id); break;
      case 'suspend': suspendMutation.mutate(agent.id); break;
      case 'activate': activateMutation.mutate(agent.id); break;
    }
  };

  const getStatusInfo = (status: DeliveryAgentStatus) => {
    return statusOptions.find(s => s.value === status) || { label: status, color: 'default' as const };
  };

  const columns = [
    {
      id: 'user', label: 'Agent', minWidth: 200,
      format: (_: any, row: DeliveryAgent) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <DeliveryIcon />
          </Avatar>
          <Box>
            <Box sx={{ fontWeight: 600 }}>
              {row.user_details ? `${row.user_details.first_name} ${row.user_details.last_name}`.trim() : `Agent #${row.id}`}
            </Box>
            <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              {row.user_details?.email || '-'}
            </Box>
          </Box>
        </Box>
      ),
    },
    {
      id: 'phone', label: 'Phone', minWidth: 120,
      format: (_: any, row: DeliveryAgent) => row.user_details?.phone || '-',
    },
    {
      id: 'vehicle_type', label: 'Vehicle', minWidth: 100,
      format: (val: VehicleType) => val ? (
        <Chip label={vehicleOptions.find(v => v.value === val)?.label || val} size="small" variant="outlined" />
      ) : '-',
    },
    {
      id: 'city', label: 'Location', minWidth: 120,
      format: (val: string, row: DeliveryAgent) => val ? `${val}, ${row.state}` : '-',
    },
    {
      id: 'is_available', label: 'Available', minWidth: 100, align: 'center' as const,
      format: (val: boolean) => (
        <Chip
          label={val ? 'Online' : 'Offline'}
          size="small"
          color={val ? 'success' : 'default'}
        />
      ),
    },
    {
      id: 'rating', label: 'Rating', minWidth: 100,
      format: (val: string, row: DeliveryAgent) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <StarIcon sx={{ color: 'warning.main', fontSize: 18 }} />
          <span>{parseFloat(val).toFixed(1)}</span>
          <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
            ({row.total_deliveries})
          </Box>
        </Box>
      ),
    },
    {
      id: 'status', label: 'Status', minWidth: 100,
      format: (val: DeliveryAgentStatus) => {
        const info = getStatusInfo(val);
        return <StatusChip status={val} label={info.label} color={info.color} />;
      },
    },
    {
      id: 'actions', label: 'Actions', minWidth: 120, align: 'right' as const,
      format: (_: any, row: DeliveryAgent) => (
        <Box>
          {row.status === 'pending' && (
            <Tooltip title="Approve">
              <IconButton
                size="small"
                color="success"
                onClick={(e) => { e.stopPropagation(); setActionConfirm({ agent: row, action: 'approve' }); }}
              >
                <ApproveIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {row.status === 'active' && (
            <Tooltip title="Suspend">
              <IconButton
                size="small"
                color="error"
                onClick={(e) => { e.stopPropagation(); setActionConfirm({ agent: row, action: 'suspend' }); }}
              >
                <SuspendIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {(row.status === 'suspended' || row.status === 'inactive' || row.status === 'approved') && (
            <Tooltip title="Activate">
              <IconButton
                size="small"
                color="success"
                onClick={(e) => { e.stopPropagation(); setActionConfirm({ agent: row, action: 'activate' }); }}
              >
                <ApproveIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Delivery Agents"
        subtitle={`${totalCount} total agents`}
        breadcrumbs={[{ label: 'Admin', path: '/admin' }, { label: 'Delivery Agents' }]}
      />

      {/* Status Tabs */}
      <Tabs
        value={statusTab}
        onChange={handleTabChange}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        variant="scrollable"
        scrollButtons="auto"
      >
        {statusTabs.map((tab) => (
          <Tab key={tab.value} label={tab.label} />
        ))}
      </Tabs>

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search agents..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          sx={{ minWidth: 250 }}
        />
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Vehicle</InputLabel>
          <Select value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value as VehicleType)} label="Vehicle">
            <MenuItem value="">All</MenuItem>
            {vehicleOptions.map(v => <MenuItem key={v.value} value={v.value}>{v.label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Availability</InputLabel>
          <Select value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value)} label="Availability">
            <MenuItem value="">All</MenuItem>
            <MenuItem value="available">Online</MenuItem>
            <MenuItem value="unavailable">Offline</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" onClick={handleSearch} startIcon={<FilterIcon />}>Apply</Button>
      </Box>

      <DataTable
        columns={columns}
        data={agents}
        loading={loading}
        totalCount={totalCount}
        page={page}
        rowsPerPage={pageSize}
        onPageChange={setPage}
        onRowsPerPageChange={setPageSize}
        emptyTitle="No delivery agents found"
        emptyDescription="Try adjusting your search or filters"
      />

      {/* Action Confirmation */}
      <ConfirmDialog
        open={!!actionConfirm}
        title={`${actionConfirm?.action === 'approve' ? 'Approve' : actionConfirm?.action === 'suspend' ? 'Suspend' : 'Activate'} Agent`}
        message={`Are you sure you want to ${actionConfirm?.action} this delivery agent?`}
        confirmText={actionConfirm?.action === 'approve' ? 'Approve' : actionConfirm?.action === 'suspend' ? 'Suspend' : 'Activate'}
        confirmColor={actionConfirm?.action === 'suspend' ? 'error' : 'success'}
        loading={approveMutation.loading || suspendMutation.loading || activateMutation.loading}
        onConfirm={handleAction}
        onCancel={() => setActionConfirm(null)}
      />
    </Box>
  );
};

export default DeliveryAgentsListPage;
