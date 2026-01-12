import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Alert, Typography, Tabs, Tab, Chip } from '@mui/material';
import { Search as SearchIcon, Visibility as ViewIcon, FilterList as FilterIcon, LocalShipping as ShipIcon, Cancel as CancelIcon, Check as ConfirmIcon, Inventory as PackIcon } from '@mui/icons-material';
import { PageHeader, DataTable, ConfirmDialog, StatusChip } from '../../../components';
import { usePaginatedApi, useMutation, useToast } from '../../../hooks';
import { salesOrdersApi } from '../../../api';
import { SalesOrder, SalesOrderStatus } from '../../../types';

const statusTabs: { value: SalesOrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'packed', label: 'Packed' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const SalesOrdersListPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [statusTab, setStatusTab] = useState<SalesOrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [actionDialog, setActionDialog] = useState<{ order: SalesOrder; action: string } | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const { data: orders, totalCount, loading, page, pageSize, setPage, setPageSize, updateParams, refetch } = usePaginatedApi(
    (params) => salesOrdersApi.list(params),
    { search, status: statusTab !== 'all' ? statusTab : undefined, ordering: '-created_at' }
  );

  const confirmMutation = useMutation((id: number) => salesOrdersApi.confirm(id), {
    onSuccess: () => { toast.success('Order confirmed'); setActionDialog(null); refetch(); },
    onError: (err) => toast.error(err),
  });

  const processMutation = useMutation((id: number) => salesOrdersApi.process(id), {
    onSuccess: () => { toast.success('Order processing'); setActionDialog(null); refetch(); },
    onError: (err) => toast.error(err),
  });

  const packMutation = useMutation((id: number) => salesOrdersApi.pack(id), {
    onSuccess: () => { toast.success('Order packed'); setActionDialog(null); refetch(); },
    onError: (err) => toast.error(err),
  });

  const readyMutation = useMutation((id: number) => salesOrdersApi.readyForPickup(id), {
    onSuccess: () => { toast.success('Ready for pickup'); setActionDialog(null); refetch(); },
    onError: (err) => toast.error(err),
  });

  const cancelMutation = useMutation((data: { id: number; reason: string }) => salesOrdersApi.cancel(data.id, data.reason), {
    onSuccess: () => { toast.success('Order cancelled'); setActionDialog(null); setCancelReason(''); refetch(); },
    onError: (err) => toast.error(err),
  });

  const handleTabChange = (_: any, newValue: SalesOrderStatus | 'all') => {
    setStatusTab(newValue);
    updateParams({ status: newValue !== 'all' ? newValue : undefined });
  };

  const handleSearch = () => {
    const params: any = { search };
    if (dateFrom) params.created_at_after = dateFrom;
    if (dateTo) params.created_at_before = dateTo;
    updateParams(params);
  };

  const handleAction = async () => {
    if (!actionDialog) return;
    const { order, action } = actionDialog;
    switch (action) {
      case 'confirm': await confirmMutation.mutate(order.id); break;
      case 'process': await processMutation.mutate(order.id); break;
      case 'pack': await packMutation.mutate(order.id); break;
      case 'ready': await readyMutation.mutate(order.id); break;
      case 'cancel': await cancelMutation.mutate({ id: order.id, reason: cancelReason }); break;
    }
  };

  const getNextAction = (status: SalesOrderStatus): { action: string; label: string; icon: React.ReactNode; color: 'success' | 'primary' | 'warning' } | null => {
    switch (status) {
      case 'pending': return { action: 'confirm', label: 'Confirm', icon: <ConfirmIcon fontSize="small" />, color: 'success' };
      case 'confirmed': return { action: 'process', label: 'Process', icon: <PackIcon fontSize="small" />, color: 'primary' };
      case 'processing': return { action: 'pack', label: 'Pack', icon: <PackIcon fontSize="small" />, color: 'primary' };
      case 'packed': return { action: 'ready', label: 'Ready for Pickup', icon: <ShipIcon fontSize="small" />, color: 'warning' };
      default: return null;
    }
  };

  const formatCurrency = (amount: number | string) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(amount));

  const columns = [
    { id: 'order_number', label: 'Order #', minWidth: 130, format: (val: string) => <Typography variant="subtitle2" fontWeight={600}>{val}</Typography> },
    { id: 'customer_name', label: 'Customer', minWidth: 150, format: (val: string, row: SalesOrder) => val || row.customer_email || `#${row.customer}` },
    { id: 'items_count', label: 'Items', minWidth: 70, align: 'center' as const },
    { id: 'total_amount', label: 'Total', minWidth: 120, format: (val: string) => formatCurrency(val) },
    { 
      id: 'payment_status', label: 'Payment', minWidth: 100,
      format: (val: string) => <Chip label={val?.replace(/_/g, ' ').toUpperCase() || 'PENDING'} size="small" color={val === 'completed' ? 'success' : val === 'failed' ? 'error' : 'warning'} variant="outlined" />
    },
    { id: 'status', label: 'Status', minWidth: 140, format: (val: SalesOrderStatus) => <StatusChip status={val} category="order" /> },
    { id: 'created_at', label: 'Date', minWidth: 100, format: (val: string) => new Date(val).toLocaleDateString() },
    {
      id: 'actions', label: 'Actions', minWidth: 140, align: 'right' as const,
      format: (_: any, row: SalesOrder) => {
        const nextAction = getNextAction(row.status);
        return (
          <Box>
            <Tooltip title="View Details"><IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/admin/sales-orders/${row.id}`); }}><ViewIcon fontSize="small" /></IconButton></Tooltip>
            {nextAction && (
              <Tooltip title={nextAction.label}>
                <IconButton size="small" color={nextAction.color} onClick={(e) => { e.stopPropagation(); setActionDialog({ order: row, action: nextAction.action }); }}>
                  {nextAction.icon}
                </IconButton>
              </Tooltip>
            )}
            {!['delivered', 'cancelled', 'refunded'].includes(row.status) && (
              <Tooltip title="Cancel"><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setActionDialog({ order: row, action: 'cancel' }); }}><CancelIcon fontSize="small" /></IconButton></Tooltip>
            )}
          </Box>
        );
      }
    },
  ];

  return (
    <Box>
      <PageHeader title="Sales Orders" subtitle={`${totalCount} total orders`} breadcrumbs={[{ label: 'Admin', path: '/admin' }, { label: 'Sales Orders' }]} />

      <Tabs value={statusTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        {statusTabs.map(tab => <Tab key={tab.value} value={tab.value} label={tab.label} />)}
      </Tabs>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField placeholder="Search by order # or customer..." size="small" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} sx={{ minWidth: 280 }} />
        <TextField type="date" size="small" label="From" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
        <TextField type="date" size="small" label="To" value={dateTo} onChange={(e) => setDateTo(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
        <Button variant="outlined" onClick={handleSearch} startIcon={<FilterIcon />}>Apply</Button>
      </Box>

      <DataTable columns={columns} data={orders} loading={loading} totalCount={totalCount} page={page} rowsPerPage={pageSize}
        onPageChange={setPage} onRowsPerPageChange={setPageSize} onRowClick={(row) => navigate(`/admin/sales-orders/${row.id}`)} emptyTitle="No orders found" />

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onClose={() => { setActionDialog(null); setCancelReason(''); }} maxWidth="xs" fullWidth>
        <DialogTitle>{actionDialog?.action === 'cancel' ? 'Cancel Order' : `${actionDialog?.action?.charAt(0).toUpperCase()}${actionDialog?.action?.slice(1)} Order`}</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to {actionDialog?.action} order "{actionDialog?.order?.order_number}"?</Typography>
          {actionDialog?.action === 'cancel' && (
            <TextField fullWidth multiline rows={3} label="Cancellation Reason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} sx={{ mt: 2 }} required />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setActionDialog(null); setCancelReason(''); }}>Close</Button>
          <Button variant="contained" color={actionDialog?.action === 'cancel' ? 'error' : 'primary'} onClick={handleAction}
            disabled={confirmMutation.loading || processMutation.loading || packMutation.loading || readyMutation.loading || cancelMutation.loading || (actionDialog?.action === 'cancel' && !cancelReason)}>
            {actionDialog?.action === 'cancel' ? 'Cancel Order' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalesOrdersListPage;
