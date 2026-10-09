---
name: Gestão da Biblioteca Escolar
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#747686'
  outline-variant: '#c4c5d7'
  surface-tint: '#2151da'
  primary: '#0037b0'
  on-primary: '#ffffff'
  primary-container: '#1d4ed8'
  on-primary-container: '#cad3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fd'
  on-secondary-container: '#57657b'
  tertiary: '#005024'
  on-tertiary: '#ffffff'
  tertiary-container: '#1c6938'
  on-tertiary-container: '#99e6a8'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b5'
  secondary-fixed: '#d5e3fd'
  secondary-fixed-dim: '#b9c7e0'
  on-secondary-fixed: '#0d1c2f'
  on-secondary-fixed-variant: '#3a485c'
  tertiary-fixed: '#a6f4b5'
  tertiary-fixed-dim: '#8bd79b'
  on-tertiary-fixed: '#00210b'
  on-tertiary-fixed-variant: '#005226'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  display-lg-mobile:
    fontFamily: Source Serif 4
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
  headline-lg:
    fontFamily: Source Serif 4
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Source Serif 4
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-lg:
    fontFamily: Public Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  title-md:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Public Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Public Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Public Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

O sistema foi concebido para atender à administração, aos educadores e aos estudantes de bibliotecas da rede pública de ensino. O tom visual é rigorosamente institucional, sóbrio, cívico e acolhedor, afastando-se deliberadamente de maneirismos visuais de startups comerciais (como gradientes agressivos, microinterações espalhafatosas ou cantos super-arredondados).

A estética adota um estilo **Moderno Institucional com rigor editorial**:
- **Solidez e Confiança:** Transmite perenidade, segurança de dados patrimoniais e catalogação confiável.
- **Eficiência e Densidade Operacional:** A interface privilegia a leitura contínua de grandes acervos, busca bibliográfica por ISBN/CDD e fluxo veloz de empréstimo e devolução.
- **Acessibilidade Universal:** Contraste mínimo estrito (em conformidade com WCAG AA e AAA), com hierarquias de rótulos explícitas, livres de ambiguidades para usuários com diferentes níveis de letramento digital.

## Colors

A paleta cromática estrutura um ambiente limpo e utilitário, com base em contrastes luminosos calibrados para longas jornadas de trabalho administrativo e consulta escolar:

- **Primária (`#1D4ED8`):** Azul institucional reservado para ações mestras, estado de foco de elementos interativos e títulos funcionais de navegação.
- **Variações de Apoio Primário:**
  - Azul Aprofundado (`#1E40AF`): Estados de clique e barras de cabeçalho administrativo.
  - Azul Seleção / Superfície de Apoio (`#DBEAFE`): Fundo para registros selecionados, linhas de tabela ativas e badges informativos neutros.
- **Superfícies e Telas de Fundo:**
  - Fundo Geral da Aplicação (`#F8FAFC`): Cinza claro frio que reduz o ofuscamento ocular sem rebaixar o contraste.
  - Fundo de Trabalho e Conteúdo (`#FFFFFF`): Branco puro para fichas catalográficas, gavetas de formulários, tabelas e cartões métricos.
- **Divisores e Contornos:** Cinza sutil neutro (`#E2E8F0`) para bordas estruturais de cartões, campos e linhas tabulares.
- **Tipografia e Contraste:**
  - Texto Principal (`#0F172A` e `#1E293B`): Alto contraste preto-azulado/chumbo para máxima legibilidade textual.
  - Texto Secundário (`#475569` e `#64748B`): Cinza médio para metadados (edição, autor secundário, data de publicação).
- **Semântica Bibliotecária e Status:**
  - *Disponível / Concluído:* Verde escuro (`#166534`) sobre fundo verde suave (`#DCFCE7`).
  - *Pendente / Prazo Próximo:* Âmbar institucional (`#9A3412`) sobre fundo amarelo suave (`#FEF3C7`).
  - *Atrasado / Irregularidade:* Vermelho comedido (`#991B1B`) sobre fundo vermelho suave (`#FEE2E2`).

## Typography

A união entre a **Source Serif 4** e a **Public Sans** cria o equilíbrio ideal entre a erudição da instituição escolar e a praticidade exigida por interfaces governamentais modernas:

- **Source Serif 4 (Títulos e Nomes de Seções):** Evoca a tradição dos livros impressos, dos arquivos acadêmicos e da literatura clássica. Usada exclusivamente em cabeçalhos de tela, nomes de módulos principais e títulos de obras no acervo.
- **Public Sans (Corpo, Rótulos e Dados):** Tipografia de alta precisão técnica e legibilidade desimpedida em telas de baixa densidade de pixels. Utilizada em células de tabelas, formulários, botões operacionais, código de barras/ISBN e metadados.
- **Comportamento Responsivo:** Títulos de topo reduzem a escala em telas móveis preservando o ritmo vertical da página.

## Layout & Spacing

O layout adota uma grade estruturada de 12 colunas em desktop, 8 em tablet e 4 em mobile, com barras de navegação institucional fixas:

- **Navegação Lateral Fixa (Sidebar):** Largura de `260px` em desktop, contendo o brasão/identificador da escola, atalhos para Acervo, Empréstimos, Leitores, Reservas e Relatórios.
- **Área de Conteúdo (Canvas Principal):** Margens generosas de `2rem` em monitores para dar respiro à leitura densa de inventários, reduzindo-se para `1rem` em dispositivos compactos.
- **Rhythm e Escala:** Baseada em submúltiplos de 4px e 8px:
  - `space-xs` (4px): Espaçamento interno entre ícones e textos em badges e chips.
  - `space-sm` (8px): Distância entre rótulo e campo de input; separação de botões em grupos de ação.
  - `space-md` (16px): Padding interno de células de tabela e espaçamento entre campos de formulário simples.
  - `space-lg` (24px): Padding interno de cartões de métrica e filtros de busca avançada.
  - `space-xl` (32px): Separação entre blocos de conteúdo da página (ex.: cabeçalho de busca vs. grade de resultados).

## Elevation & Depth

Para sustentar a fidelidade funcional sóbria e evitar elementos com aspecto flutuante artificial, a profundidade é alcançada majoritariamente através de **contornos sutis (ghost borders)** e **camadas tonais**, combinadas a sombras de difusão mínima:

- **Nível 0 (Plano de Fundo Base):** Superfície geral `#F8FAFC`, sem relevo.
- **Nível 1 (Cartões, Painéis e Tabelas):** Superfície `#FFFFFF` com contorno de `1px solid #E2E8F0` e sombra perimetral quase imperceptível: `0 1px 2px 0 rgba(15, 23, 42, 0.05)`.
- **Nível 2 (Filtros Retráteis, Dropdowns e Menus de Contexto):** Superfície `#FFFFFF` com borda `#CBD5E1` e sombra: `0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`.
- **Nível 3 (Modais de Confirmação de Empréstimo / Devolução):** Superfície `#FFFFFF` com backdrop semitransparente em cinza-petróleo escuro (`rgba(15, 23, 42, 0.45)`) e sombra: `0 10px 15px -3px rgba(15, 23, 42, 0.12)`.

## Shapes

O sistema utiliza a regra de arredondamento **Soft (`roundedness: 1`)**, que traduz formalidade sem aspereza visual:

- **Elementos Padrão (Inputs, Botões, Células, Badges):** Raio de curvatura de `0.25rem` (4px). Garante alinhamento cartesiano rigoroso em tabelas e formulários modulares.
- **Painéis, Modais e Cartões Principais (`rounded-lg`):** Raio de `0.5rem` (8px), conferindo acabamento polido sem comprometer a sobriedade.
- **Containers Maiores (`rounded-xl`):** `0.75rem` (12px), restrito a enquadramentos de grandes áreas ou banners de comunicado institucional.
- **Elementos Circulares:** Permitidos exclusivamente para avatares de estudantes/servidores e indicadores numéricos de notificação de pendências.

## Components

### Botões (Buttons)
- **Primário:** Fundo `#1D4ED8`, texto `#FFFFFF`, sem borda, cantos `rounded (4px)`, fonte `Public Sans` peso 600. Em hover, transiciona para `#1E40AF`. Foco com anel visível de `2px` em offset de `2px`.
- **Secundário / Neutro:** Fundo `#FFFFFF`, borda `1px solid #CBD5E1`, texto `#334155`. Hover em `#F1F5F9`.
- **Perigo / Atraso Crítico:** Fundo `#991B1B`, texto `#FFFFFF`. Utilizado exclusivamente para ações destrutivas (ex.: cancelar inscrição ou registrar extravio de exemplar).

### Campos de Entrada (Input Fields & Search)
- **Labels:** Sempre visíveis, posicionados acima do campo em `label-md` (`#334155`). Proibido substituir rótulos por placeholders efêmeros.
- **Campo de Busca Bibliográfica:** Campo de altura `40px`, fundo `#FFFFFF`, borda `#CBD5E1`, contendo ícone de lupa fixo à esquerda e tecla de atalho (`/` ou `Enter`) à direita.
- **Estados:** Borda em repouso `#CBD5E1`; borda em foco `#1D4ED8` com sombra de anel sutil `0 0 0 1px #1D4ED8`.

### Tabelas Acadêmicas de Acervo e Empréstimos
- **Cabeçalho:** Fundo `#F1F5F9`, tipografia em maiúsculas suaves (`label-sm`), cor `#475569`, borda inferior rígida de `1px solid #CBD5E1`.
- **Linhas:** Altura confortável de `48px` para dados simples e `64px` para registros com capa ou dados secundários. Borda entre linhas de `1px solid #F1F5F9`.
- **Hover e Seleção:** Linha passa para `#F8FAFC` no cursor e `#EFF6FF` quando selecionada via checkbox.

### Badges e Chips de Status
- **Disponível:** Fundo `#DCFCE7`, texto `#166534`, borda `1px solid #BBF7D0`.
- **Emprestado / Prazo Regular:** Fundo `#DBEAFE`, texto `#1E40AF`, borda `1px solid #BFDBFE`.
- **Prazo Próximo / Reserva:** Fundo `#FEF3C7`, texto `#9A3412`, borda `1px solid #FDE68A`.
- **Atrasado / Pendência:** Fundo `#FEE2E2`, texto `#991B1B`, borda `1px solid #FECACA`.

### Cartões de Métricas Acadêmicas
- Superfície branca retangular com borda `#E2E8F0`, padding `space-md` (16px) a `space-lg` (24px).
- Valor numérico destacado em `Public Sans` peso 700 (24px a 28px) e subtítulo institucional em `Source Serif 4` ou `Public Sans` neutra descrevendo o totalizador (Ex.: "Títulos Catalogados", "Exemplares em Circulação", "Devoluções Previstas Hoje").