import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Chip,
  Avatar,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  alpha,
} from '@mui/material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enqueueSnackbar } from 'notistack';
import DataTable from '../../components/tables/DataTable';
import StatusChip from '../../components/common/StatusChip';
import ConfirmDialog from '../../components/modals/ConfirmDialog';
import { usePageSetup, useDebounce } from '../../hooks';
import { productsApi } from '../../services/api';
import { Product, ProductStatus } from '../../types';
import { formatCurrency, truncate } from '../../utils';

const ProductsListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  usePageSetup('Products', [
    { label: 'Home', path: '/' },
    { label: 'Products' },
  ]);

  // State
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });

  const debouncedSearch = useDebounce(search, 500);

  // Query
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['products', page, pageSize, debouncedSearch, statusFilter, sortField, sortOrder],
    queryFn: () =>
      productsApi.list({
        page: page + 1,
        page_size: pageSize,
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        ordering: `${sortOrder === 'desc' ? '-' : ''}${sortField}`,
      }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => {
      enqueueSnackbar('Product deleted successfully', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeleteDialog({ open: false, product: null });
    },
    onError: () => {
      enqueueSnackbar('Failed to delete product', { variant: 'error' });
    },
  });

  // Columns
  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'image',
        headerName: '',
        width: 70,
        sortable: false,
        filterable: false,
        renderCell: (params: GridRenderCellParams<Product>) => (
          <Avatar
            variant="rounded"
            src={params.row.images?.[0]?.url}
            sx={{
              width: 48,
              height: 48,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
            }}
          >
            {params.row.name[0]}
          </Avatar>
        ),
      },
      {
        field: 'name',
        headerName: 'Product',
        flex: 1,
        minWidth: 250,
        renderCell: (params: GridRenderCellParams<Product>) => (
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {truncate(params.row.name, 40)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              SKU: {params.row.sku}
            </Typography>
          </Box>
        ),
      },
      {
        field: 'category_name',
        headerName: 'Category',
        width: 150,
        renderCell: (params: GridRenderCellParams<Product>) => (
          <Chip
            label={params.row.category_name || 'Uncategorized'}
            size="small"
            sx={{ bgcolor: 'action.selected' }}
          />
        ),
      },
      {
        field: 'selling_price',
        headerName: 'Price',
        width: 120,
        renderCell: (params: GridRenderCellParams<Product>) => (
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {formatCurrency(params.row.selling_price)}
            </Typography>
            {params.row.compare_at_price && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textDecoration: 'line-through' }}
              >
                {formatCurrency(params.row.compare_at_price)}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        renderCell: (params: GridRenderCellParams<Product>) => (
          <StatusChip status={params.row.status} />
        ),
      },
      {
        field: 'rating',
        headerName: 'Rating',
        width: 100,
        renderCell: (params: GridRenderCellParams<Product>) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="body2" fontWeight={600}>
              ⭐ {parseFloat(params.row.rating).toFixed(1)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ({params.row.review_count})
            </Typography>
          </Box>
        ),
      },
      {
        field: 'is_featured',
        headerName: 'Featured',
        width: 100,
        renderCell: (params: GridRenderCellParams<Product>) =>
          params.row.is_featured ? (
            <Chip label="Featured" size="small" color="primary" />
          ) : null,
      },
    ],
    []
  );

  // Handlers
  const handleSearch = useCallback((query: string) => {
    setSearch(query);
    setPage(0);
  }, []);

  const handleSort = useCallback((field: string, order: 'asc' | 'desc') => {
    setSortField(field);
    setSortOrder(order);
  }, []);

  const handleAdd = useCallback(() => {
    navigate('/products/new');
  }, [navigate]);

  const handleEdit = useCallback(
    (product: Product) => {
      navigate(`/products/${product.id}/edit`);
    },
    [navigate]
  );

  const handleView = useCallback(
    (product: Product) => {
      navigate(`/products/${product.id}`);
    },
    [navigate]
  );

  const handleDelete = useCallback((product: Product) => {
    setDeleteDialog({ open: true, product });
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteDialog.product) {
      deleteMutation.mutate(deleteDialog.product.id);
    }
  }, [deleteDialog.product, deleteMutation]);

  return (
    <Box>
      <DataTable
        title="Products"
        columns={columns}
        rows={data?.results || []}
        loading={isLoading}
        totalRows={data?.count}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSearch={handleSearch}
        onSort={handleSort}
        onRefresh={() => refetch()}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onView={handleView}
        onDelete={handleDelete}
        addButtonText="Add Product"
        searchPlaceholder="Search products..."
        initialSortField="created_at"
        initialSortOrder="desc"
        filters={
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </Select>
          </FormControl>
        }
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, product: null })}
        onConfirm={confirmDelete}
        title="Delete Product"
        message={
          <>
            Are you sure you want to delete <strong>{deleteDialog.product?.name}</strong>? This
            action cannot be undone.
          </>
        }
        confirmText="Delete"
        type="danger"
        loading={deleteMutation.isPending}
      />
    </Box>
  );
};

export default ProductsListPage;
