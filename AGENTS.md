# Instruções para Agentes de IA do Dashfin

## Visão geral do projeto
- Aplicação web estática para dashboard financeiro pessoal e gestão de orçamento.
- Hospedada no Firebase Hosting e implantada via GitHub Actions.
- Frontend implementado em HTML, CSS e JavaScript puros.
- A lógica do sistema foi inspirada em uma planilha de controle financeiro, mas evoluiu para uma interface premium e moderna.
- Texto e rótulos da interface devem permanecer em Português do Brasil.

## Estrutura atual
- `frontend/index.html` — dashboard principal e visão geral do patrimônio/saldos.
- `frontend/orcamento.html` — planejamento mensal e acompanhamento do orçamento.
- `frontend/graficos.html` — gráficos e análise de evolução financeira.
- `frontend/operacoes.html` — importação, revisão e registro de lançamentos.
- `frontend/css/` — estilos globais e específicos por página.
- `frontend/js/app-dashboard.js` — regras do dashboard, orçamentos, saldos e consolidação.
- `frontend/js/app-constants.js` — configuração e dados de referência do sistema.
- `frontend/js/app-auth.js` — autenticação Firebase.
- `firebase.json` — configuração do hosting do Firebase.
- `firestore.rules` — regras de segurança do Firestore.
- `.github/workflows/` — deploy automático para preview e produção.

## Diretrizes de trabalho
- Mantenha o visual consistente com a linha premium já adotada: shell lateral, paleta em cinza/verde/dourado, cards, contraste e organização clara.
- Preserve a lógica financeira original e evite mudanças estruturais que descaracterizem o modelo da planilha inspiradora.
- Prefira mudanças mínimas e de alto valor, sem introduzir redundâncias ou blocos de código sem uso.
- Como o app é estático, não adicione build system, bundler ou dependências extras sem necessidade explícita.
- Evite alterar configurações sensíveis do Firebase ou segredos de CI.

## Orientação para agentes de IA
- Não assuma que o repositório tem arquitetura em módulos JavaScript; a app segue padrão simples e direto.
- Ao alterar comportamento, priorize a lógica em `frontend/js/` e mantenha a interface alinhada ao padrão visual atual.
- Sempre verifique a página HTML relevante antes de mexer na estrutura da tela.
- Mantenha os valores públicos de configuração em `firebase-config.js` inalterados, salvo pedido explícito.
- Continue valorizando a clareza, a manutenção e a legibilidade do código.

## Observações
- O projeto continua sendo uma aplicação estática de alto impacto visual, com foco em fácil uso e gestão financeira pessoal.
- O README principal deve refletir o estado atual do app e não apenas a estrutura mínima do repositório.
- Qualquer melhoria deve respeitar o equilíbrio entre negócio financeiro e experiência premium do produto.
