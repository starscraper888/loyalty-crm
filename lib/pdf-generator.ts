import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface CampaignData {
    name: string
    description: string
    start_date: string
    end_date: string
    budget: number
    target_points: number
    target_members: number
    status: string
}

interface Metrics {
    totalParticipants: number
    pointsDistributed: number
    estimatedRevenue: number
    cost: number
    roi: string
    cpa: string
    engagementRate: string
}

interface Participant {
    profile: {
        full_name: string
        email?: string
    }
    points_earned: number
    participated_at: string
}

export function generateCampaignPDF(
    campaign: CampaignData,
    metrics: Metrics,
    participants: Participant[]
) {
    const doc = new jsPDF()

    // Add header
    doc.setFontSize(20)
    doc.setTextColor(31, 41, 55) // gray-800
    doc.text('Campaign Performance Report', 14, 20)

    // Campaign name
    doc.setFontSize(16)
    doc.setTextColor(59, 130, 246) // blue-600
    doc.text(campaign.name, 14, 32)

    // Generated date
    doc.setFontSize(10)
    doc.setTextColor(107, 114, 128) // gray-500
    doc.text(`Generated on ${new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    })}`, 14, 39)

    // Campaign details
    doc.setFontSize(14)
    doc.setTextColor(31, 41, 55)
    doc.text('Campaign Details', 14, 50)

    doc.setFontSize(10)
    doc.setTextColor(75, 85, 99)
    const details = [
        `Period: ${new Date(campaign.start_date).toLocaleDateString()} - ${new Date(campaign.end_date).toLocaleDateString()}`,
        `Status: ${campaign.status.toUpperCase()}`,
        `Budget: $${campaign.budget?.toFixed(2) || '0.00'}`,
        `Target Members: ${campaign.target_members}`,
        `Target Points: ${campaign.target_points}`,
    ]
    details.forEach((detail, index) => {
        doc.text(detail, 14, 57 + (index * 6))
    })

    if (campaign.description) {
        doc.text(`Description: ${campaign.description}`, 14, 57 + (details.length * 6), {
            maxWidth: 180
        })
    }

    // Key metrics
    let yPos = 100
    doc.setFontSize(14)
    doc.setTextColor(31, 41, 55)
    doc.text('Key Performance Metrics', 14, yPos)

    yPos += 10
    autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: [
            ['Total Participants', metrics.totalParticipants.toString()],
            ['Engagement Rate', `${metrics.engagementRate}%`],
            ['Points Distributed', metrics.pointsDistributed.toLocaleString()],
            ['Estimated Revenue', `$${metrics.estimatedRevenue.toFixed(2)}`],
            ['Total Cost', `$${metrics.cost.toFixed(2)}`],
            ['ROI', `${metrics.roi}%`],
            ['Cost Per Acquisition', `$${metrics.cpa}`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
        styles: { fontSize: 10 },
        margin: { left: 14 }
    })

    // Top participants
    if (participants.length > 0) {
        yPos = (doc as any).lastAutoTable.finalY + 15

        if (yPos > 250) {
            doc.addPage()
            yPos = 20
        }

        doc.setFontSize(14)
        doc.setTextColor(31, 41, 55)
        doc.text('Top 10 Participants', 14, yPos)

        yPos += 7
        const topParticipants = [...participants]
            .sort((a, b) => b.points_earned - a.points_earned)
            .slice(0, 10)

        autoTable(doc, {
            startY: yPos,
            head: [['Rank', 'Name', 'Email', 'Points Earned']],
            body: topParticipants.map((p, index) => [
                (index + 1).toString(),
                p.profile.full_name,
                p.profile.email || 'N/A',
                p.points_earned.toString()
            ]),
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
            styles: { fontSize: 9 },
            margin: { left: 14 }
        })
    }

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(156, 163, 175)
        doc.text(
            `Page ${i} of ${pageCount}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        )
    }

    return doc
}

export function generateAnalyticsPDF(data: {
    totalMembers: number
    activeRewards: number
    totalTransactions: number
    redemptionRate: string
    dateRange: string
}) {
    const doc = new jsPDF()

    doc.setFontSize(20)
    doc.text('Analytics Dashboard Report', 14, 20)

    doc.setFontSize(10)
    doc.text(`Period: ${data.dateRange}`, 14, 30)
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 36)

    autoTable(doc, {
        startY: 45,
        head: [['Metric', 'Value']],
        body: [
            ['Total Members', data.totalMembers.toString()],
            ['Active Rewards', data.activeRewards.toString()],
            ['Total Transactions', data.totalTransactions.toString()],
            ['Redemption Rate', `${data.redemptionRate}%`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
    })

    return doc
}
