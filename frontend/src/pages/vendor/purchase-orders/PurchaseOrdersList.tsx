import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, InputAdornment, IconButton, Tooltip, Chip, Tabs, Tab } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Visibility as ViewIcon, FilterList as FilterIcon, ShoppingCart as POIcon } from '@mui/icons-material';
import { PageHeader, DataTable, StatusChip } from '../../components';
import { usePaginatedApi } from '../../hooks';
import { purchaseOrdersApi } from '../../api';
import { PurchaseOrder, POStatus } from '../../types';
import { formatCurrency } from '../../utils';

const statusOptions: { value: POStatus; label: string; color: 'success' | 'error' | 'warning' | 'info' | 'default' }[] = [
  { value: 'draft', label: 'Draft', color: 'default' },
  { value: 'pending_approval', label: 'Pending', color: 'warning' },
  { value: 'approved', label: 'Approved', color: 'info' },
  { value: 'sent', label: 'Sent', color: 'info' },
  { value: 'confirmed', label: 'Confirmed', color: 'success' },
  { value: 'received', label: 'Received', color: 'success' },
  { value: 'complete', label: 'Complete', color: 'success' },
  { value: 'cancelled', label: 'Cancelled', color: 'error' },
];

const statusTabs = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending' },
  { value: 'approved,sent,confirmed', label: 'Active' },
  { value: 'received,complete', label: 'Complete' },
];

const VendorPurchaseOrdersListPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: orders, totalCount, loading, page, pageSize, setPage, setPageSize, updateParams } = usePaginatedApi(
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

  const getStatusInfo = (status: POStatus) => statusOptions.find(s => s.value === status) || { label: status, color: 'default' as const };

  const columns = [
    { id: 'po_number', label: 'PO Number', minWidth: 140, format: (val: string) => (<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><POIcon sx={{ color: 'primary.main', fontSize: 20 }} /><Box sx={{ fontWeight: 600 }}>{val}</Box></Box>) },
    { id: 'supplier_name', label: 'Supplier', minWidth: 150 },
    { id: 'warehouse_name', label: 'Warehouse', minWidth: 150 },
    { id: 'po_date', label: 'Date', minWidth: 100, format: (val: string) => new Date(val).toLocaleDateString() },
    { id: 'total_amount', label: 'Amount', minWidth: 100, align: 'right' as const, format: (val: string) => formatCurrency(parseFloat(val)) },
    { id: 'status', label: 'Status', minWidth: 120, format: (val: POStatus) => { const info = getStatusInfo(val); return <StatusChip status={val} label={info.label} color={info.color} />; } },
    { id: 'actions', label: '', minWidth: 60, align: 'right' as const, format: (_: any, row: PurchaseOrder) => (<Tooltip title="View"><IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/vendor/purchase-orders/${row.id}`); }}><ViewIcon fontSize="small" /></IconButton></Tooltip>) },
  ];

  return (
    <Box>
      <PageHeader title="Purchase Orders" subtitle={`${totalCount} orders`} breadcrumbs={[{ label: 'Vendor', path: '/vendor' }, { label: 'Purchase Orders' }]} actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/vendor/purchase-orders/new')}>New PO</Button>} />
      <Tabs value={statusTab} onChange={handleTabChange} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>{statusTabs.map((tab) => <Tab key={tab.value} label={tab.label} />)}</Tabs>
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}><TextField placeholder="Search..." size="small" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} sx={{ minWidth: 250 }} /><Button variant="outlined" onClick={handleSearch} startIcon={<FilterIcon />}>Search</Button></Box>
      <DataTable columns={columns} data={orders} loading={loading} totalCount={totalCount} page={page} rowsPerPage={pageSize} onPageChange={setPage} onRowsPerPageChange={setPageSize} onRowClick={(row) => navigate(`/vendor/purchase-orders/${row.id}`)} emptyTitle="No purchase orders found" emptyDescription="Create your first purchase order" />
    </Box>
  );
};

export default VendorPurchaseOrdersListPage;
