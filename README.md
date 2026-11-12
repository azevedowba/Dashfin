# Dashfin

Dashboard financeiro pessoal em HTML, CSS e JavaScript, criado para centralizar orçamento, saldos, lançamentos, análise de gastos e acompanhamento financeiro em uma experiência visual premium.

O projeto nasceu a partir de uma planilha pessoal de controle financeiro e evoluiu para uma aplicação estática com interface moderna, organização por conta, filtros, visão por período e relatórios gráficos.

## Visão geral

- Frontend estático em `frontend/`
- Autenticação e persistência com Firebase Auth + Firestore
- Estrutura orientada a dashboard financeiro e orçamento doméstico
- Interface premium com shell lateral, cards, painéis e visual consistente entre páginas
- Sem build system ou dependências de front-end para produção

## Funcionalidades principais

- painel geral com resumo de saldo e movimentações
- orçamento por mês e acompanhamento de metas
- visão por conta e saldo por conta
- importação e revisão de operações
- gráficos e análise por período
- configuração de saldos iniciais e ajustes do sistema
- filtros e organização por categoria/conta/período

## Estrutura do repositório

- `frontend/` — aplicação principal do Dashfin
  - `index.html` — dashboard principal
  - `orcamento.html` — página de orçamento
  - `graficos.html` — gráficos e análise
  - `operacoes.html` — importação e revisão de dados
  - `css/` — estilos globais e específicos por página
  - `js/` — regras de negócio, autenticação e utilitários
- `backend/` — espaço reservado para integrações ou APIs futuras
- `firebase.json` — configuração de hosting do Firebase
- `firestore.rules` — regras de segurança do Firestore
- `.github/workflows/` — deploy automatizado do Firebase

## Como executar localmente

Como o projeto é estático, basta servir a pasta `frontend/` em um servidor local:

```bash
cd Dashfin
python -m http.server 8000
```

Depois abra no navegador:

```text
http://localhost:8000/frontend/index.html
```

## Observações

- O app foi pensado para manter a lógica financeira original inspirada na planilha, mas com melhor apresentação e usabilidade.
- O foco atual é manter a experiência visual premium sem perder clareza operacional.
- O Firebase é usado como camada de autenticação e armazenamento, mas o código principal continua sendo estático e leve.

