# Project Brief — Excel Formula Visualizer

## Core Purpose

A modern web application that transforms complex Excel formulas into interactive, color-coded visualizations with plain-English explanations. The project exists to make Excel formula comprehension accessible to everyone — from spreadsheet beginners to professional auditors.

## Three Core Goals

1. **Parse** — Convert a flat Excel formula string into a hierarchical Abstract Syntax Tree (AST)
2. **Visualize** — Render the AST as nested, color-coded, interactive visual blocks
3. **Explain** — Translate every node into a human-readable plain-English sentence

## Target Audience

- Excel users who inherit complex spreadsheets they need to understand
- Students learning how Excel formulas work
- Professionals auditing spreadsheets for correctness
- Anyone who finds nested Excel formulas intimidating

## Teaching Philosophy

Every feature must serve understanding. The UI should not just display the formula — it should **teach** the user what the formula does through:
- Color-coded visual blocks that reveal structure at a glance
- Plain-English translations that read like natural language
- Hover highlighting that shows parent-child relationships
- Step-by-step evaluation that walks through calculation order
- Reference maps that trace cell dependencies

## Success Metrics

- A user can paste any Excel formula and immediately understand its structure
- The visualization is accessible and usable on mobile, tablet, and desktop
- The plain-English translation is accurate and readable for 100+ Excel functions
- The application performs well even with deeply nested, complex formulas
- The project is open-source (MIT) and welcomes community contributions

## Deployment

- Hosted on Netlify with continuous deployment from GitHub
- Static site with on-demand server rendering for the `/visualize` page (reads `?formula=` query param)