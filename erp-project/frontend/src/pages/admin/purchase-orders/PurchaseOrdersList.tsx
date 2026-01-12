import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, TextField, InputAdornment, MenuItem, Select, FormControl,
  InputLabel, IconButton, Tooltip, Chip, Tabs, Tab,
} from '@mui/material';
import {
  Add as AddIcon, Search as SearchIcon, Visibility as ViewIcon,
  FilterList as FilterIcon, ShoppingCart as POIcon,
} from '@mui/icons-material';
import { PageHeader, DataTable, StatusChip } from '../../components';
import { usePaginatedApi, useToast } from '../../hooks';
import { purchaseOrdersApi } from '../../api';
import { PurchaseOrder, POStatus } from '../../types';
import { formatCurrency } from '../../utils';

const statusOptions: { value: POStatus; label: string; color: 'success' | 'error' | 'warning' | 'info' | 'default' }[] = [
  { value: 'draft', label: 'Draft', color: 'default' },
  { value: 'pending_approval', label: 'Pending Approval', color: 'warning' },
  { value: 'approved', label: 'Approved', color: 'info' },
  { value: 'rejected', label: 'Rejected', color: 'error' },
  { value: 'sent', label: 'Sent', color: 'info' },
  { value: 'confirmed', label: 'Confirmed', color: 'success' },
  { value: 'receiving', label: 'Receiving', color: 'info' },
  { value: 'partial_received', label: 'Partial', color: 'warning' },
  { value: 'received', label: 'Received', color: 'success' },
  { value: 'complete', label: 'Complete', color: 'success' },
  { value: 'cancelled', label: 'Cancelled', color: 'error' },
];

const statusTabs = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'sent', label: 'Sent' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'receiving,partial_received', label: 'Receiving' },
  { value: 'received,complete', label: 'Complete' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PurchaseOrdersListPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // Filters
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // API hooks
  const { data: orders, totalCount, loading, page, pageSize, setPage, setPageSize, updateParams, refetch } = usePaginatedApi(
    (params) => purchaseOrdersApi.list(params),
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

  const getStatusInfo = (status: POStatus) => {
    return statusOptions.find(s => s.value === status) || { label: status, color: 'default' as const };
  };

  const columns = [
    {
      id: 'po_number', label: 'PO Number', minWidth: 140,
      format: (_: any, row: PurchaseOrder) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <POIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          <Box sx={{ fontWeight: 600 }}>{row.po_number}</Box>
        </Box>
      ),
    },
    {
      id: 'supplier_name', label: 'Supplier', minWidth: 150,
      format: (val: string) => val || '-',
    },
    {
      id: 'warehouse_name', label: 'Warehouse', minWidth: 150,
      format: (val: string) => val || '-',
    },
    {
      id: 'po_date', label: 'Date', minWidth: 100,
      format: (val: string) => new Date(val).toLocaleDateString(),
    },
    {
      id: 'total_amount', label: 'Amount', minWidth: 120, align: 'right' as const,
      format: (val: string) => formatCurrency(parseFloat(val)),
    },
    {
      id: 'items_count', label: 'Items', minWidth: 80, align: 'center' as const,
      format: (val: number) => <Chip label={val} size="small" variant="outlined" />,
    },
    {
      id: 'status', label: 'Status', minWidth: 130,
      format: (val: POStatus) => {
        const info = getStatusInfo(val);
        return <StatusChip status={val} label={info.label} color={info.color} />;
      },
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
      id: 'actions', label: 'Actions', minWidth: 80, align: 'right' as const,
      format: (_: any, row: PurchaseOrder) => (
        <Tooltip title="View Details">
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); navigate(`/admin/purchase-orders/${row.id}`); }}
          >
            <ViewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Purchase Orders"
        subtitle={`${totalCount} total orders`}
        breadcrumbs={[{ label: 'Admin', path: '/admin' }, { label: 'Purchase Orders' }]}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/admin/purchase-orders/new')}>
            New PO
          </Button>
        }
      />

      {/* Status Tabs */}
      <Tabs
        value={statusTab}
        onChange={handleTabChange}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        variant="scrollable"
        scrollButtons="auto"
      >
        {statusTabs.map((tab, index) => (
          <Tab key={tab.value} label={tab.label} />
        ))}
      </Tabs>

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search PO number, supplier..."
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          sx={{ minWidth: 280 }}
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
        onRowClick={(row) => navigate(`/admin/purchase-orders/${row.id}`)}
        emptyTitle="No purchase orders found"
        emptyDescription="Try adjusting your search or filters"
      />
    </Box>
  );
};

export default PurchaseOrdersListPage;
