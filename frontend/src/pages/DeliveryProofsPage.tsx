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
  Alert
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { deliveryProofAPI } from '../utils/api';

export default function DeliveryProofsPage() {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProof, setSelectedProof] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await deliveryProofAPI.getAll();
      setProofs(data.results || data);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load delivery proofs');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProof = (proof: any) => {
    setSelectedProof(proof);
  };

  const handleCloseDialog = () => {
    setSelectedProof(null);
  };

  const renderProofContent = (proof: any) => {
    if (!proof) return null;

    const { proof_type, proof_data } = proof;

    // Try to parse proof_data if it's a string
    let data = proof_data;
    if (typeof proof_data === 'string') {
        try {
            data = JSON.parse(proof_data);
        } catch (e) {
            // keep as string
        }
    }

    if (proof_type === 'photo' || proof_type === 'signature') {
      // If data has 'url' property or is a string starting with http/data:image
      const imageUrl = data.url || (typeof data === 'string' && (data.startsWith('http') || data.startsWith('data:image'))) ? data : null;
      
      if (imageUrl) {
        return (
          <Box sx={{ textAlign: 'center' }}>
            <img 
              src={imageUrl} 
              alt={proof_type} 
              style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} 
            />
          </Box>
        );
      }
    }

    // Default: render as JSON/Text
    return (
      <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, overflow: 'auto' }}>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </Box>
    );
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'sales_order_number', headerName: 'Order #', width: 150 },
    { field: 'proof_type', headerName: 'Type', width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={
            params.value === 'photo' ? 'primary' :
            params.value === 'signature' ? 'secondary' :
            params.value === 'otp' ? 'success' : 'default'
          }
          size="small"
        />
      )
    },
    { field: 'captured_at', headerName: 'Captured At', width: 200 },
    { 
      field: 'actions', 
      headerName: 'Actions', 
      width: 150,
      renderCell: (params) => (
        <Button 
          variant="contained" 
          size="small" 
          onClick={() => handleViewProof(params.row)}
        >
          View Proof
        </Button>
      )
    },
  ];

  return (
    <Box>
      <Typography variant="h4" mb={3}>Delivery Proofs</Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={proofs}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
        />
      </Paper>

      <Dialog 
        open={!!selectedProof} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Delivery Proof Details #{selectedProof?.id}
        </DialogTitle>
        <DialogContent dividers>
          {selectedProof && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Order:</strong> {selectedProof.sales_order_number}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Type:</strong> {selectedProof.proof_type}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Captured At:</strong> {selectedProof.captured_at}
              </Typography>
              
              <Typography variant="h6" sx={{ mt: 2 }}>Proof Data:</Typography>
              {renderProofContent(selectedProof)}

              {selectedProof.location && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Location:</Typography>
                  <pre>{JSON.stringify(selectedProof.location, null, 2)}</pre>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
