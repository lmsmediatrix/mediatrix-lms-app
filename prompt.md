# Frontend Prompt Entry

Use the repo-level workflow instead of treating this file as a standalone source of truth.

## Start Here

1. Read `../context.md`
2. For a raw feature idea, use `../.github/prompts/new-feature-task-writer.prompt.md`
3. For implementation, use `../.github/prompts/new-feature-execution.prompt.md`

## Frontend Reminders

- Routes live in `src/config/route.tsx`
- Endpoint mirrors live in `src/config/endpoints.ts`
- Query builder base class lives in `src/services/apiService.ts`
- Hooks should call `resetQuery()` before building requests
- Reuse the owning role folder under `src/pages/` and `src/components/`
- Match existing loading, error, empty, modal, and table patterns from the nearest page
