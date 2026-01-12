import React, { useState, useCallback } from 'react';
import { Box, TextField, InputAdornment, Chip, Grid, Tabs, Tab } from '@mui/material';
import { Search as SearchIcon, CheckCircle as DeliveredIcon, Cancel as FailedIcon, History as HistoryIcon, Star as RatingIcon } from '@mui/icons-material';
import { PageHeader, DataTable, StatusChip, StatsCard } from '../../components';
import { usePaginatedApi, useApiQuery } from '../../hooks';
import { deliveryApi } from '../../api';
import { DeliveryAssignment, DeliveryStatus } from '../../types';
import { formatCurrency } from '../../utils';

const statusOptions: { value: DeliveryStatus; label: string; color: 'success' | 'error' | 'warning' | 'info' | 'default' }[] = [
  { value: 'delivered', label: 'Delivered', color: 'success' },
  { value: 'failed', label: 'Failed', color: 'error' },
  { value: 'returned', label: 'Returned', color: 'warning' },
  { value: 'cancelled', label: 'Cancelled', color: 'default' },
];

const statusTabs = [
  { value: 'delivered,failed,returned,cancelled', label: 'All' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed', label: 'Failed' },
  { value: 'returned,cancelled', label: 'Others' },
];

const DeliveryHistoryPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('delivered,failed,returned,cancelled');

  const { data: stats } = useApiQuery(() => deliveryApi.agents.stats(), []);

  const { data: deliveries, totalCount, loading, page, pageSize, setPage, setPageSize, updateParams } = usePaginatedApi(
    (params) => deliveryApi.deliveries.myDeliveries({ ...params, status: statusFilter }),
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

  const getStatusInfo = (status: DeliveryStatus) => {
    return statusOptions.find(s => s.value === status) || { label: status, color: 'default' as const };
  };

  const columns = [
    {
      id: 'order_number', label: 'Order', minWidth: 140,
      format: (val: string) => <Box sx={{ fontWeight: 600 }}>{val}</Box>,
    },
    {
      id: 'delivery_contact_name', label: 'Customer', minWidth: 150,
      format: (val: string, row: DeliveryAssignment) => (
        <Box>
          <Box>{val}</Box>
          <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{row.delivery_contact_phone}</Box>
        </Box>
      ),
    },
    {
      id: 'delivery_address', label: 'Area', minWidth: 120,
      format: (val: Record<string, unknown>) => (val as any)?.city || '-',
    },
    {
      id: 'cod_amount', label: 'COD', minWidth: 100, align: 'right' as const,
      format: (val: string, row: DeliveryAssignment) => (
        parseFloat(val) > 0 ? (
          <Chip
            label={formatCurrency(parseFloat(val))}
            size="small"
            color={row.cod_collected ? 'success' : 'error'}
            variant="outlined"
          />
        ) : '-'
      ),
    },
    {
      id: 'status', label: 'Status', minWidth: 100,
      format: (val: DeliveryStatus) => {
        const info = getStatusInfo(val);
        return <StatusChip status={val} label={info.label} color={info.color} />;
      },
    },
    {
      id: 'actual_delivery_time', label: 'Completed', minWidth: 120,
      format: (val: string) => val ? new Date(val).toLocaleString() : '-',
    },
    {
      id: 'delivery_attempts', label: 'Attempts', minWidth: 80, align: 'center' as const,
      format: (val: number) => <Chip label={val} size="small" variant="outlined" />,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Delivery History"
        subtitle="View your completed deliveries"
        breadcrumbs={[{ label: 'Delivery', path: '/delivery' }, { label: 'History' }]}
      />

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Deliveries"
            value={stats?.total_deliveries || 0}
            icon={<HistoryIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Successful"
            value={stats?.successful_deliveries || 0}
            icon={<DeliveredIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Failed"
            value={stats?.failed_deliveries || 0}
            icon={<FailedIcon />}
            color="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Rating"
            value={parseFloat(stats?.rating || '0').toFixed(1)}
            icon={<RatingIcon />}
            color="warning"
          />
        </Grid>
      </Grid>

      <Tabs value={statusTab} onChange={handleTabChange} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        {statusTabs.map((tab, index) => <Tab key={index} label={tab.label} />)}
      </Tabs>

      <Box sx={{ mb: 3 }}>
        <TextField
          placeholder="Search order number..."
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
        data={deliveries}
        loading={loading}
        totalCount={totalCount}
        page={page}
        rowsPerPage={pageSize}
        onPageChange={setPage}
        onRowsPerPageChange={setPageSize}
        emptyTitle="No delivery history"
        emptyDescription="Completed deliveries will appear here"
      />
    </Box>
  );
};

export default DeliveryHistoryPage;
