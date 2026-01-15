import { useEffect, useState } from 'react';
import { Box, Stack, Typography, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { offersAPI } from '../utils/api';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({ code: '', discount_type: 'fixed', discount_value: 0, min_purchase_amount: 0, max_discount_amount: null, valid_from: null, valid_until: null });
  const [validateForm, setValidateForm] = useState<any>({ code: '', cart_total: 0 });
  const [validateResult, setValidateResult] = useState<any>(null);

  const load = async () => {
    const res = await offersAPI.coupons.getAll();
    setCoupons(res.data || res.results || res || []);
  };

  useEffect(() => { load(); }, []);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'code', headerName: 'Code', width: 140 },
    { field: 'discount_type', headerName: 'Type', width: 120 },
    { field: 'discount_value', headerName: 'Value', width: 120 },
    { field: 'min_purchase_amount', headerName: 'Min Purchase', width: 140 },
    {
      field: 'actions', headerName: 'Actions', width: 220,
      renderCell: p => (
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={() => { setEditing(p.row); setForm({ code: p.row.code, discount_type: p.row.discount_type, discount_value: p.row.discount_value, min_purchase_amount: p.row.min_purchase_amount, max_discount_amount: p.row.max_discount_amount || null, valid_from: p.row.valid_from || null, valid_until: p.row.valid_until || null }); setOpen(true); }}>Edit</Button>
          <Button size="small" color="error" onClick={async () => { await offersAPI.coupons.delete(p.row.id); load(); }}>Delete</Button>
        </Stack>
      )
    }
  ];

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={3} alignItems="center">
        <Box>
          <Typography variant="h4" fontWeight={700}>Coupons</Typography>
          <Typography color="text.secondary">Manage discount codes</Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <TextField size="small" label="Code" value={validateForm.code} onChange={e => setValidateForm({ ...validateForm, code: e.target.value })} />
          <TextField size="small" label="Cart Total" type="number" value={validateForm.cart_total} onChange={e => setValidateForm({ ...validateForm, cart_total: Number(e.target.value) })} />
          <Button variant="outlined" onClick={async () => { try { const res = await offersAPI.coupons.validate(validateForm); setValidateResult(res); } catch (err: any) { setValidateResult({ error: err.message }); } }}>Validate</Button>
          <Button variant="contained" onClick={() => { setEditing(null); setForm({ code: '', discount_type: 'fixed', discount_value: 0, min_purchase_amount: 0, max_discount_amount: null, valid_from: null, valid_until: null }); setOpen(true); }}>Add</Button>
        </Stack>
      </Stack>

      {validateResult && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography>Result: {validateResult.error ? validateResult.error : `Valid. Discount: ${validateResult.discount_amount}`}</Typography>
        </Paper>
      )}

      <Paper sx={{ p: 2 }}>
        <DataGrid autoHeight rows={coupons} columns={columns} pageSizeOptions={[10, 25, 50]} />
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? 'Edit Coupon' : 'Add Coupon'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
            <TextField label="Discount Type" value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value })} />
            <TextField label="Discount Value" type="number" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: Number(e.target.value) })} />
            <TextField label="Min Purchase" type="number" value={form.min_purchase_amount} onChange={e => setForm({ ...form, min_purchase_amount: Number(e.target.value) })} />
            <TextField label="Max Discount" type="number" value={form.max_discount_amount || ''} onChange={e => setForm({ ...form, max_discount_amount: e.target.value ? Number(e.target.value) : null })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={async () => { if (editing) await offersAPI.coupons.update(editing.id, form); else await offersAPI.coupons.create(form); setOpen(false); load(); }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
