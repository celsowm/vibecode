# Checklist de conformidade com SRP

Data da avaliacao: 2026-07-01

## Escopo

Este relatorio avalia a conformidade da aplicacao com o Single Responsibility Principle (SRP) a partir da estrutura atual do monorepo:

- `server/src`: API NestJS, modulos de dominio, controllers, services, DTOs, guards e filtros.
- `client/src`: SPA React, paginas por dominio, clientes HTTP, contexto de autenticacao, componentes compartilhados e rotas.
- `tests/e2e`: suite Playwright de fluxo completo.

SRP foi aplicado aqui como: cada modulo, classe, funcao ou componente deve ter um motivo principal para mudar. Quando um arquivo muda por motivos de dominio, infraestrutura, layout, formulario, autorizacao e orquestracao ao mesmo tempo, o risco de violacao aumenta.

## Resumo executivo

Status geral: parcialmente conforme.

O backend esta mais proximo de SRP: usa modulos por dominio, controllers finos, DTOs dedicados, guards/decorators para autorizacao declarativa e `PrismaService` como infraestrutura compartilhada. Os principais pontos de atencao no backend sao services que acumulam consulta, regra de negocio, autorizacao contextual e tarefas agendadas.

O frontend tem separacao boa entre API clients, rotas, contexto e componentes compartilhados, mas as paginas principais concentram muitas responsabilidades. `UnitsListPage`, `ChargesPage` e `BookingsPage` fazem busca de dados, mutations, estado de dialogos, montagem de payloads, transformacao de datas/valores, tratamento de erro e renderizacao em um unico componente.

## Checklist geral

| Item | Status | Evidencia | Acao recomendada |
|---|---|---|---|
| Separacao por dominio no backend | Conforme | `server/src/auth`, `users`, `residents`, `units`, `finance`, `bookings`, `announcements`, `maintenance` | Manter o padrao modulo-por-dominio para novas features. |
| Controllers focados em HTTP | Conforme | Controllers delegam operacoes aos services e aplicam decorators/guards | Evitar colocar regra de negocio em controllers futuros. |
| DTOs separados de entidades e persistencia | Conforme | `server/src/**/dto/*.ts` | Manter DTOs sincronizados com validacoes e tipos do cliente. |
| Infraestrutura Prisma isolada | Conforme | `server/src/prisma/prisma.service.ts` e `PrismaModule` | Manter acesso direto ao Prisma dentro de services ou repositories dedicados, nao em controllers. |
| Autorizacao declarativa por rota | Parcial | `RolesGuard`, `@Roles`, `CurrentUser`; services tambem fazem checks contextuais | Extrair politicas repetidas para helpers/services quando crescerem. |
| Services com uma responsabilidade clara | Parcial | `ChargesService`, `BookingsService`, `MaintenanceService` combinam consultas, regras, permissoes e efeitos | Separar regras complexas em policy/domain services conforme evolucao. |
| Tarefas agendadas separadas de casos de uso HTTP | Nao conforme leve | `ChargesService.markOverdueCharges` mistura cron com service de cobrancas | Extrair `ChargesOverdueJob` ou `ChargeStatusScheduler`. |
| Frontend com API clients separados | Conforme | `client/src/api/*.api.ts` e `api/client.ts` | Manter chamadas HTTP fora das paginas. |
| Componentes compartilhados reutilizaveis | Conforme | `StatusChip`, `ConfirmDialog`, `RoleGuard` | Expandir este padrao para formularios e tabelas repetidas. |
| Paginas React com responsabilidade unica | Parcial/nao conforme | `UnitsListPage`, `ChargesPage`, `BookingsPage` concentram UI, estado, mutations e payloads | Dividir em hooks, formularios e componentes de tabela. |
| Autenticacao client isolada | Parcial | `AuthContext` controla estado; `api/client.ts` tambem limpa storage e redireciona em 401 | Centralizar efeitos de logout/expiracao para evitar dois motivos de mudanca. |
| Formatacao e transformacao de dados separadas | Parcial | Datas e moeda formatadas inline em paginas | Criar utilitarios `formatCurrency`, `formatDateTimePtBr`, etc. |
| Tipos compartilhados do cliente | Conforme | `client/src/types/index.ts` | Avaliar geracao/compartilhamento com DTOs se a API crescer. |
| Testes como contrato de fluxo | Conforme | `server/test`, `tests/e2e`, Playwright isolado | Adicionar testes focados ao extrair hooks/policies para preservar comportamento. |

## Backend

### Pontos conformes

- A organizacao por dominio reduz motivos de mudanca cruzados. Exemplo: reservas ficam em `bookings`, financeiro em `finance`, manutencao em `maintenance`.
- Controllers sao majoritariamente adaptadores HTTP: recebem params/body/user e chamam services.
- Guards, decorators e filtro global isolam preocupacoes transversais:
  - `server/src/common/guards/roles.guard.ts`
  - `server/src/common/decorators/*.ts`
  - `server/src/common/filters/http-exception.filter.ts`
- DTOs mantem validacao de entrada fora dos services.

### Pontos de atencao

#### `ChargesService`

Arquivo: `server/src/finance/charges.service.ts`

Responsabilidades atuais:

- CRUD/listagem de taxas.
- Geracao de cobrancas para todas as unidades.
- Filtro de cobrancas por perfil do usuario.
- Consulta de inadimplencia.
- Cancelamento de cobranca.
- Job diario para marcar cobrancas vencidas.

Risco SRP: o mesmo service muda por motivos de API financeira, regra de geracao, permissao de morador, relatorio e agendamento.

Checklist especifico:

- [x] Mantem regra financeira fora do controller.
- [x] Usa transacoes/consultas via Prisma em uma camada de service.
- [ ] Separar job de vencimento em classe propria.
- [ ] Extrair regra de visibilidade de cobrancas de morador para policy/helper.
- [ ] Considerar `ChargeGenerationService` se a geracao ganhar rateio, descontos, multa ou juros.

#### `PaymentsService`

Arquivo: `server/src/finance/payments.service.ts`

Responsabilidades atuais:

- Registrar pagamento.
- Calcular total pago acumulado.
- Atualizar status da cobranca para `PAID`.
- Listar pagamentos por cobranca.

Risco SRP: aceitavel hoje, mas o calculo de quitacao pode virar regra financeira propria se houver pagamentos parciais, estorno, juros ou multa.

Checklist especifico:

- [x] Isola registro de pagamento em service proprio.
- [x] Atualiza status da cobranca junto ao efeito de pagamento.
- [ ] Extrair calculo de quitacao se a regra crescer.
- [ ] Avaliar transacao no registro de pagamento + atualizacao de cobranca.

#### `BookingsService`

Arquivo: `server/src/bookings/bookings.service.ts`

Responsabilidades atuais:

- Validar intervalo de reserva.
- Detectar conflito de horario.
- Criar reserva.
- Filtrar reservas.
- Cancelar reserva com regra de permissao contextual.

Risco SRP: baixo a medio. O service ainda esta coeso no dominio de reservas, mas mistura regra de agenda e policy de cancelamento.

Checklist especifico:

- [x] Regra de conflito fica fora do controller.
- [x] Criacao usa transacao para evitar conflito logico simples.
- [ ] Extrair `BookingPolicy.canCancel` se permissoes crescerem.
- [ ] Extrair `BookingConflictChecker` se houver regras de horario de area, limite por unidade ou antecedencia.

#### `MaintenanceService`

Arquivo: `server/src/maintenance/maintenance.service.ts`

Responsabilidades atuais:

- Criar chamado.
- Listar chamados por perfil.
- Validar acesso ao detalhe.
- Atualizar status e `resolvedAt`.
- Adicionar comentarios.

Risco SRP: medio. Comentarios e transicao de status sao subdominios que podem evoluir separadamente.

Checklist especifico:

- [x] Acesso do morador e regra de visibilidade ficam no service.
- [x] Include compartilhado reduz duplicacao.
- [ ] Extrair policy de acesso se houver mais perfis/regras.
- [ ] Separar comentarios em `MaintenanceCommentsService` se ganharem edicao, exclusao ou anexos.
- [ ] Separar transicoes de status se houver workflow mais rico.

## Frontend

### Pontos conformes

- Chamadas HTTP estao fora das paginas em `client/src/api`.
- Rotas ficam em `client/src/routes`.
- Autenticacao fica concentrada em `AuthContext`, com `ProtectedRoute` para controle de acesso de pagina.
- Componentes compartilhados simples (`StatusChip`, `ConfirmDialog`, `RoleGuard`) tem responsabilidades claras.

### Pontos de atencao

#### `UnitsListPage`

Arquivo: `client/src/pages/units/UnitsListPage.tsx`

Responsabilidades atuais:

- Buscar unidades e usuarios.
- Criar unidade.
- Excluir unidade.
- Vincular morador existente.
- Criar usuario novo durante vinculacao.
- Remover morador.
- Controlar tres fluxos de dialogo/formulario.
- Renderizar tabela, chips e acoes.

Risco SRP: alto. A pagina muda quando muda tabela, formulario de unidade, formulario de morador, regra de vinculacao, payload de usuario ou fluxo de confirmacao.

Checklist especifico:

- [ ] Extrair `useUnitsPageData` ou hooks menores: `useUnits`, `useCreateUnit`, `useResidentLinking`.
- [ ] Extrair `UnitFormDialog`.
- [ ] Extrair `ResidentLinkDialog`.
- [ ] Extrair `UnitsTable`.
- [ ] Mover payload composto "criar usuario e vincular morador" para hook/caso de uso no client.

#### `ChargesPage`

Arquivo: `client/src/pages/finance/ChargesPage.tsx`

Responsabilidades atuais:

- Buscar taxas e cobrancas.
- Filtrar por status.
- Criar taxa.
- Gerar cobrancas.
- Registrar pagamento.
- Controlar dialogs e formularios.
- Formatar moeda e data.
- Renderizar duas tabelas.

Risco SRP: alto. Taxas, cobrancas e pagamentos sao fluxos diferentes no mesmo componente.

Checklist especifico:

- [ ] Extrair `FeesTable`.
- [ ] Extrair `ChargesTable`.
- [ ] Extrair `FeeFormDialog`.
- [ ] Extrair `PaymentDialog`.
- [ ] Criar hook `useChargesPage` ou hooks por recurso.
- [ ] Mover formatacao para utilitarios.

#### `BookingsPage`

Arquivo: `client/src/pages/bookings/BookingsPage.tsx`

Responsabilidades atuais:

- Buscar areas comuns.
- Buscar reservas.
- Criar area comum.
- Criar reserva.
- Cancelar reserva.
- Tratar erro HTTP de conflito.
- Aplicar permissao visual para cancelar.
- Renderizar tabela e dialogs.
- Converter `datetime-local` para ISO.

Risco SRP: alto. A pagina mistura regras de UI, integracao, autorizacao visual e transformacao de payload.

Checklist especifico:

- [ ] Extrair `BookingsTable`.
- [ ] Extrair `CommonAreaDialog`.
- [ ] Extrair `BookingDialog`.
- [ ] Criar `useBookingsPage` para queries/mutations.
- [ ] Mover regra de `canCancelBooking` para helper testavel.
- [ ] Mover normalizacao de erro de API para utilitario comum.

#### Autenticacao client

Arquivos:

- `client/src/context/AuthContext.tsx`
- `client/src/api/client.ts`

Responsabilidades atuais:

- `AuthContext` gerencia login/logout e storage.
- `api/client.ts` injeta token, limpa storage e redireciona em 401.

Risco SRP: medio. A limpeza de sessao esta duplicada/conceitualmente dividida entre contexto e interceptor.

Checklist especifico:

- [x] Login/logout estao encapsulados.
- [x] Interceptor de request injeta token de forma centralizada.
- [ ] Evitar duplicacao de limpeza de storage.
- [ ] Preferir um `authStorage` pequeno ou evento de expiracao para o contexto reagir ao 401.

## Priorizacao recomendada

1. Extrair componentes e hooks das paginas grandes do frontend.
   Impacto alto, baixo risco se acompanhado por Playwright. Comecar por `ChargesPage` ou `UnitsListPage`.

2. Extrair utilitarios client de formatacao e erro.
   Impacto medio, baixo risco. Reduz duplicacao futura em datas, moeda e mensagens de erro da API.

3. Separar job de vencimento do `ChargesService`.
   Impacto medio, baixo risco. Mantem `ChargesService` focado em casos de uso chamados pela API.

4. Introduzir policies pequenas para permissoes contextuais.
   Impacto medio. Candidatos: `BookingPolicy`, `ChargeVisibilityPolicy`, `MaintenanceAccessPolicy`.

5. Separar subservices somente quando a regra crescer.
   Evitar extracao prematura. `PaymentsService`, `MaintenanceCommentsService` e `ChargeGenerationService` fazem sentido quando houver novas regras reais.

## Checklist para futuras mudancas

Use este checklist em PRs:

- [ ] O arquivo tem um unico motivo principal para mudar?
- [ ] Controller so adapta HTTP e delega regra?
- [ ] Service mistura regra de negocio com tarefa agendada, policy, formatacao ou transporte?
- [ ] DTO valida entrada sem carregar regra de persistencia?
- [ ] Componente React renderiza UI ou tambem orquestra varios casos de uso?
- [ ] Formularios/dialogs grandes estao extraidos quando tem estado proprio?
- [ ] Queries/mutations React Query estao em hooks quando a pagina tem mais de um fluxo?
- [ ] Formatacao de data/moeda/status esta reutilizavel?
- [ ] Regras de permissao usadas em mais de um lugar estao em policy/helper?
- [ ] A extracao proposta melhora clareza sem criar camadas vazias?

## Conclusao

A arquitetura atual tem uma base boa para SRP, especialmente no backend. O maior ganho pratico esta no frontend: transformar paginas grandes em composicoes de hooks, dialogs e tabelas especificas. No backend, a prioridade e manter services coesos por caso de uso e retirar responsabilidades que tendem a mudar por motivos independentes, como jobs agendados e policies de acesso.
