# TODO: merge contents into README.md file
# Deployment & Local Development Setup

This project is a React Single Page Application (SPA) built with Vite. It features a local automated preprocessing pipeline and is configured for direct deployment to GitHub Pages.

## Summary of Configuration Changes

### 1. Unified Scripts and Automation (`package.json`)
To combine the data preprocessing script with the application's runtime environments, the scripts block was updated to chain terminal commands using `&&`. This guarantees that the Python preprocessing finishes execution before Vite spins up.

* Installed `gh-pages` as a developer dependency to automate static asset hosting.
* Added the `"homepage"` tag to route deployment branches properly.
* Configured the following sequential execution workflow:

```json
"homepage": "https://github.io",
"scripts": {
  "preprocess": "python scripts/preprocessing.py",
  "dev": "npm run preprocess && vite",
  "build": "npm run preprocess && vite build",
  "deploy": "npm run build && gh-pages -d dist"
}
```

### 2. Environment-Aware Base Routing (`vite.config.js`)
GitHub Pages hosts single-page applications out of a subfolder URL (`/repository-name/`), while local machines expect the absolute root (`/`). 

To make the codebase compatible with both setups simultaneously without breaking the local dev server, the Vite configuration was converted into a dynamic function checking the active `command` context:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => {
  return {
    plugins: [react()],
    // Uses absolute root for local 'serve', and repository subfolder for production 'build'
    base: command === 'serve' ? '/' : '/react-vite-website/', 
  }
})
```

### 3. SPA Routing Fix (`HashRouter`)
Standard client-side routing (`BrowserRouter`) causes `404 Not Found` errors on GitHub Pages when a user refreshes the page or bookmarks a deep link, because the hosting provider searches for physical folders on their server.

The application navigation was refactored to use **`HashRouter`** (or `createHashRouter`). This appends a `#` symbol to the URL which tells the browser to keep evaluating the root `index.html` file while React handles internal navigation cleanly.

### 4. Static Asset Paths (`public/` directory)
Because all preprocessing variables and static media are generated directly inside the `public/` directory, referencing assets with an absolute leading slash (e.g., `/assets/icons/home.svg`) causes the browser to drop the subfolder repository name in production.

Asset references were updated to use **relative paths** by stripping the leading slash (e.g., `assets/icons/home.svg`), ensuring assets successfully resolve on both local localhost ports and remote deployment servers.

---

## How to Run & Deploy

### Run Locally
Executes the Python preprocessing layer, generates updated JSON assets, and boots the local development environment:
```bash
npm run dev
```

### Deploy Live
Executes the Python preprocessing layer, packages an optimized production-ready bundle inside `/dist`, and pushes the production code directly to the remote `gh-pages` hosting branch:
```bash
npm run deploy
```