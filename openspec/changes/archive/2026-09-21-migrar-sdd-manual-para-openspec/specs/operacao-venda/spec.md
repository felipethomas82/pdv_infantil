# Spec Delta

## Purpose

Define o que um operador (criança do 5º ano) vê e faz durante o atendimento: escolher produtos no catálogo, montar o carrinho, receber em dinheiro ou PIX e concluir a venda, sem digitação textual obrigatória e sem conexão com a internet.

## ADDED Requirements

### Requirement: Catálogo visual de produtos em grade

O sistema DEVE (SHALL) exibir todos os produtos cadastrados em uma grade de botões grandes, cada um mostrando foto, nome, preço unitário e quantidade disponível em estoque.

#### Scenario: Catálogo carregado com produtos disponíveis

- **WHEN** o aplicativo é aberto com produtos cadastrados e estoque maior que zero
- **THEN** cada produto aparece como um botão na grade exibindo foto, nome, preço formatado em R$ e a quantidade em estoque
- **AND** todos os botões estão habilitados para toque

#### Scenario: Produto esgotado sinalizado e bloqueado

- **WHEN** o estoque de um produto chega a zero
- **THEN** o botão do produto exibe o rótulo "Esgotado"
- **AND** o botão fica desabilitado e não adiciona o produto ao carrinho

#### Scenario: Toque no produto adiciona uma unidade

- **WHEN** o operador toca em um produto com estoque disponível
- **THEN** uma unidade desse produto é adicionada ao carrinho
- **AND** o catálogo e o carrinho são atualizados imediatamente na tela

#### Scenario: Foto ausente não quebra o catálogo

- **WHEN** o arquivo de foto de um produto não é encontrado na pasta local
- **THEN** o botão do produto continua sendo renderizado com nome, preço e estoque

### Requirement: Reserva de estoque ao adicionar ao carrinho

O sistema DEVE (SHALL) reservar uma unidade de estoque no momento em que o produto é adicionado ao carrinho, impedindo que a mesma unidade seja vendida duas vezes.

#### Scenario: Adição decrementa o estoque

- **WHEN** o operador adiciona uma unidade de um produto com estoque 3
- **THEN** o estoque exibido do produto passa a 2

#### Scenario: Venda acima do estoque é impedida

- **WHEN** um produto está com estoque zero e o operador tenta adicioná-lo novamente
- **THEN** nenhuma unidade é adicionada ao carrinho
- **AND** o produto permanece marcado como "Esgotado"

#### Scenario: Remoção do carrinho devolve a reserva

- **WHEN** o operador reduz a quantidade de um item até zero ou remove o item do carrinho
- **THEN** as unidades reservadas voltam para o estoque do produto

### Requirement: Carrinho com quantidade, subtotal e total em destaque

O carrinho DEVE (SHALL) listar os itens selecionados com quantidade, preço unitário, subtotal por item e o valor total da venda em destaque visual, permitindo ajustar quantidades e remover itens.

#### Scenario: Ajuste de quantidade pelos controles

- **WHEN** o operador usa o controle `+` de um item
- **THEN** a quantidade do item é incrementada em 1, respeitando o estoque disponível
- **AND** o subtotal do item e o total da venda são recalculados

#### Scenario: Redução até zero remove o item

- **WHEN** o operador usa o controle `-` em um item com quantidade 1
- **THEN** o item é removido da lista do carrinho

#### Scenario: Carrinho vazio bloqueia o pagamento

- **WHEN** o carrinho não possui itens
- **THEN** o sistema exibe a mensagem de carrinho vazio
- **AND** o botão de pagamento permanece desabilitado

#### Scenario: Venda com uma unidade de R$ 10,00

- **WHEN** o operador adiciona 1 unidade de um produto de R$ 10,00
- **THEN** o carrinho exibe 1 unidade
- **AND** o total exibido é R$ 10,00

### Requirement: Edição manual do valor a cobrar

O sistema DEVE (SHALL) permitir que o operador substitua o valor a cobrar por um valor informado manualmente, sem alterar os itens do carrinho.

#### Scenario: Valor manual passa a ser o total a cobrar

- **WHEN** o operador abre "Editar valor a cobrar", informa R$ 12,00 e confirma
- **THEN** o total exibido no carrinho e no painel de pagamento passa a ser R$ 12,00
- **AND** a venda é registrada com R$ 12,00, independentemente da soma dos itens

#### Scenario: Ajuste manual descartado ao alterar o carrinho

- **WHEN** existe um valor manual definido e o operador adiciona, remove ou limpa itens do carrinho
- **THEN** o valor manual é descartado e o total volta a ser a soma dos itens

#### Scenario: Valor inválido é rejeitado

- **WHEN** o operador informa valor negativo ou não numérico
- **THEN** o sistema não aplica o ajuste e mantém o total anterior

### Requirement: Seleção da forma de pagamento

O sistema DEVE (SHALL) oferecer as formas de pagamento Dinheiro e PIX, exibindo apenas o painel correspondente à forma selecionada.

#### Scenario: Alternância entre Dinheiro e PIX

- **WHEN** o operador seleciona a forma de pagamento PIX
- **THEN** o painel de dinheiro é ocultado e o painel do PIX, com o QR Code, é exibido
- **AND** a forma selecionada fica visualmente marcada

#### Scenario: Forma de pagamento preservada

- **WHEN** o operador seleciona PIX e recarrega a página
- **THEN** a forma de pagamento selecionada continua sendo PIX

### Requirement: Pagamento em dinheiro com calculadora de troco

O sistema DEVE (SHALL) calcular e exibir o troco em destaque a partir do valor recebido, e DEVE (SHALL) bloquear a finalização quando o valor recebido for menor que o total a cobrar.

#### Scenario: Troco calculado corretamente

- **WHEN** o total a cobrar é R$ 15,00 e o operador informa R$ 20,00 em dinheiro
- **THEN** o sistema exibe troco de R$ 5,00
- **AND** o botão de finalizar venda fica habilitado

#### Scenario: Valor recebido insuficiente

- **WHEN** o total a cobrar é R$ 15,00 e o operador informa R$ 10,00 em dinheiro
- **THEN** o sistema exibe "Valor recebido insuficiente" com destaque de erro
- **AND** o botão de finalizar venda fica desabilitado

#### Scenario: Valor recebido com vírgula decimal

- **WHEN** o operador digita `25,00` no campo de valor recebido
- **THEN** o sistema interpreta o valor como R$ 25,00

#### Scenario: Valor recebido sugerido

- **WHEN** o total a cobrar muda e nenhum valor foi informado
- **THEN** o campo de valor recebido é preenchido com o total a cobrar

### Requirement: Pagamento em PIX com QR Code dinâmico do valor

O sistema DEVE (SHALL) gerar, em tempo de execução, um QR Code PIX cujo payload contenha o valor exato da venda e um CRC16 recalculado.

#### Scenario: QR Code gerado com o valor da venda

- **WHEN** o operador seleciona PIX com total a cobrar de R$ 35,90
- **THEN** o sistema monta o payload a partir do payload base cadastrado, inserindo ou substituindo o campo de valor (`54`) com `35.90`
- **AND** recalcula o CRC16 sobre o payload modificado e o anexa ao final
- **AND** renderiza o QR Code com o payload resultante

#### Scenario: Valor alterado regenera o QR Code

- **WHEN** o total a cobrar muda enquanto o PIX está selecionado
- **THEN** o QR Code é regenerado com o novo valor

#### Scenario: Sem valor a cobrar não há QR Code

- **WHEN** o total a cobrar é zero
- **THEN** nenhum QR Code é gerado e o painel exibe apenas a indicação de PIX

#### Scenario: Biblioteca de QR Code indisponível

- **WHEN** a biblioteca local de geração de QR Code não pôde ser carregada
- **THEN** o painel informa que o QR Code não pôde ser gerado, sem interromper a venda por PIX

### Requirement: Conclusão da venda

Ao finalizar, o sistema DEVE (SHALL) registrar a transação, dar baixa no estoque reservado, limpar o carrinho e devolver a interface ao estado pronto para o próximo cliente.

#### Scenario: Venda finalizada com sucesso

- **WHEN** o operador confirma a finalização com carrinho válido e pagamento apto
- **THEN** a venda é registrada com itens, total, forma de pagamento, momento da venda, valor recebido e troco
- **AND** o carrinho é esvaziado, o valor recebido é zerado e o catálogo é atualizado
- **AND** o modal de pagamento é fechado e uma mensagem de sucesso é exibida

#### Scenario: Estoque zerado exibe Esgotado

- **WHEN** o estoque de um produto é 3, o operador adiciona as 3 unidades e finaliza a venda
- **THEN** o botão do produto passa a exibir "Esgotado" e fica desabilitado

#### Scenario: Venda vazia ou inválida não é registrada

- **WHEN** o carrinho está vazio, ou o pagamento em dinheiro tem valor recebido insuficiente
- **THEN** nenhuma venda é registrada e o carrinho permanece como estava

### Requirement: Limpar carrinho com confirmação

O sistema DEVE (SHALL) exigir confirmação antes de descartar todos os itens do carrinho e DEVE (SHALL) devolver as unidades reservadas ao estoque.

#### Scenario: Confirmação devolve o estoque

- **WHEN** o operador aciona "Limpar" e confirma
- **THEN** todos os itens saem do carrinho e as unidades reservadas retornam ao estoque de cada produto
- **AND** o total exibido volta a R$ 0,00

#### Scenario: Operador desiste da limpeza

- **WHEN** o operador aciona "Limpar" e recusa a confirmação
- **THEN** o carrinho e o estoque permanecem inalterados

### Requirement: Operação 100% offline sem backend

O aplicativo DEVE (SHALL) funcionar integralmente no navegador do dispositivo, sem dependência de conexão, servidor ou API externa após ser aberto.

#### Scenario: Operação sem conexão

- **WHEN** o dispositivo fica sem conexão de rede durante a feira
- **THEN** catálogo, carrinho, pagamento em dinheiro, geração do QR Code, finalização de venda e fechamento de caixa continuam funcionando

#### Scenario: Nenhum recurso remoto

- **WHEN** o aplicativo é carregado
- **THEN** páginas, estilos, scripts e ícones são servidos apenas de arquivos locais do projeto, sem requisições a CDNs ou serviços externos

### Requirement: Usabilidade touch-first e responsiva

A interface DEVE (SHALL) ser operável por toque, com botões grandes e legíveis, e DEVE (SHALL) se adaptar a telas de tablets, smartphones e notebooks em orientação retrato e paisagem.

#### Scenario: Alvos de toque adequados

- **WHEN** a interface é exibida em um tablet
- **THEN** os botões de ação principais têm alvo de toque de no mínimo 48px

#### Scenario: Sem digitação textual obrigatória

- **WHEN** o operador realiza uma venda completa em qualquer forma de pagamento
- **THEN** nenhum campo de texto livre precisa ser preenchido além de valores numéricos de pagamento

#### Scenario: Adaptação de layout

- **WHEN** o dispositivo muda de orientação entre retrato e paisagem
- **THEN** catálogo e carrinho permanecem utilizáveis, sem sobreposição de conteúdo

### Requirement: Acessibilidade dos diálogos modais

Os diálogos de pagamento, ajuste de valor, gerenciamento de produtos e fechamento de caixa DEVEM (SHALL) ser acessíveis por teclado e anunciar seu estado a tecnologias assistivas.

#### Scenario: Fechamento por teclado

- **WHEN** um diálogo modal está aberto e o operador pressiona `Esc`
- **THEN** o diálogo é fechado

#### Scenario: Gestão de foco

- **WHEN** um diálogo modal é aberto
- **THEN** o foco vai para o primeiro elemento interativo do diálogo
- **AND** ao fechar, o foco retorna ao elemento que abriu o diálogo

#### Scenario: Estado anunciado

- **WHEN** um diálogo é aberto ou fechado
- **THEN** o atributo de visibilidade assistiva do diálogo reflete o estado real na tela

### Requirement: Continuidade do estado da venda após recarga

O sistema DEVE (SHALL) restaurar o estado da venda em andamento quando a página é recarregada acidentalmente.

#### Scenario: Recarga durante o atendimento

- **WHEN** a página é recarregada com itens no carrinho
- **THEN** os itens do carrinho, as quantidades reservadas de estoque e a forma de pagamento são restaurados

#### Scenario: Estado salvo corrompido

- **WHEN** o conteúdo persistido localmente não pode ser interpretado
- **THEN** o sistema volta ao estado padrão com aviso no console, sem travar a interface
