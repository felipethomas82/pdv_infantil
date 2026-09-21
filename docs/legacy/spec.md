# Projeto: PDV Infantil Offline - Feira do Empreendedor (Crochê)

---

## 1. Contexto
Sistema de Ponto de Venda (PDV) web super simples e 100% offline, projetado especificamente para ser operado por uma criança do 5º ano do Ensino Fundamental durante uma feira escolar de empreendedorismo, onde serão comercializadosa produtos artesanais de crochê (chaveiros, mandalas, etc.)

---

## 2. Requisitos Funcionais (RF)
* **RF01 - Catálogo Visual de Produtos (em grid):** O sistema deve exibir botões grandes com: 
- foto/ícone;
- nome do produto;
- preço unitário pré-cadastrado.
Um toque/clique no produto adiciona automaticamente 1 unidade ao carrinho de compras.
* **RF02 - Gestão do Carrinho em Tempo Real:** O carrinho deve exibir a lista de itens selecionados, quantidade, subtotal por item e o valor Total da Venda em destaque visual (fonte grande e legível). Deve permitir ajustar quantidade (`+` / `-`) ou remover o item.
* **RF03 - Controle Simples de Estoque:** Cada produto possui uma quantidade inicial de estoque. O sistema deve decrementar o estoque após a confirmação da venda e bloquear a adição ao carrinho quando o estoque chegar a zero (indicando visualmente "Esgotado").
* **RF04 - Formas de Pagamento:** O sistema deve suportar duas modalidades de pagamento:
  * **Dinheiro:** Apresenta calculadora de troco com digitação do valor recebido, calculando e exibindo o troco instantaneamente em destaque e um botão grande de confirmação ("Pagamento Confirmado").
  * **PIX:** Exibe o QR Code estático / Chave PIX cadastrada e um botão grande de confirmação ("Pagamento Confirmado").
* **RF05 - Conclusão e Limpeza de Venda:** Ao finalizar a venda, o sistema deve registrar a transação, atualizar o estoque local e limpar o carrinho automaticamente para o próximo cliente.
* **RF06 - Fechamento de Caixa / Relatório da Feira:** O sistema deve ter uma aba/modal de fechamento (protegida por toggle simples) exibindo:
  * Total geral faturado (R$).
  * Total faturado em Dinheiro vs. Total em PIX.
  * Quantidade total de itens vendidos por produto (ranking de vendas).
  * Botão para resetar/reiniciar caixa (com confirmação).

---

## 3. Requisitos Não Funcionais (RNF)
* **RNF01 - 100% Offline (Zero Backend):** A aplicação deve rodar inteiramente no navegador cliente (HTML, CSS e JavaScript puros), sem depender de conexão à internet, servidores ou APIs externas após aberta.
* **RNF02 - Usabilidade Infantil / Touch First:** Interface com botões grandes (alvos de toque mínimos de 48px), contraste acessível, tipografia legível, feedback visual colorido e sem necessidade de digitação textual durante as vendas.
* **RNF03 - Responsividade:** O layout deve funcionar perfeitamente em telas de tablets, smartphones e notebooks (orientação horizontal e vertical).
* **RNF04 - Persistência Local:** Os dados iniciais dos produtos disponíveis, os dados de estoque e histórico de vendas devem persistir em `localStorage` por meio do módulo `storage.js`, para evitar perda de dados caso a aba seja recarregada acidentalmente.

---

## 4. Casos de Borda e Tratamento de Erros
* **CB01 - Venda com Carrinho Vazio:** O botão de "Finalizar Venda" deve permanecer desabilitado se nenhum item estiver no carrinho.
* **CB02 - Dinheiro Recebido Menor que o Total:** Ao selecionar dinheiro, se o valor informado for menor que o total da venda, o sistema deve indicar "Valor insuficiente" em vermelho e desabilitar o botão de confirmar venda.
* **CB03 - Tentativa de Vender Acima do Estoque:** Se um produto tiver estoque esgotado, o botão do item não deve permitir inclusão no carrinho e deve emitir um alerta visual.
* **CB04 - Recarregamento Acidental da Página:** Se a página for atualizada (F5/Reload), o estado do estoque e as vendas anteriores devem ser restaurados via leitura do `localStorage` pelo módulo `storage.js`.

---

## 5. Critérios de Aceite
* **CA01:** Dado que o usuário clica no item "Chaveiro (R$ 10,00)", o carrinho deve exibir 1 unidade e o total deve marcar R$ 10,00.
* **CA02:** Dado que o estoque de um produto é 3 unidades, ao adicionar 3 unidades e finalizar a venda, o botão do produto deve passar a exibir "Esgotado" e ficar desativado.
* **CA03:** Dado que foram realizadas 2 vendas em dinheiro (R$ 20 e R$ 10) e 1 via PIX (R$ 35), o Fechamento de Caixa deve indicar exatamente: Total Geral = R$ 65,00 | Dinheiro = R$ 30,00 | PIX = R$ 35,00.

## 7. Arquitetura de Persistência Atual
* A aplicação não depende mais de um arquivo JSON como fonte de dados em tempo de execução.
* O módulo `storage.js` centraliza o estado inicial da aplicação e todas as funções de leitura/escrita em `localStorage`.
* O `script.js` consome esse módulo para inicializar o estado e alterar o carrinho, estoque e vendas.

---

## 6. Fora de Escopo (Não implementar)
* Cadastro dinâmico complexo de produtos com upload de fotos durante a venda.
* Múltiplos níveis de permissão ou autenticação por login/senha.
* Integração bancária/API com Banco Central para confirmação automática de PIX.
* Emissão de Cupom Fiscal Eletrônico (NFC-e / SAT).
* Leitura de código de barras ou impressora térmica fiscal.
