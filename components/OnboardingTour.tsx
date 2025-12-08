'use client'

import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride'
import { useState, useEffect } from 'react'

interface OnboardingTourProps {
    steps: Step[]
    tourKey: string
    run?: boolean
}

export default function OnboardingTour({ steps, tourKey, run = true }: OnboardingTourProps) {
    const [runTour, setRunTour] = useState(false)

    useEffect(() => {
        // Check if user has seen this tour
        const hasSeenTour = localStorage.getItem(`tour-${tourKey}-completed`)
        if (!hasSeenTour && run) {
            // Delay tour start to ensure DOM is ready
            setTimeout(() => setRunTour(true), 1000)
        }
    }, [tourKey, run])

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data
        const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED]

        if (finishedStatuses.includes(status)) {
            setRunTour(false)
            localStorage.setItem(`tour-${tourKey}-completed`, 'true')
        }
    }

    return (
        <Joyride
            steps={steps}
            run={runTour}
            continuous
            showProgress
            showSkipButton
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    primaryColor: '#3b82f6',
                    zIndex: 10000,
                },
                buttonNext: {
                    backgroundColor: '#3b82f6',
                    borderRadius: '8px',
                    padding: '8px 16px'
                },
                buttonBack: {
                    marginRight: 10,
                    color: '#6b7280'
                }
            }}
            locale={{
                back: 'Back',
                close: 'Close',
                last: 'Finish',
                next: 'Next',
                skip: 'Skip Tour'
            }}
        />
    )
}
