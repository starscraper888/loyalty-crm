import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                <Link href="/" className="text-blue-600 hover:text-blue-800 mb-6 inline-flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Terms of Service</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Last updated: December 8, 2024</p>

                <div className="prose dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">1. Acceptance of Terms</h2>
                        <p>By accessing and using this Loyalty CRM service ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our Service.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">2. Description of Service</h2>
                        <p>We provide a cloud-based loyalty program management platform that enables businesses to:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Create and manage customer loyalty programs</li>
                            <li>Track points and rewards</li>
                            <li>Send notifications via WhatsApp</li>
                            <li>Analyze customer engagement data</li>
                            <li>Process payments and subscriptions</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">3. Account Registration</h2>
                        <p>To use our Service, you must:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Provide accurate, current, and complete information</li>
                            <li>Maintain the security of your password</li>
                            <li>Be at least 18 years old or have parental consent</li>
                            <li>Notify us immediately of any unauthorized use</li>
                        </ul>
                        <p className="mt-3">You are responsible for all activities that occur under your account.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">4. Subscription and Payment</h2>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">4.1 Subscription Plans</h3>
                        <p>We offer various subscription tiers with different features and usage limits. Pricing and features are as described on our website at the time of purchase.</p>

                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 mt-4">4.2 Payment</h3>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Subscriptions are billed in advance on a monthly or annual basis</li>
                            <li>Payment is processed securely by Stripe</li>
                            <li>All fees are exclusive of taxes</li>
                            <li>You authorize us to charge your payment method on a recurring basis</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 mt-4">4.3 Cancellation and Refunds</h3>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>You may cancel your subscription at any time</li>
                            <li>Cancellations take effect at the end of the current billing period</li>
                            <li>No refunds for partial months or unused features</li>
                            <li>We reserve the right to modify pricing with 30 days' notice</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">5. Acceptable Use</h2>
                        <p>You agree NOT to use the Service to:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Violate any laws or regulations</li>
                            <li>Infringe on intellectual property rights</li>
                            <li>Transmit spam, malware, or harmful code</li>
                            <li>Harass, abuse, or harm others</li>
                            <li>Attempt to gain unauthorized access to our systems</li>
                            <li>Interfere with or disrupt the Service</li>
                            <li>Use automated tools to access the Service without permission</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">6. Intellectual Property</h2>
                        <p>The Service and its original content, features, and functionality are owned by us and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>
                        <p className="mt-3">You retain ownership of any data you upload to the Service. You grant us a license to use this data solely to provide the Service to you.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">7. Data and Privacy</h2>
                        <p>We process your data in accordance with our <Link href="/en/legal/privacy" className="text-blue-600 hover:text-blue-800 underline">Privacy Policy</Link>. You are responsible for:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Obtaining necessary consents from your customers</li>
                            <li>Complying with data protection laws (GDPR, etc.)</li>
                            <li>Maintaining backups of your data</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">8. Service Availability</h2>
                        <p>We strive to provide 99.9% uptime but do not guarantee uninterrupted access. We may:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Perform scheduled maintenance with notice</li>
                            <li>Suspend service for security or legal reasons</li>
                            <li>Modify or discontinue features with notice</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">9. Limitation of Liability</h2>
                        <p className="font-semibold">TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
                        <ul className="list-disc ml-6 space-y-2 mt-3">
                            <li>The Service is provided "AS IS" without warranties of any kind</li>
                            <li>We are not liable for indirect, incidental, or consequential damages</li>
                            <li>Our total liability is limited to the amount you paid in the past 12 months</li>
                            <li>We are not responsible for third-party services (Stripe, WhatsApp, etc.)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">10. Indemnification</h2>
                        <p>You agree to indemnify and hold us harmless from any claims, damages, liabilities, and expenses arising from:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Your use of the Service</li>
                            <li>Your violation of these terms</li>
                            <li>Your violation of any rights of another party</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">11. Termination</h2>
                        <p>We may terminate or suspend your account immediately, without prior notice, for:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Breach of these terms</li>
                            <li>Non-payment of fees</li>
                            <li>Illegal or fraudulent activity</li>
                            <li>Request by law enforcement</li>
                        </ul>
                        <p className="mt-3">Upon termination, your right to use the Service will cease immediately. We may retain your data for a reasonable period as required by law.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">12. Governing Law</h2>
                        <p>These terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">13. Dispute Resolution</h2>
                        <p>Any disputes arising from these terms will be resolved through:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li>Good faith negotiation</li>
                            <li>Mediation (if negotiation fails)</li>
                            <li>Binding arbitration (as a last resort)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">14. Changes to Terms</h2>
                        <p>We reserve the right to modify these terms at any time. We will notify you of material changes via email or through the Service. Continued use after changes constitutes acceptance of the new terms.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">15. Contact Information</h2>
                        <p>For questions about these Terms of Service, please contact:</p>
                        <ul className="list-none ml-0 space-y-1 mt-3">
                            <li>Email: legal@yourcompany.com</li>
                            <li>Address: [Your Company Address]</li>
                        </ul>
                    </section>

                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        By using our Service, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                    </p>
                </div>
            </div>
        </div>
    )
}
