# Projeto: PDV Infantil Offline - Feira do Empreendedor

---

## 1. Tecnologias Utilizadas
* **HTML5:** Em um arquivo único (`index.html`).
* **CSS3 Moderno:** Flexbox e CSS Grid para layout touch-friendly responsivo, variáveis CSS para paleta lúdica e agradável (`style.css`).
* **JavaScript Puro (ES6+):** Sem uso de frameworks, sem dependência de build/bundler (`script.js`).
* **Bibliotecas Externas:** Será usada a biblioetca qrcode.min.js da pasta modules para geração do QR Code dinâmicos.
* **Storage:** Módulo `storage.js` com o estado inicial da aplicação e todas as funções de manutenção do estado em `localStorage`.

---

## 2. Estrutura de Arquivos
```text
pdv-croche-sdd/
├── spec.md          # Especificação de Requisitos (SDD)
├── plan.md          # Plano Técnico de Arquitetura
├── tasks.md         # Checklist de Decomposição de Tarefas
├── relato.md        # Relato de reflexão do laboratório
├── storage.js       # Módulo de estado inicial e persistência em localStorage
├── index.html       # Estrutura visual da aplicação
├── style.css        # Estilos, temas e responsividade
├── script.js        # Regras de negócio, carrinho, troco e persistência
├── modules\         # Pasta com bibliotecas JS externas
└── photos\          # Pasta com as fotos dos produtos
```

---

## 3. Decisões Técnicas e Arquitetura

1. **Estrutura do Estado Centralizado (Store Pattern Simples):**
   * O módulo `storage.js` expõe um objeto global `window.pdvStorage` com funções para obter o estado, persistir, resetar e manipular carrinho/estoque.
   * O estado central permanece em `localStorage`, usando a chave `pdv_infantil_state`.
   * Sempre que o estado mudar, o `script.js` dispara as funções de renderização (`renderCatalog()`, `renderCart()`, `renderSummary()`) usando os dados retornados pelo storage.

2. **Cálculos Financeiros em Centavos (Integers):**
   * Todos os preços e totais devem ser manipulados internamente como inteiros (centavos) para evitar imprecisões clássicas de ponto flutuante no JavaScript (exemplo: `0.1 + 0.2 = 0.30000000000000004`).
   * A formatação para `R$ XX,XX` é feita apenas na camada de exibição com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.

3. **Interface Dividida em 2 Painéis Principais:**
   * **Lado Esquerdo / Superior:** Catálogo de produtos com botões em grade (Grid).
   * **Lado Direito / Inferior:** Carrinho de compras, seletor de pagamento e fechamento de venda.
   * **Modal / Aba Sobreposta:** Fechamento de Caixa com estatísticas da feira.
   * **Modal / Aba Sobreposta:** Manutenção do estoque dos produtos.

4. **Geração do QR Code Dinâmico do PIX**
   * O QRCode do PIX será gerado em tempo de execução com base em uma String pré definida. Abaixo seguem instruções de como essa funcionalidade pode ser implantada.

   QR CODE DINAMICO
   Para alterar o valor offline via JavaScript com sucesso, o script precisa fazer 3 passos em sequência:
   1. Remover o CRC16 antigo (os últimos 4 caracteres).
   2. Injetar ou alterar a tag de valor (54 + tamanho + novo valor) no meio da string.
   3. Calcular o novo CRC16 de toda a string modificada e colá-lo no final.
   4. A seguir segue uma função e códigos de exemplo para gerar a string modificada do PIX e o QRCode.

   // Função para calcular o CRC16 (Algoritmo CCITT) requerido pelo Banco Central
   function calcularCRC16(payload) {
      let crc = 0xFFFF;
      for (let i = 0; i < payload.length; i++) {
         crc ^= (payload.charCodeAt(i) << 8);
         for (let j = 0; j < 8; j++) {
               if ((crc & 0x8000) !== 0) {
                  crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
               } else {
                  crc = (crc << 1) & 0xFFFF;
               }
         }
      }
      return crc.toString(16).toUpperCase().padStart(4, '0');
   }

   // Função que altera ou insere o valor em um Pix Estático existente
   function alterarValorPixEstatico(payloadOriginal, novoValor) {
      // 1. Remove o CRC16 antigo (sempre os 4 últimos caracteres após o '6304')
      let payloadSemCRC = payloadOriginal.substring(0, payloadOriginal.indexOf("6304") + 4);

      // Formata o valor para o padrão aceito (Ex: 15.50)
      let valor Formatado = parseFloat(novoValor).toFixed(2);
      let tamanhoValor = valorFormatado.length.toString().padStart(2, '0');
      let tagValor = `54${tamanhoValor}${valorFormatado}`;

      // 2. Se já existia a tag 54 no código, substitui. Se não, insere antes da tag do país (5802BR)
      if (payloadSemCRC.includes("54")) {
         // Encontra onde começa a tag 54 e onde termina o valor antigo para substituir
         let regexValor = /54\d{2}\d+\.\d{2}/;
         payloadSemCRC = payloadSemCRC.replace(regexVariance, tagValor);
      } else {
         // Insere a tag de valor logo antes da tag 5802BR (País)
         payloadSemCRC = payloadSemCRC.replace("5802BR", `${tagValor}5802BR`);
      }

      // 3. Recalcula o CRC16 sobre o novo texto e junta tudo
      let novoCRC = calcularCRC16(payloadSemCRC);
      return payloadSemCRC + novoCRC;
   }

   // --- EXEMPLO DE USO ---
   // Um payload estático qualquer gerado sem valor no banco:
   const pixDoBanco = "00020101021126360014br.gov.bcb.pix0114+551199999999952040005802BR5912NomeVendedor6009SAOPAULO62070503***6304B5F1";

   // Injetando o valor de R$ 35,90 em tempo de execução:
   const novoPixComValor = alterarValorPixEstatico(pixDoBanco, 35.90);
   console.log(novoPixComValor); 
   // Pronto! Esse novo texto gerado pode ser convertido em QR Code na tela.

   //Exemplo para criação do QR Code com a biblioteca qrcode.min.js
   var qrcode = new QRCode("test", {
      text: "http://jindo.dev.naver.com/collie",
      width: 128,
      height: 128,
      colorDark : "#000000",
      colorLight : "#ffffff",
      correctLevel : QRCode.CorrectLevel.H
   });

   //outras funcoes da biblioeta do qrcode
   qrcode.clear(); // clear the code.
   qrcode.makeCode("http://naver.com"); // make another code.

4. **Payload inicial da String do PIX (para QR Code dinâmico)**
   * A String com o payload inicial do PIX fica registrada no estado inicial salvo em `storage.js`, dentro do objeto principal do estado da aplicação, e é reutilizada em tempo de execução pelo `script.js` para gerar a imagem do QR Code.
