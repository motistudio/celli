import type {ReactNode} from 'react'
import clsx from 'clsx'
import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import Heading from '@theme/Heading'
import CopyableCode from '@site/src/components/CopyableCode'

import styles from './index.module.css'

function HomepageHeader() {
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className={styles.heroContent}>
        <div className={styles.heroText}>
          <img src='/celli/img/logo-colored.svg' alt='Celli Logo' className={styles.heroLogo} />
          <Heading as='h1' className={styles.heroTitle}>
            Make caching
            <br />
            <span className={styles.heroGradient}>beautiful & powerful</span>
          </Heading>
          <p className={styles.heroSubtitle}>
            A versatile, lightweight library for caching and memoization.
            <br />
            Build fast, memory-efficient applications with zero dependencies.
          </p>
          <div className={styles.heroButtons}>
            <Link className={clsx('button', 'button--primary', 'button--lg', styles.primaryButton)} to='/docs/intro'>
              Get Started
            </Link>
            <Link className={clsx('button', 'button--secondary', 'button--lg', styles.secondaryButton)} to='/docs/api/overview'>
              API Reference
            </Link>
          </div>
          <div className={styles.installSection}>
            <CopyableCode text='npm install celli'>npm install celli</CopyableCode>
          </div>
        </div>
      </div>
    </header>
  )
}

function HomepageFeatures() {
  const features = [
    {
      title: 'Zero Dependencies',
      emoji: '🪶',
      description: 'Lightweight at only 19kb minified with no external dependencies. Perfectly typed with 100% test coverage.'
    },
    {
      title: 'Flexible & Composable',
      emoji: '🧩',
      description: 'Build your cache exactly how you need it. Compose LRU, TTL, async, lifecycle, and remote strategies together.'
    },
    {
      title: 'Production Ready',
      emoji: '🚀',
      description: 'Built-in support for graceful shutdowns, resource cleanup, and cache lifecycle management.'
    },
    {
      title: 'Memory Efficient',
      emoji: '💾',
      description: 'Smart memory management with LRU eviction, size limits, and automatic cleanup of expired entries.'
    },
    {
      title: 'TypeScript First',
      emoji: '📘',
      description: 'Written in TypeScript with full type safety and excellent IntelliSense support out of the box.'
    },
    {
      title: 'Framework Agnostic',
      emoji: '🌐',
      description: 'Works everywhere - Node.js, browsers, Deno, Bun. Use with React, Vue, or any framework.'
    }
  ]

  return (
    <section className={styles.features}>
      <div className='container'>
        <div className={styles.featuresHeader}>
          <Heading as='h2' className={styles.featuresTitle}>
            Why Celli?
          </Heading>
          <p className={styles.featuresSubtitle}>
            Everything you need for modern caching and memoization
          </p>
        </div>
        <div className={styles.featureGrid}>
          {features.map((feature, idx) => (
            <div key={idx} className={styles.featureCard}>
              <div className={styles.featureEmoji}>{feature.emoji}</div>
              <Heading as='h3' className={styles.featureTitle}>
                {feature.title}
              </Heading>
              <p className={styles.featureDescription}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext()
  return (
    <Layout
      title={`${siteConfig.title} - Versatile caching and memoization library`}
      description='A versatile library for caching and memoization in various runtime environments. Flexible cache creation, memoization tools, and zero dependencies.'
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  )
}
