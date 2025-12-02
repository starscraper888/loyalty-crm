import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts"

// Mock test for Deno environment
Deno.test("Quiet Hours Logic", () => {
    const QUIET_HOURS_START = 21
    const QUIET_HOURS_END = 9

    const checkQuietHours = (hour: number) => {
        return hour >= QUIET_HOURS_START || hour < QUIET_HOURS_END
    }

    assertEquals(checkQuietHours(22), true) // 10 PM - Quiet
    assertEquals(checkQuietHours(2), true)  // 2 AM - Quiet
    assertEquals(checkQuietHours(10), false) // 10 AM - Active
    assertEquals(checkQuietHours(20), false) // 8 PM - Active
})
