import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { Add, Delete } from '@mui/icons-material';
import { tokenAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const TokensPage: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [outstandingTokens, setOutstandingTokens] = useState([]);
  const [blacklistedTokens, setBlacklistedTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [refreshToken, setRefreshToken] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      if (tabValue === 0) {
        const response = await tokenAPI.getOutstanding();
        setOutstandingTokens(response.results || response);
      } else {
        const response = await tokenAPI.getBlacklisted();
        setBlacklistedTokens(response.results || response);
      }
    } catch (error) {
      console.error('Error loading tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tabValue]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBlacklist = async () => {
    try {
      await tokenAPI.blacklist(refreshToken);
      setOpenDialog(false);
      setRefreshToken('');
      loadData();
    } catch (error: any) {
      alert(error.message || 'Error blacklisting token');
    }
  };

  const handleDeleteBlacklisted = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this blacklisted token record?')) {
      try {
        await tokenAPI.deleteBlacklisted(id);
        loadData();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const outstandingColumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { 
      field: 'user', 
      headerName: 'User', 
      width: 200,
      renderCell: (params) => params.value ? `${params.value.first_name} ${params.value.last_name} (${params.value.email})` : 'N/A'
    },
    { field: 'jti', headerName: 'JTI', width: 250 },
    { field: 'created_at', headerName: 'Created At', width: 200 },
    { field: 'expires_at', headerName: 'Expires At', width: 200 },
  ];

  const blacklistedColumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { 
      field: 'token', 
      headerName: 'Token JTI', 
      width: 250,
      valueGetter: (_, row) => row.token?.jti || 'N/A'
    },
    { 
      field: 'user', 
      headerName: 'User', 
      width: 200,
      valueGetter: (_, row) => {
        const user = row.token?.user;
        return user ? `${user.first_name} ${user.last_name} (${user.email})` : 'N/A';
      }
    },
    { field: 'blacklisted_at', headerName: 'Blacklisted At', width: 200 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (params) => (
        <Tooltip title="Delete">
          <IconButton onClick={() => handleDeleteBlacklisted(params.row.id)} color="error" size="small">
            <Delete />
          </IconButton>
        </Tooltip>
      )
    }
  ];

  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return <Typography>Access Denied</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Token Management</Typography>
      
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} indicatorColor="primary" textColor="primary">
          <Tab label="Outstanding Tokens" />
          <Tab label="Blacklisted Tokens" />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={outstandingTokens}
              columns={outstandingColumns}
              loading={loading}
              slots={{ toolbar: GridToolbar }}
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            />
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Stack direction="row" justifyContent="flex-end" mb={2}>
            <Button 
              variant="contained" 
              startIcon={<Add />} 
              onClick={() => setOpenDialog(true)}
            >
              Blacklist Token
            </Button>
          </Stack>
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={blacklistedTokens}
              columns={blacklistedColumns}
              loading={loading}
              slots={{ toolbar: GridToolbar }}
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            />
          </Box>
        </TabPanel>
      </Paper>

      {/* Blacklist Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Blacklist Token</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Refresh Token"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={refreshToken}
            onChange={(e) => setRefreshToken(e.target.value)}
            helperText="Enter the refresh token you want to blacklist"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleBlacklist} variant="contained" color="error">
            Blacklist
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TokensPage;
