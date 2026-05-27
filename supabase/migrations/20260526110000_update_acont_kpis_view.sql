-- Migration: 20260526110000_update_acont_kpis_view
--
-- Recria vw_acont_kpis_banco incluindo todas as contas (ativas e inativas),
-- com contagem separada de ativas.
-- Necessário DROP + CREATE porque adicionamos a coluna qtd_contas_ativas.

drop view if exists public.vw_acont_kpis_banco;

create view public.vw_acont_kpis_banco as
select
  c.banco,
  count(distinct c.id)                                         as qtd_contas,
  count(distinct c.id) filter (where c.ativo = true)           as qtd_contas_ativas,
  coalesce(
    sum(
      case when c.ativo = true
        then s.disponibilidade_exercicio + s.disponibilidade_anterior
        else 0
      end
    ), 0
  )                                                            as total_disponibilidade,
  coalesce(
    sum(
      case when c.ativo = true
        then s.razao_exercicio + s.razao_anterior
        else 0
      end
    ), 0
  )                                                            as total_razao
from public.acont_contas c
left join public.acont_saldos s on s.conta_id = c.id
group by c.banco;

comment on view public.vw_acont_kpis_banco is
  'Totais por banco — todas as contas, saldos apenas das ativas.';
