# TaskLite

Aplicativo web para gerenciamento de tarefas com timer Pomodoro integrado.

## Sobre o Projeto

TaskLite é uma aplicação frontend para organização de tarefas e produtividade. Inclui sistema de autenticação local, gerenciamento de tarefas e timer Pomodoro com sincronização automática.

## Funcionalidades

- Sistema de login e cadastro (armazenamento local)
- Criação e organização de tarefas
- Timer Pomodoro com sincronização automática
- Sincronização em segundo plano para dispositivos móveis
- Interface responsiva para todos os dispositivos
- Estatísticas de produtividade

## Acesso Online

https://jczerf.github.io/task-lite/

## Tecnologias

- HTML5
- CSS3
- JavaScript (Vanilla)
- LocalStorage para persistência de dados

## Timer Pomodoro

O timer Pomodoro possui sincronização automática que resolve problemas comuns em dispositivos móveis:

- Armazena timestamp de início no localStorage
- Sincroniza automaticamente quando a aplicação volta do segundo plano
- Calcula tempo decorrido com precisão
- Notificações visuais e sonoras
- Estatísticas de sessões completadas

## Estrutura do Projeto

```
TaskLite/
├── index.html
├── auth/
│   ├── login.html
│   └── registration.html
├── dashboard/
│   ├── dashboard.html
│   └── taskManager.html
├── css/
│   ├── index.css
│   ├── login.css
│   ├── registration.css
│   ├── dashboard.css
│   ├── footer.css
│   ├── taskManager.css
│   └── pomodoro.css
├── js/
│   ├── menu.js
│   ├── login.js
│   ├── registration.js
│   ├── dashboard.js
│   ├── taskManager.js
│   └── pomodoro.js
└── service/
    ├── fakeAuth.js
    └── fakeHash.js
```

## Execução Local

1. Clone o repositório
2. Abra o arquivo index.html em um navegador
3. Ou execute um servidor HTTP local na pasta do projeto

## Licença

Projeto de código aberto para fins educacionais.
