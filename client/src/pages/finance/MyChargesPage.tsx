import { Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { fetchCharges } from '../../api/finance.api';
import { StatusChip } from '../../components/StatusChip';

export function MyChargesPage() {
  const chargesQuery = useQuery({ queryKey: ['my-charges'], queryFn: () => fetchCharges() });

  return (
    <div>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Minhas Cobranças
      </Typography>
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Descrição</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Vencimento</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {chargesQuery.data?.map((charge) => (
              <TableRow key={charge.id}>
                <TableCell>{charge.fee?.description}</TableCell>
                <TableCell>R$ {Number(charge.amount).toFixed(2)}</TableCell>
                <TableCell>{new Date(charge.dueDate).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell>
                  <StatusChip status={charge.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </div>
  );
}
