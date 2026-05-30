import { LegalPageShell } from "./legal-page-shell";

export function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      subtitle="Welcome to AffiliateChatBox (“Platform”, “we”, “our”, or “us”). Your privacy is important to us. This Privacy Policy explains how we collect, use, store, and protect your information when you use AffiliateChatBox."
      lastUpdated="25 Nov 2023"
      dateLabel="Effective Date"
      sections={[
        {
          title: "1. Information We Collect",
          paragraphs: ["We may collect the following information:"],
          subsections: [
            {
              title: "Account Information",
              bullets: [
                "Full name",
                "Email address",
                "LinkedIn profile information",
                "Google account information",
                "Profile photo",
                "Professional details voluntarily shared by users",
              ],
            },
            {
              title: "Verification Information",
              bullets: [
                "LinkedIn authentication status",
                "Google verification status",
                "Login timestamps and verification logs",
              ],
            },
            {
              title: "Communication Data",
              bullets: [
                "Chat metadata",
                "Message timestamps",
                "Connection requests",
                "Notification preferences",
              ],
            },
            {
              title: "Technical Data",
              bullets: [
                "IP address",
                "Browser type",
                "Device information",
                "Cookies and session logs",
                "Usage analytics",
              ],
            },
          ],
        },
        {
          title: "2. How We Use Your Information",
          paragraphs: ["We use your information to:"],
          bullets: [
            "Create and manage user accounts",
            "Verify user identity",
            "Enable networking and messaging features",
            "Prevent spam, fraud, abuse, and fake profiles",
            "Send alerts, notifications, and transactional emails",
            "Improve platform security and performance",
            "Comply with legal obligations under Indian law",
          ],
        },
        {
          title: "3. User Verification",
          paragraphs: [
            "AffiliateChatBox allows users to authenticate via Google and LinkedIn. However, only LinkedIn-verified users may access direct messaging/chat features.",
            "Verification status does not guarantee the authenticity, credibility, or conduct of any user.",
          ],
        },
        {
          title: "4. Data Retention",
          paragraphs: ["We retain:"],
          bullets: [
            "System and access logs for a minimum of 180 days",
            "User registration and verification records as required under applicable Indian laws",
            "Certain records longer where required for security, fraud prevention, or legal compliance",
          ],
        },
        {
          title: "5. Sharing of Information",
          paragraphs: ["We do not sell personal data.", "We may disclose information:"],
          bullets: [
            "To comply with legal requests",
            "To law enforcement agencies",
            "To prevent fraud, abuse, or security threats",
            "To service providers assisting platform operations",
          ],
        },
        {
          title: "6. Cookies",
          paragraphs: ["We may use cookies and similar technologies to:"],
          bullets: [
            "Maintain user sessions",
            "Improve functionality",
            "Analyze website traffic",
            "Enhance user experience",
          ],
        },
        {
          title: "7. User Responsibilities",
          paragraphs: ["Users are responsible for:"],
          bullets: [
            "Maintaining account confidentiality",
            "Ensuring information shared is accurate",
            "Avoiding illegal, abusive, or misleading activities",
          ],
        },
        {
          title: "8. Security",
          paragraphs: [
            "We implement commercially reasonable security measures to protect user information. However, no online platform can guarantee complete security.",
          ],
        },
        {
          title: "9. Third-Party Services",
          paragraphs: [
            "AffiliateChatBox may integrate with third-party platforms including Google and LinkedIn. Use of such services is subject to their respective privacy policies.",
          ],
        },
        {
          title: "10. Contact",
          paragraphs: [
            "For privacy-related concerns, contact:",
            "Email: legal@affiliatechatbox.com",
            "Website: https://affiliatechatbox.com",
          ],
        },
      ]}
    />
  );
}
