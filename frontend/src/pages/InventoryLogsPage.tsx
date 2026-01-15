import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Chip, 
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { Visibility } from '@mui/icons-material';
import { inventoryLogAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const InventoryLogsPage: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await inventoryLogAPI.getAll();
      setLogs(data.results || data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory logs');
    } finally {
      setLoading(false);
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'inward': return 'success';
      case 'outward': return 'error';
      case 'transfer': return 'info';
      case 'adjustment': return 'warning';
      case 'return': return 'secondary';
      default: return 'default';
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { 
      field: 'product', 
      headerName: 'Product', 
      width: 200,
      valueGetter: (value, row) => row.product?.name || value
    },
    { 
      field: 'warehouse', 
      headerName: 'Warehouse', 
      width: 150,
      valueGetter: (value, row) => row.warehouse?.name || value
    },
    { 
      field: 'movement_type', 
      headerName: 'Type', 
      width: 130,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={getMovementColor(params.value)} 
          size="small" 
          variant="outlined"
        />
      )
    },
    { field: 'quantity', headerName: 'Qty', width: 100 },
    { field: 'quantity_after', headerName: 'Balance', width: 100 },
    { 
      field: 'created_by', 
      headerName: 'User', 
      width: 150,
      valueGetter: (value, row) => {
        const u = row.created_by;
        return u ? `${u.first_name} ${u.last_name}` : 'System';
      }
    },
    { field: 'notes', headerName: 'Notes', width: 250 },
    { 
      field: 'created_at', 
      headerName: 'Date', 
      width: 180,
      valueFormatter: (value) => new Date(value).toLocaleString()
    },
  ];

  if (!user) return null;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Inventory Logs</Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ height: 700, width: '100%' }}>
        <DataGrid
          rows={logs}
          columns={columns}
          loading={loading}
          slots={{ toolbar: GridToolbar }}
          pageSizeOptions={[25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: {
              sortModel: [{ field: 'created_at', sort: 'desc' }],
            },
          }}
        />
      </Paper>
    </Box>
  );
};

export default InventoryLogsPage;