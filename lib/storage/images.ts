import { createClient } from '@/lib/supabase/server'

export async function uploadRewardImage(file: File, rewardId: string): Promise<{ url?: string; error?: string }> {
    try {
        const supabase = await createClient()

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (!validTypes.includes(file.type)) {
            return { error: 'Invalid file type. Please upload JPEG, PNG, or WebP images.' }
        }

        // Validate file size (max 2MB)
        const maxSize = 2 * 1024 * 1024
        if (file.size > maxSize) {
            return { error: 'File too large. Maximum size is 2MB.' }
        }

        // Generate unique filename
        const ext = file.name.split('.').pop()
        const fileName = `${rewardId}-${Date.now()}.${ext}`
        const filePath = `rewards/${fileName}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('rewards')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: true
            })

        if (uploadError) {
            console.error('Upload error:', uploadError)
            return { error: 'Failed to upload image. Please try again.' }
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('rewards')
            .getPublicUrl(filePath)

        return { url: publicUrl }
    } catch (e: any) {
        console.error('Image upload error:', e)
        return { error: 'An unexpected error occurred.' }
    }
}

export async function deleteRewardImage(imageUrl: string): Promise<void> {
    try {
        const supabase = await createClient()

        // Extract file path from URL
        const urlParts = imageUrl.split('/rewards/')
        if (urlParts.length < 2) return

        const filePath = `rewards/${urlParts[1]}`

        await supabase.storage
            .from('rewards')
            .remove([filePath])
    } catch (e) {
        console.error('Failed to delete image:', e)
    }
}
