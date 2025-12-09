// QR Code Generation Utilities for Tenant WhatsApp Links

import QRCode from 'qrcode'

const WHATSAPP_NUMBER = '14155238886' // Platform WhatsApp number (digits only)

/**
 * Generate WhatsApp link for tenant registration
 * Format: https://wa.me/14155238886?text=GET%20{slug}
 */
export function generateTenantWhatsAppLink(tenantSlug: string): string {
    const message = `GET ${tenantSlug}`
    const encodedMessage = encodeURIComponent(message)
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`
}

/**
 * Generate QR code as Data URL (for display in img tag)
 */
export async function generateQRCodeDataURL(text: string): Promise<string> {
    try {
        return await QRCode.toDataURL(text, {
            errorCorrectionLevel: 'M',
            margin: 2,
            width: 300,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        })
    } catch (error) {
        console.error('QR generation error:', error)
        throw new Error('Failed to generate QR code')
    }
}

/**
 * Generate QR code for tenant WhatsApp registration
 */
export async function generateTenantQRCode(tenantSlug: string): Promise<string> {
    const whatsappLink = generateTenantWhatsAppLink(tenantSlug)
    return await generateQRCodeDataURL(whatsappLink)
}

/**
 * Download QR code as PNG file
 */
export function downloadQRCode(dataUrl: string, filename: string) {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `${filename}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

/**
 * Generate multiple tenant QR codes
 */
export async function generateAllTenantQRCodes(
    tenants: Array<{ id: string; name: string; slug: string }>
): Promise<Array<{ tenant: typeof tenants[0]; qrCodeUrl: string }>> {
    const results = await Promise.all(
        tenants.map(async (tenant) => ({
            tenant,
            qrCodeUrl: await generateTenantQRCode(tenant.slug)
        }))
    )
    return results
}
