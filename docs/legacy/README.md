# Documentos legados (SDD manual)

Esta pasta guarda os artefatos do SDD **manual** que o projeto usou antes de migrar para o
OpenSpec. Nada aqui é fonte de verdade: o conteúdo foi preservado apenas como registro
histórico do laboratório e como evidência do processo anterior.

## Onde está a verdade agora

1. **As specs vivem em `openspec/specs/`.** Nenhuma regra de comportamento deve ser lida ou
   editada a partir dos arquivos desta pasta. O `spec.md` daqui foi convertido nas
   capabilities `operacao-venda` e `administracao-caixa`, e é lá que as mudanças passam a
   ser declaradas.
2. **O runbook passou a ser o fluxo OpenSpec.** O `tasks.md` desta pasta era um checklist
   manual, sem vínculo com o código. As tarefas agora nascem dentro de uma *change*:
   `openspec new change "<nome>"` → artefatos (`proposal`, `specs`, `design`, `tasks`) →
   implementação → `openspec archive`. O estado atual é consultado com
   `openspec list` e validado com `openspec validate "<change>" --strict`.
3. **`storage.json` foi removido.** Ele descrevia um estado inicial que o runtime nunca
   leu: o aplicativo é offline e persiste tudo em `localStorage`, na chave
   `pdv_infantil_state`, por meio do módulo `storage.js`. O catálogo canônico
   (`chaveiro` R$ 10,00, `mandala` R$ 18,00, `borracinha de cabelo` R$ 12,00) está em
   `DEFAULT_PRODUCTS` dentro de `storage.js`, que é o único lugar onde produtos e preços
   são definidos.

## O que há aqui

| Arquivo | O que era |
|---|---|
| `spec.md` | Especificação de requisitos (RF/RNF, casos de borda e critérios de aceite) |
| `plan.md` | Plano técnico de arquitetura e decisões de implementação |
| `tasks.md` | Checklist manual de decomposição de tarefas, por fases |
| `relato.md` | Relato de reflexão do laboratório (entregável do trabalho) |

Parte deste conteúdo **já estava desatualizada** quando a migração aconteceu. As
divergências conhecidas estão registradas na seção *Decisions* do `design.md` da change
`migrar-sdd-manual-para-openspec`, que também explica por que duas delas foram mantidas
como estão (estoque reservado ao adicionar ao carrinho e reset de caixa protegido por
senha) em vez de o código voltar a descrever o que este `spec.md` dizia.
