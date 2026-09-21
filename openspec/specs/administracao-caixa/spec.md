# administracao-caixa Specification

## Purpose

Define o que o operador consulta e altera fora do atendimento: o fechamento de caixa com totais e extrato da feira, o reinício do dia, e a manutenção de estoque e preços dos produtos, sempre sobre dados persistidos localmente no próprio dispositivo.

## Requirements

### Requirement: Fechamento de caixa com totais por forma de pagamento

O sistema DEVE (SHALL) exibir, em um painel de fechamento de caixa, o faturamento total do dia e a separação entre dinheiro e PIX.

#### Scenario: Totais calculados a partir das vendas

- **WHEN** foram registradas duas vendas em dinheiro (R$ 20,00 e R$ 10,00) e uma venda em PIX (R$ 35,00)
- **THEN** o painel exibe Total Geral igual a R$ 65,00, Dinheiro igual a R$ 30,00 e PIX igual a R$ 35,00

#### Scenario: Caixa sem vendas

- **WHEN** nenhuma venda foi registrada
- **THEN** o painel exibe todos os totais como R$ 0,00

#### Scenario: Total geral consistente

- **WHEN** o painel de fechamento é exibido
- **THEN** o Total Geral equivale exatamente à soma dos totais de Dinheiro e PIX

### Requirement: Ranking de vendas por produto

O sistema DEVE (SHALL) exibir, no fechamento de caixa, a quantidade total vendida por produto, ordenada da maior para a menor.

#### Scenario: Ranking ordenado

- **WHEN** existem vendas registradas de mais de um produto
- **THEN** os produtos são listados em ordem decrescente de quantidade vendida, com o plural correto

#### Scenario: Ranking vazio

- **WHEN** nenhuma venda foi registrada
- **THEN** o ranking informa que ainda não há vendas registradas

### Requirement: Extrato de vendas detalhado

O sistema DEVE (SHALL) exibir, no fechamento de caixa, um extrato com cada venda registrada, mostrando data e hora, forma de pagamento, itens com quantidade e valor unitário, e o total da venda.

#### Scenario: Extrato da venda mais recente primeiro

- **WHEN** o extrato é exibido com vendas registradas
- **THEN** as vendas aparecem com a mais recente no topo
- **AND** cada venda mostra seu total, que pode diferir da soma dos itens quando houve ajuste manual do valor a cobrar

#### Scenario: Extrato vazio

- **WHEN** nenhuma venda foi registrada
- **THEN** o extrato informa que ainda não há vendas registradas

### Requirement: Novo dia com reinício de estoque e totais

O sistema DEVE (SHALL) permitir reiniciar o dia, apagando o histórico de vendas, zerando os totais do caixa e restaurando o estoque inicial de cada produto.

#### Scenario: Reset bem-sucedido

- **WHEN** o operador confirma o reinício do dia com a senha correta
- **THEN** o histórico de vendas é apagado, os totais geral, dinheiro e PIX voltam a R$ 0,00, o carrinho é esvaziado e o valor recebido é zerado
- **AND** o estoque de cada produto volta ao seu estoque inicial
- **AND** catálogo, carrinho, extrato e totais são re-renderizados na tela
- **AND** uma mensagem de sucesso é exibida

#### Scenario: Senha incorreta bloqueia o reset

- **WHEN** o operador confirma o reinício com senha incorreta
- **THEN** os dados de vendas, estoque e totais permanecem inalterados
- **AND** o sistema exibe uma mensagem de erro

#### Scenario: Confirmação prévia obrigatória

- **WHEN** o operador aciona o reinício do dia
- **THEN** o sistema pede confirmação explícita antes de apagar qualquer dado

### Requirement: Proteção do reset de caixa por senha

O painel administrativo DEVE (SHALL) proteger a operação de reinício do dia por senha, de modo que o operador do atendimento não apague as vendas por engano.

#### Scenario: Senha não exposta na interface de venda

- **WHEN** a tela de atendimento é exibida
- **THEN** a senha do caixa não é apresentada em nenhum elemento visível

#### Scenario: Senha preservada entre sessões

- **WHEN** o estado é recarregado do armazenamento local
- **THEN** a senha previamente definida é mantida, usando o valor padrão apenas quando não houver senha salva

### Requirement: Gerenciamento de estoque dos produtos

O sistema DEVE (SHALL) permitir que o operador consulte e altere a quantidade em estoque de cada produto.

#### Scenario: Alteração de estoque aplicada

- **WHEN** o operador informa uma nova quantidade de estoque válida e salva
- **THEN** o novo valor é persistido e o catálogo passa a refletir a quantidade atualizada
- **AND** a lista de gerenciamento é atualizada com o valor salvo

#### Scenario: Estoque inicial preservado

- **WHEN** o operador altera apenas a quantidade em estoque de um produto
- **THEN** o estoque inicial usado pelo reinício do dia não é inflado pela quantidade atual

#### Scenario: Valor inválido é rejeitado

- **WHEN** o operador informa quantidade negativa ou não numérica
- **THEN** o sistema não altera o estoque do produto

### Requirement: Gerenciamento de preço dos produtos

O sistema DEVE (SHALL) permitir que o operador altere o preço unitário de cada produto, refletindo a mudança no catálogo e nos itens já presentes no carrinho.

#### Scenario: Preço atualizado no catálogo

- **WHEN** o operador altera o preço de um produto de R$ 10,00 para R$ 12,00 e salva
- **THEN** o catálogo exibe R$ 12,00 e o valor é persistido

#### Scenario: Preço atualizado no carrinho

- **WHEN** um produto com preço alterado possui itens no carrinho
- **THEN** os itens passam a usar o novo preço e o total é recalculado

#### Scenario: Preço negativo é rejeitado

- **WHEN** o operador informa preço negativo ou não numérico
- **THEN** o sistema não altera o preço do produto

### Requirement: Catálogo e preços definidos em fonte única

O sistema DEVE (SHALL) definir produtos, preços e estoques iniciais em um único ponto de configuração local, sem duplicação de valores em outros arquivos.

#### Scenario: Catálogo padrão único

- **WHEN** o aplicativo é iniciado sem estado persistido
- **THEN** o catálogo inicial é criado a partir dessa única definição, com chaveiro a R$ 10,00, mandala a R$ 18,00 e borrachinha de cabelo a R$ 12,00

#### Scenario: Nenhum arquivo de dados em runtime

- **WHEN** o aplicativo é carregado
- **THEN** nenhum arquivo JSON local é lido como fonte de dados, sendo o armazenamento local do navegador a única fonte em tempo de execução

### Requirement: Persistência local de vendas, totais e estoque

O sistema DEVE (SHALL) persistir vendas, totais do caixa, estoque e configuração do catálogo no armazenamento local do navegador, mantendo esses dados entre recargas e reinícios do aplicativo.

#### Scenario: Dados mantidos entre recargas

- **WHEN** a página é recarregada após vendas registradas
- **THEN** o histórico de vendas, os totais do caixa e o estoque atualizado são restaurados

#### Scenario: Ausência de dados persistidos

- **WHEN** não existe nenhum estado salvo no armazenamento local
- **THEN** o sistema inicia com o catálogo padrão, carrinho vazio, histórico vazio e totais zerados

#### Scenario: Falha de leitura ou gravação

- **WHEN** o armazenamento local está indisponível ou contém conteúdo inválido
- **THEN** o sistema mantém a aplicação utilizável com o estado padrão e reporta o problema no console, sem interromper o atendimento da feira

#### Scenario: Total geral derivado dos totais por forma de pagamento

- **WHEN** os totais do caixa são lidos ou gravados
- **THEN** eles vêm de uma única estrutura de totais por forma de pagamento, sem cópias paralelas que possam divergir
