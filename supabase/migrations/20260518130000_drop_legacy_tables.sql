-- Remove as tabelas do pipeline legado.
-- Pré-condição: 20260518120000_fix_dlob_diagnostico_sem_legado.sql já aplicada,
-- garantindo que vw_dlob_sem_nedl_diagnostico não referencia mais documentos_liquidacao.
--
-- Tabelas removidas:
--   documentos_liquidacao       — cubo SIAFE antigo (DL)
--   normalized_ne_dl_rows       — pipeline legado NE↔DL
--   normalized_dl_ob_rows       — pipeline legado DL↔OB
--   ordens_bancarias            — OBs legado
--   notas_empenho               — NEs legado
--   processos                   — processos legado
--   consolidated_siafe_lineage  — lineage legado agregado
--
-- CASCADE garante que qualquer view residual dependente seja derrubada junto.
-- Após esta migration, as únicas fontes válidas são:
--   normalized_ne_rows, normalized_nedl_rows, normalized_dlob_rows.

drop table if exists public.documentos_liquidacao        cascade;
drop table if exists public.normalized_ne_dl_rows        cascade;
drop table if exists public.normalized_dl_ob_rows        cascade;
drop table if exists public.ordens_bancarias             cascade;
drop table if exists public.notas_empenho                cascade;
drop table if exists public.processos                    cascade;
drop table if exists public.consolidated_siafe_lineage   cascade;
