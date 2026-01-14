import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, TextField, InputAdornment, MenuItem, Select, FormControl,
  InputLabel, IconButton, Tooltip, Chip, Tabs, Tab, Avatar,
} from '@mui/material';
import {
  Add as AddIcon, Search as SearchIcon, Edit as EditIcon, Visibility as ViewIcon,
  FilterList as FilterIcon, Publish as PublishIcon, Unpublished as UnpublishIcon,
} from '@mui/icons-material';
import { PageHeader, DataTable, StatusChip, ConfirmDialog } from '../../components';
import { usePaginatedApi, useMutation, useToast } from '../../hooks';
import { productsApi } from '../../api';
import { Product, ProductStatus } from '../../types';
import { formatCurrency } from '../../utils';

const statusOptions: { value: ProductStatus; label: string; color: 'success' | 'error' | 'warning' | 'default' }[] = [
  { value: 'draft', label: 'Draft', color: 'default' },
  { value: 'active', label: 'Active', color: 'success' },
  { value: 'inactive', label: 'Inactive', color: 'warning' },
  { value: 'archived', label: 'Archived', color: 'error' },
];

const statusTabs = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const VendorProductsListPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // Filters
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Action state
  const [publishConfirm, setPublishConfirm] = useState<{ product: Product; action: 'publish' | 'unpublish' } | null>(null);

  // API hooks
  const { data: products, totalCount, loading, page, pageSize, setPage, setPageSize, updateParams, refetch } = usePaginatedApi(
    (params) => productsApi.list(params),
    { search, status: statusFilter || undefined }
  );

  const publishMutation = useMutation((id: number) => productsApi.publish(id), {
    onSuccess: () => { toast.success('Product published'); setPublishConfirm(null); refetch(); },
    onError: (err) => toast.error(err),
  });

  const unpublishMutation = useMutation((id: number) => productsApi.unpublish(id), {
    onSuccess: () => { toast.success('Product unpublished'); setPublishConfirm(null); refetch(); },
    onError: (err) => toast.error(err),
  });

  const handleSearch = useCallback(() => {
    updateParams({ search, status: statusFilter || undefined });
  }, [search, statusFilter, updateParams]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setStatusTab(newValue);
    const newStatus = statusTabs[newValue].value;
    setStatusFilter(newStatus);
    updateParams({ status: newStatus || undefined });
  };

  const handlePublishAction = () => {
    if (!publishConfirm) return;
    if (publishConfirm.action === 'publish') {
      publishMutation.mutate(publishConfirm.product.id);
    } else {
      unpublishMutation.mutate(publishConfirm.product.id);
    }
  };

  const columns = [
    {
      id: 'name', label: 'Product', minWidth: 250,
      format: (_: any, row: Product) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            variant="rounded"
            src={row.images?.[0]?.url}
            sx={{ width: 48, height: 48 }}
          >
            {row.name[0]}
          </Avatar>
          <Box>
            <Box sx={{ fontWeight: 600 }}>{row.name}</Box>
            <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>SKU: {row.sku}</Box>
          </Box>
        </Box>
      ),
    },
    {
      id: 'category_name', label: 'Category', minWidth: 120,
      format: (val: string) => val || '-',
    },
    {
      id: 'base_price', label: 'Price', minWidth: 100, align: 'right' as const,
      format: (val: string, row: Product) => (
        <Box>
          <Box>{formatCurrency(parseFloat(row.selling_price || val))}</Box>
          {row.compare_at_price && (
            <Box sx={{ fontSize: '0.75rem', color: 'text.secondary', textDecoration: 'line-through' }}>
              {formatCurrency(parseFloat(row.compare_at_price))}
            </Box>
          )}
        </Box>
      ),
    },
    {
      id: 'total_stock', label: 'Stock', minWidth: 80, align: 'center' as const,
      format: (val: number) => (
        <Chip
          label={val}
          size="small"
          color={val > 10 ? 'success' : val > 0 ? 'warning' : 'error'}
          variant="outlined"
        />
      ),
    },
    {
      id: 'status', label: 'Status', minWidth: 100,
      format: (val: ProductStatus) => {
        const info = statusOptions.find(s => s.value === val);
        return <StatusChip status={val} label={info?.label || val} color={info?.color} />;
      },
    },
    {
      id: 'actions', label: 'Actions', minWidth: 120, align: 'right' as const,
      format: (_: any, row: Product) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/vendor/products/${row.id}`); }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {row.status === 'draft' || row.status === 'inactive' ? (
            <Tooltip title="Publish">
              <IconButton
                size="small"
                color="success"
                onClick={(e) => { e.stopPropagation(); setPublishConfirm({ product: row, action: 'publish' }); }}
              >
                <PublishIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Unpublish">
              <IconButton
                size="small"
                color="warning"
                onClick={(e) => { e.stopPropagation(); setPublishConfirm({ product: row, action: 'unpublish' }); }}
              >
                <UnpublishIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="My Products"
        subtitle={`${totalCount} products`}
        breadcrumbs={[{ label: 'Vendor', path: '/vendor' }, { label: 'Products' }]}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/vendor/products/new')}>
            Add Product
          </Button>
        }
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
        data={products}
        loading={loading}
        totalCount={totalCount}
        page={page}
        rowsPerPage={pageSize}
        onPageChange={setPage}
        onRowsPerPageChange={setPageSize}
        onRowClick={(row) => navigate(`/vendor/products/${row.id}`)}
        emptyTitle="No products found"
        emptyDescription="Start by creating your first product"
      />

      {/* Publish Confirmation */}
      <ConfirmDialog
        open={!!publishConfirm}
        title={publishConfirm?.action === 'publish' ? 'Publish Product' : 'Unpublish Product'}
        message={`Are you sure you want to ${publishConfirm?.action} "${publishConfirm?.product.name}"?`}
        confirmText={publishConfirm?.action === 'publish' ? 'Publish' : 'Unpublish'}
        confirmColor={publishConfirm?.action === 'publish' ? 'success' : 'warning'}
        loading={publishMutation.loading || unpublishMutation.loading}
        onConfirm={handlePublishAction}
        onCancel={() => setPublishConfirm(null)}
      />
    </Box>
  );
};

export default VendorProductsListPage;
