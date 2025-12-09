'use client'

import { useState, useEffect } from 'react'
import { downloadQRCode } from '@/lib/qr/generator'
import { Download, Printer, Copy, Check } from 'lucide-react'

interface TenantQRCodeProps {
    tenant: {
        id: string
        name: string
        slug: string
    }
    qrCodeUrl: string
}

export default function TenantQRCode({ tenant, qrCodeUrl }: TenantQRCodeProps) {
    const [copied, setCopied] = useState(false)

    const handleDownload = () => {
        downloadQRCode(qrCodeUrl, `qr-${tenant.slug}`)
    }

    const handlePrint = () => {
        const printWindow = window.open('', '', 'width=600,height=600')
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>${tenant.name} - QR Code</title>
                    <style>
                        body {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                            font-family: system-ui, -apple-system, sans-serif;
                        }
                        h1 { margin: 20px 0; font-size: 24px; }
                        p { margin: 10px 0; color: #666; }
                        img { max-width: 300px; margin: 20px 0; }
                        .instructions {
                            max-width: 400px;
                            text-align: center;
                            margin-top: 20px;
                            padding: 20px;
                            background: #f5f5f5;
                            border-radius: 8px;
                        }
                    </style>
                </head>
                <body>
                    <h1>${tenant.name}</h1>
                    <p>Scan to Join Our Loyalty Program</p>
                    <img src="${qrCodeUrl}" alt="QR Code" />
                    <div class="instructions">
                        <strong>How to Join:</strong><br/>
                        1. Scan this QR code<br/>
                        2. WhatsApp will open automatically<br/>
                        3. Send the message to join<br/>
                        4. Get your instant OTP
                    </div>
                </body>
                </html>
            `)
            printWindow.document.close()
            printWindow.print()
        }
    }

    const copySlug = () => {
        navigator.clipboard.writeText(tenant.slug)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
            {/* Tenant Info */}
            <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {tenant.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                    <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {tenant.slug}
                    </code>
                    <button
                        onClick={copySlug}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        title="Copy slug"
                    >
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-4 bg-white p-4 rounded">
                <img
                    src={qrCodeUrl}
                    alt={`QR code for ${tenant.name}`}
                    className="w-64 h-64"
                />
            </div>

            {/* Instructions */}
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                <strong className="text-gray-900 dark:text-white">Customer Instructions:</strong>
                <ol className="mt-2 ml-4 list-decimal space-y-1">
                    <li>Scan QR code with phone camera</li>
                    <li>WhatsApp opens with pre-filled message</li>
                    <li>Send message to join</li>
                    <li>Receive 6-digit OTP instantly</li>
                </ol>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={handleDownload}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Download className="w-4 h-4" />
                    Download PNG
                </button>
                <button
                    onClick={handlePrint}
                    className="flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
                >
                    <Printer className="w-4 h-4" />
                    Print
                </button>
            </div>
        </div>
    )
}
