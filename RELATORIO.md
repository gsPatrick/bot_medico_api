# 📋 Relatório de Implementação - Backend Bot Médico

**Data:** 14/01/2026  
**Desenvolvedor:** Antigravity AI  
**Projeto:** Motor de Chatbot Dinâmico para WhatsApp - Triagem Médica

---

## 🎯 Objetivo do Projeto

Construir uma API RESTful robusta em Node.js que funcione como um **Motor de Chatbot Dinâmico (Flow Engine)** para WhatsApp, integrado com Z-API. O sistema lê a estrutura do fluxo de um JSON no banco de dados, permitindo alterações visuais no futuro sem modificar o código backend.

---

## 🛠️ Stack Tecnológica

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| Node.js | LTS | Runtime |
| Express.js | 4.18.2 | Framework HTTP |
| PostgreSQL | - | Banco de dados |
| Sequelize | 6.35.0 | ORM com suporte JSONB |
| Axios | 1.6.0 | Cliente HTTP para Z-API |
| dotenv | 16.3.1 | Variáveis de ambiente |
| cors | 2.8.5 | Cross-Origin Resource Sharing |
| uuid | 9.0.0 | Geração de IDs únicos |

---

## 📁 Estrutura de Pastas Criada

```
bot_medico/
└── api/
    ├── package.json               # Configuração NPM
    ├── .env.example               # Template de variáveis
    ├── .env                       # Variáveis de ambiente
    ├── .gitignore                 # Arquivos ignorados pelo Git
    └── src/
        ├── app.js                 # Entrada principal + auto-seeder
        │
        ├── Config/
        │   ├── database.js        # Conexão Sequelize/PostgreSQL
        │   └── zapi.config.js     # Credenciais Z-API
        │
        ├── Models/
        │   ├── User.js            # Admin/Secretária
        │   ├── Contact.js         # Paciente (estado do fluxo)
        │   ├── Flow.js            # Estrutura JSONB do chatbot
        │   ├── Message.js         # Log de conversas
        │   └── index.js           # Associações entre models
        │
        ├── Services/
        │   ├── ZApi.service.js    # Wrapper Z-API
        │   └── FlowEngine.service.js  # Cérebro do chatbot
        │
        ├── Features/
        │   ├── Webhook/
        │   │   ├── webhook.controller.js  # Parser Z-API
        │   │   └── webhook.routes.js
        │   └── Flows/
        │       ├── flow.controller.js     # CRUD completo
        │       └── flow.routes.js
        │
        ├── Routes/
        │   └── index.js           # Agregador de rotas
        │
        └── Seeders/
            └── default-triage-flow.js  # Fluxo de triagem médica
```

**Total: 16 arquivos JavaScript + 4 arquivos de configuração**

---

## 🗄️ Modelagem de Dados

### Model: User (Admin/Secretária)
```javascript
{
  id: UUID (PK),
  name: String,
  email: String (unique),
  password: String,
  role: ENUM('admin', 'secretary'),
  is_active: Boolean
}
```

### Model: Contact (Paciente)
```javascript
{
  phone: String (PK, unique),
  name: String,
  current_flow_id: UUID (FK -> Flow),
  current_node_id: String,           // Posição no fluxo
  status: ENUM('BOT', 'PENDING', 'FINISHED', 'DISQUALIFIED'),
  variables: JSONB,                  // Ex: { "dor": "ombro" }
  tags: JSONB,                       // Ex: ["PREMIUM", "OMBRO"]
  last_interaction_at: Date
}
```

### Model: Flow (Estrutura do Chatbot)
```javascript
{
  id: UUID (PK),
  name: String,
  description: Text,
  is_active: Boolean,
  trigger_keyword: String,           // Ex: "oi", "agendar"
  nodes: JSONB                       // Estrutura completa do fluxo
}
```

### Model: Message (Log de Conversas)
```javascript
{
  id: UUID (PK),
  contact_phone: String (FK -> Contact),
  direction: ENUM('in', 'out'),
  content: Text,
  message_type: ENUM('text', 'button', 'list', 'image', 'audio', 'document', 'location'),
  zapi_message_id: String,
  node_id: String,
  metadata: JSONB
}
```

---

## 🔌 Serviços Implementados

### ZApi.service.js

| Método | Descrição |
|--------|-----------|
| `sendText(phone, message)` | Envia texto simples |
| `sendButtons(phone, text, buttons)` | Envia até 3 botões |
| `sendList(phone, text, title, buttonText, sections)` | Envia menu com opções |
| `sendImage(phone, imageUrl, caption)` | Envia imagem |
| `checkStatus()` | Verifica status da instância |
| `getQRCode()` | Obtém QR Code para conexão |
| `formatPhone(phone)` | Formata telefone para padrão Z-API |

### FlowEngine.service.js (O Cérebro)

**Algoritmo de Processamento:**
1. Busca/cria contato pelo telefone
2. Se não tiver fluxo ativo, inicia o fluxo padrão
3. Carrega o fluxo e nó atual
4. Valida resposta do usuário
5. Salva variáveis coletadas
6. Avança para o próximo nó
7. Executa ação do nó (message/question/handover/disqualify)

**Tipos de Nós:**
| Tipo | Comportamento |
|------|---------------|
| `message` | Envia texto → avança automaticamente |
| `question` | Envia botões/lista → PAUSA e aguarda resposta |
| `handover` | Transfere para humano (status = PENDING) |
| `disqualify` | Encerra fluxo (status = DISQUALIFIED) |

---

## 🌐 Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/` | Informações da API |
| GET | `/health` | Health check |
| POST | `/webhook` | Recebe mensagens Z-API |
| GET | `/webhook` | Verificação do webhook |
| POST | `/webhook/status` | Recebe status de mensagens |
| GET | `/api/flows` | Lista todos os fluxos |
| GET | `/api/flows/:id` | Obtém fluxo específico |
| POST | `/api/flows` | Cria novo fluxo |
| PUT | `/api/flows/:id` | Atualiza fluxo |
| DELETE | `/api/flows/:id` | Remove fluxo |
| POST | `/api/flows/:id/activate` | Ativa um fluxo |
| POST | `/api/flows/:id/duplicate` | Duplica um fluxo |

---

## 🩺 Fluxo de Triagem Médica (Seeder)

O seeder implementa **15 nós** cobrindo toda a jornada do paciente:

### Mapa do Fluxo

```
                    ┌─────────────────────────────────────────┐
                    │               START                      │
                    │  "Primeira vez com Dr. Marcelo?"         │
                    └───────────────┬─────────────────────────┘
                                    │
              ┌─────────────────────┴─────────────────────┐
              │ SIM                                    NÃO │
              ▼                                           ▼
        ┌───────────┐                         ┌──────────────────┐
        │  WELCOME  │                         │  CHECK_RECURRENT │
        │ Boas-vindas│                         │"Mesmo problema?" │
        └─────┬─────┘                         └────────┬─────────┘
              │                                        │
              │                    ┌───────────────────┼───────────────────┐
              │                    │ SIM                                NÃO │
              │                    ▼                                       ▼
              │          ┌─────────────────┐                     (volta para WELCOME)
              │          │HANDOVER_RECORRENTE│
              │          │  → ATENDIMENTO   │
              │          └─────────────────┘
              ▼
        ┌───────────┐
        │ Q_REGION  │
        │"Qual região?"│
        └─────┬─────┘
              │
        ┌─────┴─────┐
        ▼           ▼
    Ombro/Joelho/Outra
              │
              ▼
        ┌───────────┐
        │ Q_PROBLEM │
        │"Tipo de    │
        │ problema?" │
        └─────┬─────┘
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
Dor Crônica/        Dor Recente/
Lesão/Cirurgia      Não Sei
    │                   │
    ▼                   ▼
┌───────────┐    ┌──────────────┐
│ Q_MODERN  │    │DESCARTE_FRIO│
│"Tratamento│    │  (encerra)  │
│ moderno?" │    └──────────────┘
└─────┬─────┘
      │
      ▼ (continua...)
```

### Nós Implementados

| # | Nó | Tipo | Próximo (SIM) | Próximo (NÃO) |
|---|---|---|---|---|
| 1 | `start` | question | welcome | check_recurrent |
| 2 | `check_recurrent` | question | handover_recorrente | welcome |
| 3 | `handover_recorrente` | handover | - | - |
| 4 | `welcome` | message | q_region | - |
| 5 | `q_region` | question | q_problem | q_problem |
| 6 | `q_problem` | question | q_modern | descarte_frio |
| 7 | `q_modern` | question | q_finance | descarte_frio |
| 8 | `q_finance` | question | q_goal | descarte_convenio |
| 9 | `q_goal` | question | q_location | descarte_frio |
| 10 | `q_location` | question | q_modalidade/msg_telemedicina | - |
| 11 | `msg_telemedicina` | message | q_modalidade | - |
| 12 | `q_modalidade` | question | success_handover | - |
| 13 | `success_handover` | handover | - | - |
| 14 | `descarte_frio` | disqualify | - | - |
| 15 | `descarte_convenio` | disqualify | - | - |

---

## ✅ Verificações Realizadas

| Verificação | Status |
|-------------|--------|
| Estrutura de pastas criada | ✅ |
| 16 arquivos JavaScript | ✅ |
| package.json configurado | ✅ |
| Dependências instaladas (146 pacotes) | ✅ |
| Sintaxe validada (`node --check`) | ✅ |
| .env.example criado | ✅ |
| .gitignore configurado | ✅ |
| Seeder com fluxo completo | ✅ |
| Auto-execução do seeder no app.js | ✅ |

---

## 🚀 Como Executar

### 1. Configurar Variáveis de Ambiente

Editar o arquivo `api/.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bot_medico
DB_USER=postgres
DB_PASSWORD=sua_senha

# Server
PORT=3000
NODE_ENV=development

# Z-API
ZAPI_INSTANCE_ID=sua_instancia
ZAPI_TOKEN=seu_token
ZAPI_CLIENT_TOKEN=seu_client_token
```

### 2. Criar Banco de Dados

```sql
CREATE DATABASE bot_medico;
```

### 3. Iniciar o Servidor

```bash
cd api
npm start
```

### 4. Output Esperado

```
[Database] Conectando ao PostgreSQL...
[Database] ✅ Conexão estabelecida com sucesso!
[Database] Sincronizando models...
[Database] ✅ Models sincronizados!
[Seeder] Inicializando fluxo de triagem...
[Seeder] ✅ Fluxo de triagem pronto!

╔════════════════════════════════════════════════════╗
║                                                    ║
║   🏥 BOT MÉDICO API - SERVIDOR INICIADO           ║
║                                                    ║
║   🌐 URL: http://localhost:3000                    ║
║   📡 Webhook: POST /webhook                        ║
║   🔧 Fluxos: GET /api/flows                        ║
║                                                    ║
╚════════════════════════════════════════════════════╝
```

---

## 📝 Próximos Passos Sugeridos

1. **Configurar Z-API:** Conectar instância do WhatsApp
2. **Configurar Webhook:** Apontar URL do webhook no painel Z-API
3. **Testar Fluxo:** Enviar mensagem para o número conectado
4. **Frontend:** Criar interface visual para edição de fluxos
5. **Autenticação:** Implementar JWT para APIs administrativas
6. **Notificações:** WebSocket para alertar admins sobre handovers

---

**Relatório gerado automaticamente em 14/01/2026**
