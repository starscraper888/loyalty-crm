
export async function voidRedemption(
    redemptionId: string,
    reason: string
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Not authenticated" }
    }

    // Check admin/manager permission
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!['admin', 'owner', 'manager'].includes(profile?.role || '')) {
        return { error: "Insufficient permissions. Only admins and managers can void redemptions." }
    }

    // Call RPC function to void redemption
    const { data, error } = await supabase.rpc('void_redemption', {
        p_redemption_id: redemptionId,
        p_void_reason: reason,
        p_voided_by: user.id
    })

    if (error) {
        return { error: error.message }
    }

    if (!data.success) {
        return { error: data.error }
    }

    revalidatePath('/admin/members')
    revalidatePath('/member/history')

    return {
        success: true,
        message: `Refunded ${data.refunded_points} points for ${data.reward_name}`,
        refundedPoints: data.refunded_points
    }
}
