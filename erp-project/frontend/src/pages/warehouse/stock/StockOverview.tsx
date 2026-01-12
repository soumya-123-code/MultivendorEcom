import React, { useState, useCallback } from 'react';
import { Box, TextField, InputAdornment, Chip, Tabs, Tab, Grid, Paper, Typography } from '@mui/material';
import { Search as SearchIcon, Inventory as InventoryIcon, Warning as WarningIcon, Error as ErrorIcon } from '@mui/icons-material';
import { PageHeader, DataTable, StatusChip, StatsCard } from '../../components';
import { usePaginatedApi, useApiQuery } from '../../hooks';
import { inventoryApi } from '../../api';
import { Inventory, StockStatus } from '../../types';

const stockStatusOptions = [
  { value: 'in_stock', label: 'In Stock', color: 'success' as const },
  { value: 'low_stock', label: 'Low Stock', color: 'warning' as const },
  { value: 'out_of_stock', label: 'Out of Stock', color: 'error' as const },
];

const statusTabs = [
  { value: '', label: 'All Items' },
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

const StockOverviewPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: summary } = useApiQuery(() => inventoryApi.summary(), []);

  const { data: inventory, totalCount, loading, page, pageSize, setPage, setPageSize, updateParams } = usePaginatedApi(
    (params) => inventoryApi.list(params),
    { search, stock_status: statusFilter || undefined }
  );

  const handleSearch = useCallback(() => {
    updateParams({ search, stock_status: statusFilter || undefined });
  }, [search, statusFilter, updateParams]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setStatusTab(newValue);
    const newStatus = statusTabs[newValue].value;
    setStatusFilter(newStatus);
    updateParams({ stock_status: newStatus || undefined });
  };

  const columns = [
    {
      id: 'product_name', label: 'Product', minWidth: 200,
      format: (val: string, row: Inventory) => (
        <Box>
          <Box sx={{ fontWeight: 600 }}>{val}</Box>
          <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>SKU: {row.product_sku}</Box>
        </Box>
      ),
    },
    {
      id: 'location_code', label: 'Location', minWidth: 100,
      format: (val: string) => val || '-',
    },
    {
      id: 'quantity', label: 'On Hand', minWidth: 80, align: 'center' as const,
      format: (val: number) => <Box sx={{ fontWeight: 600 }}>{val}</Box>,
    },
    {
      id: 'reserved_quantity', label: 'Reserved', minWidth: 80, align: 'center' as const,
      format: (val: number) => val > 0 ? <Chip label={val} size="small" color="warning" variant="outlined" /> : '-',
    },
    {
      id: 'available_quantity', label: 'Available', minWidth: 80, align: 'center' as const,
      format: (val: number) => <Chip label={val} size="small" color={val > 0 ? 'success' : 'error'} />,
    },
    {
      id: 'stock_status', label: 'Status', minWidth: 120,
      format: (val: StockStatus) => {
        const info = stockStatusOptions.find(s => s.value === val);
        return <StatusChip status={val} label={info?.label || val} color={info?.color} />;
      },
    },
    {
      id: 'batch_number', label: 'Batch', minWidth: 100,
      format: (val: string) => val || '-',
    },
    {
      id: 'expiry_date', label: 'Expiry', minWidth: 100,
      format: (val: string) => val ? new Date(val).toLocaleDateString() : '-',
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Stock Overview"
        subtitle="View and manage warehouse inventory"
        breadcrumbs={[{ label: 'Warehouse', path: '/warehouse' }, { label: 'Stock' }]}
      />

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Items"
            value={summary?.total_items || 0}
            icon={<InventoryIcon />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Quantity"
            value={summary?.total_quantity || 0}
            icon={<InventoryIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Low Stock"
            value={summary?.by_status?.low_stock || 0}
            icon={<WarningIcon />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Out of Stock"
            value={summary?.by_status?.out_of_stock || 0}
            icon={<ErrorIcon />}
            color="error"
          />
        </Grid>
      </Grid>

      <Tabs value={statusTab} onChange={handleTabChange} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        {statusTabs.map((tab) => <Tab key={tab.value} label={tab.label} />)}
      </Tabs>

      <Box sx={{ mb: 3 }}>
        <TextField
          placeholder="Search products..."
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
        data={inventory}
        loading={loading}
        totalCount={totalCount}
        page={page}
        rowsPerPage={pageSize}
        onPageChange={setPage}
        onRowsPerPageChange={setPageSize}
        emptyTitle="No inventory items"
        emptyDescription="Stock will appear here when items are received"
      />
    </Box>
  );
};

export default StockOverviewPage;
