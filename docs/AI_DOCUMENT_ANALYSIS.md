# AI document analysis

`AIProvider` is unchanged: `OpenAIProvider` when `OPENAI_API_KEY` exists, otherwise `MockAIProvider`.

The UI always labels **AI Mode: LIVE** or **AI Mode: DEMO**. Mock output is never labeled live.

## Analyze with AI

After extraction, authorized users can request analysis. The model must return JSON validated by Zod:

```
summary, keyFacts[], potentialRisks[], potentialNonconformities[],
suggestedActions[], dates[], referencedEntities[], confidenceNotes[]
```

Raw model text is never written into a workflow. If live AI fails, the uploaded file is kept and a deterministic demo analysis is stored with an explicit failure note.

## Safety

AI may summarize, suggest causes/actions, and identify possible risks or ISO-related questions.

AI must not approve/reject/verify/close NCR, CAPA, or audit findings, and must not make a compliance decision.

Every recommendation shows: **AI-generated recommendation — human review required.**

## Create draft from analysis

Authorized users may create Task / Risk / NCR / CAPA **drafts**. The draft is pre-filled only with supported fields and linked back to the source document. Humans edit and submit.
