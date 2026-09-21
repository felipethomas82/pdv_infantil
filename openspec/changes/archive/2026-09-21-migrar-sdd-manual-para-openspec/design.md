# Design

## Context

Ver `proposal.md — Why` para a motivação. Os fatos que moldam este design:

- **Sem repositório git** no diretório do projeto (não há `.git`), então não existe rollback automático para as edições de código desta mudança.
- **Sem build/bundler**: os scripts são carregados como `<script src>` clássicos a partir de `file://`. Módulos ES (`import`/`export`) são bloqueados por CORS nesse protocolo, o que fixa o padrão de módulo global (`window.pdvStorage`).
- **Duas fontes de verdade hoje**: `storage.js` (runtime, `localStorage` chave `pdv_infantil_state`) e `storage.json` (morto). Além disso `script.js` reimplementa todo o fallback de leitura/escrita e as mutações de carrinho/venda/produto.
- **Duas estruturas de totais**: `boxTotals` e `cashbox.totalCash/totalPix/totalGeneral` são gravadas em paralelo, com `normalizeState` remendando uma a partir da outra.
- **Catálogo duplicado em três lugares**: `storage.js` (`chaveiro` 500, `mandala` 1000, `borracinha` 500), `storage.json` (1000/1800/1200) e o fallback de `script.js` (1000/1800/1200).
- **OpenSpec já inicializado** (`openspec/config.yaml`, `schema: spec-driven`), porém sem nenhuma spec publicada — por isso todas as requirements desta mudança são `ADDED`.
- **Público-alvo**: uma criança de 5º ano operando um tablet durante uma feira escolar, sem suporte técnico disponível no momento do uso.

## Goals / Non-Goals

**Goals:**

- Baseline de specs que descreve o comportamento real do sistema, utilizável como contrato para mudanças futuras.
- Uma única fonte de verdade para estado, catálogo e totais, eliminando a classe de bug de divergência entre implementações paralelas.
- Corrigir os defeitos de consistência observáveis (preços vs. CA01, `initialStock`, modal não fechado, entrada de valor com vírgula, encoding, foco/`Esc`).
- Preservar integralmente a operação offline em `file://`, sem novas dependências.

**Non-Goals:**

- Reescrever semântica de negócio: o estoque continua sendo reservado no momento de adicionar ao carrinho (ver Decisão 2) e o reset continua protegido por senha.
- Introduzir framework, bundler, servidor local, service worker ou PWA.
- Criar suíte de testes automatizados: o projeto não tem runner, `package.json` nem Node como dependência de runtime, e cada cenário das specs é verificável manualmente.
- Mover `modules/` e `photos/` ou alterar o layout visual.

## Decisions

### 1. Duas capabilities: `operacao-venda` e `administracao-caixa`

Separação pelo **papel operacional**: tudo que acontece com um cliente na frente fica em `operacao-venda`; tudo que o operador faz fora do atendimento (fechamento, novo dia, manutenção de catálogo) fica em `administracao-caixa`.

*Alternativas:* 5 capabilities por requisito (`catalogo-carrinho`, `pagamento`, `gestao-estoque`, `fechamento-caixa`, `persistencia-local`) fragmentaria um app de 3 arquivos e faria toda mudança futura tocar 3–4 deltas. 1 capability única (`pdv-infantil`) misturaria o fluxo do cliente com o administrativo, dificultando declarar impacto em mudanças futuras.

*Consequência:* persistência aparece nos dois lados, formulada onde importa — continuidade da venda em andamento em `operacao-venda`, histórico/totais/catálogo em `administracao-caixa`.

### 2. Baseline descreve o comportamento implementado; divergências semânticas são registradas, não reescritas

Duas divergências entre `spec.md` e o código **não** são corrigidas nesta mudança:

| Divergência | `spec.md` diz | Código faz | Decisão |
|---|---|---|---|
| Baixa de estoque | RF03: decrementar após confirmar a venda | Reserva ao adicionar ao carrinho | Manter reserva |
| Proteção do reset | RF06: "toggle simples" | Senha no estado | Manter senha |

*Rationale:* a reserva no add impede que a mesma unidade entre em dois carrinhos e é o que sustenta o cenário "Venda acima do estoque é impedida". Trocar para baixa na confirmação seria um redesenho de fluxo com risco em cima de um evento ao vivo, não uma correção de consistência. A senha é mais restritiva que o toggle e o requisito de proteção continua atendido.

*Alternativa:* reescrever o código para bater com `spec.md` — rejeitada por risco e por não ser o objetivo da migração. Ambas as divergências ficam explícitas nas specs (`Reserva de estoque ao adicionar ao carrinho`, `Proteção do reset de caixa por senha`) para que uma mudança futura possa revisá-las com intenção.

### 3. Preços canônicos em `storage.js`, com migração pontual do estado legado

Preços passam a existir **apenas** em `DEFAULT_PRODUCTS` (`storage.js`): chaveiro 1000, mandala 1800, borracinha 1200 (em centavos). Isso restaura CA01 (chaveiro R$ 10,00) e alinha com `storage.json`, o registro de preços original do projeto.

*Problema:* um operador com estado salvo guardaria os preços antigos indefinidamente, já que o catálogo só é criado quando não há estado.

*Solução:* introduzir `stateVersion` no estado (`2`) e uma migração em `normalizeState` que sobe os preços **somente** quando o trio legado é reconhecido exatamente (chaveiro 500 / mandala 1000 / borracinha 500). Assim uma alteração de preço feita de propósito em "Gerenciar Produtos" nunca é sobrescrita.

*Alternativas:* forçar preços no reset de caixa (destruiria ajustes legítimos de preço); não migrar (deixaria CA01 falhando para quem já usou o app).

### 4. `storage.js` é o dono único do estado; `script.js` só apresenta e trata eventos

Todo acesso a estado sai de `script.js` para `storage.js`, inclusive as mutações e o estado padrão. `script.js` mantém apenas: resolução de elementos, renderização, listeners e formatação.

*Alternativas:* manter as duas implementações (é exatamente a origem dos bugs atuais — duas lógicas que precisam concordar); migrar para módulos ES com `import`/`export` (bloqueado por CORS em `file://` sem bundler); extrair um terceiro módulo de estado (não reduz risco nem complexidade com 3 arquivos).

### 5. `boxTotals` é a fonte única dos totais; `cashbox.*` deixa de ser gravado

`boxTotals = { geral, dinheiro, pix }` passa a ser o único dado persistido de totais. Os campos `cashbox.totalCash/totalPix/totalGeneral` são derivados na leitura por uma função única, mantendo compatibilidade com estados salvos que os possuem.

*Rationale:* o par redundante é o que exigiu o remendo atual em `normalizeState` (`boxTotals.geral ?? cashbox.totalGeneral`), sintoma clássico de duas fontes do mesmo dado.

### 6. `initialStock` só muda por ação explícita

`updateProduct` deixa de fazer `initialStock = max(initialStock, stock)`. O estoque inicial é o baseline do "Novo Dia" e só é alterado quando o operador o define explicitamente; alterar o `stock` corrente não o infla mais.

*Alternativa:* manter o `max` — impede que o "Novo Dia" reduza o baseline, mas transforma todo salvamento de estoque em mudança silenciosa do baseline (bug atual).

### 7. Convenção normativa bilíngue `DEVE (SHALL)`

O corpo de cada requirement mantém o texto em português e inclui o termo RFC 2119 em inglês: `O sistema DEVE (SHALL) ...`. A convenção está documentada no topo de cada spec.

*Rationale:* o validador do OpenSpec exige `/\\b(SHALL|MUST)\\b/` no corpo do requirement (`dist/core/parsers/requirement-text.js`); sem isso `openspec validate --strict` falha em todos os requirements. Escrever as specs inteiramente em inglês foi rejeitada por ser a documentação de leitura do usuário, em um projeto todo em pt-BR.

### 8. Modais: manter overlay próprio e adicionar gestão de foco/`Esc`

Um helper único passa a concentrar abrir/fechar modal: aplica/remove `hidden`, alterna `aria-hidden`, guarda o elemento de foco anterior, foca o primeiro interativo e trata `Esc`. Invariante: no máximo um modal aberto por vez.

*Alternativa considerada:* migrar para o elemento nativo `<dialog>` com `showModal()`, que entrega `Esc`, foco preso e `::backdrop` de graça. Rejeitada nesta mudança por alterar CSS e a estrutura dos 4 modais em cima de um evento ao vivo, sem possibilidade de teste automatizado — fica como refatoração futura opcional, sem impacto nas specs (comportamento observável idêntico).

### 9. Entrada do valor recebido aceita vírgula

O campo passa a `type="text"` com `inputmode="decimal"`, com parse que normaliza `,` para `.` e arredonda para centavos. Um campo `type="number"` rejeita `,` no navegador, contradizendo o placeholder `Ex.: 25,00` já exibido.

*Alternativa:* manter `type="number"` e trocar o placeholder para `25.00` — pioraria a experiência de uma criança brasileira digitando no tablet.

### 10. `localStorage` indisponível → fallback em memória

Se `localStorage` falhar na leitura ou escrita, o estado passa a viver em memória na sessão, mantendo o app operável (modo privado, cota cheia), com aviso no console.

### 11. Documentos legados vão para `docs/legacy/`, preservados

`spec.md`, `plan.md`, `tasks.md` e `relato.md` são **movidos**, não apagados. O `relato.md` é entregável do laboratório e os outros três são a evidência do SDD manual. Uma nota curta em `docs/legacy/README.md` aponta que as specs vivem em `openspec/specs/` e que o runbook é `openspec` (não mais `tasks.md`).

## Risks / Trade-offs

- **[Sem versionamento]** Nenhum rollback automático para as edições de código → Inicializar `git init` e commitar o estado atual **antes** de tocar em código (Task 1.1), mantendo `docs/legacy/` como segunda rede de segurança para a documentação.
- **[Preço antigo persistido]** Operador com estado legado verá preços antigos até a migração rodar → Migração só dispara quando o trio legado é reconhecido exatamente (Decisão 3); validar com um estado antigo real antes de publicar.
- **[Refatoração do dono do estado]** Concentrar tudo em `storage.js` pode regredir o fluxo de venda → Verificação manual de todos os cenários de `operacao-venda` em sequência (Task 6.1), incluindo o caminho do ajuste manual de valor.
- **[Divergência RF03 mantida]** Item reservado bloqueia estoque enquanto fica no carrinho → Mitigado por "Limpar carrinho" (com confirmação) devolver o estoque e pela continuidade do carrinho após recarga.
- **[Ajuste manual de valor]** `manualPaymentAmount` pode ser menor ou maior que a soma dos itens, e é esse valor que entra nos totais → Registrado explicitamente no cenário "Extrato da venda mais recente primeiro"; o extrato mostra o total cobrado por venda.
- **[Remoção de `storage.json`]** Algum procedimento externo pode depender dele → Verificar referências antes de remover (Task 1.3) e registrar a remoção no README legado.
- **[Sem teste automatizado]** Só há verificação manual, sujeita a esquecimento → Os cenários das specs são escritos como passos executáveis, e a Task 6.1 percorre os dois specs como checklist.
- **[Fotos grandes]** ~1,5 MB por imagem carregada com `loading="lazy"` → Fora de escopo, registrado em Open Questions.

## Migration Plan

A migração é local, sem deploy.

1. **Backup**: `git init` + commit do estado atual (código e docs).
2. **Specs**: publicar as duas capabilities via `openspec` (esta mudança) — é o que dá sentido a tudo abaixo.
3. **Documentos**: mover os 4 arquivos legados para `docs/legacy/` e adicionar o README de apontamento.
4. **`storage.js`** primeiro (é o dono do estado): catálogo/preços canônicos, `stateVersion` + migração, `initialStock` explícito, `boxTotals` único, reset de caixa completo, fallback em memória.
5. **`script.js`** depois: remover fallbacks duplicados, adotar o helper de modal, parse pt-BR do valor recebido, confirmação no "Limpar carrinho", correção de encoding.
6. **`index.html` / `style.css`**: ajustar o input do valor recebido e o que o helper de modal exigir.
7. **Limpeza**: remover `storage.json`; preencher o `context` de `openspec/config.yaml`.
8. **Verificação**: percorrer os cenários de ambos os specs; validar o preço canônico a partir de um `localStorage` com o estado antigo.
9. **Arquivar** a mudança no OpenSpec para promover as specs para `openspec/specs/`.

**Rollback:** `git checkout .` (ou restaurar do commit inicial). Se o git não estiver disponível, as cópias de `docs/legacy/` e o estado antigo de `localStorage` permitem reconstruir o comportamento anterior manualmente.

## Open Questions

- A senha padrão `1234` deve continuar fixa no código ou ganhar uma tela para ser alterada? (Não afeta specs, abordagem nem tarefas: o requisito atual cobre apenas preservação da senha entre sessões.)
- As fotos (~1,5 MB cada) devem ser comprimidas para uso em tablet antigo? (Assunto de performance; nenhum requisito descreve tempo de carregamento do catálogo.)
- Vale adotar `<dialog>` nativo em uma próxima mudança, substituindo o helper de modal? (Comportamento observável idêntico, portanto sem efeito nos specs.)
