import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Chip, Alert, Tabs, Tab, IconButton, Dialog, DialogTitle, DialogContent, List, ListItem, ListItemText, Divider } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Visibility } from '@mui/icons-material';
import { inventoryAPI } from '../utils/api';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState(0);
  const [logsOpen, setLogsOpen] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);

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

  const handleViewLogs = async (item: any) => {
    setSelectedItem(item);
    try {
      const res = await inventoryAPI.getLogs(item.id);
      setLogs(res.data || []);
      setLogsOpen(true);
    } catch (error: any) {
      console.error(error);
      alert('Failed to load logs');
    }
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
      headerName: 'Logs',
      width: 80,
      renderCell: (params) => (
        <IconButton size="small" onClick={() => handleViewLogs(params.row)}>
          <Visibility />
        </IconButton>
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
      <Paper><DataGrid rows={inventory} columns={columns} loading={loading} pageSizeOptions={[10, 25, 50]} /></Paper>

      <Dialog open={logsOpen} onClose={() => setLogsOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Inventory Logs - {selectedItem?.product_name}</DialogTitle>
        <DialogContent>
          <List>
            {logs.length > 0 ? logs.map((log: any, index: number) => (
              <Box key={index}>
                <ListItem>
                  <ListItemText
                    primary={`${log.movement_type} - Qty: ${log.quantity}`}
                    secondary={`${new Date(log.created_at).toLocaleString()} - ${log.notes || ''}`}
                  />
                </ListItem>
                <Divider />
              </Box>
            )) : <Typography p={2}>No logs found.</Typography>}
          </List>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
