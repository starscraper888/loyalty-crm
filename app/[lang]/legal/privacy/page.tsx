import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                <Link href="/" className="text-blue-600 hover:text-blue-800 mb-6 inline-flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Privacy Policy</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Last updated: December 8, 2024</p>

                <div className="prose dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">1. Information We Collect</h2>
                        <p>We collect information you provide directly to us when you:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Create an account (email, phone number, name)</li>
                            <li>Use our loyalty program (points earned, rewards redeemed)</li>
                            <li>Make payments (processed securely by Stripe)</li>
                            <li>Contact our support team</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">2. How We Use Your Information</h2>
                        <p>We use the information we collect to:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Provide, maintain, and improve our services</li>
                            <li>Process your transactions and send you related information</li>
                            <li>Send you technical notices, updates, and support messages</li>
                            <li>Respond to your comments and questions</li>
                            <li>Analyze usage patterns to improve user experience</li>
                            <li>Send promotional communications (with your consent)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">3. Information Sharing</h2>
                        <p>We may share your information with:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li><strong>Service Providers:</strong> Stripe (payment processing), Supabase (data hosting)</li>
                            <li><strong>WhatsApp:</strong> For loyalty program notifications (if you opt in)</li>
                            <li><strong>Analytics:</strong> Anonymized data for improving our service</li>
                            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                        </ul>
                        <p className="mt-3">We do not sell your personal information to third parties.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">4. Data Retention</h2>
                        <p>We retain your information for as long as your account is active or as needed to provide you services. We also retain and use your information as necessary to comply with our legal obligations, resolve disputes, and enforce our agreements.</p>
                        <p className="mt-3">Financial transaction records are retained for 7 years to comply with tax and audit requirements.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">5. Your Rights (GDPR)</h2>
                        <p>You have the right to:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li><strong>Access:</strong> Request a copy of your personal data</li>
                            <li><strong>Rectification:</strong> Correct inaccurate data</li>
                            <li><strong>Erasure:</strong> Request deletion of your data (subject to legal retention requirements)</li>
                            <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
                            <li><strong>Objection:</strong> Object to processing of your data</li>
                            <li><strong>Restriction:</strong> Request restriction of processing</li>
                        </ul>
                        <p className="mt-3">To exercise these rights, visit your account settings or contact us at privacy@yourcompany.com</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">6. Security</h2>
                        <p>We implement appropriate technical and organizational measures to protect your personal information, including:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Encryption of data in transit (HTTPS/TLS)</li>
                            <li>Encryption of sensitive data at rest</li>
                            <li>Regular security audits and monitoring</li>
                            <li>Access controls and authentication</li>
                            <li>Secure payment processing via PCI-compliant providers</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">7. Cookies</h2>
                        <p>We use cookies and similar tracking technologies to:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Remember your preferences (essential cookies)</li>
                            <li>Understand how you use our service (analytics cookies)</li>
                            <li>Deliver relevant advertisements (marketing cookies - optional)</li>
                        </ul>
                        <p className="mt-3">You can manage your cookie preferences through our cookie consent banner.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">8. Children's Privacy</h2>
                        <p>Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">9. International Data Transfers</h2>
                        <p>Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this privacy policy and applicable laws.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">10. Changes to This Policy</h2>
                        <p>We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">11. Contact Us</h2>
                        <p>If you have any questions about this privacy policy, please contact us at:</p>
                        <ul className="list-none ml-0 space-y-1 mt-3">
                            <li>Email: privacy@yourcompany.com</li>
                            <li>Address: [Your Company Address]</li>
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    )
}
