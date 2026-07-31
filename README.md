# Excel Formula Visualizer

[![Netlify Status](https://api.netlify.com/api/v1/badges/13afaf17-9680-4f97-aae5-85c94c9b71f4/deploy-status)](https://app.netlify.com/projects/excel-formula-visualizer/deploys)

A modern web application for visualizing and understanding Excel formulas. Paste any Excel formula and instantly see a clear, interactive breakdown of its components, dependencies, and evaluation order.

## 🚀 Tech Stack

- **Framework:** [Astro](https://astro.build) v7
- **Styling:** [Tailwind CSS](https://tailwindcss.com) v4
- **Fonts:** Inter (body), JetBrains Mono (code)
- **Deployment:** Netlify

## 📁 Project Structure

```text
/
├── public/
│   └── favicon.*
├── src/
│   ├── assets/
│   ├── components/
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   └── index.astro
│   └── styles/
│       └── global.css
├── astro.config.mjs
├── package.json
├── tsconfig.json
└── README.md
```

## 🧞 Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |

## ✨ Features

- **Parse & Structure** — Automatically parse any Excel formula into a structured tree of functions, operators, references, and literals.
- **Evaluation Order** — See the step-by-step evaluation order with color-coded groupings.
- **Interactive Reference Map** — Click on any cell reference to highlight its location and trace dependencies.

## 📄 License

MIT