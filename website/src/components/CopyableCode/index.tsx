import type {ReactNode} from 'react'
import {useState} from 'react'
import {Copy, Check} from 'lucide-react'
import styles from './styles.module.css'

interface CopyableCodeProps {
  text: string
  children: ReactNode
}

export default function CopyableCode({text, children}: CopyableCodeProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className={styles.copyContainer} onClick={handleCopy}>
      <code className={styles.code}>{children}</code>
      <button className={styles.copyButton} aria-label='Copy to clipboard'>
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
    </div>
  )
}
