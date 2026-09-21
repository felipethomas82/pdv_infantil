# Proposal

## Why

O PDV Infantil Offline foi construído com um SDD manual (`spec.md`, `plan.md`, `tasks.md` na raiz). Esses arquivos estão desatualizados em relação ao código: descrevem um `storage.json` que não é mais usado em runtime, um botão de toggle onde existe senha, e preços que divergem do critério de aceite CA01. Sem specs versionadas, nenhuma mudança futura pode declarar o que altera nem ser validada.

Esta mudança migra o projeto para o OpenSpec, criando a baseline de specs a partir do comportamento real do sistema e corrigindo os defeitos de consistência encontrados na auditoria.

## What Changes

**Estrutura OpenSpec**
- Criar as capabilities `operacao-venda` e `administracao-caixa` em `openspec/specs/` (via delta specs desta mudança).
- Mover `spec.md`, `plan.md`, `tasks.md` e `relato.md` para `docs/legacy/`, preservando o conteúdo como registro histórico do laboratório SDD manual.
- Preencher o bloco `context` de `openspec/config.yaml` com stack, convenções e comandos do projeto.

**Correções de consistência (defeitos reais encontrados na auditoria)**
- **Preços canônicos em fonte única**: `storage.js` passa a ser a única definição de catálogo/preços. **BREAKING**: os valores atuais (`chaveiro` R$ 5,00, `mandala` R$ 10,00, `borracinha` R$ 5,00) sobem para R$ 10,00 / R$ 18,00 / R$ 12,00, restaurando o critério de aceite CA01. Carrinhos já salvos em `localStorage` mantêm o preço antigo por item.
- **BREAKING**: remover `storage.json` — artefato morto, já que o runtime lê apenas `localStorage` via `storage.js`.
- **Fonte única de estado**: eliminar o fallback duplicado em `script.js` (`readDefaultState`, ramos `else` de `loadState`/`saveState`/`addToCart`/`updateCartQuantity`/`completeSale`/`updateProduct`). Hoje as duas implementações podem divergir silenciosamente.
- **Deduplicar totais do caixa**: `boxTotals` passa a ser a fonte única; `cashbox.totalCash/totalPix/totalGeneral` deixam de ser gravados em paralelo e passam a ser derivados na leitura.
- **Corrigir `initialStock`**: `updateProduct` faz `initialStock = max(initialStock, stock)`, inflando o baseline de estoque do "Novo Dia" a cada salvamento. `initialStock` só muda por ação explícita do operador.
- **Fechar o modal de pagamento** ao finalizar a venda e limpar o valor recebido na tela; hoje a venda conclui com o modal aberto e o input preenchido.
- **Reset de caixa coerente**: `resetCashbox` também reinicia o valor recebido e re-renderiza catálogo, carrinho e extrato.
- **Confirmar "Limpar carrinho"**: ação destrutiva hoje disparada em um único toque, sem voltar o estoque em caso de engano do operador.
- **Entrada de dinheiro**: aceitar vírgula decimal (`25,00`), coerente com o placeholder exibido; hoje o `type="number"` só aceita ponto.
- **Codificação**: corrigir a mensagem com mojibake em `script.js` (`N�o foi poss�vel...`) para UTF-8.
- **Acessibilidade dos modais**: fechar com `Esc`, focar o primeiro elemento ao abrir e devolver o foco ao gatilho ao fechar.

**Divergências da spec manual aceitas na baseline** (não corrigidas nesta mudança, registradas em `design.md`)
- Estoque é reservado ao **adicionar ao carrinho**, não na confirmação da venda (difere de RF03).
- Reset do caixa é protegido por **senha**, não por toggle (difere de RF06).

## Capabilities

### New Capabilities
- `operacao-venda`: catálogo visual em grid com foto/nome/preço/estoque, reserva de estoque ao adicionar, carrinho com quantidade e total destacado, edição manual do valor a cobrar, dinheiro com calculadora de troco, PIX com QR Code dinâmico do valor, finalização da venda e limpeza do carrinho — operando 100% offline e touch-first.
- `administracao-caixa`: fechamento de caixa (totais geral/dinheiro/PIX, ranking por produto, extrato detalhado), "Novo Dia" protegido por senha com restauração do estoque inicial, gerenciamento de estoque e preço por produto, e a persistência local em `localStorage` de vendas e totais.

### Modified Capabilities
- Nenhuma. O projeto não possui specs em `openspec/specs/` (`openspec list --specs` retorna "No specs found"), então todas as requirements entram como `ADDED`.

## Impact

**Código**
- `storage.js`: catálogo/preços canônicos, `initialStock` explícito, remoção da duplicação `boxTotals`/`cashbox`, reset de caixa completo.
- `script.js`: remoção dos fallbacks duplicados, fechamento do modal ao finalizar, parse pt-BR do valor recebido, confirmação do "Limpar carrinho", correção de encoding, foco/`Esc` nos modais.
- `index.html` / `style.css`: ajustes de diálogo modal e do input de valor recebido.

**Dados**
- `storage.json` é removido (o app já persiste apenas em `localStorage`, chave `pdv_infantil_state`).
- Estados existentes em `localStorage` de operadores atuais passam a exibir os preços canônicos apenas após reset de caixa ou edição em "Gerenciar Produtos".

**Documentação**
- `spec.md`, `plan.md`, `tasks.md`, `relato.md` movidos para `docs/legacy/`.
- `openspec/config.yaml` ganha o bloco `context`.

**Sem impacto em**: dependências externas (`modules/qrcode.min.js`, Font Awesome permanecem locais), serviços, APIs ou conectividade — o requisito de zero backend é preservado.
