import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, TextField, InputAdornment, IconButton, Tooltip, Chip, Tabs, Tab,
} from '@mui/material';
import {
  Search as SearchIcon, Visibility as ViewIcon, FilterList as FilterIcon,
  ShoppingBag as OrderIcon,
} from '@mui/icons-material';
import { PageHeader, DataTable, StatusChip } from '../../components';
import { usePaginatedApi } from '../../hooks';
import { salesOrdersApi } from '../../api';
import { SalesOrder, SOStatus } from '../../types';
import { formatCurrency } from '../../utils';

const statusOptions: { value: SOStatus; label: string; color: 'success' | 'error' | 'warning' | 'info' | 'default' }[] = [
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'confirmed', label: 'Confirmed', color: 'info' },
  { value: 'processing', label: 'Processing', color: 'info' },
  { value: 'packed', label: 'Packed', color: 'info' },
  { value: 'ready_for_pickup', label: 'Ready', color: 'success' },
  { value: 'out_for_delivery', label: 'Out for Delivery', color: 'info' },
  { value: 'delivered', label: 'Delivered', color: 'success' },
  { value: 'cancelled', label: 'Cancelled', color: 'error' },
];

const statusTabs = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'packed,ready_for_pickup', label: 'Ready' },
  { value: 'out_for_delivery', label: 'In Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const VendorSalesOrdersListPage: React.FC = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: orders, totalCount, loading, page, pageSize, setPage, setPageSize, updateParams } = usePaginatedApi(
    (params) => salesOrdersApi.list(params),
    { search, status: statusFilter || undefined }
  );

  const handleSearch = useCallback(() => {
    updateParams({ search, status: statusFilter || undefined });
  }, [search, statusFilter, updateParams]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setStatusTab(newValue);
    const newStatus = statusTabs[newValue].value;
    setStatusFilter(newStatus);
    updateParams({ status: newStatus || undefined });
  };

  const getStatusInfo = (status: SOStatus) => {
    return statusOptions.find(s => s.value === status) || { label: status, color: 'default' as const };
  };

  const columns = [
    {
      id: 'order_number', label: 'Order', minWidth: 140,
      format: (val: string) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <OrderIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          <Box sx={{ fontWeight: 600 }}>{val}</Box>
        </Box>
      ),
    },
    {
      id: 'customer_name', label: 'Customer', minWidth: 150,
      format: (val: string, row: SalesOrder) => (
        <Box>
          <Box>{val || 'Customer'}</Box>
          <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{row.customer_email}</Box>
        </Box>
      ),
    },
    {
      id: 'order_date', label: 'Date', minWidth: 100,
      format: (val: string) => new Date(val).toLocaleDateString(),
    },
    {
      id: 'items_count', label: 'Items', minWidth: 70, align: 'center' as const,
      format: (val: number) => <Chip label={val} size="small" variant="outlined" />,
    },
    {
      id: 'total_amount', label: 'Total', minWidth: 100, align: 'right' as const,
      format: (val: string) => formatCurrency(parseFloat(val)),
    },
    {
      id: 'payment_status', label: 'Payment', minWidth: 100,
      format: (val: string) => (
        <Chip
          label={val}
          size="small"
          color={val === 'completed' ? 'success' : val === 'pending' ? 'warning' : 'default'}
          variant="outlined"
        />
      ),
    },
    {
      id: 'status', label: 'Status', minWidth: 130,
      format: (val: SOStatus) => {
        const info = getStatusInfo(val);
        return <StatusChip status={val} label={info.label} color={info.color} />;
      },
    },
    {
      id: 'actions', label: '', minWidth: 60, align: 'right' as const,
      format: (_: any, row: SalesOrder) => (
        <Tooltip title="View Details">
          <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/vendor/sales-orders/${row.id}`); }}>
            <ViewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Sales Orders"
        subtitle={`${totalCount} orders`}
        breadcrumbs={[{ label: 'Vendor', path: '/vendor' }, { label: 'Sales Orders' }]}
      />

      <Tabs value={statusTab} onChange={handleTabChange} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }} variant="scrollable" scrollButtons="auto">
        {statusTabs.map((tab) => <Tab key={tab.value} label={tab.label} />)}
      </Tabs>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search orders..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          sx={{ minWidth: 250 }}
        />
        <Button variant="outlined" onClick={handleSearch} startIcon={<FilterIcon />}>Search</Button>
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
        onRowClick={(row) => navigate(`/vendor/sales-orders/${row.id}`)}
        emptyTitle="No orders found"
        emptyDescription="Orders will appear here when customers place them"
      />
    </Box>
  );
};

export default VendorSalesOrdersListPage;
