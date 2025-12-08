'use client'

import { useState } from 'react'
import { FileDown } from 'lucide-react'
import { generateCampaignPDF } from '@/lib/pdf-generator'

export default function ExportPDFButton({ campaign, metrics, participants }: any) {
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = () => {
        setIsExporting(true)
        try {
            const pdf = generateCampaignPDF(campaign, metrics, participants)
            pdf.save(`campaign-report-${campaign.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`)
        } catch (error) {
            console.error('PDF export error:', error)
            alert('Failed to export PDF. Please try again.')
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
            {isExporting ? (
                <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Exporting...
                </>
            ) : (
                <>
                    <FileDown className="w-4 h-4" />
                    Export PDF
                </>
            )}
        </button>
    )
}
