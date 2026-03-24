### 1. **Usuario**
Representa um usuário do sistema com diferentes níveis de acesso.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | Identificador único (PK) |
| nome | String | Nome completo do usuário |
| username | String | Nome de usuário único para login |
| senhaHash | String | Senha criptografada |
| email | String | Email opcional |
| ativo | Boolean | Estado do usuário (ativo/inativo) |
| role | Enum(Role) | Papel do usuário (USER, INSTRUCTOR, ADMIN) |
| criadoEm | DateTime | Data de criação da conta |

**Relacionamentos:**
- Realiza múltiplas `TentativaProva`
- Recebe múltiplos `Certificado`
- Acessa múltiplas `Prova` (autorizado)

---

### 2. **Fabricante**
Representa organizações/fabricantes que criam as provas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | Identificador único (PK) |
| nome | String | Nome do fabricante |
| site | String | Website/URL |
| areaAtuacao | String | Área de atuação |

**Relacionamentos:**
- Cria múltiplas `Prova`

---

### 3. **Prova**
Representa um exame/teste do sistema.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | Identificador único (PK) |
| nome | String | Nome da prova |
| categoria | String | Categoria/classificação |
| tempoLimiteMinutos | Int | Tempo máximo em minutos |
| qtdPerguntasSorteio | Int | Quantidade de questões sorteadas (padrão: 10) |
| notaCorte | Decimal(5,2) | Nota mínima para aprovação |
| validadeMeses | Int | Validade do certificado em meses (padrão: 12) |
| fabricanteId | Int | Referência ao fabricante (FK) |

**Relacionamentos:**
- Criada por um `Fabricante`
- Acessível por múltiplos `Usuario`
- Contém múltiplas `Pergunta`
- Registra múltiplas `TentativaProva`
- Referencia múltiplos `MaterialEstudo`

---

### 4. **Pergunta**
Representa uma questão/pergunta de uma prova.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | Identificador único (PK) |
| enunciado | Text | Texto da pergunta |
| imagemUrl | String | URL de imagem associada (opcional) |
| nivelDificuldade | String | Nível de dificuldade |

**Relacionamentos:**
- Pertence a múltiplas `Prova` (N:N)
- Possui múltiplas `Resposta` (1:N)
- Respondida em múltiplas `TentativaResposta`

---

### 5. **Resposta**
Representa uma alternativa de resposta para uma pergunta.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | Identificador único (PK) |
| textoAlternativa | Text | Texto da alternativa |
| ehCorreta | Boolean | Indica se é a resposta correta |
| perguntaId | Int | Referência à pergunta (FK) |

**Relacionamentos:**
- Pertence a uma `Pergunta`
- Escolhida em múltiplas `TentativaResposta`

---

### 6. **TentativaProva**
Representa uma tentativa de realizar uma prova por um usuário.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | Identificador único (PK) |
| dataInicio | DateTime | Quando a prova começou |
| dataFim | DateTime | Quando a prova terminou (opcional) |
| notaFinal | Decimal(5,2) | Nota final obtida (opcional) |
| aprovado | Boolean | Status de aprovação (opcional) |
| usuarioId | Int | Referência ao usuário (FK) |
| provaId | Int | Referência à prova (FK) |

**Relacionamentos:**
- Realizada por um `Usuario`
- Tentativa de completar uma `Prova`
- Registra múltiplas `TentativaResposta`
- Gera um `Certificado` (1:1, opcional)

---

### 7. **TentativaResposta**
Representa a resposta de um usuário a uma pergunta específica em uma tentativa.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | Identificador único (PK) |
| tentativaId | Int | Referência à tentativa (FK) |
| perguntaId | Int | Referência à pergunta (FK) |
| respostaEscolhidaId | Int | Resposta escolhida (FK, opcional) |

**Relacionamentos:**
- Pertence a uma `TentativaProva`
- Responde a uma `Pergunta`
- Referencia uma `Resposta` (opcional - pode não responder)

---

### 8. **Certificado**
Representa um certificado emitido após aprovação em uma prova.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | Identificador único (PK) |
| codigoAutenticacao | String | Código único (UUID) para autenticação |
| dataEmissao | DateTime | Data de emissão |
| dataValidade | DateTime | Data de validade (opcional) |
| caminhoPdf | String | Caminho do arquivo PDF (opcional) |
| usuarioId | Int | Referência ao usuário (FK) |
| tentativaId | Int | Referência à tentativa (FK, unique) |

**Relacionamentos:**
- Emitido para um `Usuario`
- Gerado por uma `TentativaProva`

---

### 9. **MaterialEstudo**
Representa material de estudo relacionado a uma prova.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int | Identificador único (PK) |
| titulo | String | Título do material |
| descricao | Text | Descrição detalhada (opcional) |
| tipo | String | Tipo (LINK, VIDEO, PDF, TEXTO) |
| url | String | URL do recurso (opcional) |
| provaId | Int | Referência à prova (FK) |

**Relacionamentos:**
- Associado a uma `Prova`
- Deletado em cascata quando a prova é deletada

---

## Enums

### **Role**
Define os papéis disponíveis no sistema:
- `USER` - Usuário regular
- `INSTRUCTOR` - Instrutor/professor
- `ADMIN` - Administrador

---

## Relacionamentos Principais

### M:N (Muitos para Muitos)
- **Usuario ↔ Prova**: Um usuário pode acessar múltiplas provas, e uma prova pode ser acessada por múltiplos usuários

### 1:N (Um para Muitos)
- **Fabricante → Prova**: Um fabricante cria múltiplas provas
- **Prova → Pergunta**: Uma prova contém múltiplas perguntas
- **Prova → TentativaProva**: Uma prova pode ter múltiplas tentativas
- **Pergunta → Resposta**: Uma pergunta tem múltiplas respostas
- **Usuario → TentativaProva**: Um usuário realiza múltiplas tentativas
- **Usuario → Certificado**: Um usuário recebe múltiplos certificados
- **TentativaProva → TentativaResposta**: Uma tentativa registra múltiplas respostas

### 1:1 (Um para Um)
- **TentativaProva ↔ Certificado**: Uma tentativa gera no máximo um certificado

---

## Constraints e Validações

| Campo | Constraint | Descrição |
|-------|-----------|-----------|
| Usuario.username | UNIQUE | Cada usuário deve ter um nome único |
| Usuario.ativo | DEFAULT(true) | Novo usuário comes ativo por padrão |
| Usuario.role | DEFAULT(USER) | Novo usuário recebe papel USER por padrão |
| Prova.qtdPerguntasSorteio | DEFAULT(10) | 10 perguntas por padrão |
| Prova.validadeMeses | DEFAULT(12) | Certificado válido por 12 meses |
| Certificado.codigoAutenticacao | UNIQUE | Cada certificado tem código único |
| Certificado.tentativaId | UNIQUE | Uma tentativa gera apenas um certificado |
| TentativaProva.dataInicio | DEFAULT(now()) | Registra data/hora do início |
| Certificado.dataEmissao | DEFAULT(now()) | Registra data/hora de emissão |
| Usuario.criadoEm | DEFAULT(now()) | Registra data/hora de criação |
| Resposta (perguntaId) | ON DELETE CASCADE | Respostas são deletadas com pergunta |
| MaterialEstudo (provaId) | ON DELETE CASCADE | Material é deletado com prova |

---

## Indices e Performance

### Índices Recomendados
```sql
-- Chaves Estrangeiras (já indexadas automaticamente)
CREATE INDEX idx_prova_fabricante ON provas(fabricante_id);
CREATE INDEX idx_tentativa_usuario ON tentativas_prova(usuario_id);
CREATE INDEX idx_tentativa_prova ON tentativas_prova(prova_id);
CREATE INDEX idx_resposta_pergunta ON respostas(pergunta_id);
CREATE INDEX idx_tentativa_resposta_tentativa ON tentativas_respostas(tentativa_id);
CREATE INDEX idx_certificado_usuario ON certificados(usuario_id);

-- Campos frequentemente consultados
CREATE INDEX idx_usuario_username ON usuarios(username);
CREATE INDEX idx_usuario_ativo ON usuarios(ativo);
CREATE INDEX idx_certificado_codigo ON certificados(codigo_autenticacao);
```

---

## Fluxo de Dados Típico

1. **Criação de Prova**: Fabricante cria Prova com Perguntas e Respostas
2. **Autorização**: Admin autoriza Usuários para acessar Provas específicas
3. **Estudo**: Usuário acessa MaterialEstudo da Prova
4. **Tentativa**: Usuário realiza TentativaProva
5. **Respostas**: Sistema registra TentativaResposta para cada pergunta
6. **Certificado**: Se aprovado, Certificado é gerado
7. **Autenticação**: Código do certificado pode ser verificado

---

## Observações Importantes

- **Soft Delete**: No momento não há soft delete implementado. Avaliar implementação para dados históricos.
- **Auditoria**: Considerar adicionar campos de `atualizadoEm` e `atualizadoPor` para rastreabilidade.
- **Validações**: A lógica de aprovação está no schema, mas validações de negócios devem estar na aplicação.
- **GDPR**: Implementar rotina de anonimização de dados pessoais de usuários inativos.

---

**Gerado em**: 23 de Março de 2026
