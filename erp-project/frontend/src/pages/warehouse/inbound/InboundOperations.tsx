import React, { useState, useCallback } from 'react';
import { Box, TextField, InputAdornment, Chip, Tabs, Tab, Grid } from '@mui/material';
import { Search as SearchIcon, LocalShipping as InboundIcon, Schedule as PendingIcon, CheckCircle as ReceivedIcon } from '@mui/icons-material';
import { PageHeader, DataTable, StatusChip, StatsCard } from '../../components';
import { usePaginatedApi } from '../../hooks';
import { purchaseOrdersApi } from '../../api';
import { PurchaseOrder, POStatus } from '../../types';
import { formatCurrency } from '../../utils';

const statusOptions: { value: POStatus; label: string; color: 'success' | 'error' | 'warning' | 'info' | 'default' }[] = [
  { value: 'confirmed', label: 'Confirmed', color: 'info' },
  { value: 'receiving', label: 'Receiving', color: 'warning' },
  { value: 'partial_received', label: 'Partial', color: 'warning' },
  { value: 'received', label: 'Received', color: 'success' },
  { value: 'complete', label: 'Complete', color: 'success' },
];

const statusTabs = [
  { value: 'confirmed,receiving,partial_received', label: 'Pending Receipt' },
  { value: 'received,complete', label: 'Received' },
];

const InboundOperationsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('confirmed,receiving,partial_received');

  const { data: orders, totalCount, loading, page, pageSize, setPage, setPageSize, updateParams } = usePaginatedApi(
    (params) => purchaseOrdersApi.list(params),
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

  const getStatusInfo = (status: POStatus) => {
    return statusOptions.find(s => s.value === status) || { label: status, color: 'default' as const };
  };

  // Calculate stats from current data
  const pendingCount = orders.filter(o => ['confirmed', 'receiving', 'partial_received'].includes(o.status)).length;
  const receivedCount = orders.filter(o => ['received', 'complete'].includes(o.status)).length;

  const columns = [
    {
      id: 'po_number', label: 'PO Number', minWidth: 140,
      format: (val: string) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InboundIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          <Box sx={{ fontWeight: 600 }}>{val}</Box>
        </Box>
      ),
    },
    {
      id: 'supplier_name', label: 'Supplier', minWidth: 150,
    },
    {
      id: 'po_date', label: 'PO Date', minWidth: 100,
      format: (val: string) => new Date(val).toLocaleDateString(),
    },
    {
      id: 'expected_date', label: 'Expected', minWidth: 100,
      format: (val: string) => val ? new Date(val).toLocaleDateString() : '-',
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
      id: 'status', label: 'Status', minWidth: 120,
      format: (val: POStatus) => {
        const info = getStatusInfo(val);
        return <StatusChip status={val} label={info.label} color={info.color} />;
      },
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Inbound Operations"
        subtitle="Manage incoming purchase orders and receipts"
        breadcrumbs={[{ label: 'Warehouse', path: '/warehouse' }, { label: 'Inbound' }]}
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="Pending Receipt"
            value={pendingCount}
            icon={<PendingIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="Received Today"
            value={receivedCount}
            icon={<ReceivedIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatsCard
            title="Total Orders"
            value={totalCount}
            icon={<InboundIcon />}
            color="primary"
          />
        </Grid>
      </Grid>

      <Tabs value={statusTab} onChange={handleTabChange} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        {statusTabs.map((tab, index) => <Tab key={index} label={tab.label} />)}
      </Tabs>

      <Box sx={{ mb: 3 }}>
        <TextField
          placeholder="Search PO number, supplier..."
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
        emptyTitle="No inbound orders"
        emptyDescription="Purchase orders ready for receipt will appear here"
      />
    </Box>
  );
};

export default InboundOperationsPage;
