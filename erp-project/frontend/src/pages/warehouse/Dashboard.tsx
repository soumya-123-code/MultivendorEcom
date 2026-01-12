import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Card, CardContent, CardHeader, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Skeleton, Alert, Chip, LinearProgress } from '@mui/material';
import { Inventory as InventoryIcon, ArrowDownward as InboundIcon, ArrowUpward as OutboundIcon, Warning as WarningIcon, Refresh as RefreshIcon, LocalShipping as ShippingIcon } from '@mui/icons-material';
import { PageHeader, StatsCard, StatusChip } from '../../components';
import { useAppSelector } from '../../store';
import { selectUser } from '../../store/slices/authSlice';
import { inventoryApi, purchaseOrdersApi, salesOrdersApi, warehousesApi } from '../../api';
import { Inventory, PurchaseOrder, SalesOrder, WarehouseStats } from '../../types';

const WarehouseDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalItems: 0, lowStock: 0, outOfStock: 0, pendingInbound: 0, pendingOutbound: 0 });
  const [pendingPOs, setPendingPOs] = useState<PurchaseOrder[]>([]);
  const [pendingShipments, setPendingShipments] = useState<SalesOrder[]>([]);
  const [lowStockItems, setLowStockItems] = useState<Inventory[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [inventoryRes, lowStockRes, outOfStockRes, posRes, ordersRes] = await Promise.all([
        inventoryApi.list({ page: 1, page_size: 1 }),
        inventoryApi.getLowStock(),
        inventoryApi.getOutOfStock(),
        purchaseOrdersApi.list({ page: 1, page_size: 5, status: 'confirmed' }),
        salesOrdersApi.list({ page: 1, page_size: 5, status: 'packed' })
      ]);

      setStats({
        totalItems: inventoryRes.data.count,
        lowStock: lowStockRes.data.length,
        outOfStock: outOfStockRes.data.length,
        pendingInbound: posRes.data.count,
        pendingOutbound: ordersRes.data.count
      });

      setPendingPOs(posRes.data.results);
      setPendingShipments(ordersRes.data.results);
      setLowStockItems(lowStockRes.data.slice(0, 8));
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          {[1,2,3,4].map(i => <Grid item xs={12} sm={6} md={3} key={i}><Skeleton variant="rounded" height={140} /></Grid>)}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={`Warehouse Dashboard`}
        subtitle="Stock management and fulfillment overview"
        actions={<Button startIcon={<RefreshIcon />} onClick={fetchDashboardData} variant="outlined">Refresh</Button>}
      />

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard title="Total SKUs" value={stats.totalItems} icon={InventoryIcon} iconColor="#1976d2" iconBgColor="rgba(25,118,210,0.1)" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard title="Low Stock Items" value={stats.lowStock} subtitle="Need reorder" icon={WarningIcon} iconColor="#ed6c02" iconBgColor="rgba(237,108,2,0.1)" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard title="Pending Inbound" value={stats.pendingInbound} subtitle="POs to receive" icon={InboundIcon} iconColor="#2e7d32" iconBgColor="rgba(46,125,50,0.1)" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard title="Ready to Ship" value={stats.pendingOutbound} subtitle="Orders packed" icon={OutboundIcon} iconColor="#9c27b0" iconBgColor="rgba(156,39,176,0.1)" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Pending Inbound (POs) */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><InboundIcon color="success" /> Pending Inbound</Box>} action={<Button size="small" onClick={() => navigate('/warehouse/inbound')}>View All</Button>} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>PO #</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell>Items</TableCell>
                    <TableCell>Expected</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingPOs.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center">No pending inbound</TableCell></TableRow>
                  ) : pendingPOs.map((po) => (
                    <TableRow key={po.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/warehouse/inbound/${po.id}`)}>
                      <TableCell sx={{ fontWeight: 600 }}>{po.po_number}</TableCell>
                      <TableCell>{po.supplier_name || '-'}</TableCell>
                      <TableCell>{po.items_count}</TableCell>
                      <TableCell>{po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell><StatusChip status={po.status} category="purchaseOrder" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* Ready to Ship */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><ShippingIcon color="primary" /> Ready to Ship</Box>} action={<Button size="small" onClick={() => navigate('/warehouse/outbound')}>View All</Button>} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Order #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Items</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingShipments.length === 0 ? (
                    <TableRow><TableCell colSpan={4} align="center">No orders ready</TableCell></TableRow>
                  ) : pendingShipments.map((order) => (
                    <TableRow key={order.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/warehouse/outbound/${order.id}`)}>
                      <TableCell sx={{ fontWeight: 600 }}>{order.order_number}</TableCell>
                      <TableCell>{order.customer_name || '-'}</TableCell>
                      <TableCell>{order.items_count}</TableCell>
                      <TableCell><StatusChip status={order.status} category="order" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>

        {/* Low Stock Alert */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><WarningIcon color="warning" /> Low Stock Alerts</Box>} action={<Button size="small" onClick={() => navigate('/warehouse/stock?status=low_stock')}>View All</Button>} />
            <CardContent>
              {lowStockItems.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 3 }}>All stock levels are healthy</Typography>
              ) : (
                <Grid container spacing={2}>
                  {lowStockItems.map((item) => (
                    <Grid item xs={12} sm={6} md={3} key={item.id}>
                      <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
                        <Typography variant="subtitle2" noWrap>{item.product_name}</Typography>
                        <Typography variant="caption" color="text.secondary">SKU: {item.product_sku}</Typography>
                        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip label={`${item.quantity} units`} size="small" color={item.quantity === 0 ? 'error' : 'warning'} />
                          <Typography variant="caption">Reorder: {item.reorder_level}</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={Math.min((item.quantity / (item.reorder_level || 10)) * 100, 100)} color={item.quantity === 0 ? 'error' : 'warning'} sx={{ mt: 1, height: 4, borderRadius: 1 }} />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WarehouseDashboard;
