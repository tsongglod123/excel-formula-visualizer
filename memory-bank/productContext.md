# Product Context — Excel Formula Visualizer

## Why This Project Exists

Excel is the world's most widely-used data tool, but its formulas remain a black box for most users. People inherit spreadsheets with complex nested formulas like `=IF(VLOOKUP(INDEX(...)))` and have no idea what they do. This project bridges that gap by making formula structure visible and understandable.

## Problem Statement

- **Flat formulas hide structure** — A single line of text obscures the deeply nested decision tree inside
- **No built-in explanation** — Excel shows the formula text but never explains what it means
- **Intimidating for learners** — Nested functions, absolute/relative references, and operator precedence are barriers to entry
- **Audit difficulty** — Professionals spend hours manually tracing formula dependencies

## How It Works

### User Flow
1. User lands on the homepage and sees a formula input field in the hero section
2. User types or pastes an Excel formula (e.g., `=IF(SUM(A1:A10)>100, "Over Budget", "Within Budget")`)
3. User clicks "Visualize" and is taken to `/visualize?formula=...`
4. The server parses the formula into an AST and renders three interactive panels:
   - **Formula Outline** — Color-coded nested blocks showing the tree structure
   - **Step-by-Step Evaluator** — Play/pause animated walkthrough of evaluation order
   - **Explanation Panel** — Plain-English breakdown of every formula component
5. User can hover nodes to see relationships, click references to trace dependencies, and step through evaluation
6. User can copy the URL to share the visualization with others

### Three-Layer Architecture
```
Formula String → [Parse Layer] → AST → [Visualize Layer] → Visual Blocks → [Explain Layer] → Plain English
```

## User Experience Goals

- **Immediate comprehension** — A first-time user should understand a formula within seconds of seeing the visualization
- **Progressive disclosure** — Show the big picture first, then let users drill into details (hover, step-by-step, reference map)
- **Delightful interactions** — Smooth animations, color-coded blocks, and responsive hover effects make learning feel intuitive
- **Accessible everywhere** — Works on mobile, tablet, and desktop; supports keyboard navigation and screen readers
- **No friction** — No sign-up, no installation, no cost. Paste a formula and learn.

## Brand & Design Direction

- **Bold and distinctive** — Not generic AI aesthetics; committed to a unique visual identity
- **Light-only** — Single light theme by design. Dark mode is explicitly out of scope; the site opts out via `color-scheme: light`
- **Highly typographic** — Bricolage Grotesque for body text (characterful sans-serif), Spline Sans Mono for formulas (clean monospace)
- **Color as information** — Every node type has a dedicated color; color isn't decoration, it's data
- **Spatial hierarchy** — Nested blocks reveal tree depth; generous whitespace prevents cognitive overload