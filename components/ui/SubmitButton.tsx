'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'

export function SubmitButton({
    children,
    className,
    loadingText
}: {
    children: React.ReactNode,
    className?: string,
    loadingText?: string
}) {
    const { pending } = useFormStatus()
    return (
        <button disabled={pending} type="submit" className={`disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}>
            {pending ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {loadingText}
                </>
            ) : children}
        </button>
    )
}
