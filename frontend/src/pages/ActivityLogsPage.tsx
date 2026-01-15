import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Chip,
  TextField,
  MenuItem,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Visibility, FilterList } from '@mui/icons-material';
import { activityLogAPI, userAPI } from '../utils/api';
import { PageHeader, DetailDrawer, DetailSection, DetailItem } from '../components';

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [filters, setFilters] = useState({
    user: '',
    action: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filters.user) params.user = filters.user;
      if (filters.action) params.action = filters.action;

      const [logsData, usersData] = await Promise.all([
        activityLogAPI.getAll(params),
        userAPI.getAll(),
      ]);
      setLogs(logsData.results || logsData.data || logsData || []);
      setUsers(usersData.results || usersData.data || usersData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const getActionColor = (action: string) => {
    const a = action?.toLowerCase() || '';
    if (a.includes('create') || a.includes('add')) return 'success';
    if (a.includes('delete') || a.includes('remove')) return 'error';
    if (a.includes('update') || a.includes('edit')) return 'info';
    if (a.includes('login') || a.includes('auth')) return 'primary';
    return 'default';
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'user',
      headerName: 'User',
      width: 200,
      renderCell: (params) => (
        <Box>
          <Typography fontWeight={600} fontSize={14}>
            {params.row.user_name || params.row.user?.email || 'System'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.user?.role || 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'action',
      headerName: 'Action',
      width: 180,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getActionColor(params.value) as any}
          size="small"
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1,
      renderCell: (params) => (
        <Typography variant="body2" noWrap title={params.value}>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'ip_address',
      headerName: 'IP Address',
      width: 140,
    },
    {
      field: 'created_at',
      headerName: 'Timestamp',
      width: 180,
      renderCell: (params) =>
        params.value ? new Date(params.value).toLocaleString() : '-',
    },
    {
      field: 'actions',
      headerName: '',
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <Tooltip title="View Details">
          <IconButton
            size="small"
            onClick={() => {
              setSelectedLog(params.row);
              setDetailOpen(true);
            }}
          >
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Activity Logs"
        subtitle="View all system activity and audit trail"
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <FilterList color="action" />
          <TextField
            select
            size="small"
            label="User"
            value={filters.user}
            onChange={(e) => setFilters({ ...filters, user: e.target.value })}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">All Users</MenuItem>
            {users.map((user) => (
              <MenuItem key={user.id} value={user.id}>
                {user.email}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Action Type"
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All Actions</MenuItem>
            <MenuItem value="create">Create</MenuItem>
            <MenuItem value="update">Update</MenuItem>
            <MenuItem value="delete">Delete</MenuItem>
            <MenuItem value="login">Login</MenuItem>
            <MenuItem value="logout">Logout</MenuItem>
          </TextField>
        </Stack>
      </Paper>

      <Paper sx={{ borderRadius: 3 }}>
        <DataGrid
          rows={logs}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          autoHeight
          initialState={{
            pagination: { paginationModel: { pageSize: 25 } },
            sorting: { sortModel: [{ field: 'created_at', sort: 'desc' }] },
          }}
          sx={{
            border: 0,
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f8fafc',
            },
          }}
        />
      </Paper>

      {/* Detail Drawer */}
      <DetailDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title="Activity Log Details"
        subtitle={`Log ID: ${selectedLog?.id}`}
      >
        {selectedLog && (
          <>
            <DetailSection title="Activity Information">
              <DetailItem label="Action" value={selectedLog.action} chip />
              <DetailItem label="Description" value={selectedLog.description} />
              <DetailItem label="Module" value={selectedLog.module} />
              <DetailItem label="Object ID" value={selectedLog.object_id} />
            </DetailSection>
            <DetailSection title="User Information">
              <DetailItem label="User" value={selectedLog.user_name || selectedLog.user?.email} />
              <DetailItem label="User ID" value={selectedLog.user?.id || selectedLog.user_id} />
            </DetailSection>
            <DetailSection title="Request Details">
              <DetailItem label="IP Address" value={selectedLog.ip_address} />
              <DetailItem label="User Agent" value={selectedLog.user_agent} />
              <DetailItem
                label="Timestamp"
                value={
                  selectedLog.created_at
                    ? new Date(selectedLog.created_at).toLocaleString()
                    : '-'
                }
              />
            </DetailSection>
            {selectedLog.extra_data && (
              <DetailSection title="Additional Data">
                <Paper sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                  <pre style={{ margin: 0, fontSize: 12, overflow: 'auto' }}>
                    {JSON.stringify(selectedLog.extra_data, null, 2)}
                  </pre>
                </Paper>
              </DetailSection>
            )}
          </>
        )}
      </DetailDrawer>
    </Box>
  );
}
