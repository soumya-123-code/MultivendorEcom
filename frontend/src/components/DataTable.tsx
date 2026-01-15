import { Paper, Box, TextField, InputAdornment, Stack, Button } from '@mui/material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { Search as SearchIcon, FilterList as FilterIcon } from '@mui/icons-material';
import { useState } from 'react';

interface DataTableProps {
  rows: any[];
  columns: GridColDef[];
  loading?: boolean;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  onRowClick?: (params: GridRowParams) => void;
  height?: number;
  showSearch?: boolean;
  toolbar?: React.ReactNode;
}

export default function DataTable({
  rows,
  columns,
  loading = false,
  searchPlaceholder = 'Search...',
  onSearch,
  onRowClick,
  height = 600,
  showSearch = true,
  toolbar,
}: DataTableProps) {
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  return (
    <Paper
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
      }}
    >
      {(showSearch || toolbar) && (
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            {showSearch && (
              <TextField
                size="small"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                sx={{ minWidth: 300 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            )}
            <Box sx={{ flex: 1 }} />
            {toolbar}
          </Stack>
        </Box>
      )}
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        onRowClick={onRowClick}
        pageSizeOptions={[10, 25, 50, 100]}
        initialState={{
          pagination: { paginationModel: { pageSize: 25 } },
        }}
        disableRowSelectionOnClick
        sx={{
          border: 0,
          height,
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#f8fafc',
            fontWeight: 700,
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: '#f1f5f9',
            cursor: onRowClick ? 'pointer' : 'default',
          },
        }}
      />
    </Paper>
  );
}
