## Configuração local do Supabase

Este guia explica como aplicar as migrations e publicar funções que estão na pasta `supabase/` do repositório.

Pré-requisitos
- `psql` (cliente PostgreSQL) instalado ou o Supabase CLI (`supabase`).
- Docker se você usar `supabase start` para iniciar o ambiente local.

1) Preparar variáveis de ambiente

Copie o exemplo e edite os valores necessários:

```bash
cp .env.example .env.local
```

Se for aplicar as migrations localmente com `psql`, exporte uma variável `DATABASE_URL` apontando para seu Postgres local (ex.: criado pelo Supabase CLI):

```bash
export DATABASE_URL="postgres://postgres:postgres@localhost:54322/postgres"
```

No PowerShell (Windows):

```powershell
$env:DATABASE_URL = 'postgres://postgres:postgres@localhost:54322/postgres'
```

2) Iniciar ambiente local (opcional, com Supabase CLI)

Se você usa o Supabase CLI e quer um ambiente local completo (Realtime, Auth, Postgres), inicie:

```bash
supabase start
```

O comando acima cria serviços locais e imprime a string de conexão do Postgres — use essa URL para `DATABASE_URL`.

3) Aplicar migrations SQL

As migrations SQL ficam em `supabase/migrations`. Elas geralmente precisam ser aplicadas em ordem alfabética/numérica.

Usando `psql` (Linux / macOS):

```bash
for f in supabase/migrations/*.sql; do
  echo "aplicando $f"
  psql "$DATABASE_URL" -f "$f"
done
```

Em PowerShell (Windows):

```powershell
Get-ChildItem supabase/migrations -Filter *.sql | Sort-Object Name | ForEach-Object { psql $env:DATABASE_URL -f $_.FullName }
```

Observação: revise os arquivos em `supabase/migrations` antes de aplicar — algumas migrations podem depender da ordem ou de roles específicas.

4) Funções (Edge Functions)

As funções encontram-se em `supabase/functions`. Para publicar / testar localmente utilize o Supabase CLI:

```bash
# deploy de uma função específica
supabase functions deploy nome-da-funcao

# rodar localmente
supabase functions serve
```

