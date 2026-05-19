# Grammar Page — Feature Specification

## Goal

Build the **Grammar** page. The page has two sections displayed on the same route:

1. **Grammar Explanation** — a rich Markdown document with examples, styled like a Notion document.
2. **Grammar Exercises** — up to 20 interactive exercises (multiple types) rendered in a Notion-like UI, with answer submission and per-question feedback.

## Tech Stack

- **Markdown rendering**: `react-markdown` + `remark-gfm` + `rehype-pretty-code` for syntax highlighting

## Implementation

- implement functions that fetches the grammar explinations and exercices
- implement the convex funtion that persist the user's score

### Submit Behavior

Two modes are acceptable — pick the simpler one for the first implementation:

**Submit All at once**

- A single `"Check Answers"` button at the bottom of the exercises section
- On click: validate all answers client-side against the stored `answer` / `correct` fields
- Update UI state to show per-question feedback
- No backend round-trip needed for basic checking (answers are already in the Convex documents fetched at load)
- call a Convex mutation to persist the user's score

## Loading & Error States

- Skeleton loaders
- Error boundary with a simple "Failed to load grammar content. Retry." message

## Libraries to Install

```bash
npm install react-markdown remark-gfm rehype-highlight
```
