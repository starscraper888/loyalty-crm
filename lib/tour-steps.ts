import { Step } from 'react-joyride'

export const adminTourSteps: Step[] = [
    {
        target: 'body',
        content: 'Welcome to your Admin Dashboard! Let\'s take a quick tour of the key features.',
        placement: 'center',
        disableBeacon: true
    },
    {
        target: '[data-tour="members"]',
        content: 'Manage your members here. Add new members, view their points, and track their activity.',
        placement: 'bottom'
    },
    {
        target: '[data-tour="rewards"]',
        content: 'Create and manage your rewards catalog. Set point costs and add attractive images.',
        placement: 'bottom'
    },
    {
        target: '[data-tour="analytics"]',
        content: 'Track your program performance with detailed analytics and insights.',
        placement: 'bottom'
    },
    {
        target: '[data-tour="campaigns"]',
        content: 'Launch marketing campaigns and track their ROI to boost engagement.',
        placement: 'bottom'
    },
    {
        target: 'body',
        content: 'That\'s it! You\'re ready to start managing your loyalty program. 🎉',
        placement: 'center'
    }
]

export const memberTourSteps: Step[] = [
    {
        target: 'body',
        content: 'Welcome to your rewards dashboard! Let\'s show you around.',
        placement: 'center',
        disableBeacon: true
    },
    {
        target: '[data-tour="points-balance"]',
        content: 'This is your current points balance. Earn points with every purchase!',
        placement: 'bottom'
    },
    {
        target: '[data-tour="tier-badge"]',
        content: 'Your membership tier. Earn more points to unlock higher tiers and better rewards!',
        placement: 'bottom'
    },
    {
        target: '[data-tour="browse-rewards"]',
        content: 'Browse available rewards and see what you can redeem with your points.',
        placement: 'top'
    },
    {
        target: '[data-tour="qr-code"]',
        content: 'Show this QR code at the counter to earn or redeem points.',
        placement: 'top'
    },
    {
        target: 'body',
        content: 'Start earning and redeeming today! Happy shopping! 🎁',
        placement: 'center'
    }
]
