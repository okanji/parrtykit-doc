This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Env variables
I could not figure out env variables for partykit locally, so there are two placeholders for the supabase keys in `partykit/index.ts`: 

```
const SUPABASE_URL = "";
const SUPABASE_KEY = "";
```

## Getting Started

Create the following supabase table:

```
create table
  public.documents (
    id bigint generated by default as identity,
    created_at timestamp with time zone null default now(),
    ystate bytea null,
    document json null,
    name text null,
    constraint documents_pkey primary key (id),
    constraint documents_name_key unique (name)
  ) tablespace pg_default;
  ```

`pnpm i`

`npx partykit dev`

`pnpm run dev`
