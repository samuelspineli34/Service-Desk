# Osaka Tech - Corporate Ticket Management System

O **Osaka Tech** é uma solução completa para gerenciamento de chamados técnicos internos. O sistema foi desenvolvido com uma arquitetura modular, seguindo padrões de mercado como **DAO (Data Access Object)**, **DTO (Data Transfer Object)** e **RBAC (Role-Based Access Control)** para garantir segurança e escalabilidade.

---

## Demo Live
Acesse o sistema em: [https://osakatech.vercel.app](https://osakatech.vercel.app)

### Credenciais de Teste
Para explorar as diferentes permissões do sistema (RBAC), utilize as contas abaixo (Senha padrão: `teste123`):

| Cargo | Email | Permissões |
| :--- | :--- | :--- |
| **Admin** | admin@osakacorp.com | Acesso total, gestão de usuários e cargos. |
| **Técnico** | tech@osakacorp.com | Gerenciamento e resolução de chamados. |
| **Usuário** | user@osakacorp.com | Abertura e acompanhamento de chamados próprios. |


# Funcionalidades Principais

### Gerenciamento de Usuários (CRUD)
- Criação, edição e remoção lógica (Soft Delete) de membros da organização

### Controle de Acesso Dinâmico (RBAC)
- Sistema de permissões granulado
- Administradores criam cargos
- Definição exata dos módulos acessíveis por usuário

### Ciclo de Vida de Chamados (Tickets)
- Abertura de chamados
- Atribuição de responsáveis
- Alteração de status:
  - Open
  - In Progress
  - Closed
- Definição de prioridade

### Sistema de Atendimento (Timeline)
- Histórico completo de comentários por ticket
- Registro da interação entre técnicos e usuários

### Avaliação de Satisfação (Rating)
- Avaliação após fechamento do chamado
- Notas de 1 a 5

### Dashboard de Métricas
- Chamados ativos
- Chamados resolvidos
- Total de usuários
- Média de satisfação
- Atualização em tempo real

### Segurança Avançada
- Autenticação baseada em JWT
- Hash criptográfico de senhas

---

# Stack Tecnológica

## Backend

- Linguagem: Python 3.x  
- Framework: Flask  
- Segurança: Flask-JWT-Extended  
- Banco de Dados: PostgreSQL  
- Driver DB: psycopg2-binary  
- Ambiente: python-dotenv  

## Frontend

- Linguagem: TypeScript  
- Estilização: Tailwind CSS  
- Gerenciador de Pacotes: Bun  
- Bundler / Dev Server: Vite  
- Ícones: Material Icons Round  

---

# Estrutura do Projeto

```text
Service-Desk/
├── backend/
│   ├── src/
│   │   ├── config/       # Configurações de ambiente e constantes
│   │   ├── controllers/  # Lógica de controle (opcional)
│   │   ├── dao/          # Data Access Objects (Queries SQL)
│   │   ├── dto/          # Data Transfer Objects (Formatação de saída)
│   │   ├── routes/       # Definição de endpoints (Blueprints)
│   │   ├── services/     # Regras de negócio
│   │   └── app.py        # Ponto de entrada do Flask
│   ├── .env              # Variáveis sensíveis (não versionado)
│   └── requirements.txt  # Dependências Python
├── frontend/
│   ├── public/           # Ativos estáticos (favicon, imagens)
│   ├── src/
│   │   ├── components/   # Componentes reutilizáveis
│   │   ├── interfaces/   # Tipos TypeScript
│   │   ├── pages/        # HTML e TS por módulo
│   │   ├── services/     # Integração com API
│   │   └── utils/        # Utilitários globais
│   ├── package.json
│   └── vite.config.ts
├── database/
│   ├── schema.sql
│   └── seed.sql
├── docs/
│   ├── openapi.yaml
│   └── api-docs.html
└── README.md
```

# Arquitetura e Padrões de Projeto

O sistema foi desenhado seguindo princípios de alta coesão e baixo acoplamento, utilizando padrões de projeto que facilitam a manutenção e a escalabilidade do código.

### Camada de Acesso a Dados (DAO)
Toda a interação com o banco de dados PostgreSQL é isolada em classes DAO. Isso garante que a lógica de persistência (SQL) não se misture com as regras de negócio, permitindo alterações na estrutura do banco com impacto mínimo no restante da aplicação.

### Objetos de Transferência de Dados (DTO)
A comunicação entre o backend e o frontend utiliza DTOs para filtrar quais informações devem ser expostas. Esse padrão é fundamental para a segurança, garantindo que dados sensíveis, como hashes de senhas, nunca deixem o servidor.

### Service Layer
As regras de negócio, validações e orquestração de chamadas estão concentradas na camada de serviços. O Service atua como um mediador entre as rotas da API e os DAOs.

---

# Segurança e Integridade de Dados

A segurança foi tratada como prioridade no desenvolvimento, implementando técnicas modernas de proteção.

### Controle de Acesso Baseado em Cargos (RBAC)
Diferente de sistemas com cargos fixos, o Osaka Tech utiliza permissões dinâmicas vinculadas a cargos (Roles). Isso permite que o administrador crie novos níveis de acesso e selecione exatamente quais funcionalidades cada cargo pode executar.

### Proteção de Identificadores (UUID v4)
Em vez de IDs sequenciais (1, 2, 3...), o sistema utiliza UUIDs (Universally Unique Identifiers). Isso impede ataques de enumeração de recursos, onde usuários mal-intencionados tentam acessar dados alterando números na URL.

### Hashing de Senhas
As senhas são processadas utilizando o algoritmo scrypt, garantindo que, mesmo em caso de acesso indevido ao banco de dados, as credenciais originais permaneçam inacessíveis.

### Exclusão Lógica (Soft Delete)
A aplicação implementa a exclusão lógica em tabelas críticas. Quando um usuário ou ticket é "removido", o registro permanece no banco de dados com uma marcação de data na coluna `deleted_at`. Isso garante a rastreabilidade histórica e a integridade de dados para auditorias.

---

# Documentação da API

A interface de programação (API) está totalmente documentada seguindo o padrão OpenAPI 3.0. A documentação descreve:
- Endpoints disponíveis.
- Formatos de requisição e resposta (JSON).
- Requisitos de autenticação para cada rota.
- Códigos de status HTTP retornados.

O arquivo de especificação pode ser encontrado em `/docs/openapi.yaml` e pode ser visualizado de forma interativa através de ferramentas como Swagger UI ou Redoc.

---

# Considerações Técnicas

- **Persistência:** O sistema utiliza PostgreSQL com suporte nativo a tipos UUID.
- **Frontend Modular:** Desenvolvido em TypeScript puro para demonstrar domínio de manipulação de DOM e integração assíncrona com APIs.
- **Estilização:** Implementada via Tailwind CSS, priorizando uma interface limpa, responsiva e de padrão corporativo.
- **Gerenciamento de Ambiente:** Utilização de variáveis de ambiente (.env) para separação total entre credenciais e código-fonte.

