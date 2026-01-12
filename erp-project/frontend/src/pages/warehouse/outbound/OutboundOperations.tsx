import React, { useState, useCallback } from 'react';
import { Box, TextField, InputAdornment, Chip, Tabs, Tab, Grid, IconButton, Tooltip } from '@mui/material';
import { Search as SearchIcon, LocalShipping as OutboundIcon, Schedule as PendingIcon, CheckCircle as ShippedIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { PageHeader, DataTable, StatusChip, StatsCard } from '../../components';
import { usePaginatedApi } from '../../hooks';
import { salesOrdersApi } from '../../api';
import { SalesOrder, SOStatus } from '../../types';
import { formatCurrency } from '../../utils';

const statusOptions: { value: SOStatus; label: string; color: 'success' | 'error' | 'warning' | 'info' | 'default' }[] = [
  { value: 'processing', label: 'Processing', color: 'info' },
  { value: 'packed', label: 'Packed', color: 'info' },
  { value: 'ready_for_pickup', label: 'Ready', color: 'success' },
  { value: 'out_for_delivery', label: 'Shipped', color: 'success' },
];

const statusTabs = [
  { value: 'processing', label: 'To Process' },
  { value: 'packed', label: 'Packed' },
  { value: 'ready_for_pickup', label: 'Ready for Pickup' },
  { value: 'out_for_delivery', label: 'Shipped' },
];

const OutboundOperationsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('processing');

  const { data: orders, totalCount, loading, page, pageSize, setPage, setPageSize, updateParams } = usePaginatedApi(
    (params) => salesOrdersApi.list(params),
    { search, status: statusFilter }
  );

  const handleSearch = useCallback(() => {
    updateParams({ search, status: statusFilter });
  }, [search, statusFilter, updateParams]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setStatusTab(newValue);
    const newStatus = statusTabs[newValue].value;
    setStatusFilter(newStatus);
    updateParams({ status: newStatus });
  };

  const getStatusInfo = (status: SOStatus) => {
    return statusOptions.find(s => s.value === status) || { label: status, color: 'default' as const };
  };

  const columns = [
    {
      id: 'order_number', label: 'Order', minWidth: 140,
      format: (val: string) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <OutboundIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          <Box sx={{ fontWeight: 600 }}>{val}</Box>
        </Box>
      ),
    },
    {
      id: 'customer_name', label: 'Customer', minWidth: 150,
      format: (val: string) => val || 'Customer',
    },
    {
      id: 'order_date', label: 'Order Date', minWidth: 100,
      format: (val: string) => new Date(val).toLocaleDateString(),
    },
    {
      id: 'items_count', label: 'Items', minWidth: 70, align: 'center' as const,
      format: (val: number) => <Chip label={val} size="small" variant="outlined" />,
    },
    {
      id: 'total_amount', label: 'Amount', minWidth: 100, align: 'right' as const,
      format: (val: string) => formatCurrency(parseFloat(val)),
    },
    {
      id: 'payment_method', label: 'Payment', minWidth: 80,
      format: (val: string) => (
        <Chip 
          label={val === 'cod' ? 'COD' : 'Prepaid'} 
          size="small" 
          color={val === 'cod' ? 'warning' : 'success'} 
          variant="outlined" 
        />
      ),
    },
    {
      id: 'status', label: 'Status', minWidth: 120,
      format: (val: SOStatus) => {
        const info = getStatusInfo(val);
        return <StatusChip status={val} label={info.label} color={info.color} />;
      },
    },
    {
      id: 'actions', label: '', minWidth: 60, align: 'right' as const,
      format: (_: any, row: SalesOrder) => (
        <Tooltip title="View Details">
          <IconButton size="small">
            <ViewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Outbound Operations"
        subtitle="Process and ship customer orders"
        breadcrumbs={[{ label: 'Warehouse', path: '/warehouse' }, { label: 'Outbound' }]}
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="To Process"
            value={orders.filter(o => o.status === 'processing').length}
            icon={<PendingIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Packed"
            value={orders.filter(o => o.status === 'packed').length}
            icon={<OutboundIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Ready for Pickup"
            value={orders.filter(o => o.status === 'ready_for_pickup').length}
            icon={<ShippedIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Orders"
            value={totalCount}
            icon={<OutboundIcon />}
            color="primary"
          />
        </Grid>
      </Grid>

      <Tabs value={statusTab} onChange={handleTabChange} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        {statusTabs.map((tab, index) => <Tab key={index} label={tab.label} />)}
      </Tabs>

      <Box sx={{ mb: 3 }}>
        <TextField
          placeholder="Search order number, customer..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          sx={{ minWidth: 300 }}
        />
      </Box>

      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        totalCount={totalCount}
        page={page}
        rowsPerPage={pageSize}
        onPageChange={setPage}
        onRowsPerPageChange={setPageSize}
        emptyTitle="No outbound orders"
        emptyDescription="Orders ready for processing will appear here"
      />
    </Box>
  );
};

export default OutboundOperationsPage;
