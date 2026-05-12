## Obiettivo

Sostituire HuggingFace con un Mistral AI Agent che, ad ogni ricerca dell'utente:

1. Assegna la ricerca a uno dei tier predefiniti (1-18).
2. Genera 1-3 subcategorie semantiche coerenti (es. "Microbiologia", "Microbiota Umano", "Interazione Microrganismi-Biologia Umana").
3. Salva tutto come zero-party / non-PII analytics per l'utente.
4. Le subcategorie compaiono nelle Tier cards espanse in **Interests Tiers**, sotto le subcategorie statiche, personalizzate per ogni utente. Layout invariato.

## Step 1 — Secrets

Richiedere via `add_secret`:

- `MISTRAL_API_KEY` — chiave API generata su console.mistral.ai
- `MISTRAL_AGENT_ID` — `ag_019e1c86830173e189f360bdcd36f6ce`

## Step 2 — Schema DB (migration)

Estendere `tier_keywords` con una colonna `kind` per distinguere keyword grezze da subcategorie generate dall'agente:

```sql
ALTER TABLE public.tier_keywords
  ADD COLUMN kind text NOT NULL DEFAULT 'keyword'
  CHECK (kind IN ('keyword','subcategory'));

CREATE INDEX IF NOT EXISTS tier_keywords_user_tier_kind_idx
  ON public.tier_keywords(user_id, tier_id, kind);
```

Le subcategorie vivono nella stessa tabella (RLS già a posto, ognuna scopata per `user_id`), col campo `count` che incrementa quando lo stesso concept torna. Nessuna nuova tabella → minimo blast radius.

Per gli **anonymous analytics non-PII** riusiamo l'aggregato già esistente: la subcategoria viene loggata in `anonymous_research_analytics` come nuovo record con `host = 'mistral:subcategory:<slug>'` (riusa la pipe di anonimizzazione esistente, niente PII perché solo l'aggregato per tier+settimana).

## Step 3 — Edge function `classify-interest` (riscritta)

Sostituire la chiamata HuggingFace con Mistral Agents API:

```
POST https://api.mistral.ai/v1/agents/completions
Headers: Authorization: Bearer ${MISTRAL_API_KEY}
Body: {
  agent_id: "${MISTRAL_AGENT_ID}",
  messages: [{ role: "user", content: <query utente + lista 18 tier> }],
  response_format: { type: "json_object" }
}
```

L'agente deve restituire JSON strutturato:

```json
{
  "tierId": 1,
  "tierName": "Biological Systems",
  "confidence": 0.92,
  "subcategories": ["Microbiologia", "Microbiota Umano", "Interazione Microrganismi-Biologia Umana"]
}
```

Se l'agente non rispetta lo schema (Mistral non garantisce tool-calling per gli Agents), aggiungere un fallback `chat/completions` con `mistral-small-latest` + system prompt che impone JSON. Catturare 429/402 e rilanciarli al client.

Mantiene auth `getUser()` come ora, mantiene la stessa response shape estesa con `subcategories: string[]` (backward-compatible con `useClassifyInterest`).

## Step 4 — Persistenza subcategorie

In `useClassifyInterest.ts`, aggiungere `persistSubcategories(userId, tierId, subs)` che fa upsert con `kind='subcategory'`. Chiamato da `BrowserPicker.tsx` (e `OpenAlexFeed`) subito dopo che la classificazione torna.

`extractKeywords()` continua a girare per le keyword grezze (kind='keyword'), così abbiamo sia il segnale fine (parole) sia il segnale strutturato (subcategorie LLM).

## Step 5 — UI Interests Tiers

In `src/hooks/useTierKeywords.ts`: aggiungere `kind` nella `select` e nel tipo, e splittare in `byTierKeywords` + `byTierSubcategories` (oppure un solo `byTier` con due array).

In `src/pages/Tiers.tsx` (righe 212-233), nella sezione espansa aggiungere — **sopra** "Your personalised sub-interests" e **sotto** le subcategorie statiche — un nuovo blocco:

```
AI-derived subcategories (from your searches):
[chip Microbiologia ×3] [chip Microbiota Umano ×1] ...
```

Stilizzato con accento amber per distinguerlo dal blocco crimson delle keyword. Layout cards invariato.

## Step 6 — Memory + verifica

- Aggiornare `mem://index.md`: rimpiazzare la riga "HuggingFace classifier" con "Mistral Agent classifier (ag_019e...) genera tier + subcategorie zero-party".
- Test manuale: ricerca "Rhodopseudomonas Palustris in association with Human Biological Functions" → deve apparire come tier Biological Systems con subcategorie generate, visibili nella card espansa di quel tier.

## Note tecniche

- HuggingFace classifier viene **rimosso** dal flusso (codice secret `HUGGINGFACE_API_KEY` resta nei secret per ora, non lo cancello).
- Le subcategorie sono **per-utente**: due utenti che cercano la stessa cosa avranno chip diverse nelle proprie tier card se cercano altri interessi e uguali se cercano le stesse cose, questo Integrerá la Possibilità di Connettere Utenti con Affinità e Interessi Simili collegati a Meta. Layout/markup uguale per tutti.
- Zero PII: la query grezza non viene mai esposta al client di altri utenti, solo subcategorie e count aggregati.
- Costo: 1 chiamata Mistral per ogni search submit (già il pattern attuale con HF).