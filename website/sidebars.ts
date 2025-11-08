import type {SidebarsConfig} from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: ['getting-started/installation', 'getting-started/basic-usage', 'getting-started/cache-creation']
    },
    {
      type: 'category',
      label: 'Advanced Topics',
      items: ['advanced/cache-manager', 'advanced/composable-caches', 'advanced/source-caches', 'advanced/graceful-shutdown']
    },
    {
      type: 'category',
      label: 'API Reference',
      items: ['api/overview', 'api/cache-creation']
    }
  ]
}

export default sidebars
