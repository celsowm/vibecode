import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AddIcon from '@mui/icons-material/Add';
import PaymentIcon from '@mui/icons-material/Payment';
import {
  createFee,
  fetchCharges,
  fetchFees,
  generateCharges,
  registerPayment,
} from '../../api/finance.api';
import { StatusChip } from '../../components/StatusChip';
import type { ChargeStatus } from '../../types';

export function ChargesPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ChargeStatus | ''>('');
  const chargesQuery = useQuery({
    queryKey: ['charges', statusFilter],
    queryFn: () => fetchCharges(statusFilter ? { status: statusFilter } : undefined),
  });
  const feesQuery = useQuery({ queryKey: ['fees'], queryFn: fetchFees });

  const [feeDialogOpen, setFeeDialogOpen] = useState(false);
  const now = new Date();
  const [feeForm, setFeeForm] = useState({
    description: '',
    amount: '',
    referenceMonth: now.getMonth() + 1,
    referenceYear: now.getFullYear(),
    dueDay: 10,
  });

  const [paymentTarget, setPaymentTarget] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState({ amountPaid: '', method: 'PIX' });

  const createFeeMutation = useMutation({
    mutationFn: createFee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fees'] });
      setFeeDialogOpen(false);
    },
  });

  const generateChargesMutation = useMutation({
    mutationFn: generateCharges,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['charges'] }),
  });

  const paymentMutation = useMutation({
    mutationFn: registerPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      setPaymentTarget(null);
      setPaymentForm({ amountPaid: '', method: 'PIX' });
    },
  });

  return (
    <div>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Financeiro - Cobranças</Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => setFeeDialogOpen(true)}>
          Nova Taxa Mensal
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Taxas cadastradas
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Descrição</TableCell>
              <TableCell>Mês/Ano</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {feesQuery.data?.map((fee) => (
              <TableRow key={fee.id}>
                <TableCell>{fee.description}</TableCell>
                <TableCell>
                  {fee.referenceMonth}/{fee.referenceYear}
                </TableCell>
                <TableCell>R$ {Number(fee.amount).toFixed(2)}</TableCell>
                <TableCell align="right">
                  <Button size="small" onClick={() => generateChargesMutation.mutate(fee.id)}>
                    Gerar cobranças
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Box sx={{ mb: 2 }}>
        <TextField
          select
          label="Filtrar status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ChargeStatus | '')}
          sx={{ width: 200 }}
          size="small"
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="PENDING">Pendente</MenuItem>
          <MenuItem value="PAID">Pago</MenuItem>
          <MenuItem value="OVERDUE">Atrasado</MenuItem>
          <MenuItem value="CANCELED">Cancelado</MenuItem>
        </TextField>
      </Box>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Unidade</TableCell>
              <TableCell>Taxa</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Vencimento</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {chargesQuery.data?.map((charge) => (
              <TableRow key={charge.id}>
                <TableCell>{charge.unit?.identifier}</TableCell>
                <TableCell>{charge.fee?.description}</TableCell>
                <TableCell>R$ {Number(charge.amount).toFixed(2)}</TableCell>
                <TableCell>{new Date(charge.dueDate).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>
                  <StatusChip status={charge.status} />
                </TableCell>
                <TableCell align="right">
                  {charge.status !== 'PAID' && charge.status !== 'CANCELED' && (
                    <IconButton
                      title="Registrar pagamento"
                      aria-label={`Registrar pagamento ${charge.unit?.identifier ?? charge.id}`}
                      onClick={() => {
                        setPaymentTarget(charge.id);
                        setPaymentForm({ amountPaid: charge.amount, method: 'PIX' });
                      }}
                    >
                      <PaymentIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={feeDialogOpen} onClose={() => setFeeDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Nova Taxa Mensal</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Descrição"
            value={feeForm.description}
            onChange={(e) => setFeeForm({ ...feeForm, description: e.target.value })}
          />
          <TextField
            label="Valor"
            type="number"
            value={feeForm.amount}
            onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
          />
          <TextField
            label="Mês de referência"
            type="number"
            value={feeForm.referenceMonth}
            onChange={(e) => setFeeForm({ ...feeForm, referenceMonth: Number(e.target.value) })}
          />
          <TextField
            label="Ano de referência"
            type="number"
            value={feeForm.referenceYear}
            onChange={(e) => setFeeForm({ ...feeForm, referenceYear: Number(e.target.value) })}
          />
          <TextField
            label="Dia de vencimento"
            type="number"
            value={feeForm.dueDay}
            onChange={(e) => setFeeForm({ ...feeForm, dueDay: Number(e.target.value) })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeeDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() =>
              createFeeMutation.mutate({ ...feeForm, amount: Number(feeForm.amount) })
            }
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!paymentTarget} onClose={() => setPaymentTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Registrar Pagamento</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Valor pago"
            type="number"
            value={paymentForm.amountPaid}
            onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
          />
          <TextField
            select
            label="Método"
            value={paymentForm.method}
            onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
          >
            <MenuItem value="PIX">PIX</MenuItem>
            <MenuItem value="BOLETO">Boleto</MenuItem>
            <MenuItem value="DINHEIRO">Dinheiro</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentTarget(null)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() =>
              paymentMutation.mutate({
                chargeId: paymentTarget!,
                amountPaid: Number(paymentForm.amountPaid),
                method: paymentForm.method,
              })
            }
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
