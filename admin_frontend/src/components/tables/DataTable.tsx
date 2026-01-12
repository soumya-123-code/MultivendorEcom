import React, { useState, useCallback } from 'react';
import {
  DataGrid,
  GridColDef,
  GridPaginationModel,
  GridSortModel,
  GridRowSelectionModel,
  GridToolbar,
  GridFilterModel,
} from '@mui/x-data-grid';
import {
  Box,
  Card,
  TextField,
  InputAdornment,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Button,
  Typography,
  Tooltip,
  Chip,
  alpha,
} from '@mui/material';
import {
  Search,
  FilterList,
  Refresh,
  Download,
  MoreVert,
  Add,
  Edit,
  Delete,
  Visibility,
} from '@mui/icons-material';
import { useDebounce } from '../../hooks';

interface DataTableProps<T> {
  columns: GridColDef[];
  rows: T[];
  loading?: boolean;
  totalRows?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSearch?: (query: string) => void;
  onSort?: (field: string, order: 'asc' | 'desc') => void;
  onRefresh?: () => void;
  onExport?: () => void;
  onAdd?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onView?: (row: T) => void;
  onRowClick?: (row: T) => void;
  onSelectionChange?: (ids: GridRowSelectionModel) => void;
  title?: string;
  searchPlaceholder?: string;
  addButtonText?: string;
  selectable?: boolean;
  actions?: boolean;
  filters?: React.ReactNode;
  headerActions?: React.ReactNode;
  getRowId?: (row: T) => string | number;
  initialSortField?: string;
  initialSortOrder?: 'asc' | 'desc';
}

function DataTable<T extends { id?: number | string }>({
  columns,
  rows,
  loading = false,
  totalRows,
  page = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  onSearch,
  onSort,
  onRefresh,
  onExport,
  onAdd,
  onEdit,
  onDelete,
  onView,
  onRowClick,
  onSelectionChange,
  title,
  searchPlaceholder = 'Search...',
  addButtonText = 'Add New',
  selectable = false,
  actions = true,
  filters,
  headerActions,
  getRowId,
  initialSortField,
  initialSortOrder = 'desc',
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortModel, setSortModel] = useState<GridSortModel>(
    initialSortField ? [{ field: initialSortField, sort: initialSortOrder }] : []
  );
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page,
    pageSize,
  });
  const [selectedRows, setSelectedRows] = useState<GridRowSelectionModel>([]);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    row: T | null;
  } | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 500);

  // Handle search
  React.useEffect(() => {
    if (onSearch) {
      onSearch(debouncedSearch);
    }
  }, [debouncedSearch, onSearch]);

  // Handle pagination
  const handlePaginationChange = useCallback(
    (model: GridPaginationModel) => {
      setPaginationModel(model);
      if (onPageChange && model.page !== paginationModel.page) {
        onPageChange(model.page);
      }
      if (onPageSizeChange && model.pageSize !== paginationModel.pageSize) {
        onPageSizeChange(model.pageSize);
      }
    },
    [onPageChange, onPageSizeChange, paginationModel]
  );

  // Handle sort
  const handleSortChange = useCallback(
    (model: GridSortModel) => {
      setSortModel(model);
      if (onSort && model.length > 0) {
        onSort(model[0].field, model[0].sort || 'asc');
      }
    },
    [onSort]
  );

  // Handle selection
  const handleSelectionChange = useCallback(
    (model: GridRowSelectionModel) => {
      setSelectedRows(model);
      if (onSelectionChange) {
        onSelectionChange(model);
      }
    },
    [onSelectionChange]
  );

  // Context menu
  const handleContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      const rowId = (event.currentTarget as HTMLElement).getAttribute('data-id');
      const row = rows.find((r) => String(getRowId ? getRowId(r) : r.id) === rowId);
      if (row) {
        setContextMenu({
          mouseX: event.clientX + 2,
          mouseY: event.clientY - 6,
          row,
        });
      }
    },
    [rows, getRowId]
  );

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  // Add action column if actions are enabled
  const columnsWithActions: GridColDef[] = actions
    ? [
        ...columns,
        {
          field: 'actions',
          headerName: 'Actions',
          width: 120,
          sortable: false,
          filterable: false,
          renderCell: (params) => (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {onView && (
                <Tooltip title="View">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(params.row);
                    }}
                  >
                    <Visibility fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {onEdit && (
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(params.row);
                    }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(params.row);
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          ),
        },
      ]
    : columns;

  return (
    <Card>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
          alignItems: { md: 'center' },
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {title && (
            <Typography variant="h6" fontWeight={600}>
              {title}
            </Typography>
          )}
          {selectedRows.length > 0 && (
            <Chip
              label={`${selectedRows.length} selected`}
              size="small"
              color="primary"
              onDelete={() => setSelectedRows([])}
            />
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            gap: 1.5,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {/* Search */}
          {onSearch && (
            <TextField
              size="small"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 250 }}
            />
          )}

          {/* Filters */}
          {filters}

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {onRefresh && (
              <Tooltip title="Refresh">
                <IconButton onClick={onRefresh} disabled={loading}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            )}
            {onExport && (
              <Tooltip title="Export">
                <IconButton onClick={onExport} disabled={loading}>
                  <Download />
                </IconButton>
              </Tooltip>
            )}
            {headerActions}
            {onAdd && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={onAdd}
                sx={{ whiteSpace: 'nowrap' }}
              >
                {addButtonText}
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Data Grid */}
      <DataGrid
        rows={rows}
        columns={columnsWithActions}
        loading={loading}
        getRowId={getRowId}
        paginationModel={paginationModel}
        onPaginationModelChange={handlePaginationChange}
        sortModel={sortModel}
        onSortModelChange={handleSortChange}
        rowSelectionModel={selectedRows}
        onRowSelectionModelChange={handleSelectionChange}
        checkboxSelection={selectable}
        disableRowSelectionOnClick={!onRowClick}
        onRowClick={onRowClick ? (params) => onRowClick(params.row) : undefined}
        pageSizeOptions={[5, 10, 25, 50, 100]}
        paginationMode={totalRows !== undefined ? 'server' : 'client'}
        rowCount={totalRows}
        autoHeight
        slotProps={{
          row: {
            onContextMenu: handleContextMenu,
            style: { cursor: onRowClick ? 'pointer' : 'default' },
          },
        }}
        sx={{
          border: 'none',
          '& .MuiDataGrid-cell': {
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          },
          '& .MuiDataGrid-columnHeaders': {
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          },
          '& .MuiDataGrid-row:hover': {
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          },
        }}
      />

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        {onView && (
          <MenuItem
            onClick={() => {
              if (contextMenu?.row) onView(contextMenu.row);
              handleCloseContextMenu();
            }}
          >
            <ListItemIcon>
              <Visibility fontSize="small" />
            </ListItemIcon>
            View
          </MenuItem>
        )}
        {onEdit && (
          <MenuItem
            onClick={() => {
              if (contextMenu?.row) onEdit(contextMenu.row);
              handleCloseContextMenu();
            }}
          >
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            Edit
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem
            onClick={() => {
              if (contextMenu?.row) onDelete(contextMenu.row);
              handleCloseContextMenu();
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <Delete fontSize="small" color="error" />
            </ListItemIcon>
            Delete
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
}

export default DataTable;
