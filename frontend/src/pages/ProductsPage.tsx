import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  ListItemAvatar,
  ToggleButtonGroup,
  ToggleButton,
  Card,
  CardMedia,
  CardContent,
  CardActions
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { 
  Add, 
  Edit, 
  Delete,
  Style as StyleIcon,
  Image as ImageIcon,
  Star as StarIcon,
  ViewList,
  ViewModule
} from '@mui/icons-material';
import { productAPI, categoryAPI, productVariantAPI, productImageAPI } from '../utils/api';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  // Variant Management
  const [variantsOpen, setVariantsOpen] = useState(false);
  const [variants, setVariants] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [variantForm, setVariantForm] = useState({ name: '', sku: '', attributes: '{}' });

  // Image Management
  const [imagesOpen, setImagesOpen] = useState(false);
  const [images, setImages] = useState<any[]>([]);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  // Reviews Management
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);

  // Product Form
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: '',
    base_price: '',
    selling_price: '',
    cost_price: '',
    description: ''
  });

  const load = async () => {
    try {
      const p = await productAPI.getAll();
      const c = await categoryAPI.getAll();
      const productsData = p.data || p.results || p || [];
      const categoriesData = c.data || c.results || c || [];
      
      // Ensure products is always an array
      setProducts(Array.isArray(productsData) ? productsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error(error);
      setProducts([]);
      setCategories([]);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true') {
      openDialog();
    }
  }, [location.search]);

  const openDialog = (p?: any) => {
    if (p) {
      setEditing(p);
      setForm({
        name: p.name,
        sku: p.sku,
        category: p.category?.id || '',
        base_price: p.base_price,
        selling_price: p.selling_price,
        cost_price: p.cost_price,
        description: p.description || ''
      });
    } else {
      setEditing(null);
      setForm({
        name: '',
        sku: '',
        category: '',
        base_price: '',
        selling_price: '',
        cost_price: '',
        description: ''
      });
    }
    setOpen(true);
  };

  const save = async () => {
    try {
      if (editing) await productAPI.update(editing.id, form);
      else await productAPI.create(form);
      setOpen(false);
      load();
    } catch (error) {
      console.error(error);
      alert('Failed to save product');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await productAPI.delete(id);
      load();
    }
  };

  // --- Variants Logic ---

  const handleOpenVariants = async (product: any) => {
    setSelectedProduct(product);
    const res = await productVariantAPI.getAll(product.id);
    setVariants(res.data || res.results || res || []);
    setVariantForm({ name: '', sku: '', attributes: '{}' });
    setVariantsOpen(true);
  };

  const handleAddVariant = async () => {
    try {
      await productVariantAPI.create(selectedProduct.id, {
        ...variantForm,
        attributes: JSON.parse(variantForm.attributes)
      });
      const res = await productVariantAPI.getAll(selectedProduct.id);
      setVariants(res.data || res.results || res || []);
      setVariantForm({ name: '', sku: '', attributes: '{}' });
    } catch (error) {
      alert('Invalid attributes JSON or SKU already exists');
    }
  };

  const handleDeleteVariant = async (variantId: number) => {
    await productVariantAPI.delete(selectedProduct.id, variantId);
    const res = await productVariantAPI.getAll(selectedProduct.id);
    setVariants(res.data || res.results || res || []);
  };

  // --- Images Logic ---

  const handleOpenImages = async (product: any) => {
    setSelectedProduct(product);
    const res = await productImageAPI.getAll(product.id);
    setImages(res.data || res.results || res || []);
    setSelectedImageFile(null);
    setImagesOpen(true);
  };

  const handleAddImage = async () => {
    if (!selectedImageFile) return;
    const formData = new FormData();
    formData.append('image', selectedImageFile);
    
    await productImageAPI.create(selectedProduct.id, formData);
    const res = await productImageAPI.getAll(selectedProduct.id);
    setImages(res.data || []);
    setSelectedImageFile(null);
  };

  const handleDeleteImage = async (imageId: number) => {
    await productImageAPI.delete(selectedProduct.id, imageId);
    const res = await productImageAPI.getAll(selectedProduct.id);
    setImages(res.data || []);
  };

  const handleSetPrimaryImage = async (imageId: number) => {
    await productImageAPI.setPrimary(selectedProduct.id, imageId);
    const res = await productImageAPI.getAll(selectedProduct.id);
    setImages(res.data || []);
  };

  // --- Reviews Logic ---

  const handleOpenReviews = async (product: any) => {
    setSelectedProduct(product);
    const res = await productAPI.getReviews(product.id);
    setReviews(res.data || []);
    setReviewsOpen(true);
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'name',
      headerName: 'Product',
      flex: 1,
      renderCell: p => <Typography fontWeight={600}>{p.value}</Typography>
    },
    {
      field: 'category',
      headerName: 'Category',
      width: 150,
      renderCell: p => <Chip label={p.value?.name} size="small" />
    },
    {
      field: 'selling_price',
      headerName: 'Price',
      width: 100,
      renderCell: p => `₹${p.value}`
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 250,
      renderCell: p => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Variants">
            <IconButton onClick={() => handleOpenVariants(p.row)} color="secondary" size="small">
              <StyleIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Images">
            <IconButton onClick={() => handleOpenImages(p.row)} color="info" size="small">
              <ImageIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton onClick={() => openDialog(p.row)} color="primary" size="small">
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton onClick={() => handleDelete(p.row.id)} color="error" size="small">
              <Delete />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    }
  ];

  const getProductImage = (product: any) => {
    if (product.primary_image) {
      if (typeof product.primary_image === 'string') return product.primary_image;
      if (typeof product.primary_image === 'object' && product.primary_image.image) return product.primary_image.image;
    }
    // Fallback if images array exists in product object
    if (Array.isArray(product.images) && product.images.length > 0) {
      const first = product.images[0];
      return typeof first === 'string' ? first : first.image;
    }
    return 'https://via.placeholder.com/300?text=No+Image';
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={3} alignItems="center">
        <Box>
          <Typography variant="h4" fontWeight={700}>Products</Typography>
          <Typography color="text.secondary">Manage products, variants, and images</Typography>
        </Box>
        
        <Stack direction="row" spacing={2}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newView) => { if (newView) setViewMode(newView); }}
            size="small"
            color="primary"
          >
            <ToggleButton value="table">
              <Tooltip title="Table View"><ViewList /></Tooltip>
            </ToggleButton>
            <ToggleButton value="card">
              <Tooltip title="Card View"><ViewModule /></Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>

          <Button variant="contained" startIcon={<Add />} onClick={() => openDialog()}>
            Add Product
          </Button>
        </Stack>
      </Stack>

      {viewMode === 'table' ? (
        <Paper sx={{ height: 600, borderRadius: 3 }}>
          <DataGrid
            rows={products}
            columns={columns}
            disableRowSelectionOnClick
            sx={{ border: 0, '& .MuiDataGrid-columnHeaders': { backgroundColor: '#fff1f2', fontWeight: 700 } }}
          />
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {Array.isArray(products) && products.map((product) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="180"
                  image={getProductImage(product)}
                  alt={product.name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Chip 
                      label={product.category?.name || 'Uncategorized'} 
                      size="small" 
                      color="default" 
                      variant="outlined" 
                    />
                    <Typography variant="h6" color="primary.main" fontWeight="bold">
                      ₹{product.selling_price}
                    </Typography>
                  </Stack>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom noWrap title={product.name}>
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    SKU: {product.sku}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    height: '2.5em'
                  }}>
                    {product.description || 'No description available'}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center', bgcolor: 'grey.50', p: 1 }}>
                  <Tooltip title="Variants">
                    <IconButton onClick={() => handleOpenVariants(product)} color="secondary" size="small">
                      <StyleIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Images">
                    <IconButton onClick={() => handleOpenImages(product)} color="info" size="small">
                      <ImageIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Reviews">
                    <IconButton onClick={() => handleOpenReviews(product)} color="warning" size="small">
                      <StarIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton onClick={() => openDialog(product)} color="primary" size="small">
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => handleDelete(product.id)} color="error" size="small">
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Product Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2} mt={1}>
            <TextField label="Product Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Stack direction="row" spacing={2}>
              <TextField fullWidth label="SKU" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} />
              <TextField select fullWidth label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </TextField>
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField fullWidth label="Base Price" value={form.base_price} onChange={e => setForm({ ...form, base_price: e.target.value })} />
              <TextField fullWidth label="Selling Price" value={form.selling_price} onChange={e => setForm({ ...form, selling_price: e.target.value })} />
              <TextField fullWidth label="Cost Price" value={form.cost_price} onChange={e => setForm({ ...form, cost_price: e.target.value })} />
            </Stack>
            <TextField label="Description" multiline rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>{editing ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      {/* Variants Dialog */}
      <Dialog open={variantsOpen} onClose={() => setVariantsOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Manage Variants for {selectedProduct?.name}</DialogTitle>
        <DialogContent>
          <Stack direction="row" spacing={2} alignItems="center" my={2}>
            <TextField size="small" label="Name (e.g. Red XL)" value={variantForm.name} onChange={e => setVariantForm({ ...variantForm, name: e.target.value })} />
            <TextField size="small" label="SKU" value={variantForm.sku} onChange={e => setVariantForm({ ...variantForm, sku: e.target.value })} />
            <TextField size="small" label='Attributes JSON (e.g. {"size":"XL"})' fullWidth value={variantForm.attributes} onChange={e => setVariantForm({ ...variantForm, attributes: e.target.value })} />
            <Button variant="contained" onClick={handleAddVariant}>Add</Button>
          </Stack>
          <List>
            {variants.map(v => (
              <ListItem key={v.id} divider>
                <ListItemText primary={v.name} secondary={`SKU: ${v.sku} | Attrs: ${JSON.stringify(v.attributes)}`} />
                <ListItemSecondaryAction>
                  <IconButton onClick={() => handleDeleteVariant(v.id)} edge="end" color="error">
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVariantsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Images Dialog */}
      <Dialog open={imagesOpen} onClose={() => setImagesOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Manage Images for {selectedProduct?.name}</DialogTitle>
        <DialogContent>
          <Stack direction="row" spacing={2} alignItems="center" my={2}>
            <Button variant="outlined" component="label">
              Upload File
              <input type="file" hidden accept="image/*" onChange={e => setSelectedImageFile(e.target.files?.[0] || null)} />
            </Button>
            <Typography>{selectedImageFile?.name || 'No file selected'}</Typography>
            <Button variant="contained" onClick={handleAddImage} disabled={!selectedImageFile}>Upload</Button>
          </Stack>
          <List>
            {images.map(img => (
              <ListItem key={img.id} divider>
                <ListItemAvatar>
                  <Avatar src={img.image} variant="rounded" sx={{ width: 60, height: 60, mr: 2 }} />
                </ListItemAvatar>
                <ListItemText primary={img.is_primary ? "Primary Image" : "Secondary Image"} secondary={img.alt_text} />
                <ListItemSecondaryAction>
                  {!img.is_primary && (
                    <Button size="small" onClick={() => handleSetPrimaryImage(img.id)}>Set Primary</Button>
                  )}
                  <IconButton onClick={() => handleDeleteImage(img.id)} edge="end" color="error">
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImagesOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Reviews Dialog */}
      <Dialog open={reviewsOpen} onClose={() => setReviewsOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Reviews for {selectedProduct?.name}</DialogTitle>
        <DialogContent>
           <List>
            {reviews.length > 0 ? reviews.map((review, index) => (
              <ListItem key={index} divider alignItems="flex-start">
                 <ListItemText 
                   primary={
                     <Stack direction="row" spacing={1} alignItems="center">
                       <Typography fontWeight="bold">{review.user_name || 'Anonymous'}</Typography>
                       <Chip size="small" label={`${review.rating} Stars`} color="warning" icon={<StarIcon />} />
                     </Stack>
                   }
                   secondary={
                     <>
                       <Typography variant="body2" color="text.primary" mt={0.5}>{review.comment}</Typography>
                       <Typography variant="caption" color="text.secondary">{new Date(review.created_at).toLocaleString()}</Typography>
                     </>
                   }
                 />
              </ListItem>
            )) : (
              <Typography p={2} color="text.secondary">No reviews yet.</Typography>
            )}
           </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}