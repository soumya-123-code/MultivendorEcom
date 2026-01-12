import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Button, TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Grid, Alert, Typography, Tabs, Tab, Chip, Card, CardContent } from '@mui/material';
import { Search as SearchIcon, Edit as EditIcon, Add as AddIcon, Remove as RemoveIcon, SwapHoriz as TransferIcon, FilterList as FilterIcon, Warning as WarningIcon, Inventory as InventoryIcon } from '@mui/icons-material';
import { PageHeader, DataTable, StatusChip, StatsCard } from '../../../components';
import { usePaginatedApi, useMutation, useToast, useApiQuery } from '../../../hooks';
import { inventoryApi, warehousesApi } from '../../../api';
import { Inventory, StockStatus, Warehouse, InventoryAdjustment, InventoryTransfer } from '../../../types';

const statusTabs: { value: StockStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Stock' },
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

const InventoryListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const initialStatus = searchParams.get('status') as StockStatus || 'all';
  const [statusTab, setStatusTab] = useState<StockStatus | 'all'>(initialStatus);
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<number | ''>('');

  // Modal states
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [adjustData, setAdjustData] = useState<{ quantity: number; reason: string; type: 'add' | 'subtract' }>({ quantity: 0, reason: '', type: 'add' });
  const [transferData, setTransferData] = useState<{ to_warehouse: number; quantity: number; reason: string }>({ to_warehouse: 0, quantity: 0, reason: '' });
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch warehouses for filter
  const { data: warehousesData } = useApiQuery(() => warehousesApi.list({ page: 1, page_size: 100 }), []);
  const warehouses = warehousesData?.results || [];

  // Fetch low stock count
  const { data: lowStockData } = useApiQuery(() => inventoryApi.getLowStock(), []);
  const { data: outOfStockData } = useApiQuery(() => inventoryApi.getOutOfStock(), []);

  const { data: inventory, totalCount, loading, page, pageSize, setPage, setPageSize, updateParams, refetch } = usePaginatedApi(
    (params) => inventoryApi.list(params),
    { search, stock_status: statusTab !== 'all' ? statusTab : undefined, warehouse: warehouseFilter || undefined }
  );

  const adjustMutation = useMutation(
    (data: { id: number; quantity: number; reason: string }) => inventoryApi.adjust(data.id, data.quantity, data.reason),
    { onSuccess: () => { toast.success('Stock adjusted'); setAdjustOpen(false); setSelectedInventory(null); refetch(); }, onError: (err) => setFormError(err) }
  );

  const transferMutation = useMutation(
    (data: { id: number; to_warehouse: number; quantity: number; reason: string }) => inventoryApi.transfer(data.id, data.to_warehouse, data.quantity, data.reason),
    { onSuccess: () => { toast.success('Stock transferred'); setTransferOpen(false); setSelectedInventory(null); refetch(); }, onError: (err) => setFormError(err) }
  );

  const handleTabChange = (_: any, newValue: StockStatus | 'all') => {
    setStatusTab(newValue);
    updateParams({ stock_status: newValue !== 'all' ? newValue : undefined });
  };

  const handleSearch = () => updateParams({ search, warehouse: warehouseFilter || undefined });

  const handleOpenAdjust = (inv: Inventory) => {
    setSelectedInventory(inv);
    setAdjustData({ quantity: 0, reason: '', type: 'add' });
    setFormError(null);
    setAdjustOpen(true);
  };

  const handleOpenTransfer = (inv: Inventory) => {
    setSelectedInventory(inv);
    setTransferData({ to_warehouse: 0, quantity: 0, reason: '' });
    setFormError(null);
    setTransferOpen(true);
  };

  const handleAdjust = async () => {
    if (!selectedInventory || adjustData.quantity <= 0) { setFormError('Enter a valid quantity'); return; }
    const finalQuantity = adjustData.type === 'subtract' ? -adjustData.quantity : adjustData.quantity;
    await adjustMutation.mutate({ id: selectedInventory.id, quantity: finalQuantity, reason: adjustData.reason });
  };

  const handleTransfer = async () => {
    if (!selectedInventory || transferData.quantity <= 0 || !transferData.to_warehouse) {
      setFormError('Enter valid transfer details');
      return;
    }
    await transferMutation.mutate({ id: selectedInventory.id, ...transferData });
  };

  const getStockStatusColor = (status: StockStatus) => {
    switch (status) {
      case 'in_stock': return 'success';
      case 'low_stock': return 'warning';
      case 'out_of_stock': return 'error';
      default: return 'default';
    }
  };

  const columns = [
    {
      id: 'product', label: 'Product', minWidth: 250,
      format: (_: any, row: Inventory) => (
        <Box>
          <Typography variant="subtitle2">{row.product_name || `Product #${row.product}`}</Typography>
          <Typography variant="caption" color="text.secondary">SKU: {row.product_sku || '-'}</Typography>
        </Box>
      )
    },
    { id: 'warehouse_name', label: 'Warehouse', minWidth: 150, format: (val: string) => val || '-' },
    { id: 'location_code', label: 'Location', minWidth: 100, format: (val: string) => val || '-' },
    {
      id: 'quantity', label: 'Quantity', minWidth: 100,
      format: (val: number, row: Inventory) => (
        <Box>
          <Typography variant="body2" fontWeight={600} color={val <= (row.reorder_level || 0) ? 'error.main' : 'inherit'}>{val}</Typography>
          {row.reserved_quantity > 0 && <Typography variant="caption" color="text.secondary">({row.reserved_quantity} reserved)</Typography>}
        </Box>
      )
    },
    { id: 'reorder_level', label: 'Reorder At', minWidth: 100, format: (val: number) => val || '-' },
    {
      id: 'stock_status', label: 'Status', minWidth: 120,
      format: (val: StockStatus) => <Chip label={val?.replace(/_/g, ' ').toUpperCase()} size="small" color={getStockStatusColor(val) as any} />
    },
    { id: 'updated_at', label: 'Last Updated', minWidth: 120, format: (val: string) => new Date(val).toLocaleString() },
    {
      id: 'actions', label: 'Actions', minWidth: 120, align: 'right' as const,
      format: (_: any, row: Inventory) => (
        <Box>
          <Tooltip title="Adjust Stock"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenAdjust(row); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Transfer Stock"><IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleOpenTransfer(row); }}><TransferIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
      )
    },
  ];

  return (
    <Box>
      <PageHeader title="Inventory" subtitle={`${totalCount} inventory records`} breadcrumbs={[{ label: 'Admin', path: '/admin' }, { label: 'Inventory' }]} />

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <InventoryIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box><Typography variant="h5" fontWeight={700}>{totalCount}</Typography><Typography variant="caption" color="text.secondary">Total Items</Typography></Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'warning.main' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <WarningIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              <Box><Typography variant="h5" fontWeight={700}>{lowStockData?.length || 0}</Typography><Typography variant="caption" color="text.secondary">Low Stock</Typography></Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ borderLeft: 4, borderColor: 'error.main' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <WarningIcon sx={{ fontSize: 40, color: 'error.main' }} />
              <Box><Typography variant="h5" fontWeight={700}>{outOfStockData?.length || 0}</Typography><Typography variant="caption" color="text.secondary">Out of Stock</Typography></Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Tabs value={statusTab} onChange={handleTabChange} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        {statusTabs.map(tab => <Tab key={tab.value} value={tab.value} label={tab.label} />)}
      </Tabs>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField placeholder="Search products..." size="small" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} sx={{ minWidth: 250 }} />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Warehouse</InputLabel>
          <Select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value as number)} label="Warehouse">
            <MenuItem value="">All Warehouses</MenuItem>
            {warehouses.map((wh: Warehouse) => <MenuItem key={wh.id} value={wh.id}>{wh.name}</MenuItem>)}
          </Select>
        </FormControl>
        <Button variant="outlined" onClick={handleSearch} startIcon={<FilterIcon />}>Apply</Button>
      </Box>

      <DataTable columns={columns} data={inventory} loading={loading} totalCount={totalCount} page={page} rowsPerPage={pageSize}
        onPageChange={setPage} onRowsPerPageChange={setPageSize} emptyTitle="No inventory found" />

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustOpen} onClose={() => setAdjustOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Adjust Stock</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedInventory?.product_name} - Current: <strong>{selectedInventory?.quantity}</strong>
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Action</InputLabel>
                <Select value={adjustData.type} onChange={(e) => setAdjustData({ ...adjustData, type: e.target.value as 'add' | 'subtract' })} label="Action">
                  <MenuItem value="add">Add Stock</MenuItem>
                  <MenuItem value="subtract">Remove Stock</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth type="number" size="small" label="Quantity" value={adjustData.quantity} onChange={(e) => setAdjustData({ ...adjustData, quantity: Number(e.target.value) })} inputProps={{ min: 0 }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} size="small" label="Reason" value={adjustData.reason} onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAdjustOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdjust} disabled={adjustMutation.loading}>Adjust</Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Stock Dialog */}
      <Dialog open={transferOpen} onClose={() => setTransferOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Transfer Stock</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedInventory?.product_name} - Available: <strong>{(selectedInventory?.quantity || 0) - (selectedInventory?.reserved_quantity || 0)}</strong>
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>To Warehouse</InputLabel>
                <Select value={transferData.to_warehouse || ''} onChange={(e) => setTransferData({ ...transferData, to_warehouse: e.target.value as number })} label="To Warehouse">
                  {warehouses.filter((wh: Warehouse) => wh.id !== selectedInventory?.warehouse).map((wh: Warehouse) => (
                    <MenuItem key={wh.id} value={wh.id}>{wh.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth type="number" size="small" label="Quantity" value={transferData.quantity} onChange={(e) => setTransferData({ ...transferData, quantity: Number(e.target.value) })} 
                inputProps={{ min: 0, max: (selectedInventory?.quantity || 0) - (selectedInventory?.reserved_quantity || 0) }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} size="small" label="Reason" value={transferData.reason} onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTransferOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleTransfer} disabled={transferMutation.loading}>Transfer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryListPage;
