import React, { useState, useCallback } from 'react';
import {
  Box, Button, TextField, InputAdornment, MenuItem, Select, FormControl,
  InputLabel, IconButton, Tooltip, Chip, Tabs, Tab, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Alert,
} from '@mui/material';
import {
  Search as SearchIcon, FilterList as FilterIcon, SwapHoriz as TransferIcon,
  Add as AddIcon, Remove as RemoveIcon, Inventory as InventoryIcon,
} from '@mui/icons-material';
import { PageHeader, DataTable, StatusChip } from '../../components';
import { usePaginatedApi, useMutation, useToast } from '../../hooks';
import { inventoryApi } from '../../api';
import { Inventory, StockStatus } from '../../types';
import { formatCurrency } from '../../utils';

const stockStatusOptions: { value: StockStatus; label: string; color: 'success' | 'error' | 'warning' | 'default' }[] = [
  { value: 'in_stock', label: 'In Stock', color: 'success' },
  { value: 'low_stock', label: 'Low Stock', color: 'warning' },
  { value: 'out_of_stock', label: 'Out of Stock', color: 'error' },
];

const statusTabs = [
  { value: '', label: 'All' },
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

const VendorInventoryListPage: React.FC = () => {
  const toast = useToast();

  // Filters
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Adjustment modal
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<Inventory | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');

  // API hooks
  const { data: inventory, totalCount, loading, page, pageSize, setPage, setPageSize, updateParams, refetch } = usePaginatedApi(
    (params) => inventoryApi.list(params),
    { search, stock_status: statusFilter || undefined }
  );

  const adjustMutation = useMutation(
    (data: { id: number; quantity: number; reason: string }) => inventoryApi.adjust(data.id, data.quantity, data.reason),
    {
      onSuccess: () => { toast.success('Inventory adjusted'); setAdjustOpen(false); refetch(); },
      onError: (err) => toast.error(err),
    }
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

  const handleOpenAdjust = (item: Inventory) => {
    setAdjustingItem(item);
    setAdjustQty(0);
    setAdjustReason('');
    setAdjustOpen(true);
  };

  const handleAdjust = () => {
    if (!adjustingItem || adjustQty === 0) return;
    adjustMutation.mutate({ id: adjustingItem.id, quantity: adjustQty, reason: adjustReason });
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
      id: 'warehouse_name', label: 'Warehouse', minWidth: 150,
      format: (val: string, row: Inventory) => (
        <Box>
          <Box>{val}</Box>
          {row.location_code && (
            <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Loc: {row.location_code}</Box>
          )}
        </Box>
      ),
    },
    {
      id: 'quantity', label: 'Qty', minWidth: 80, align: 'center' as const,
      format: (val: number, row: Inventory) => (
        <Box>
          <Box sx={{ fontWeight: 600 }}>{val}</Box>
          {row.reserved_quantity > 0 && (
            <Box sx={{ fontSize: '0.75rem', color: 'warning.main' }}>-{row.reserved_quantity} reserved</Box>
          )}
        </Box>
      ),
    },
    {
      id: 'available_quantity', label: 'Available', minWidth: 80, align: 'center' as const,
      format: (val: number) => <Chip label={val} size="small" color={val > 0 ? 'success' : 'error'} variant="outlined" />,
    },
    {
      id: 'buy_price', label: 'Cost', minWidth: 100, align: 'right' as const,
      format: (val: string) => val ? formatCurrency(parseFloat(val)) : '-',
    },
    {
      id: 'stock_status', label: 'Status', minWidth: 120,
      format: (val: StockStatus) => {
        const info = stockStatusOptions.find(s => s.value === val);
        return <StatusChip status={val} label={info?.label || val} color={info?.color} />;
      },
    },
    {
      id: 'actions', label: 'Actions', minWidth: 100, align: 'right' as const,
      format: (_: any, row: Inventory) => (
        <Box>
          <Tooltip title="Adjust Stock">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenAdjust(row); }}>
              <InventoryIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Inventory"
        subtitle={`${totalCount} items`}
        breadcrumbs={[{ label: 'Vendor', path: '/vendor' }, { label: 'Inventory' }]}
      />

      {/* Status Tabs */}
      <Tabs
        value={statusTab}
        onChange={handleTabChange}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        {statusTabs.map((tab) => (
          <Tab key={tab.value} label={tab.label} />
        ))}
      </Tabs>

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search products..."
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
        data={inventory}
        loading={loading}
        totalCount={totalCount}
        page={page}
        rowsPerPage={pageSize}
        onPageChange={setPage}
        onRowsPerPageChange={setPageSize}
        emptyTitle="No inventory found"
        emptyDescription="Add products and receive stock to see inventory here"
      />

      {/* Adjust Dialog */}
      <Dialog open={adjustOpen} onClose={() => setAdjustOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adjust Stock</DialogTitle>
        <DialogContent>
          {adjustingItem && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ fontWeight: 600 }}>{adjustingItem.product_name}</Box>
              <Box sx={{ color: 'text.secondary' }}>Current: {adjustingItem.quantity} | Available: {adjustingItem.available_quantity}</Box>
            </Box>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={() => setAdjustQty(q => q - 1)} disabled={adjustQty <= -100}>
                  <RemoveIcon />
                </IconButton>
                <TextField
                  type="number"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                  sx={{ width: 120 }}
                  inputProps={{ style: { textAlign: 'center' } }}
                />
                <IconButton onClick={() => setAdjustQty(q => q + 1)} disabled={adjustQty >= 1000}>
                  <AddIcon />
                </IconButton>
              </Box>
              <Box sx={{ textAlign: 'center', mt: 1, color: adjustQty > 0 ? 'success.main' : adjustQty < 0 ? 'error.main' : 'text.secondary' }}>
                {adjustQty > 0 ? `+${adjustQty} (Add)` : adjustQty < 0 ? `${adjustQty} (Remove)` : 'No change'}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g., Damaged items, Count correction"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustOpen(false)}>Cancel</Button>
          <Button onClick={handleAdjust} variant="contained" disabled={adjustQty === 0 || adjustMutation.loading}>
            Adjust
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VendorInventoryListPage;
