# Domus BI · Portal de parceiros

Portal onde parceiros comerciais e embaixadoras acompanham as lojas que vieram pelos cupons deles. Endereço: https://parceiros.domusbi.app.br

- Login por link no e-mail (edge function `partner-portal-login` do projeto principal). Só recebe link quem está cadastrado como parceiro, embaixadora ou administrador.
- Os dados vêm das RPCs `partner_portal_*` e `partner_admin_*` (migration `20261203100000_portal_parceiros_embaixadoras.sql` do projeto principal). Cada pessoa só vê as lojas dela; o banco garante isso.
- Este repositório só tem a tela. Banco e edge functions continuam no projeto principal (domus-bi-prod).

## Rodar no computador

```
npm install
cp .env.example .env   # preencha com a URL e a chave anon do Supabase
npm run dev
```

## Publicar

Vercel, framework Vite, variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_KEY` (as mesmas do sistema). Domínio: `parceiros.domusbi.app.br`.
