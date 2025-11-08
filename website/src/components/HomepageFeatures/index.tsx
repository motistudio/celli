import type {ReactNode} from 'react'
import clsx from 'clsx'
import Heading from '@theme/Heading'
import styles from './styles.module.css'

type FeatureItem = {
  title: string
  Svg: React.ComponentType<React.ComponentProps<'svg'>>
  description: ReactNode
}

const FeatureList: FeatureItem[] = [
  {
    title: 'Zero Dependencies',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Celli is lightweight (only 19kb minified) with no external dependencies. Perfectly typed with 100% test coverage to ensure high reliability.
      </>
    )
  },
  {
    title: 'Flexible & Composable',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Build your cache exactly how you need it. Compose LRU, TTL, async, lifecycle, and remote strategies together. From simple memoization to
        complex distributed caching.
      </>
    )
  },
  {
    title: 'Production Ready',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Built-in support for graceful shutdowns, resource cleanup, and cache lifecycle management. Perfect for server-side applications and
        microservices.
      </>
    )
  }
]

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className='text--center'>
        <Svg className={styles.featureSvg} role='img' />
      </div>
      <div className='text--center padding-horiz--md'>
        <Heading as='h3'>{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  )
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className='container'>
        <div className='row'>
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  )
}
