# Instruções para Agentes de IA do Dashfin

## Visão geral do projeto
- Aplicação web estática para dashboard financeiro e análise de dados.
- Hospedada no Firebase Hosting e implantada via GitHub Actions.
- Não há sistema de build, gerenciador de pacotes ou código backend neste repositório.
- Frontend implementado em HTML, CSS e JavaScript puros.
- Texto e rótulos da interface estão em Português do Brasil.

## Arquivos principais
- `index.html` — página principal do dashboard e histórico.
- `graficos.html` — página de gráficos e análise.
- `operacoes.html` — página de lançamentos, importação e revisão de dados.
- `firebase-config.js` — inicialização do Firebase e configuração do Firestore.
- `firebase.json` — configuração de hospedagem do Firebase e regra de rewrite.
- `.github/workflows/firebase-hosting-pull-request.yml` — deploy de preview para pull requests.
- `.github/workflows/firebase-hosting-merge.yml` — deploy para o canal live ao fazer merge na branch `main`.

## Convenções de trabalho
- Mantenha as alterações alinhadas ao estilo visual existente e às variáveis CSS das páginas atuais.
- Use o mesmo estilo de linguagem em Português ao estender rótulos de UI ou mensagens.
- Prefira mudanças mínimas e preserve a estrutura atual da página.
- Como o app é estático, não introduza ferramentas de build Node/npm a menos que o usuário peça explicitamente.
- Evite modificar referências a contas de serviço do Firebase ou segredos de CI; esses são gerenciados externamente.

## Orientação para agentes de IA
- Não assuma que existe um sistema de módulos JavaScript; o app usa padrões simples e scripts inline.
- Ao adicionar comportamento, prefira APIs DOM nativas e lógica leve consistente com o código existente.
- Ao corrigir problemas, inspeccione a página HTML relevante primeiro, pois não há estrutura JS separada.
- Mantenha valores públicos de configuração em `firebase-config.js` inalterados, a menos que o usuário solicite uma atualização do Firebase.

## Observações
- O repositório contém apenas páginas estáticas com estilo embutido e não possui testes.
- O `README.md` é minimalista e não fornece instruções de setup ou uso além da identidade do projeto.
