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
  Chip,
  Rating,
  Alert,
  IconButton,
  TextField,
  Stack
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { reviewAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { Visibility, CheckCircle, Edit, Delete } from '@mui/icons-material';

export default function ProductReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ rating: 0, title: '', review: '' });

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState({ product: '', order: '', rating: 5, title: '', review: '' });

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true') {
      setAddDialogOpen(true);
    }
  }, [location.search]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await reviewAPI.getAll();
      setReviews(data.data || data.results || data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      // Clean up empty order if not provided
      const payload = { ...addForm };
      if (!payload.order) delete (payload as any).order;
      
      await reviewAPI.create(payload);
      setAddDialogOpen(false);
      setAddForm({ product: '', order: '', rating: 5, title: '', review: '' });
      loadReviews();
    } catch (err: any) {
      alert(err.message || 'Failed to create review');
    }
  };

  const handleEdit = (review: any) => {
    setSelectedReview(review);
    setEditForm({ rating: review.rating, review: review.review, title: review.title });
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    try {
      await reviewAPI.update(selectedReview.id, editForm);
      setEditDialogOpen(false);
      loadReviews();
    } catch (err: any) {
      alert(err.message || 'Failed to update review');
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await reviewAPI.approve(id);
      loadReviews();
      if (selectedReview?.id === id) {
        setSelectedReview(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to approve review');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await reviewAPI.delete(id);
      loadReviews();
      if (selectedReview?.id === id) {
        setSelectedReview(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete review');
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { 
      field: 'product', 
      headerName: 'Product', 
      width: 200,
      valueGetter: (params: any) => params.row.product?.name || params.value
    },
    { 
      field: 'customer', 
      headerName: 'Customer', 
      width: 150,
      valueGetter: (params: any) => params.row.customer_name || 'Anonymous'
    },
    { 
      field: 'rating', 
      headerName: 'Rating', 
      width: 120,
      renderCell: (params) => (
        <Rating value={params.value} readOnly size="small" />
      )
    },
    { field: 'title', headerName: 'Title', width: 200 },
    { 
      field: 'is_approved', 
      headerName: 'Status', 
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value ? 'Approved' : 'Pending'} 
          color={params.value ? 'success' : 'warning'}
          size="small"
        />
      )
    },
    { field: 'created_at', headerName: 'Date', width: 180 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 250,
      renderCell: (params) => (
        <Box>
          <IconButton 
            size="small" 
            onClick={() => setSelectedReview(params.row)}
            title="View"
            color="primary"
          >
            <Visibility />
          </IconButton>
          
          <IconButton 
            size="small" 
            onClick={() => handleEdit(params.row)}
            title="Edit"
            color="info"
          >
            <Edit />
          </IconButton>

          {!params.row.is_approved && (user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'vendor') && (
            <IconButton 
              size="small" 
              color="success"
              onClick={() => handleApprove(params.row.id)}
              title="Approve"
            >
              <CheckCircle />
            </IconButton>
          )}
          
          <IconButton 
            size="small" 
            color="error"
            onClick={() => handleDelete(params.row.id)}
            title="Delete"
          >
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Product Reviews</Typography>
        <Button variant="contained" onClick={() => setAddDialogOpen(true)}>
          Add Review
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={reviews}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
        />
      </Paper>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle>Add Review</DialogTitle>
        <DialogContent>
          <TextField
            label="Product ID"
            fullWidth
            margin="normal"
            type="number"
            value={addForm.product}
            onChange={(e) => setAddForm({ ...addForm, product: e.target.value })}
          />
          <TextField
            label="Order ID (Optional)"
            fullWidth
            margin="normal"
            type="number"
            value={addForm.order}
            onChange={(e) => setAddForm({ ...addForm, order: e.target.value })}
          />
          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography component="legend">Rating</Typography>
            <Rating
              value={addForm.rating}
              onChange={(e, v) => setAddForm({ ...addForm, rating: v || 0 })}
            />
          </Box>
          <TextField
            label="Title"
            fullWidth
            margin="normal"
            value={addForm.title}
            onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
          />
          <TextField
            label="Review"
            fullWidth
            margin="normal"
            multiline
            rows={4}
            value={addForm.review}
            onChange={(e) => setAddForm({ ...addForm, review: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd}>Submit</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Review</DialogTitle>
        <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
                <Box>
                    <Typography component="legend">Rating</Typography>
                    <Rating value={editForm.rating} onChange={(e, val) => setEditForm({...editForm, rating: val || 0})} />
                </Box>
                <TextField label="Title" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} fullWidth />
                <TextField label="Review" value={editForm.review} onChange={e => setEditForm({...editForm, review: e.target.value})} fullWidth multiline rows={4} />
            </Stack>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!selectedReview && !editDialogOpen} onClose={() => setSelectedReview(null)} maxWidth="md" fullWidth>
        <DialogTitle>Review Details</DialogTitle>
        <DialogContent dividers>
          {selectedReview && (
            <Box>
              <Typography variant="h6" gutterBottom>{selectedReview.title}</Typography>
              <Box display="flex" alignItems="center" mb={2}>
                <Rating value={selectedReview.rating} readOnly />
                <Typography variant="body2" color="text.secondary" ml={1}>
                  by {selectedReview.customer_name} on {new Date(selectedReview.created_at).toLocaleDateString()}
                </Typography>
              </Box>
              <Typography paragraph>{selectedReview.review}</Typography>
              
              {selectedReview.images && selectedReview.images.length > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle2">Images:</Typography>
                  <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                    {selectedReview.images.map((img: string, index: number) => (
                      <img 
                        key={index} 
                        src={img} 
                        alt={`Review ${index + 1}`} 
                        style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }} 
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!selectedReview?.is_approved && (
            <Button onClick={() => handleApprove(selectedReview.id)} color="success">
              Approve
            </Button>
          )}
          <Button onClick={() => setSelectedReview(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
