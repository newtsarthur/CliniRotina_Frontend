# CliniRotina Audit Action Log

## 2026-06-26

### Ação 1 - Início do hardening de ações clínicas
- Pedido: começar pela correção mais importante da auditoria, mantendo o sistema funcional.
- Escopo escolhido: marcação/desmarcação de medicamento por paciente.
- Motivo: hoje o front grava em `patient_daily_actions` e `patient_logs` separadamente, o que permite duplicidade ou estado parcial em falha de rede, clique duplo ou concorrência entre aparelhos.
- Estratégia: mover essa operação para uma RPC transacional no banco, com data clínica e índices únicos por paciente/medicamento/dia.

### Ação 2 - Migration transacional de medicamento
- Arquivo: `supabase/migrations/20260626121000_transactional_medication_checks.sql`.
- Adicionado: `current_clinic_date()`, colunas `action_date` e `taken_date`, índices únicos de idempotência e RPC `record_medication_check`.
- Adicionado: `notification_outbox` para eventos futuros de n8n/WhatsApp com `idempotency_key`.
- Cuidado aplicado: a migration remove duplicatas históricas antes de criar índices únicos, evitando falha caso o banco já tenha recebido cliques repetidos.

### Ação 3 - Front passou a usar a rotina transacional
- Arquivos: `src/pages/Dashboard.tsx` e `src/pages/Plano.tsx`.
- Alterado: marcação de medicamento saiu de inserts/deletes diretos em duas tabelas e passou a chamar `record_medication_check`.
- Alterado: leituras diárias passaram a usar `action_date` e `taken_date`.
- Impacto esperado: clique duplo, reconexão e múltiplos aparelhos não devem mais duplicar o check do mesmo medicamento no mesmo dia.

### Ação 4 - Tipos Supabase sincronizados
- Arquivo: `src/integrations/supabase/types.ts`.
- Adicionado: colunas `action_date`, `taken_date`, tabela `notification_outbox` e funções `current_clinic_date`/`record_medication_check`.
- Motivo: manter build e autocomplete coerentes com a migration nova.

### Ação 5 - Progresso do tratamento lê datas clínicas
- Arquivo: `src/components/dashboard/TreatmentProgress.tsx`.
- Alterado: cálculo de medicamentos tomados usa `taken_date`/`action_date` quando disponíveis, preservando fallback para dados antigos.
- Motivo: impedir que o progresso diário seja distorcido por diferenças entre horário local e UTC.

### Ação 6 - Validação local
- Comando: `npm.cmd run build`.
- Resultado: passou.
- Observação: o Vite manteve apenas aviso de chunk grande e Browserslist desatualizado.

### Ação 7 - Lint local
- Comando: `npm.cmd run lint`.
- Resultado: passou sem erros.
- Observação: restam 7 warnings antigos de Fast Refresh em componentes `src/components/ui/*`, sem relação com a alteração clínica.

### Ação 8 - Monitoramento médico usa datas clínicas
- Arquivos: `src/components/prontuario/PatientMonitoring.tsx` e `src/components/exames/HistoryTimeline.tsx`.
- Alterado: histórico de ações e medicamentos passou a preferir `action_date`/`taken_date`.
- Mantido: fallback para `created_at`/`taken_at` em registros antigos.
- Motivo: médico não deve ver adesão diária mudando por diferença de timezone.

### Ação 9 - Revalidação após monitoramento médico
- Comando: `npm.cmd run build`.
- Resultado: passou.
- Comando: `npm.cmd run lint`.
- Resultado: passou sem erros; permanecem os mesmos 7 warnings antigos de Fast Refresh.
