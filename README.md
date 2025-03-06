# Writing Style Checker

A simple web application that helps improve writing by highlighting and fixing common stylistic issues:

- **Weasel Words**: Words that sound good without conveying specific information (very, extremely, various, etc.)
- **Passive Voice**: Constructions where the subject receives the action rather than performing it
- **Duplicate Words**: Repeated adjacent words that might be missed during proofreading

Based on [Shell scripts for passive voice, weasel words, duplicates](https://matt.might.net/articles/shell-scripts-for-passive-voice-weasel-words-duplicates/) by Matt Might.

## Features

- Real-time detection and highlighting of writing issues
- Click to fix duplicate words automatically
- Light/dark/system theme support
- Responsive design for mobile and desktop
- Simple, clean interface

## Project Structure

```
writing-style-checker/
├── src/
│   ├── lib/
│   │   ├── App.svelte         # Main application component
│   │   └── detector.ts        # Core issue detection logic
│   ├── routes/
│   │   └── +page.svelte       # SvelteKit route page
│   └── app.html               # Main HTML template
├── static/
│   └── favicon.png            # Site icon
├── package.json               # Project dependencies
└── vite.config.js             # Vite configuration
```

## Setup Instructions

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173/`

## Building for Production

To create a production version of the app:

```bash
npm run build
```

You can preview the production build with:

```bash
npm run preview
```

## Deployment to Cloudflare Pages

1. Configure SvelteKit to use the Cloudflare adapter:

```bash
npm install -D @sveltejs/adapter-cloudflare
```

2. Update your `svelte.config.js`:

```javascript
import adapter from "@sveltejs/adapter-cloudflare";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
    // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
    adapter: adapter(),
  },
};

export default config;
```

3. Build your project:

```bash
npm run build
```

4. Deploy to Cloudflare Pages through the Cloudflare Dashboard or using the Wrangler CLI.

## License

MIT
