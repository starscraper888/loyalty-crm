import { issuePoints } from '@/app/staff/actions'

// Mock revalidatePath
jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

describe('Staff Actions', () => {
    it('should issue points successfully', async () => {
        const formData = new FormData()
        formData.append('phone', '+1234567890')
        formData.append('points', '100')
        formData.append('description', 'Test')

        const result = await issuePoints(formData)

        expect(result).toEqual({ success: true, message: 'Issued 100 points to +1234567890' })
    })

    it('should fail if phone or points missing', async () => {
        const formData = new FormData()
        formData.append('phone', '+1234567890')

        const result = await issuePoints(formData)

        expect(result).toHaveProperty('error')
    })
})
