# Tasks

## 1. Preparação e segurança

- [x] 1.1 Inicializar git no diretório do projeto e commitar o estado atual (código, docs e `openspec/`); verificar com `git log --oneline` que existe um commit com `spec.md`, `script.js` e `storage.js` versionados
- [x] 1.2 Registrar em `docs/legacy/README.md` que as specs vivem em `openspec/specs/`, que o runbook passou a ser o fluxo OpenSpec e que `storage.json` foi removido; verificar lendo o arquivo e confirmando os três apontamentos
- [x] 1.3 Levantar todas as referências a `storage.json` (código, docs e comentários) e anotar quais precisam ser reescritas; verificar com uma busca por `storage.json` no projeto retornando apenas arquivos já cobertos pelas tasks 2.x e 3.x
- [x] 1.4 Mover `spec.md`, `plan.md`, `tasks.md` e `relato.md` para `docs/legacy/`, preservando o conteúdo original; verificar que os quatro arquivos existem em `docs/legacy/` e que a raiz não os contém mais

## 2. `storage.js` como dono único do estado

- [x] 2.1 Consolidar o catálogo canônico em `DEFAULT_PRODUCTS` (chaveiro R$ 10,00, mandala R$ 18,00, borracinha de cabelo R$ 12,00, em centavos) removendo qualquer outra definição de produto ou preço; verificar que a busca por `1000`, `1800` e `1200` retorna apenas o bloco do catálogo em `storage.js`
- [x] 2.2 Adicionar `stateVersion` ao estado e a migração de preços que só dispara quando o trio legado é reconhecido exatamente (chaveiro 500 / mandala 1000 / borracinha 500); verificar carregando um `pdv_infantil_state` com os preços legados e confirmando que o catálogo passa a exibir R$ 10,00, R$ 18,00 e R$ 12,00
- [x] 2.3 Garantir que a migração não sobrescreva preços editados de propósito; verificar salvando um `pdv_infantil_state` com `chaveiro` a 750 e confirmando que o preço permanece R$ 7,50 após recarregar
- [x] 2.4 Tornar `boxTotals` a única estrutura de totais persistida e derivar `cashbox.totalCash/totalPix/totalGeneral` na leitura por uma função única; verificar que nenhuma escrita em `cashbox.total*` permanece no código e que um estado salvo com apenas `cashbox.total*` continua abrindo com os totais corretos
- [x] 2.5 Corrigir `updateProduct` para que `initialStock` só mude por ação explícita, removendo o `max(initialStock, stock)`; verificar alterando o estoque de um produto com estoque inicial 5 para 8, fazendo um "Novo Dia" e confirmando que o estoque volta a 5
- [x] 2.6 Completar `resetCashbox` para zerar o valor recebido, limpar o carrinho e devolver todos os totais e contadores a zero; verificar que, após o reset com a senha correta, todos os campos de total estão em R$ 0,00 e o carrinho está vazio
- [x] 2.7 Implementar fallback em memória quando `localStorage` estiver indisponível para leitura ou escrita, mantendo o app operável; verificar simulando `localStorage.setItem` lançando exceção e confirmando que uma venda completa continua funcionando na sessão

## 3. `script.js`: sem lógica de estado duplicada

- [x] 3.1 Remover `readDefaultState` e os ramos de fallback de `loadState` e `saveState`, passando a delegar integralmente a `window.pdvStorage`; verificar que o app inicia, carrega o catálogo e persiste uma venda normalmente
- [x] 3.2 Remover os ramos `else` duplicados de `addToCart`, `updateCartQuantity`, `finalizeSale`, `clearCart` e do salvamento em "Gerenciar Produtos"; verificar que as mesmas ações continuam funcionando pelo caminho de `storage.js`
- [x] 3.3 Fechar o modal de pagamento e limpar o campo de valor recebido ao concluir a venda; verificar que, após finalizar, o modal não está mais visível, o campo está vazio e a mensagem de sucesso é exibida
- [x] 3.4 Exigir confirmação no botão "Limpar" do carrinho, devolvendo o estoque das unidades reservadas apenas quando confirmado; verificar que recusar a confirmação mantém carrinho e estoque intactos e que confirmar devolve as unidades
- [x] 3.5 Trocar o campo de valor recebido para aceitar vírgula decimal e converter o valor para centavos; verificar digitando `25,00` e confirmando que o cálculo de troco usa R$ 25,00
- [x] 3.6 Corrigir a codificação da mensagem de erro de leitura do estado para UTF-8; verificar que a mensagem no console não contém mais caracteres corrompidos
- [x] 3.7 Centralizar abrir/fechar dos quatro modais em um único helper com foco no primeiro elemento interativo, retorno do foco ao gatilho e fechamento por `Esc`; verificar em cada modal que `Esc` fecha, o foco entra no diálogo ao abrir e volta ao botão de origem ao fechar
- [x] 3.8 Garantir o invariante de um único modal aberto por vez; verificar abrindo "Editar valor a cobrar" a partir do modal de pagamento e confirmando que não há dois overlays visíveis simultaneamente

## 4. `index.html` e `style.css`

- [x] 4.1 Ajustar o campo de valor recebido para `type="text"` com `inputmode="decimal"`, coerente com o placeholder exibido; verificar que o teclado numérico aparece no dispositivo e que a digitação com vírgula é aceita
- [x] 4.2 Revisar os atributos de visibilidade assistiva dos modais para refletir o estado real após usar o helper de modal; verificar inspecionando cada um dos quatro modais aberto e fechado
- [x] 4.3 Ajustar o CSS apenas no que o helper de modal e o novo campo exigirem, sem alterar o layout aprovado do catálogo e do carrinho; verificar comparando a tela do catálogo e do carrinho antes e depois da mudança

## 5. Limpeza do projeto

- [x] 5.1 Remover `storage.json` do projeto; verificar com `ls` que o arquivo não existe mais e repetir a busca da Task 1.3 sem resultados
- [x] 5.2 Preencher o bloco `context` de `openspec/config.yaml` com stack, restrição de operação offline em `file://`, convenções de idioma e o fluxo de comandos do OpenSpec; verificar que `openspec context --json` continua retornando o root corretamente

## 6. Verificação final

- [x] 6.1 Percorrer manualmente todos os cenários de `openspec/changes/migrar-sdd-manual-para-openspec/specs/operacao-venda/spec.md` no navegador, incluindo o caminho do ajuste manual de valor e o do valor recebido insuficiente; verificar que cada cenário se comporta como descrito
- [x] 6.2 Percorrer manualmente todos os cenários de `openspec/changes/migrar-sdd-manual-para-openspec/specs/administracao-caixa/spec.md`, incluindo o caso CA03 de duas vendas em dinheiro (R$ 20,00 e R$ 10,00) e uma em PIX (R$ 35,00); verificar que o fechamento exibe Total Geral R$ 65,00, Dinheiro R$ 30,00 e PIX R$ 35,00
- [x] 6.3 Verificar a operação sem rede, abrindo o app em `file://` com a rede desativada e executando uma venda completa em dinheiro e uma em PIX; verificar que catálogo, troco, QR Code e finalização funcionam e que nenhuma requisição externa é disparada no painel de rede
- [x] 6.4 Rodar `openspec validate "migrar-sdd-manual-para-openspec" --strict` e confirmar que a mudança é reportada como válida
