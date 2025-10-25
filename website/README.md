# Celli Documentation Website

This directory contains the Docusaurus-based documentation website for Celli.

Built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## Local Development

Start the development server:

```bash
npm start
```

This command starts a local development server and opens a browser window. Most changes are reflected live without having to restart the server.

## Build

Build the website for production:

```bash
npm run build
```

This command generates static content into the `build` directory.

## Serve Locally

Test the production build locally:

```bash
npm run serve
```

## Deployment

The documentation is **automatically deployed to GitHub Pages** when changes are pushed to the `master` branch via GitHub Actions.

The site is available at: https://motistudio.github.io/celli/

### Manual Deployment

If needed, you can also manually deploy:

```bash
npm run deploy
```

## Project Structure

```
website/
├── docs/              # Documentation markdown files
│   ├── intro.md       # Introduction page
│   ├── getting-started/
│   ├── advanced/
│   └── api/
├── src/
│   ├── components/    # React components
│   ├── css/          # Custom CSS
│   └── pages/        # Standalone pages (homepage, etc.)
├── static/           # Static assets
├── sidebars.ts       # Sidebar configuration
└── docusaurus.config.ts  # Docusaurus configuration
```

## Contributing to Documentation

1. All documentation is written in Markdown with MDX support
2. Place new docs in the appropriate directory:
   - `getting-started/` - Beginner-friendly guides
   - `advanced/` - Advanced topics
   - `api/` - API reference documentation
3. Update `sidebars.ts` when adding new pages
4. Test locally with `npm start` before submitting PR
5. Ensure all internal links work (build will fail on broken links)

## Notes

- Dependencies are installed in the root `package.json` as devDependencies
- Run commands from the root with `npm run docs:start`, `npm run docs:build`, etc.
- Or run commands from the `website` directory directly

## Learn More

- [Docusaurus Documentation](https://docusaurus.io/)
- [Celli GitHub Repository](https://github.com/motistudio/celli)
- [Celli npm Package](https://www.npmjs.com/package/celli)
