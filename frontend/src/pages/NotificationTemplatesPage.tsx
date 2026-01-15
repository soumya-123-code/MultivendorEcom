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
  Alert
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { notificationTemplateAPI } from '../utils/api';

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    type: 'system',
    title_template: '',
    message_template: ''
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await notificationTemplateAPI.getAll();
      setTemplates(data.data || data.results || data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (template?: any) => {
    if (template) {
      setFormData(template);
    } else {
      setFormData({
        id: null,
        name: '',
        type: 'system',
        title_template: '',
        message_template: ''
      });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    try {
      if (formData.id) {
        await notificationTemplateAPI.update(formData.id, formData);
      } else {
        await notificationTemplateAPI.create(formData);
      }
      setOpenDialog(false);
      loadTemplates();
    } catch (err: any) {
      alert(err.message || 'Failed to save template');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await notificationTemplateAPI.delete(id);
      loadTemplates();
    } catch (err: any) {
      alert(err.message || 'Failed to delete template');
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'type', headerName: 'Type', width: 150 },
    { field: 'title_template', headerName: 'Title Template', width: 250 },
    { 
      field: 'actions', 
      headerName: 'Actions', 
      width: 200,
      renderCell: (params) => (
        <Box>
          <Button 
            size="small" 
            onClick={() => handleOpenDialog(params.row)}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button 
            size="small" 
            color="error"
            onClick={() => handleDelete(params.row.id)}
          >
            Delete
          </Button>
        </Box>
      )
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Notification Templates</Typography>
        <Button variant="contained" onClick={() => handleOpenDialog()}>
          Add Template
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={templates}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
        />
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{formData.id ? 'Edit Template' : 'Add Template'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              fullWidth
              helperText="e.g. order, system, payment"
            />
            <TextField
              label="Title Template"
              value={formData.title_template}
              onChange={(e) => setFormData({ ...formData, title_template: e.target.value })}
              fullWidth
            />
            <TextField
              label="Message Template"
              value={formData.message_template}
              onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
              fullWidth
              multiline
              rows={4}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
