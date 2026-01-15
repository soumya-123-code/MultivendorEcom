import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  IconButton,
  Tooltip,
  Alert,
  Chip,
  Tab,
  Tabs,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Add,
  Edit,
  Visibility,
  SwapHoriz,
  TrendingUp,
  TrendingDown,
  Inventory,
  History,
  Warning,
} from '@mui/icons-material';
import { inventoryAPI, warehouseAPI, productAPI, inventoryLogAPI } from '../utils/api';
import { PageHeader, ConfirmDialog, DetailDrawer, DetailSection, DetailItem, StatusLogsTimeline } from '../components';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [inventoryLogs, setInventoryLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const [form, setForm] = useState({
    product: '',
    warehouse: '',
    quantity: '',
    reorder_level: '10',
    location: '',
  });

  const [adjustForm, setAdjustForm] = useState({
    quantity: '',
    notes: '',
  });

  const [transferForm, setTransferForm] = useState({
    to_warehouse: '',
    quantity: '',
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      let data;
      if (tab === 1) data = await inventoryAPI.getLowStock();
      else if (tab === 2) data = await inventoryAPI.getOutOfStock();
      else data = await inventoryAPI.getAll();

      const [warehousesData, productsData, summaryData] = await Promise.all([
        warehouseAPI.getAll(),
        productAPI.getAll(),
        inventoryAPI.getSummary().catch(() => null),
      ]);

      setInventory(data.results || data.data || data || []);
      setWarehouses(warehousesData.results || warehousesData.data || warehousesData || []);
      setProducts(productsData.results || productsData.data || productsData || []);
      setSummary(summaryData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadInventoryLogs = async (id: number) => {
    try {
      const data = await inventoryLogAPI.getByInventory(id);
      setInventoryLogs(data.results || data.data || data || []);
    } catch (err) {
      console.error('Failed to load inventory logs');
    }
  };

  const openForm = (item?: any) => {
    if (item) {
      setSelectedItem(item);
      setForm({
        product: item.product?.id || item.product_id || '',
        warehouse: item.warehouse?.id || item.warehouse_id || '',
        quantity: item.quantity || '',
        reorder_level: item.reorder_level || '10',
        location: item.location || '',
      });
    } else {
      setSelectedItem(null);
      setForm({
        product: '',
        warehouse: '',
        quantity: '',
        reorder_level: '10',
        location: '',
      });
    }
    setFormOpen(true);
  };

  const openDetail = (item: any) => {
    setSelectedItem(item);
    setDetailOpen(true);
    loadInventoryLogs(item.id);
  };

  const handleSave = async () => {
    try {
      if (selectedItem) {
        await inventoryAPI.update(selectedItem.id, form);
        setSuccess('Inventory updated successfully');
      } else {
        await inventoryAPI.create(form);
        setSuccess('Inventory added successfully');
      }
      setFormOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAdjust = async () => {
    if (!selectedItem) return;
    try {
      await inventoryAPI.adjust(selectedItem.id, parseInt(adjustForm.quantity), adjustForm.notes);
      setSuccess('Inventory adjusted successfully');
      setAdjustOpen(false);
      setAdjustForm({ quantity: '', notes: '' });
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleTransfer = async () => {
    if (!selectedItem) return;
    try {
      await inventoryAPI.transfer(selectedItem.id, {
        to_warehouse: transferForm.to_warehouse,
        quantity: parseInt(transferForm.quantity),
        notes: transferForm.notes,
      });
      setSuccess('Inventory transferred successfully');
      setTransferOpen(false);
      setTransferForm({ to_warehouse: '', quantity: '', notes: '' });
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getStockStatus = (row: any) => {
    const available = row.available_quantity ?? (row.quantity - (row.reserved_quantity || 0));
    const reorder = row.reorder_level || 10;
    if (available === 0) return { label: 'Out of Stock', color: 'error' };
    if (available < reorder) return { label: 'Low Stock', color: 'warning' };
    return { label: 'In Stock', color: 'success' };
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'product',
      headerName: 'Product',
      flex: 1,
      renderCell: (params) => (
        <Typography fontWeight={600}>
          {params.row.product?.name || params.row.product_name || '-'}
        </Typography>
      ),
    },
    {
      field: 'warehouse',
      headerName: 'Warehouse',
      width: 160,
      renderCell: (params) => params.row.warehouse?.name || params.row.warehouse_name || '-',
    },
    {
      field: 'quantity',
      headerName: 'Quantity',
      width: 100,
      renderCell: (params) => (
        <Typography fontWeight={600}>{params.value}</Typography>
      ),
    },
    {
      field: 'reserved_quantity',
      headerName: 'Reserved',
      width: 100,
    },
    {
      field: 'available',
      headerName: 'Available',
      width: 100,
      renderCell: (params) => {
        const available = params.row.available_quantity ?? (params.row.quantity - (params.row.reserved_quantity || 0));
        return <Typography fontWeight={600} color={available > 0 ? 'success.main' : 'error.main'}>{available}</Typography>;
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => {
        const status = getStockStatus(params.row);
        return <Chip label={status.label} color={status.color as any} size="small" />;
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => openDetail(params.row)}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openForm(params.row)}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Adjust Quantity">
            <IconButton
              size="small"
              color="info"
              onClick={() => {
                setSelectedItem(params.row);
                setAdjustOpen(true);
              }}
            >
              <TrendingUp fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Transfer">
            <IconButton
              size="small"
              color="secondary"
              onClick={() => {
                setSelectedItem(params.row);
                setTransferOpen(true);
              }}
            >
              <SwapHoriz fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Inventory"
        subtitle="Manage stock levels across warehouses"
        actionLabel="Add Inventory"
        onAction={() => openForm()}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h4" fontWeight={700}>
                      {summary.total_items || 0}
                    </Typography>
                    <Typography color="text.secondary">Total Items</Typography>
                  </Box>
                  <Inventory sx={{ fontSize: 40, color: '#6366f1' }} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h4" fontWeight={700} color="success.main">
                      {summary.in_stock || 0}
                    </Typography>
                    <Typography color="text.secondary">In Stock</Typography>
                  </Box>
                  <TrendingUp sx={{ fontSize: 40, color: '#22c55e' }} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h4" fontWeight={700} color="warning.main">
                      {summary.low_stock || 0}
                    </Typography>
                    <Typography color="text.secondary">Low Stock</Typography>
                  </Box>
                  <Warning sx={{ fontSize: 40, color: '#f59e0b' }} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h4" fontWeight={700} color="error.main">
                      {summary.out_of_stock || 0}
                    </Typography>
                    <Typography color="text.secondary">Out of Stock</Typography>
                  </Box>
                  <TrendingDown sx={{ fontSize: 40, color: '#ef4444' }} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="All Inventory" />
        <Tab label="Low Stock" icon={<Warning color="warning" />} iconPosition="end" />
        <Tab label="Out of Stock" icon={<Warning color="error" />} iconPosition="end" />
      </Tabs>

      <Paper sx={{ borderRadius: 3 }}>
        <DataGrid
          rows={inventory}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          autoHeight
          sx={{
            border: 0,
            '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f8fafc' },
          }}
        />
      </Paper>

      {/* Form Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #ec4899, #d946ef)', color: 'white' }}>
          {selectedItem ? 'Edit Inventory' : 'Add Inventory'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Product"
              value={form.product}
              onChange={(e) => setForm({ ...form, product: e.target.value })}
              fullWidth
              required
              disabled={!!selectedItem}
            >
              {products.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Warehouse"
              value={form.warehouse}
              onChange={(e) => setForm({ ...form, warehouse: e.target.value })}
              fullWidth
              required
              disabled={!!selectedItem}
            >
              {warehouses.map((w) => (
                <MenuItem key={w.id} value={w.id}>
                  {w.name}
                </MenuItem>
              ))}
            </TextField>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Quantity"
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Reorder Level"
                type="number"
                value={form.reorder_level}
                onChange={(e) => setForm({ ...form, reorder_level: e.target.value })}
                fullWidth
              />
            </Stack>
            <TextField
              label="Location (Rack/Shelf)"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {selectedItem ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Adjust Dialog */}
      <Dialog open={adjustOpen} onClose={() => setAdjustOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adjust Inventory Quantity</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
            Current quantity: {selectedItem?.quantity || 0}
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Adjustment (+ or -)"
              type="number"
              value={adjustForm.quantity}
              onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
              fullWidth
              required
              helperText="Use positive number to add, negative to subtract"
            />
            <TextField
              label="Notes"
              multiline
              rows={2}
              value={adjustForm.notes}
              onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdjust}>
            Adjust
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onClose={() => setTransferOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Transfer Inventory</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
            From: {selectedItem?.warehouse?.name || selectedItem?.warehouse_name}
            <br />
            Available: {selectedItem?.available_quantity ?? (selectedItem?.quantity - (selectedItem?.reserved_quantity || 0))}
          </Typography>
          <Stack spacing={2}>
            <TextField
              select
              label="To Warehouse"
              value={transferForm.to_warehouse}
              onChange={(e) => setTransferForm({ ...transferForm, to_warehouse: e.target.value })}
              fullWidth
              required
            >
              {warehouses
                .filter((w) => w.id !== (selectedItem?.warehouse?.id || selectedItem?.warehouse_id))
                .map((w) => (
                  <MenuItem key={w.id} value={w.id}>
                    {w.name}
                  </MenuItem>
                ))}
            </TextField>
            <TextField
              label="Quantity to Transfer"
              type="number"
              value={transferForm.quantity}
              onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Notes"
              multiline
              rows={2}
              value={transferForm.notes}
              onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleTransfer}>
            Transfer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Drawer */}
      <DetailDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={selectedItem?.product?.name || selectedItem?.product_name}
        subtitle={`Inventory ID: ${selectedItem?.id}`}
        width={550}
      >
        <Tabs value={0} sx={{ mb: 2 }}>
          <Tab icon={<Inventory />} label="Details" iconPosition="start" />
          <Tab icon={<History />} label="History" iconPosition="start" />
        </Tabs>
        {selectedItem && (
          <>
            <DetailSection title="Stock Information">
              <DetailItem label="Product" value={selectedItem.product?.name || selectedItem.product_name} />
              <DetailItem label="Warehouse" value={selectedItem.warehouse?.name || selectedItem.warehouse_name} />
              <DetailItem label="Quantity" value={selectedItem.quantity} />
              <DetailItem label="Reserved" value={selectedItem.reserved_quantity || 0} />
              <DetailItem
                label="Available"
                value={selectedItem.available_quantity ?? (selectedItem.quantity - (selectedItem.reserved_quantity || 0))}
              />
              <DetailItem label="Reorder Level" value={selectedItem.reorder_level || 10} />
              <DetailItem label="Location" value={selectedItem.location} />
            </DetailSection>
            <DetailSection title="Stock Status">
              <Box>
                <Chip
                  label={getStockStatus(selectedItem).label}
                  color={getStockStatus(selectedItem).color as any}
                  sx={{ mb: 2 }}
                />
              </Box>
            </DetailSection>
            {inventoryLogs.length > 0 && (
              <DetailSection title="Recent Activity">
                {inventoryLogs.slice(0, 5).map((log: any) => (
                  <Paper key={log.id} sx={{ p: 2, mb: 1, bgcolor: '#f8fafc' }}>
                    <Typography variant="body2" fontWeight={600}>
                      {log.action}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {log.notes} - {new Date(log.created_at).toLocaleString()}
                    </Typography>
                  </Paper>
                ))}
              </DetailSection>
            )}
          </>
        )}
      </DetailDrawer>
    </Box>
  );
}
