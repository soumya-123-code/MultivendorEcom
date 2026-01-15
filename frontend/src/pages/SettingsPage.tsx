import { useEffect, useState } from 'react';
import { Box, Stack, Typography, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tabs, Tab } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { settingsAPI } from '../utils/api';

export default function SettingsPage() {
  const [tab, setTab] = useState(0);
  const [storeSettings, setStoreSettings] = useState<any>(null);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  const [taxRules, setTaxRules] = useState<any[]>([]);
  const [returnPolicies, setReturnPolicies] = useState<any[]>([]);

  const [openStore, setOpenStore] = useState(false);
  const [storeForm, setStoreForm] = useState<any>({ store_name: '', company_name: '', email: '', phone: '' });

  const [openCurrency, setOpenCurrency] = useState(false);
  const [currencyForm, setCurrencyForm] = useState<any>({ code: '', symbol: '', name: '', exchange_rate: 1 });
  const [editingCurrency, setEditingCurrency] = useState<any>(null);

  const [openShipping, setOpenShipping] = useState(false);
  const [shippingForm, setShippingForm] = useState<any>({ name: '', base_rate: 0, min_delivery_days: 2, max_delivery_days: 5 });
  const [editingShipping, setEditingShipping] = useState<any>(null);

  const [openTax, setOpenTax] = useState(false);
  const [taxForm, setTaxForm] = useState<any>({ name: '', percentage: 0, country: '', state: '' });
  const [editingTax, setEditingTax] = useState<any>(null);

  const [openReturn, setOpenReturn] = useState(false);
  const [returnForm, setReturnForm] = useState<any>({ name: '', description: '', return_window_days: 30 });
  const [editingReturn, setEditingReturn] = useState<any>(null);

  const load = async () => {
    const s = await settingsAPI.store.getAll();
    const c = await settingsAPI.currencies.getAll();
    const sh = await settingsAPI.shipping.getAll();
    const t = await settingsAPI.tax.getAll();
    const rp = await settingsAPI.returnPolicies.getAll();
    const sData = s.data || s.results || s || [];
    setStoreSettings(Array.isArray(sData) ? sData[0] || null : sData);
    setCurrencies(c.data || c.results || c || []);
    setShippingMethods(sh.data || sh.results || sh || []);
    setTaxRules(t.data || t.results || t || []);
    setReturnPolicies(rp.data || rp.results || rp || []);
  };

  useEffect(() => { load(); }, []);

  const currencyColumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'code', headerName: 'Code', width: 100 },
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'symbol', headerName: 'Symbol', width: 100 },
    { field: 'exchange_rate', headerName: 'Rate', width: 120 },
    {
      field: 'actions', headerName: 'Actions', width: 200,
      renderCell: p => (
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={() => { setEditingCurrency(p.row); setCurrencyForm({ code: p.row.code, symbol: p.row.symbol, name: p.row.name, exchange_rate: p.row.exchange_rate }); setOpenCurrency(true); }}>Edit</Button>
          <Button size="small" color="error" onClick={async () => { await settingsAPI.currencies.delete(p.row.id); load(); }}>Delete</Button>
        </Stack>
      )
    }
  ];

  const shippingColumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'base_rate', headerName: 'Base Rate', width: 120 },
    { field: 'min_delivery_days', headerName: 'Min Days', width: 120 },
    { field: 'max_delivery_days', headerName: 'Max Days', width: 120 },
    {
      field: 'actions', headerName: 'Actions', width: 200,
      renderCell: p => (
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={() => { setEditingShipping(p.row); setShippingForm({ name: p.row.name, base_rate: p.row.base_rate, min_delivery_days: p.row.min_delivery_days, max_delivery_days: p.row.max_delivery_days }); setOpenShipping(true); }}>Edit</Button>
          <Button size="small" color="error" onClick={async () => { await settingsAPI.shipping.delete(p.row.id); load(); }}>Delete</Button>
        </Stack>
      )
    }
  ];

  const taxColumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'percentage', headerName: '%', width: 100 },
    { field: 'country', headerName: 'Country', width: 150 },
    { field: 'state', headerName: 'State', width: 150 },
    {
      field: 'actions', headerName: 'Actions', width: 200,
      renderCell: p => (
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={() => { setEditingTax(p.row); setTaxForm({ name: p.row.name, percentage: p.row.percentage, country: p.row.country, state: p.row.state }); setOpenTax(true); }}>Edit</Button>
          <Button size="small" color="error" onClick={async () => { await settingsAPI.tax.delete(p.row.id); load(); }}>Delete</Button>
        </Stack>
      )
    }
  ];

  const returnColumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'return_window_days', headerName: 'Window (days)', width: 150 },
    {
      field: 'actions', headerName: 'Actions', width: 200,
      renderCell: p => (
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={() => { setEditingReturn(p.row); setReturnForm({ name: p.row.name, description: p.row.description, return_window_days: p.row.return_window_days }); setOpenReturn(true); }}>Edit</Button>
          <Button size="small" color="error" onClick={async () => { await settingsAPI.returnPolicies.delete(p.row.id); load(); }}>Delete</Button>
        </Stack>
      )
    }
  ];

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" mb={3} alignItems="center">
        <Box>
          <Typography variant="h4" fontWeight={700}>Settings</Typography>
          <Typography color="text.secondary">Manage store, currencies, shipping, tax, returns</Typography>
        </Box>
      </Stack>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="Store" />
          <Tab label="Currencies" />
          <Tab label="Shipping" />
          <Tab label="Tax" />
          <Tab label="Return Policies" />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" mb={2}>
            <Typography variant="h6">Store Settings</Typography>
            <Button variant="contained" onClick={() => { setStoreForm({ store_name: storeSettings?.store_name || '', company_name: storeSettings?.company_name || '', email: storeSettings?.email || '', phone: storeSettings?.phone || '' }); setOpenStore(true); }}>Edit</Button>
          </Stack>
          <Stack spacing={1}>
            <Typography>Store: {storeSettings?.store_name || '-'}</Typography>
            <Typography>Company: {storeSettings?.company_name || '-'}</Typography>
            <Typography>Email: {storeSettings?.email || '-'}</Typography>
            <Typography>Phone: {storeSettings?.phone || '-'}</Typography>
          </Stack>
        </Paper>
      )}

      {tab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" mb={2}>
            <Typography variant="h6">Currencies</Typography>
            <Button variant="contained" onClick={() => { setEditingCurrency(null); setCurrencyForm({ code: '', symbol: '', name: '', exchange_rate: 1 }); setOpenCurrency(true); }}>Add</Button>
          </Stack>
          <DataGrid autoHeight rows={currencies} columns={currencyColumns} pageSizeOptions={[10, 25, 50]} />
        </Paper>
      )}

      {tab === 2 && (
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" mb={2}>
            <Typography variant="h6">Shipping Methods</Typography>
            <Button variant="contained" onClick={() => { setEditingShipping(null); setShippingForm({ name: '', base_rate: 0, min_delivery_days: 2, max_delivery_days: 5 }); setOpenShipping(true); }}>Add</Button>
          </Stack>
          <DataGrid autoHeight rows={shippingMethods} columns={shippingColumns} pageSizeOptions={[10, 25, 50]} />
        </Paper>
      )}

      {tab === 3 && (
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" mb={2}>
            <Typography variant="h6">Tax Settings</Typography>
            <Button variant="contained" onClick={() => { setEditingTax(null); setTaxForm({ name: '', percentage: 0, country: '', state: '' }); setOpenTax(true); }}>Add</Button>
          </Stack>
          <DataGrid autoHeight rows={taxRules} columns={taxColumns} pageSizeOptions={[10, 25, 50]} />
        </Paper>
      )}

      {tab === 4 && (
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" mb={2}>
            <Typography variant="h6">Return Policies</Typography>
            <Button variant="contained" onClick={() => { setEditingReturn(null); setReturnForm({ name: '', description: '', return_window_days: 30 }); setOpenReturn(true); }}>Add</Button>
          </Stack>
          <DataGrid autoHeight rows={returnPolicies} columns={returnColumns} pageSizeOptions={[10, 25, 50]} />
        </Paper>
      )}

      <Dialog open={openStore} onClose={() => setOpenStore(false)} fullWidth maxWidth="sm">
        <DialogTitle>Store Settings</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Store Name" value={storeForm.store_name} onChange={e => setStoreForm({ ...storeForm, store_name: e.target.value })} />
            <TextField label="Company Name" value={storeForm.company_name} onChange={e => setStoreForm({ ...storeForm, company_name: e.target.value })} />
            <TextField label="Email" value={storeForm.email} onChange={e => setStoreForm({ ...storeForm, email: e.target.value })} />
            <TextField label="Phone" value={storeForm.phone} onChange={e => setStoreForm({ ...storeForm, phone: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStore(false)}>Cancel</Button>
          <Button variant="contained" onClick={async () => { if (storeSettings?.id) await settingsAPI.store.update(storeSettings.id, storeForm); else await settingsAPI.store.create(storeForm); setOpenStore(false); load(); }}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openCurrency} onClose={() => setOpenCurrency(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingCurrency ? 'Edit Currency' : 'Add Currency'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Code" value={currencyForm.code} onChange={e => setCurrencyForm({ ...currencyForm, code: e.target.value })} />
            <TextField label="Symbol" value={currencyForm.symbol} onChange={e => setCurrencyForm({ ...currencyForm, symbol: e.target.value })} />
            <TextField label="Name" value={currencyForm.name} onChange={e => setCurrencyForm({ ...currencyForm, name: e.target.value })} />
            <TextField label="Exchange Rate" type="number" value={currencyForm.exchange_rate} onChange={e => setCurrencyForm({ ...currencyForm, exchange_rate: Number(e.target.value) })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCurrency(false)}>Cancel</Button>
          <Button variant="contained" onClick={async () => { if (editingCurrency) await settingsAPI.currencies.update(editingCurrency.id, currencyForm); else await settingsAPI.currencies.create(currencyForm); setOpenCurrency(false); load(); }}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openShipping} onClose={() => setOpenShipping(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingShipping ? 'Edit Shipping Method' : 'Add Shipping Method'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Name" value={shippingForm.name} onChange={e => setShippingForm({ ...shippingForm, name: e.target.value })} />
            <TextField label="Base Rate" type="number" value={shippingForm.base_rate} onChange={e => setShippingForm({ ...shippingForm, base_rate: Number(e.target.value) })} />
            <TextField label="Min Delivery Days" type="number" value={shippingForm.min_delivery_days} onChange={e => setShippingForm({ ...shippingForm, min_delivery_days: Number(e.target.value) })} />
            <TextField label="Max Delivery Days" type="number" value={shippingForm.max_delivery_days} onChange={e => setShippingForm({ ...shippingForm, max_delivery_days: Number(e.target.value) })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenShipping(false)}>Cancel</Button>
          <Button variant="contained" onClick={async () => { if (editingShipping) await settingsAPI.shipping.update(editingShipping.id, shippingForm); else await settingsAPI.shipping.create(shippingForm); setOpenShipping(false); load(); }}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openTax} onClose={() => setOpenTax(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingTax ? 'Edit Tax' : 'Add Tax'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Name" value={taxForm.name} onChange={e => setTaxForm({ ...taxForm, name: e.target.value })} />
            <TextField label="Percentage" type="number" value={taxForm.percentage} onChange={e => setTaxForm({ ...taxForm, percentage: Number(e.target.value) })} />
            <TextField label="Country" value={taxForm.country} onChange={e => setTaxForm({ ...taxForm, country: e.target.value })} />
            <TextField label="State" value={taxForm.state} onChange={e => setTaxForm({ ...taxForm, state: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTax(false)}>Cancel</Button>
          <Button variant="contained" onClick={async () => { if (editingTax) await settingsAPI.tax.update(editingTax.id, taxForm); else await settingsAPI.tax.create(taxForm); setOpenTax(false); load(); }}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openReturn} onClose={() => setOpenReturn(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingReturn ? 'Edit Return Policy' : 'Add Return Policy'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Name" value={returnForm.name} onChange={e => setReturnForm({ ...returnForm, name: e.target.value })} />
            <TextField label="Description" value={returnForm.description} onChange={e => setReturnForm({ ...returnForm, description: e.target.value })} />
            <TextField label="Return Window Days" type="number" value={returnForm.return_window_days} onChange={e => setReturnForm({ ...returnForm, return_window_days: Number(e.target.value) })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenReturn(false)}>Cancel</Button>
          <Button variant="contained" onClick={async () => { if (editingReturn) await settingsAPI.returnPolicies.update(editingReturn.id, returnForm); else await settingsAPI.returnPolicies.create(returnForm); setOpenReturn(false); load(); }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
