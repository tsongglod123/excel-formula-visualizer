# Excel Formula Visualizer — Project Overview

## Purpose

A modern web application that helps users understand complex Excel formulas by parsing them into an Abstract Syntax Tree (AST) and rendering them as interactive, color-coded visual blocks with plain-English explanations.

## Core Mission

Transform a flat Excel formula string into a rich, understandable learning experience through three layers:

1. **Parse** — Turn a flat formula string into a hierarchical Abstract Syntax Tree (AST)
2. **Visualize** — Render the AST as nested, color-coded visual blocks that reveal structure at a glance
3. **Explain** — Convert the visual tree into plain English so users truly understand what the formula does

## Teaching Philosophy

The UI should not just display the formula — it should **teach** the user. Every feature must serve understanding:

- **Plain English Translation** — Every formula node gets a human-readable explanation alongside the visual blocks
- **Hover Highlighting** — Hovering a node highlights its parent-child relationships in the tree
- **Step-by-Step Execution** — Animated walkthrough showing evaluation order from innermost to outermost
- **Interactive Reference Map** — Click cell references to trace dependencies and see their values

## Target Audience

- Excel users who need to understand complex or inherited formulas
- Students learning how Excel formulas work
- Professionals auditing spreadsheets for correctness