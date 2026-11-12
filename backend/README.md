# Backend

Este diretório está reservado para evoluções do Dashfin que exigirem lógica de servidor, APIs ou integrações personalizadas.

Atualmente, a aplicação principal continua sendo frontend estático com autenticação e armazenamento em Firebase, então o backend não é obrigatório neste repositório.

## Estado atual

- Frontend em `frontend/`
- Autenticação e dados em Firebase Auth + Firestore
- Estrutura de backend mantida como espaço futuro para integrações ou regras de negócio mais pesadas

## Quando usar este diretório

- criação de APIs próprias
- serviços de processamento analítico
- integrações com dados externos
- autenticação customizada ou regras avançadas de negócio
- funcionalidades que exigem processamento em servidor

## Estrutura sugerida

```text
backend/
  src/
  routes/
  services/
  config/
  tests/
```

## Observação

Para o momento, a prioridade do projeto está na experiência do dashboard financeiro, na clareza operacional e na apresentação premium do app, sem introduzir complexidade de infraestrutura desnecessária.
