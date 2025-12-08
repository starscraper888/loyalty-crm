'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function CopyCodeButton({ code, label = 'Copy Code' }: { code: string, label?: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <button
            onClick={handleCopy}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg flex items-center gap-2 transition-colors"
        >
            {copied ? (
                <>
                    <Check className="w-4 h-4" />
                    Copied!
                </>
            ) : (
                <>
                    <Copy className="w-4 h-4" />
                    {label}
                </>
            )}
        </button>
    )
}
