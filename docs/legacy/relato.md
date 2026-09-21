# Relato de Execução do Laboratório SDD

## Perguntas contidas no PDF

### 1. Em algum momento a IA gerou código que não correspondia ao que a especificação pedia? O que vocês fizeram?
Sim. Foi necessário ajustar detalhes do fluxo de pagamento, como o bloqueio da venda com valor recebido insuficiente e a atualização do total após editar o valor a cobrar. Alguns bugs genéricos de interface, como manter o estado quando a página era recarregada. 

### 2. A especificação escrita no início do laboratório precisou ser revisada durante o processo? Por quê?
Sim. A especificação precisou ser revisada principalmente na parte da persistência dos dados. A proposta inicial era persistir os dados em arquivo, contudo nào foi possível com o app totalmente offline. O requisito de funcionamento offline foi mantido, mas a arquitetura mudou: em vez de um arquivo JSON carregado durante a execução, o projeto passou a usar `storage.js` e `localStorage`.

Também foram acrescentados e refinados requisitos percebidos durante o uso, como a edição do valor a cobrar em um modal, o preenchimento automático do valor recebido, o gerenciamento de estoque e preços, o extrato detalhado no fechamento de caixa e melhorias de contraste e organização dos botões. Essas revisões foram necessárias para que a solução funcionasse no navegador e fosse mais simples de operar. Tais ajustes foram sendo feitos ao longo que o app ia sendo testado manualmente.

### 3. O que teria acontecido se vocês tivessem pedido a calculadora inteira de uma vez, sem especificação nem decomposição em tarefas?
Provavelmente a implementação teria sido mais genérica e menos adequada. Poderiam faltar regras importantes, como limitar a venda pelo estoque, bloquear pagamento em dinheiro insuficiente, persistir dados offline, gerar o PIX com o valor correto e separar ações de atendimento das ações administrativas.

Sem a decomposição em tarefas, seria mais difícil identificar em qual etapa ocorreu cada problema e corrigir apenas o trecho necessário. A especificação e as fases permitiram validar catálogo, carrinho, pagamento, gerenciamento e fechamento de caixa de forma progressiva, evitando que uma mudança em uma parte do PDV quebrasse funcionalidades já implementadas.
