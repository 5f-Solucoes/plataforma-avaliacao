```mermaid
---
config:
  look: neo
  layout: elk
---

flowchart TD
    classDef client fill:#e0f7fa,stroke:#006064,stroke-width:2px,color:#000
    classDef server fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#000
    classDef data fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px,color:#000
    classDef storage fill:#ede7f6,stroke:#4a148c,stroke-width:2px,color:#000

    User([Usuários: Admin, Instrutor, Aluno])

    subgraph Frontend [1. Camada de Apresentação Client-Side Browser]
        UI[Mantine UI\nComponentes Visuais]:::client
        CC[React Client Components\nEstados, Hooks, Interatividade]:::client
    end

    subgraph Backend [2. Camada de Aplicação Next.js Node.js]
        SC[Server Components\nSSR e Busca de dados segura]:::server
        SA[Server Actions\nMutações e Formulários]:::server
        
        subgraph CoreLogic [Núcleo de Regras de Negócio]
            Auth(Módulo de Permissões / Sessão):::server
            ExamEngine(Motor de Provas & Anti-Fantasma):::server
            Grader(Correção Automática & Certificados):::server
            LMS(Gerenciador de Módulo de Estudos):::server
        end
    end

    subgraph DataAccess [3. Camada de Persistência]
        ORM[Prisma ORM\nGerenciador de Schema e Tipagem]:::data
    end

    subgraph Infra [4. Infraestrutura e Armazenamento]
        DB[(Banco de Dados Relacional PostgreSQL )]:::storage
        FS[File System Local\npastasp ublic/uploads]:::storage
    end

    User -->|Interage pelo Navegador| UI
    UI -->|Renderiza| CC
    User -->|Navega para Nova URL| SC
    CC -->|Dispara Ações async| SA
    
    SA -->|Valida Role do Usuário| Auth
    SA -->|Inicia/Finaliza Tentativas| ExamEngine
    SA -->|Valida Gabaritos| Grader
    SA -->|Upload de Materiais| LMS
    
    LMS -->|Salva arquivos no disco| FS
    ExamEngine -->|Lê imagens das questões| FS
    
    SC -->|Leitura Direta Rápida| ORM
    SA -->|Operações de Escrita/Update/Delete| ORM
    
    ORM -->|Executa Queries SQL Nativas| DB
    ```