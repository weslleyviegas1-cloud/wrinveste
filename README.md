# FII Navigator

Crie um aplicativo financeiro premium focado em Fundos Imobiliários (FIIs), com experiência moderna, visual avançado, animações fluidas e elementos 3D leves. O app deve funcionar como um assistente inteligente de investimentos, ajudando o usuário a acompanhar, analisar e simular investimentos.



🎯 OBJETIVO:

Criar um app altamente visual, intuitivo e poderoso que permita ao usuário:



* Controlar sua carteira de FIIs

* Simular investimentos

* Visualizar renda passiva

* Analisar e comparar fundos

* Tomar decisões melhores



---



🎨 DESIGN E EXPERIÊNCIA:



* Tema escuro:



  * Fundo: #0B0B0B

  * Cards: #121212

* Texto: #FFFFFF

* Verde (ganhos): #00E676

* Vermelho (perdas): #FF5252

* Azul destaque: #2979FF



✨ Estilo visual:



* Interface moderna estilo fintech premium

* Glassmorphism (efeito vidro)

* Sombras suaves e profundidade

* Elementos com leve efeito 3D

* Bordas arredondadas (12px–20px)

* Tipografia limpa e moderna



🎬 Animações:



* Transições suaves entre telas

* Cards com efeito hover/toque

* Gráficos animados ao carregar

* Microinterações ao clicar

* Círculo da carteira com rotação/interação



---



📱 ESTRUTURA DO APP:



1. DASHBOARD (TELA PRINCIPAL)



Exibir:



* Total investido

* Valor atual da carteira

* Lucro ou prejuízo

* Renda mensal estimada

* Renda anual estimada



📊 Elementos:



* Gráfico de crescimento animado

* Círculo interativo da carteira (pizza animada)



  * Mostra distribuição por fundo

  * Ao tocar, mostra detalhes



---



2. CARTEIRA DE INVESTIMENTOS



Funcionalidades:



* Adicionar fundos manualmente (ex: MXRF11, HGLG11, VISC11)

* Inserir:



  * valor investido OU

  * quantidade de cotas



Exibir:



* Total investido

* Valor atual

* Lucro/prejuízo

* Dividendos mensais estimados por fundo

* Percentual de cada fundo na carteira



---



3. LISTA DE FUNDOS (FIIs)



* Exibir lista com 20 a 50 FIIs

* Mostrar para cada fundo:



  * Nome (ex: MXRF11)

  * Tipo (papel, tijolo, híbrido)

  * Dividend yield estimado

  * Preço atual (mockado inicialmente)

  * Score (0 a 10)



📌 Ordenação:



* Melhores fundos no topo



📌 Filtros:



* Maior rendimento

* Maior estabilidade

* Crescimento

* Menor risco



---



4. SISTEMA DE SCORE INTELIGENTE



Cada fundo recebe nota de 0 a 10 baseada em:



* Dividend yield

* Histórico de pagamentos

* Consistência

* Tipo de fundo

* Volatilidade



Exibir com:



* Cor (verde, amarelo, vermelho)

* Barra visual



---



5. SIMULADOR DE INVESTIMENTO



Usuário insere:



* Valor a investir

* Fundo escolhido



Calcular automaticamente:



* Quantidade de cotas

* Dividendos mensais estimados

* Dividendos anuais

* Crescimento estimado em 12 meses



---



6. CÁLCULOS AUTOMÁTICOS



O sistema deve calcular automaticamente:



* Soma total investida

* Média de rendimento

* Renda passiva mensal total

* Renda anual total

* Distribuição percentual da carteira



---



7. DADOS E ATUALIZAÇÃO



Inicialmente:



* Usar dados mockados



Preparar estrutura para:



* Integração com APIs financeiras futuras



---



8. ARMAZENAMENTO



* Sem login obrigatório

* Salvar dados localmente (localStorage ou similar)

* Preparar para integração futura com Cloud (Firebase, Supabase ou AWS)



---



☁️ CLOUD (PREPARAÇÃO)



* Estrutura pronta para:



  * Backup de dados

  * Sincronização futura

  * Atualização automática



---



🎯 UX (EXPERIÊNCIA DO USUÁRIO)



* Interface simples e intuitiva

* Navegação fluida

* Feedback visual imediato

* Sem telas confusas

* Foco em clareza de informações



---



⚠️ REGRAS IMPORTANTES



* NÃO prometer ganhos garantidos

* Mostrar estimativas realistas

* Indicar que valores são aproximados

* Evitar linguagem enganosa



---



💎 DIFERENCIAL DO APP



* Visual premium com 3D leve

* Animações modernas

* Sistema inteligente de análise

* Simulador poderoso

* Controle completo da carteira

* Experiência estilo fintech de alto nível



---



🎯 RESULTADO ESPERADO



Um aplicativo bonito, moderno, inteligente e funcional que ajude o usuário a:



* entender seus investimentos

* acompanhar renda passiva

* tomar melhores decisões

* visualizar crescimento financeiro

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://wrinveste.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2cfeb623-4cfc-4ad2-94e8-682a93c93967).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
