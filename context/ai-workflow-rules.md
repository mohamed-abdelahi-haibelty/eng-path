# Development Workflow

## Approach

Build this project incrementally using a spec-driven workflow. Context files define what to build, how to build it, and what the current state of progress is. Always implement against these specs — do not infer or invent behavior from scratch.

## Scoping Rules

- Work on one module, route, or Convex function at a time.
- Prefer small, verifiable increments over large speculative changes.
- Do not combine unrelated system boundaries in a single implementation step.

## When To Split Work

Split an implementation step if it combines:

- UI changes and Convex schema changes
- Multiple unrelated learning modules (e.g., grammar and speaking)
- Convex queries and Convex actions in the same change
- Curriculum content generation and runtime application logic
- Audio recording UI and audio evaluation backend
- Flashcard scheduling and flashcard review UI
- Behavior that is not clearly defined in the context files

If a change cannot be verified end to end quickly, the scope is too broad — split it.

## Handling Missing Requirements

- Do not invent product behavior that is not defined in the context files.
- If a requirement is ambiguous, resolve it in the relevant context file before implementing.
- If a requirement is missing, add it as an open question in `progress-tracker.md` before continuing.

## Protected Foundation Components

Do not modify generated third-party foundation components unless explicitly instructed.

This includes:

- `components/ui/*` (shadcn/ui components)
- third-party library internals
- Convex generated client code

These should remain default and reusable.

Project-specific styling, layout changes, and feature logic must be implemented in app-level components instead of modifying foundation components.

Only modify these files when a task explicitly requires it.

## AI Provider Constraints

- All runtime AI must use cloud APIs with free or freemium tiers. No local models.
- The approved providers are Groq (Llama 3.3 and Whisper, runtime).
- Do not introduce additional AI providers without updating `architecture-context.md` first.
- AI calls run only in Convex actions at runtime.
- Curriculum content is generated offline and seeded once. Do not attempt to generate or regenerate curriculum content from the running application.
- Convex queries and mutations must never call external AI APIs — that work belongs in actions.

## Curriculum Content Workflow

- Do not modify generated curriculum content from within the running application.

## Keeping Docs In Sync

Update the relevant context file whenever implementation changes:

- System architecture or boundaries
- Convex schema decisions
- Code conventions or standards
- Feature scope
- AI provider choices or prompt structure
- Curriculum schema changes

Progress state must reflect the actual state of the implementation, not the intended state.

## Before Moving To The Next Unit

1. The current implementation step works end to end within its defined scope.
2. No invariant defined in `architecture-context.md` was violated.
3. All AI responses are validated against a Zod schema before persistence.
4. All Convex functions enforce auth and ownership checks.
5. `progress-tracker.md` reflects the completed work.
