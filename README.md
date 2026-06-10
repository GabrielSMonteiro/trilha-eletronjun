# ⚡ CapacitaJun

Plataforma gamificada para capacitação — interface em React + TypeScript com backend em Supabase.

---

## Visão Rápida

- Repositório Original: [CapacitaJun EletronJun](https://github.com/GabrielSMonteiro/Capacita)
- Manager de pacotes oficial: **npm**
- Banco de Dados: Supabase (migrations na pasta `supabase/migrations`)

---

## 🎯 Sobre

O CapacitaJun é um projeto Open Source da EletronJun que organiza trilhas de aprendizado em lições, com sistema de gamificação (pontos, níveis, conquistas e streaks) e painel administrativo (para gerenciamento de conteúdo e progresso de alunos). O objetivo é facilitar o onboarding e capacitação contínua de membros.

## 🛠 Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Data & Auth:** Supabase (Postgres + RLS)
- **State & Fetching:** React Query, Supabase JS
- **Testes & Qualidade:** Vitest + Testing Library, Playwright (E2E), Husky + ESLint

---

## ⚙️ Configuração do Ambiente e Banco de Dados (Supabase)

Para rodar o projeto localmente, você precisará configurar o frontend e o banco de dados via Supabase CLI.

### 1. Configurando o Banco (Supabase Local)
Todo o esquema de tabelas, funções, RLS e roles do banco estão na pasta `supabase/`.
1. Instale o [Supabase CLI](https://supabase.com/docs/guides/cli).
2. Na raiz do projeto, inicie os contêineres locais do Supabase:
   ```bash
   supabase start
   ```
3. O Supabase CLI aplicará automaticamente as migrations localizadas na pasta `supabase/migrations/`.
4. Anote a "API URL" e "anon key" que serão exibidas no terminal.

*Nota: As tabelas principais incluem `profiles` (dados do usuário), `user_roles` (onde a role `admin` é definida), `categories`, `lessons` e `user_progress`.*

### 2. Configurando o Frontend
1. Instale as dependências usando **npm**:
   ```bash
   npm install
   ```
2. Crie e preencha as variáveis de ambiente:
   ```bash
   cp .env.example .env.local
   ```
   Edite `.env.local` e insira as chaves do Supabase local (ou remoto, se estiver conectando a um projeto na nuvem).
   ```env
   VITE_SUPABASE_URL=http://127.0.0.1:54321
   VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
   ```

3. Rodar o ambiente de desenvolvimento:
   ```bash
   npm run dev
   ```

---

## 🧪 Comandos Úteis (Desenvolvimento)

Para manter a qualidade e rodar a suíte de testes do projeto:

- `npm run dev`: Inicia o servidor local do Vite.
- `npm run lint`: Checa problemas de sintaxe e estilo com ESLint.
- `npm run test`: Executa os testes unitários/integração via Vitest.
- `npm run test:ui`: Abre a interface gráfica do Vitest no navegador.
- `npm run test:e2e`: Executa testes end-to-end com Playwright.
- `npm run coverage`: Gera o relatório de cobertura de testes.

Temos também hooks de **pre-commit** usando Husky para garantir que o lint e os testes rodem antes do código ser empurrado para o repositório.

