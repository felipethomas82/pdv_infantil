# 🧵 PDV Infantil Offline — Mãos que Criam

Ponto de venda (PDV) web, **100% offline**, feito para ser operado por uma criança do 5º ano do
Ensino Fundamental durante uma feira escolar de empreendedorismo (Feira do Empreendedor Ases
Educacional), vendendo produtos artesanais de crochê.

O objetivo não é ser um sistema completo de retaguarda: é ser **confiável e simples de operar ao
vivo**, no meio da feira, em um tablet, sem internet e sem ninguém para dar suporte técnico.

> **Para rodar:** baixe o projeto e abra o `index.html` no navegador.
> Não instala, não compila, não depende de servidor nem de conexão.

---

## Funcionalidades

### Atendimento (o que a criança usa na frente do cliente)

| Recurso | Como funciona |
|---|---|
| **Catálogo em grade** | Botões grandes com foto, nome, preço e estoque. Um toque adiciona 1 unidade. |
| **Esgotado** | Quando o estoque chega a zero, o botão mostra "Esgotado" e fica desabilitado. |
| **Carrinho** | Lista os itens com quantidade, preço unitário, subtotal e o **total em destaque**. Controles `+` / `-` e remoção automática ao chegar a zero. |
| **Editar valor a cobrar** | Permite cobrar um valor diferente da soma dos itens (arredondamento, combo, desconto). O ajuste é descartado se o carrinho mudar. |
| **Dinheiro** | Campo de valor recebido (aceita vírgula, ex.: `25,00`), **cálculo de troco em tempo real** e bloqueio com aviso "Valor recebido insuficiente". |
| **PIX** | Gera um **QR Code dinâmico com o valor exato da venda** a partir de um payload PIX estático (insere a tag de valor `54` e recalcula o CRC16). |
| **Finalizar venda** | Registra a venda, baixa o estoque reservado, limpa o carrinho, fecha o modal e confirma o sucesso. |
| **Limpar** | Descarta o carrinho **com confirmação** e devolve as unidades ao estoque. |

### Administração (fora do atendimento)

| Recurso | Como funciona |
|---|---|
| **Fechamento de caixa** | Total Geral, total em Dinheiro e total em PIX, **ranking de vendas** por produto e **extrato** venda por venda (data, hora, forma de pagamento, itens e total cobrado). |
| **Novo dia** | Protegido por **senha**, apaga o histórico, zera os totais e restaura o estoque inicial de cada produto. |
| **Gerenciar produtos** | Altera o estoque e o preço unitário de cada produto; o catálogo e os itens no carrinho acompanham a mudança. |

---

## Como usar

1. Clone ou baixe o repositório.
2. Abra `index.html` com dois cliques (roda direto em `file://`).
3. Fluxo da venda: **toque no produto → Pagamento → Dinheiro ou PIX → Finalizar Venda**.
4. Fechamento do dia: **Fechamento de Caixa → Novo Dia** (senha padrão `1234`).

Funciona em Chrome, Edge, Firefox e Safari atuais, em notebook, tablet ou celular, nas duas
orientações. Os alvos de toque têm no mínimo 48px e não é preciso digitar texto durante a venda.

---

## Estrutura do projeto

```text
pdv_infantil/
├── index.html      # estrutura da tela (catálogo, carrinho e modais)
├── style.css       # aparência, layout touch-friendly e responsividade
├── script.js       # renderização, eventos e formatação (não guarda estado)
├── storage.js      # dono único do estado: catálogo, regras e persistência
├── modules/        # bibliotecas locais: qrcode.min.js e Font Awesome
├── photos/         # fotos dos produtos (chaveiro, mandala, borrachinha)
├── openspec/       # especificação viva: specs, changes e archive
└── docs/legacy/    # SDD manual anterior (registro histórico do laboratório)
```

O projeto não usa framework, bundler nem gerenciador de pacotes. Os scripts são carregados como
`<script src>` clássicos — a aplicação abre em `file://`, onde módulos ES e `fetch` são bloqueados
pelo navegador, e por isso o estado é exposto como módulo global (`window.pdvStorage`).

**Divisão de responsabilidade:** todo o estado (catálogo, carrinho, vendas, totais e persistência)
vive em `storage.js`; `script.js` apenas renderiza, trata eventos e formata valores. Não existem
duas implementações da mesma regra.

---

## Como os dados são guardados

Tudo fica no `localStorage` do navegador, na chave `pdv_infantil_state`, versionada por
`stateVersion` para permitir migrações. Não há backend, banco de dados nem arquivo de dados em
tempo de execução.

- **Valores monetários são inteiros em centavos.** A conversão para `R$` acontece só na exibição
  (`Intl.NumberFormat('pt-BR')`), evitando imprecisões de ponto flutuante.
- **Catálogo canônico em um único lugar:** `DEFAULT_PRODUCTS` em `storage.js`.
- **Totais com fonte única:** uma única estrutura (`boxTotals`) guarda o faturamento; os totais por
  forma de pagamento são derivados dela, sem cópias paralelas que possam divergir.
- Se o `localStorage` estiver indisponível (modo privado, cota cheia), o app continua operando com
  o estado em memória durante a sessão, avisando no console.

### Configuração rápida

| O que mudar | Onde |
|---|---|
| Produtos, preços e estoques iniciais | `DEFAULT_PRODUCTS` em `storage.js` |
| Chave e dados do recebedor PIX | `DEFAULT_PIX_PAYLOAD` em `storage.js` |
| Senha do "Novo Dia" | `DEFAULT_CASHBOX_PASSWORD` em `storage.js` |

> ⚠️ O `DEFAULT_PIX_PAYLOAD` versionado contém a chave PIX e o nome do recebedor usados no projeto
> original. **Substitua pelos seus dados** antes de usar o app para cobrar. Como este repositório é
> público, esses dados ficam visíveis no histórico do Git.

---

## Especificação (OpenSpec)

A especificação do sistema é versionada com o [OpenSpec](https://github.com/Fission-AI/OpenSpec) e
vive em `openspec/specs/`, dividida em duas capabilities:

| Capability | Cobre |
|---|---|
| `operacao-venda` | Catálogo, reserva de estoque, carrinho, valor a cobrar, dinheiro com troco, PIX, conclusão da venda, operação offline, usabilidade touch e continuidade após recarga. |
| `administracao-caixa` | Fechamento de caixa, ranking, extrato, novo dia, senha, gerenciamento de estoque e preço, catálogo em fonte única e persistência local. |

Cada requirement tem cenários no formato `WHEN/THEN`, escritos para serem executados como um roteiro
de teste manual. Os requirements são redigidos em português com o termo normativo da RFC 2119 ao
lado do verbo — `DEVE (SHALL)` — porque o validador do OpenSpec exige `SHALL`/`MUST` no corpo do
requisito.

```bash
# inventário das capabilities publicadas
openspec list --specs

# validação de tudo (specs e changes)
openspec validate --all

# ver as regras de uma capability
openspec show operacao-venda --type spec
```

### Como propor uma mudança

```bash
openspec new change "nome-da-mudanca"   # cria proposal, specs (delta), design e tasks
# ... implementar as tarefas ...
openspec validate "nome-da-mudanca" --strict
openspec archive "nome-da-mudanca"      # publica as specs e arquiva a mudança
```

O histórico completo da migração do SDD manual para o OpenSpec está em
`openspec/changes/archive/2026-09-21-migrar-sdd-manual-para-openspec/`, com `proposal.md`,
`design.md` (decisões e trade-offs) e `tasks.md`.

---

## Verificação

O projeto **não tem testes automatizados** — é um não-objetivo declarado na mudança de migração, por
ser um app de arquivo único, sem runner e sem dependências. A verificação é:

- cada cenário das specs, executado manualmente como roteiro;
- `openspec validate --all`, que precisa passar;
- checagem de operação offline: com a rede desativada, catálogo, troco, geração do QR Code,
  finalização de venda e fechamento de caixa continuam funcionando, **sem nenhuma requisição
  externa** (todas as dependências são arquivos locais).

---

## Decisões e limitações conhecidas

Transparência sobre escolhas que divergem de uma leitura literal da especificação inicial:

- **O estoque é reservado ao adicionar ao carrinho**, e não na confirmação da venda. Isso impede que
  a mesma unidade entre em dois carrinhos e é o que sustenta o cenário de bloqueio de venda acima do
  estoque. Remover o item, limpar o carrinho ou recarregar a página devolvem ou preservam a reserva.
- **O "Novo Dia" é protegido por senha**, não por um simples toggle.
- **O PIX não é confirmado pelo sistema.** O QR Code é gerado com o valor correto, mas quem confirma
  o recebimento é o operador — não há integração bancária.
- **"Editar valor a cobrar" fica no painel do carrinho**, portanto não é acessível enquanto o modal
  de pagamento está aberto.
- Fora de escopo por decisão: NFC-e/SAT, leitor de código de barras, impressora térmica, login com
  múltiplos perfis e cadastro de produtos com upload de fotos.

### Próximos passos possíveis

- Tela para trocar a senha do caixa pela interface (hoje é constante no código).
- Compressão das fotos dos produtos (~1,5 MB por imagem).
- Migrar os modais para o elemento nativo `<dialog>` (ganho de acessibilidade, comportamento
  observável idêntico).
- O campo de "Valor total" do modal de edição ainda é `type="number"` e exige ponto decimal, enquanto
  o campo de valor recebido já aceita vírgula.

---

## Documentos do laboratório

Este projeto começou como um exercício de **Spec-Driven Development (SDD) feito à mão** e depois foi
migrado para o OpenSpec. Os artefatos originais ficaram preservados em `docs/legacy/` como registro
histórico — em especial `relato.md`, a reflexão sobre o processo:

- `docs/legacy/spec.md` — especificação de requisitos original (RF/RNF, casos de borda, critérios de aceite)
- `docs/legacy/plan.md` — plano técnico de arquitetura
- `docs/legacy/tasks.md` — checklist manual de decomposição de tarefas
- `docs/legacy/relato.md` — relato de execução do laboratório

Nada em `docs/legacy/` é fonte de verdade: o comportamento do sistema está especificado em
`openspec/specs/`.
