# Projeto: PDV Infantil Offline - Feira do Empreendedor

---

## Fase 1: Estrutura Base e Layout (HTML/CSS)
- [x] **Task 1.1:** Criar a estrutura base do `index.html` com cabeçalho da feira, área de catálogo, painel lateral do carrinho e modal de fechamento.
- [x] **Task 1.2:** Criar estilos em `style.css` com paleta agradável/lúdica, botões de toque grandes (mínimo 48px), visualização em CSS Grid responsiva (mobile/tablet/desktop).
- [x] **Task 1.3:** Criar arquivo `script.js` sem código ainda e linkar em index.html.
- [x] **Task 1.4:** Linkar as bibliotecas da pasta modules em index.html.
- [x] **Task 1.5:** Criar arquivo storage.json sem código ainda.

---

## Fase 2: Catálogo de Produtos e Gestão de Carrinho (JavaScript)
- [x] **Task 2.1:** Definir estrutura inicial de produtos de crochê (chaveiro, mandala, borracinha de cabelo) e carregar/salvar estado no módulo `storage.js` usando `localStorage`.
- [x] **Task 2.2:** Implementar renderização dinâmica do catálogo com exibição de estoque e bloqueio visual de produtos esgotados.
- [x] **Task 2.3:** Implementar lógica de adicionar item ao carrinho ao tocar no produto (respeitando limite de estoque).
- [x] **Task 2.4:** Implementar controles de quantidade (`+`, `-`) e remoção de itens no carrinho, atualizando o valor total em tempo real.
- [x] **Task 2.5:** Implementar o carregamento da imagem do produto a partir do nome do arquivo definido no JSON. As fotos estão na pasta photos\.
- [x] **Task 2.6:** Implementar o estado inicial da aplicação e a manutenção dos dados via `storage.js` + `localStorage`, centralizando o estado inicial e a persistência sem depender de JSON em runtime.

---

## Fase 3: Pagamento, Troco e Finalização de Venda
- [x] **Task 3.1:** Implementar seleção de forma de pagamento (Dinheiro ou PIX).
- [x] **Task 3.2:** Implementar calculadora de troco para dinheiro com validação de valor insuficiente.
- [x] **Task 3.3:** Implementar código para gerar dinamicamente a string do PIX e o QR Code com base nessa string.
- [x] **Task 3.4:** Implementar função de finalizar venda: decrementar estoque, registrar venda no histórico, limpar carrinho e emitir mensagem de sucesso.
- [x] **Task 3.5:** Implementar uma opção para alterar o valor do pagamento manualmente.

---

## Fase 4: Manutenção do estoque e preços de produtos
- [x] **Task 4.1:** Implementar tela em que é possível visualizar todos os produtos, suas quantidades e preços.
- [x] **Task 4.2:** Implementar funções para alterar as quantidades dos produtos em estoque.
- [x] **Task 4.3:** Implementar a função para atualização do preço dos produtos.

---

## Fase 5: Fechamento de Caixa e Validação
- [x] **Task 5.1:** Implementar modal/seção de Fechamento de Caixa calculando: Faturamento Total, Total em Dinheiro, Total em PIX.
- [x] **Task 5.2:** Implementar botão de "Novo Dia / Resetar Caixa" com confirmação a partir de uma senha estática inserida no arquivo storage.js.
- [x] **Task 5.3:** Executar bateria de testes manuais contra todos os Critérios de Aceite (CA01 a CA04) e Casos de Borda da `spec.md`.

## Fase 6: Melhorias no design
- [x] **Task 6.1:** Use os ícones de Fontawesome presentes na pasta modules\fontawesome (arquivo all.min.css) para aplicar ícones nos botões e em outras áreas necessárias da aplicação 
- [x] **Task 6.2:** No relatório do fechamento de caixa deve aparecer uma relação de cada produto vendido com o seu valor respectivo, como um extrato de vendas.