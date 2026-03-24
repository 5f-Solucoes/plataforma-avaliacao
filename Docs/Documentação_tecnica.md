# Documentação Técnica - Plataforma de Avaliação 5F

## Índice
1. [Visão Geral]
2. [Stack Tecnológico]
3. [Arquitetura]
4. [Estrutura de Diretórios]
5. [Banco de Dados]
6. [Autenticação e Autorização]
7. [Funcionalidades Principais]
8. [Pages e Rotas]
9. [Componentes]
10. [Server Actions]
11. [Configurações]
12. [Guia de Desenvolvimento]
13. [Testes]
14. [Deployment]

---

## Visão Geral

**Plataforma de Avaliação 5F** é um sistema web completo de certificação e avaliação técnica desenvolvido com Next.js 16. A plataforma permite:

- **Autenticação segura** com MFA (Multi-Factor Authentication) via WatchGuard AuthPoint
- **Gestão de provas** com questions dinâmicas e cronometradas
- **Emissão automática de certificados** em PDF com código de autenticação único
- **Painel administrador** para gerenciar usuários, provas, questões e categorias
- **Histórico de tentativas** e rastreamento de desempenho
- **Validação de certificados** via código única

### Objetivo Principal
Fornecer um ambiente seguro, escalável e confiável para testar conhecimento técnico dos colaboradores da 5F Soluções e emitir certificados digitais verificáveis.

---

## Stack Tecnológico

### Frontend
- **Next.js 16.1.7** - Framework React com server-side rendering
- **React 19.2.3** - Biblioteca UI
- **Mantine UI 8.3.15** - Componentes visuais de alta qualidade
- **Tailwind CSS 4** - Utilitários CSS
- **TypeScript 5** - Tipagem estática

### Backend
- **Next.js API Routes** - Endpoints via server actions
- **Prisma 7.4.1** - ORM para banco de dados
- **PostgreSQL 15** - Banco de dados relacional

### Autenticação e Segurança
- **jose v6.1.3** - JWT
- **bcryptjs v3.0.3** - Hash de senhas
- **WatchGuard AuthPoint** - MFA 
- **Next.js cookies** - Gerenciamento de sessões

### Geração de Documentos
- **jsPDF v4.2.0** - Geração de PDF
- **html2canvas v1.4.1** - Captura de conteúdo HTML para imagem

### Testes
- **Vitest v4.1.1** - Test runner baseado em Vite
- **React Testing Library v16.3.2** - Testes de componentes
- **jsdom v29.0.1** - DOM virtual para testes
- **vitest-mock-extended v3.1.0** - Mocks avançados

### Utilitários
- **@tabler/icons-react v3.37.1** - Ícones
- **pg v8.18.0** - Driver PostgreSQL
- **dotenv v17.3.1** - Variáveis de ambiente
- **ESLint v10** - Linter
- **PostCSS v8.5.6** - Processador CSS

---

### Padrões de Arquitetura

1. **Server Components** (Next.js App Router)
   - Pages renderizadas no servidor
   - Segurança aprimorada
   - Redução de JavaScript no cliente

2. **Server Actions**
   - Funções reutilizáveis marcadas com `"use server"`
   - Execução segura no servidor
   - Validação de permissões

3. **Client Components**
   - Componentes interativos com `"use client"`
   - Estado gerenciado via Mantine hooks
   - Notificações via @mantine/notifications

4. **Middleware de Autenticação**
   - Verificação de JWT em cookies
   - Recuperação de usuário via Prisma
   - Validação de permissões

---

## Estrutura de Diretórios

```
plataforma-avaliacao/
│
├── app/                                # Next.js App Router
│   ├── layout.tsx                      # Layout raiz (Mantine Provider, Estilos)
│   ├── page.tsx                        # Página inicial
│   ├── actions.ts                      # Server actions globais (logout)
│   ├── globals.css                     # Estilos globais
│   │
│   ├── admin/                          # Painel Administrativo (requer ADMIN/INSTRUCTOR)
│   │   ├── categorias/
│   │   │   ├── page.tsx                # Gerenciar categorias de provas
│   │   │   ├── actions.ts              # Ações: renomear, deletar categorias
│   │   │   └── actions.test.ts         # Testes de ações
│   │   ├── fabricantes/
│   │   │   ├── page.tsx                # Gerenciar fabricantes
│   │   │   ├── actions.ts              # Ações: CRUD fabricantes
│   │   │   └── actions.test.ts
│   │   ├── provas/
│   │   │   ├── page.tsx                # Listar e gerenciar provas
│   │   │   ├── actions.ts              # Ações: criar, editar, deletar provas
│   │   │   ├── actions.test.ts
│   │   │   └── [id]/questoes/
│   │   │       ├── page.tsx            # Gerenciar questões de uma prova
│   │   │       └── actions.ts          # Ações de questões
│   │   ├── questoes/
│   │   │   ├── page.tsx                # Visualização de questionário (banco de questões)
│   │   │   ├── actions.ts              # Ações: criar, editar, deletar questões
│   │   │   └── actions.test.ts
│   │   └── usuarios/
│   │       ├── page.tsx                # Listar usuários
│   │       ├── actions.ts              # Ações: gerenciar usuários
│   │       ├── create/page.tsx         # Criar novo usuário
│   │       └── [id]/
│   │           └── edit/page.tsx       # Editar usuário
│   │
│   ├── certificado/
│   │   └── [codigo]/page.tsx           # Validação e visualização de certificado por código
│   │
│   ├── configuracoes/                  # Configurações do usuário
│   │   ├── page.tsx                    # Página de configurações
│   │   ├── actions.ts                  # Ações: atualizar configurações
│   │   └── actions.test.ts
│   │
│   ├── dashboard/
│   │   └── page.tsx                    # Dashboard principal (provas disponíveis)
│   │
│   ├── estudos/                        # Material de estudo
│   │   ├── page.tsx                    # Listar materiais de estudo
│   │   ├── [id]/
│   │   │   ├── page.tsx                # Visualizar material específico
│   │   │   ├── actions.ts              # Ações de estudos
│   │   │   └── actions.test.ts
│   │
│   ├── login/
│   │   ├── page.tsx                    # Página de login
│   │   └── action.ts                   # Server actions: loginAction, checkMfaStatusAction
│   │
│   ├── perfil/
│   │   └── page.tsx                    # Perfil do usuário
│   │
│   └── prova/
│       └── [id]/
│           ├── page.tsx                # Executor de prova (interface de teste)
│           ├── actions.ts              # Ações: enviar respostas, calcular nota
│           └── actions.test.ts
│
├── components/                         # Componentes React reutilizáveis
│   ├── MainLayout.tsx                  # Layout principal com navegação (AppShell)
│   ├── admin/
│   │   ├── CategoriasManager.tsx       # Componente para gerenciar categorias
│   │   ├── FabricantesManager.tsx      # Componente para gerenciar fabricantes
│   │   ├── ProvasManager.tsx           # Componente para listar/gerenciar provas
│   │   ├── QuestoesBank.tsx            # Visualizador de banco de questões
│   │   ├── QuestoesManager.tsx         # Gerenciador de questões
│   │   ├── UserForm.tsx                # Formulário para criar/editar usuário
│   │   └── UsersManager.tsx            # Lista de usuários
│   ├── Certificado/
│   │   ├── CertificateControls.tsx     # Controles de certificado (download, print)
│   │   └── PrintButton.tsx             # Botão de impressão
│   ├── Dashboard/
│   │   └── ProvasList.tsx              # Lista de provas disponíveis
│   ├── Estudos/
│   │   └── EstudosViewer.tsx           # Visualizador de materiais de estudo
│   ├── exam/
│   │   └── QuestionCard.tsx            # Componente de questão individual
│   ├── Prova/
│   │   ├── ExamRunner.tsx              # Executor principal de prova
│   │   └── ProvaStartWrapper.tsx       # Wrapper de inicialização de prova
│   └── Settings/
│       └── SettingsTabs.tsx            # Abas de configurações
│
├── lib/                                # Utilitários e configurações
│   ├── auth.ts                         # Autenticação: getCurrentUser(), JWT verification
│   ├── prisma.ts                       # Instância singleton do Prisma Client
│   └── watchguard.ts                   # Integração WatchGuard: iniciarTransacaoPush(), verificarStatusTransacao()
│
├── prisma/                             # Banco de dados
│   ├── schema.prisma                   # Definição de modelos (Schemas)
│   ├── seed.ts                         # Script de seed (dados iniciais)
│   └── migrations/                     # Histórico de migrações
│       ├── migration_lock.toml
│       ├── 20260220182412_init_db_com_validade/
│       │   └── migration.sql
│       └── 20260226181759_add_roles/
│           └── migration.sql
│
├── public/                             # Arquivos estáticos
│   └── uploads/
│       ├── estudos/                    # Upload de materiais de estudo
│       ├── questoes/                   # Upload de imagens de questões
│
├── test/                               # Testes
│   └── setup.ts                        # Configuração do Vitest
│
├── types/                              # Tipos TypeScript globais
│   └── index.ts
│
├── Docs/                               # Documentação
│   ├── Documentação_tecnica.md        # Este arquivo
│   ├── Classe.md                       # Definições de classes
│   ├── Diagrama_De_Estudo.md           # Diagrama do fluxo de estudos
│   ├── Diagrama_De_Sequencia.md        # Diagrama de sequência
│   ├── Diagrama_Prova_e_Certificado.md # Fluxo de prova e certificado
│   ├── Diagramas_de_Arquitetura.md    # Arquitetura do sistema
│   ├── Diagrama_Fluxo_de_Dados.md     # Fluxo de dados
│   ├── Diagrama_Prova.md               # Detalhes de prova
│   └── Login.md                        # Fluxo de login
│
├── Configuration Files
│   ├── package.json                    # Dependências e scripts
│   ├── tsconfig.json                   # Configuração TypeScript
│   ├── next.config.ts                  # Configuração Next.js
│   ├── vitest.config.ts                # Configuração de testes
│   ├── tailwind.config.js              # Configuração Tailwind
│   ├── postcss.config.cjs              # Configuração PostCSS
│   ├── eslint.config.mjs               # Configuração ESLint
│   ├── docker-compose.yml              # Orquestração Docker
│   ├── .env.example                    # Variáveis de ambiente (exemplo)
│   └── .env.local                      # Variáveis de ambiente (local)
│
├── README.md                           # Guia rápido do projeto
└── .gitignore                          # Arquivos ignorados no Git
```

---

## Banco de Dados

### Modelos Prisma

#### 1. **Usuario**
```prisma
model Usuario {
  id              Int
  nome            String
  username        String              @unique
  senhaHash       String
  email           String?
  ativo           Boolean             @default(true)
  role            Role                @default(USER)
  criadoEm        DateTime            @default(now())
  provasLiberadas Prova[]             @relation("AcessoProva")
  tentativas      TentativaProva[]
  certificados    Certificado[]
}
```

**Roles:**
- `USER` - Usuário comum, pode fazer provas
- `INSTRUCTOR` - Instrutor, pode gerenciar provas e questões
- `ADMIN` - Administrador, acesso total

#### 2. **Prova**
```prisma
model Prova {
  id                  Int
  nome                String
  categoria           String?
  tempoLimiteMinutos  Int
  qtdPerguntasSorteio Int              @default(10)
  notaCorte           Decimal          @map("nota_corte")
  validadeMeses       Int?             @default(12)
  
  fabricanteId        Int?
  fabricante          Fabricante?
  usuariosPermitidos  Usuario[]        @relation("AcessoProva")
  materiais           MaterialEstudo[]
  perguntas           Pergunta[]
  tentativas          TentativaProva[]
}
```

#### 3. **Pergunta**
```prisma
model Pergunta {
  id               Int
  enunciado        String              @db.Text
  imagemUrl        String?
  nivelDificuldade String?
  
  respostas        Resposta[]
  tentativas       TentativaResposta[]
}
```

#### 4. **Resposta**
```prisma
model Resposta {
  id                 Int
  textoAlternativa   String              @db.Text
  ehCorreta          Boolean
  
  perguntaId         Int
  pergunta           Pergunta
  respostasDadas     TentativaResposta[]
}
```

#### 5. **TentativaProva**
Rastreia cada tentativa de um usuário em uma prova:
```prisma
model TentativaProva {
  id          Int
  dataInicio  DateTime
  dataFim     DateTime?
  notaFinal   Decimal?
  aprovado    Boolean?
  
  usuarioId   Int
  usuario     Usuario
  
  provaId     Int
  prova       Prova
  
  respostas   TentativaResposta[]
  certificado Certificado?
}
```

#### 6. **TentativaResposta**
Cada resposta fornecida pelo usuário em uma questão:
```prisma
model TentativaResposta {
  id                  Int
  tentativaId         Int
  tentativa           TentativaProva
  
  perguntaId          Int
  pergunta            Pergunta
  
  respostaEscolhidaId Int?
  resposta            Resposta?
}
```

#### 7. **Certificado**
```prisma
model Certificado {
  id                    Int
  codigoAutenticacao    String            @unique @default(uuid())
  dataEmissao           DateTime          @default(now())
  dataValidade          DateTime?
  
  caminhoPdf            String?
  
  usuarioId             Int
  usuario               Usuario
  
  tentativaId           Int               @unique
  tentativa             TentativaProva
}
```

#### 8. **MaterialEstudo**
```prisma
model MaterialEstudo {
  id          Int
  titulo      String
  descricao   String?                 @db.Text
  tipo        String                  @default("LINK") 
  url         String?
  
  provaId     Int
  prova       Prova
}
```

#### 9. **Fabricante**
```prisma
model Fabricante {
  id          Int
  nome        String
  site        String?
  areaAtuacao String?
  provas      Prova[]
}
```

### Fluxo de Dados

```
1. Usuário faz login via WatchGuard ✓
   └─ Armazenado em session_token 

2. Usuário acessa dashboard
   └─ Recupera provas permitidas

3. Usuário inicia prova
   └─ Cria TentativaProva com timestamp inicio
   └─ Sorteia X questões
   └─ Inicia cronômetro

4. Usuário responde questões
   └─ Salva cada TentativaResposta
   └─ Valida em tempo real

5. Usuário finaliza prova
   └─ Calcula nota_final
   └─ Define aprovado = (nota_final >= nota_corte)
   └─ Se aprovado, gera Certificado automaticamente

6. Certificado é emitido
   └─ Gera PDF com jsPDF
   └─ Armazena código_autenticacao único
   └─ Calcula validade 
```

---

### Componentes de Segurança

1. **lib/auth.ts**
   - `getCurrentUser()` - Recupera usuário da sessão JWT
   - Valida token com jose
   - Retorna dados básicos do usuário

2. **lib/watchguard.ts**
   - `iniciarTransacaoPush()` - Inicia MFA
   - `verificarStatusTransacao()` - Verifica status MFA
   - `getToken()` - Cache de token WatchGuard
   - `callApi()` - Chamadas para API WatchGuard

3. **Server Actions com Verificação de Permissão**
   ```typescript
   async function checkPermission() {
     const user = await getCurrentUser();
     if (!user || (user.role !== "ADMIN" && user.role !== "INSTRUCTOR")) {
       throw new Error("Sem permissão");
     }
   }
   ```

### Variáveis de Ambiente Necessárias

```bash
# Banco de Dados
DATABASE_URL=postgresql://admin:admin@localhost:5432/plataforma_avaliacao

# Session
SESSION_SECRET=sua-chave-secreta-aqui

# WatchGuard AuthPoint
WATCHGUARD_ACCESS_ID=seu-access-id
WATCHGUARD_CLIENT_SECRET=seu-client-secret
WATCHGUARD_AUTH_URL=https://authpoint.watchguard.com/oauth2/token
WATCHGUARD_API_BASE=https://seu-account.watchguard.com
WATCHGUARD_API_KEY=seu-api-key
WATCHGUARD_ACCOUNT_ID=seu-account-id
WATCHGUARD_RESOURCE_ID=seu-resource-id
```

---

## Funcionalidades Principais

### 1. **Autenticação Multi-Fator (MFA)**
- Login com username/email + senha
- Push notification via WatchGuard mobile app
- Fallback para senha local se MFA falhar
- Sincronização de senha quando muda no AD

### 2. **Gerenciamento de Provas**
- Criar/editar/deletar provas
- Definir tempo limite, nota de corte, validade
- Associar questões
- Liberar acesso para usuários específicos
- Vincular materiais de estudo

### 3. **Banco de Questões**
- Gerenciar questões com múltiplas alternativas
- Suporte a imagens em questões
- Nivelamento de dificuldade
- Sorteio dinâmico de questões

### 4. **Executor de Prova**
- Interface limpa para responder questões
- Cronômetro em tempo real
- Validação de respostas
- Cálculo automático de nota
- Feedback imediato

### 5. **Emissão de Certificados**
- Geração automática de PDF
- Código de autenticação único (UUID)
- Validade configurável
- Download ou impressão
- Validação por código

### 6. **Painel Administrativo**
- Dashboard com métricas
- CRUD completo de usuários
- Gerenciamento de provas e questões
- Gerenciamento de categorias
- Gerenciamento de fabricantes
- Configurações do sistema

### 7. **Materiais de Estudo**
- Suporte a links, vídeos, PDFs e textos
- Associação com provas
- Visualização integrada

### 8. **Histórico e Rastreamento**
- Histórico de tentativas por usuário
- Rastreamento de respostas
- Análise de desempenho

---

## Pages e Rotas

### Rotas Públicas

| Rota | Descrição |
|------|-----------|
| `/` | Página inicial (landing page) |
| `/login` | Login com MFA |
| `/certificado/[codigo]` | Validação de certificado por código público |

### Rotas Autenticadas (USER)

| Rota | Descrição |
|------|-----------|
| `/dashboard` | Dashboard com provas disponíveis |
| `/prova/[id]` | Executor de prova |
| `/estudos` | Materiais de estudo |
| `/estudos/[id]` | Material específico |
| `/perfil` | Perfil do usuário |
| `/configuracoes` | Configurações pessoais |

### Rotas Admin/Instructor

| Rota | Descrição |
|------|-----------|
| `/admin/usuarios` | Gerenciar usuários |
| `/admin/usuarios/create` | Criar novo usuário |
| `/admin/usuarios/[id]/edit` | Editar usuário |
| `/admin/provas` | Gerenciar provas |
| `/admin/provas/[id]/questoes` | Questões de uma prova |
| `/admin/questoes` | Bank de questões |
| `/admin/categorias` | Gerenciar categorias |
| `/admin/fabricantes` | Gerenciar fabricantes |

### Proteção de Rotas

Implementada via server components e `getCurrentUser()`:
- Redirecionamento automático se não autenticado
- Verificação de role/permissão
- Página 403 para acesso negado

---

## Componentes

### Layout e Navegação

**MainLayout.tsx** - Layout principal com NavBar, Header e Menu
```tsx
<AppShell>
  - Header com logo e menu do usuário
  - Sidebar com navegação (dinâmica por role)
  - ScrollArea na navbar
  - Menu avatar com perfil e logout
```

### Componentes Admin

1. **UsersManager.tsx** - Tabela de usuários com ações
2. **UserForm.tsx** - Formulário para criar/editar user
3. **ProvasManager.tsx** - Tabela de provas com ações
4. **QuestoesManager.tsx** - Gerenciar questões
5. **QuestoesBank.tsx** - Visualizador de banco de questões
6. **CategoriasManager.tsx** - Gerenciar categorias
7. **FabricantesManager.tsx** - Gerenciar fabricantes

### Componentes Usuário

1. **ProvasList.tsx** (Dashboard) - Cards com provas disponíveis
2. **ExamRunner.tsx** - Interface principal de prova
   - Cronômetro
   - Navegação entre questões
   - Seleção de respostas
   - Botão de finalizar
3. **QuestionCard.tsx** - Renderização de questão individual
4. **CertificateControls.tsx** - Controles de certificado
5. **PrintButton.tsx** - Botão de impressão
6. **EstudosViewer.tsx** - Visualizador de materiais
7. **SettingsTabs.tsx** - Abas de configurações

### Padrões de Componentes

- **"use client"** para componentes com interatividade
- **Mantine UI** para todos os componentes visuais
- **TypeScript** com tipagem completa
- **React Hooks** (useState, useEffect, useCallback)

---

## Server Actions

Server Actions são funções reutilizáveis executadas no servidor com validação integrada.

### Autenticação (`/app/login/action.ts`)

```typescript
export async function loginAction(prevState, formData)

export async function checkMfaStatusAction(transactionId)
```

### Categorias (`/app/admin/categorias/actions.ts`)

```typescript
export async function renameCategoriaAction(oldName, newName)
export async function deleteCategoriaAction(categoryName)
```

### Fabricantes (`/app/admin/fabricantes/actions.ts`)

```typescript
export async function createFabricanteAction(formData)
export async function updateFabricanteAction(id, formData)
export async function deleteFabricanteAction(id)
```

### Provas (`/app/admin/provas/actions.ts`)

```typescript
export async function createProvaAction(formData)
export async function updateProvaAction(id, formData)
export async function deleteProvaAction(id)
export async function liberarProvaAction(provaId, usuarioIds)
```

### Questões (`/app/admin/questoes/actions.ts`)

```typescript
export async function createQuestaoAction(formData)
export async function updateQuestaoAction(id, formData)
export async function deleteQuestaoAction(id)
export async function adicionarQuestaoProvaAction(provaId, questaoId)
```

### Prova (Execução) (`/app/prova/[id]/actions.ts`)

```typescript
export async function iniciarProvaAction(provaId)

export async function enviarRespostaAction(tentativaId, perguntaId, respostaId)

export async function finalizarProvaAction(tentativaId)
```

### Usuários (`/app/admin/usuarios/actions.ts`)

```typescript
export async function createUsuarioAction(formData)
export async function updateUsuarioAction(id, formData)
export async function deleteUsuarioAction(id)
export async function resetSenhaUsuarioAction(id)
```

### Estudos (`/app/estudos/[id]/actions.ts`)

```typescript
export async function createMaterialEstudoAction(formData)
export async function updateMaterialEstudoAction(id, formData)
export async function deleteMaterialEstudoAction(id)
```

### Configurações (`/app/configuracoes/actions.ts`)

```typescript
export async function updateConfiguracaoAction(formData)
```

### Logout (`/app/actions.ts`)

```typescript
export async function logoutAction()
```

---

## Configurações

### next.config.ts
```typescript
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "strict": true,
    "jsx": "react-jsx",
    "paths": { "@/*": ["./*"] }
  }
}
```

### vitest.config.ts
```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    alias: { '@': path.resolve(__dirname, './') }
  }
})
```

### tailwind.config.js
Configuração de cores, fontes e extensões Tailwind.

### postcss.config.cjs
Processamento CSS com Mantine e Tailwind.

### .env.local
```bash
DATABASE_URL=postgresql://admin:admin@localhost:5432/plataforma_avaliacao
SESSION_SECRET=sua-chave-secreta
WATCHGUARD_* = variáveis WatchGuard
```

---

## Guia de Desenvolvimento

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/5f-Solucoes/plataforma-avaliacao.git
cd plataforma-avaliacao
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure variáveis de ambiente**
```bash
cp .env.example .env.local
```

4. **Inicie banco de dados**
```bash
docker-compose up -d
```

5. **Execute migrações Prisma**
```bash
npx prisma migrate deploy
```

6. **Execute seed (dados iniciais)**
```bash
npx prisma db seed
```

### Desenvolvimento

```bash
npm run dev
```

Acesse em `http://localhost:3000`

### Build para Produção

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

---

## Testes

### Rodando Testes

```bash
npm run test

npm run test -- --watch

npm run test -- --coverage
```

### Estrutura de Testes

Testes estão localizados próximo aos arquivos implementados:
- `*.test.ts` - Testes de actions
- `*.test.tsx` - Testes de componentes

### Exemplo de Teste

```typescript
import { describe, it, expect } from 'vitest';
import { renameCategoriaAction } from '@/app/admin/categorias/actions';

describe('Categorias Actions', () => {
  it('should rename categoria', async () => {
    const result = await renameCategoriaAction('Old', 'New');
    expect(result.success).toBe(true);
  });
});
```

---

### Deploy em Servidor Próprio

1. **Build da aplicação**
```bash
npm run build
```

2. **Inicie a aplicação**
```bash
npm start
```

3. **Configure reverse proxy** 

### Variáveis de Ambiente em Produção

Certifique-se de definir todas as variáveis:
- `DATABASE_URL` - URL PostgreSQL em produção
- `SESSION_SECRET` - Chave segura e aleatória
- `WATCHGUARD_*` - Credenciais reais do WatchGuard
- `NODE_ENV=production`

---

## Scripts NPM

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Build para produção |
| `npm start` | Inicia servidor de produção |
| `npm run lint` | Executa ESLint |
| `npm run test` | Rodas testes com Vitest |
| `npx prisma studio` | Abre UI Prisma Studio |
| `npx prisma migrate dev` | Cria nova migração |
| `npx prisma db seed` | Executa seed script |

---

## Troubleshooting

### Problema: Login não funciona
**Solução:**
- Verifique `DATABASE_URL`
- Verifique variáveis WatchGuard
- Verifique `SESSION_SECRET`

### Problema: Banco de dados não conecta
**Solução:**
```bash
docker-compose up -d
npx prisma db push
```

### Problema: Testes falhando
**Solução:**
```bash
npm install --save-dev @testing-library/react @testing-library/dom jsdom
npm run test -- --reporter=verbose
```

### Problema: Certificado não gera PDF
**Solução:**
- Verifique se html2canvas e jsPDF estão instalados
- Verifique permissões de escrita em `/downloads`

---

**Última Atualização:** Março, 2026

