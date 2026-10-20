# Sistema de Gestão da Biblioteca Escolar

MVP acadêmico para cadastro e consulta do acervo, leitores, empréstimos, devoluções e relatórios de circulação. A aplicação usa React, Node.js/Express e PostgreSQL e trabalha com dados locais fictícios.

## Requisitos

- Node.js 20 ou superior e npm.
- PostgreSQL instalado e em execução.

## Executar localmente

1. Crie um banco PostgreSQL vazio chamado `biblioteca_escolar` (por exemplo, pelo pgAdmin).
2. Copie `.env.example` para `.env` e ajuste `DATABASE_URL` para as credenciais locais do PostgreSQL. Altere também `JWT_SECRET` e, se desejar, as credenciais de demonstração.
3. Na raiz do projeto, instale dependências, crie o schema e os dados fictícios e inicie a aplicação:

   ```powershell
   npm install
   npm run db:setup
   npm run dev
   ```

4. Acesse <http://localhost:5173>.

O Vite encaminha `/api` para a API Node em `http://localhost:3001`. O seed cria o operador de demonstração `operador@biblioteca.local` com senha `biblioteca123`, salvo se `DEMO_LOGIN` e `DEMO_PASSWORD` forem definidos no `.env`. Essas credenciais servem somente ao ambiente local.

Os comandos da API carregam o `.env` da raiz do projeto, mesmo quando o npm os executa dentro do workspace `api`. `npm run db:setup` cria/atualiza tabelas e índices e insere os dados de demonstração. Ele não cria o próprio database PostgreSQL: o database indicado em `DATABASE_URL` deve existir antes da execução.

## Demo pública no Render + Neon

O arquivo `render.yaml` configura um único serviço Node no Render: ele compila a interface React, prepara o schema/seed e serve frontend e API pelo mesmo domínio.

1. Crie um projeto PostgreSQL no [Neon](https://neon.com/) e copie a **pooled connection string** (`DATABASE_URL`) do painel.
2. Envie o repositório para o GitHub, escolha **New + → Blueprint** no [Render](https://render.com/) e conecte o repositório. O Render detecta `render.yaml`.
3. Antes do primeiro deploy, configure no serviço Render as variáveis:
   - `DATABASE_URL`: a URL pooled do Neon, guardada como secret.
   - `DEMO_PASSWORD`: uma senha exclusiva para a demonstração; ela precisa ser definida e não deve ser `biblioteca123`.
   - `JWT_SECRET`: gerada automaticamente pelo Blueprint.
4. Faça o deploy e abra a URL pública exibida pelo Render. A conta criada pelo seed usa `DEMO_LOGIN` (padrão `operador@biblioteca.local`) e `DEMO_PASSWORD`.

Não envie `.env` ao GitHub; ele está excluído pelo `.gitignore`. O banco deve permanecer separado do repositório e receber somente dados fictícios. Como todos os visitantes da demo podem usar a mesma conta de operador, eles compartilham os dados e podem alterá-los. O plano gratuito do Render pode suspender o serviço após inatividade, causando demora no primeiro acesso; o compute gratuito do Neon também pode dormir e está sujeito aos limites do plano. Essa configuração é para apresentação acadêmica, não para produção.

## Funcionalidades

- Login do operador com senha armazenada em hash e cookie HTTP-only.
- Cadastro, edição, busca e filtragem de livros/exemplares e leitores.
- Identificador patrimonial automático para cada exemplar.
- Consulta bibliográfica pelo ISBN via Open Library, com preenchimento manual disponível em caso de falha ou ISBN não encontrado.
- Empréstimo de exemplar disponível, prazo fixo de 14 dias corridos e registro de devolução.
- Identificação de atrasos sem aplicação de multas ou cotas por tipo de leitor.
- Painel e relatórios com indicadores calculados dos dados do PostgreSQL.

O acesso às demais telas exige autenticação. Os dados do seed são fictícios e podem ser recriados após limpar as tabelas do banco.

## Verificação

```powershell
npm test
npm run build
```

Os testes unitários cobrem cálculo de datas, identificação de atrasos e normalização de situações. Para validar os fluxos completos, configure o banco local e teste cadastro, empréstimo, tentativa de empréstimo de exemplar indisponível, devolução e atualização dos indicadores pela interface.
