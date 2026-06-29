export type LegalSubsection = {
  title: string;
  bullets?: string[];
  paragraphs?: string[];
};

export type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
  subsections?: LegalSubsection[];
  isMajorHeading?: boolean;
};

export const TERMS_OF_SERVICE_META = {
  title: "Terms of Service",
  subtitle: "By accessing or using AffiliateChatBox, you agree to these Terms of Service.",
  lastUpdated: "25 Nov 2023",
  dateLabel: "Effective Date",
} as const;

export const TERMS_OF_SERVICE_SECTIONS: LegalSection[] = [
  {
    title: "1. Eligibility",
    paragraphs: ["You must be at least 18 years old to use the Platform."],
  },
  {
    title: "2. Account Registration",
    paragraphs: [
      "Users may sign up using Google or LinkedIn authentication.",
      "Only LinkedIn-verified users are permitted to access messaging/chat features.",
    ],
  },
  {
    title: "3. User Conduct",
    paragraphs: ["Users agree NOT to:"],
    bullets: [
      "Send spam or unsolicited promotions",
      "Misrepresent identity or business affiliation",
      "Harass, abuse, or threaten others",
      "Share illegal, harmful, or deceptive content",
      "Attempt unauthorized access to accounts or systems",
      "Use automation or scraping tools without permission",
    ],
  },
  {
    title: "4. Messaging Disclaimer",
    paragraphs: [
      "AffiliateChatBox provides a communication platform only.",
      "We do not endorse, verify, or guarantee:",
    ],
    bullets: [
      "User claims",
      "Business opportunities",
      "Affiliate offers",
      "Financial arrangements",
      "Partnerships or transactions",
      "Users interact at their own risk.",
    ],
  },
  {
    title: "5. Verification Disclaimer",
    paragraphs: [
      "LinkedIn or Google verification only confirms successful authentication through those platforms and does not guarantee legitimacy or trustworthiness.",
    ],
  },
  {
    title: "6. Email Notifications",
    paragraphs: ["By creating an account, users consent to receive:"],
    bullets: [
      "Connection alerts",
      "Chat notifications",
      "Security alerts",
      "Platform updates",
      "Transactional emails",
    ],
    subsections: [
      {
        title: "",
        paragraphs: ["Users may unsubscribe from non-essential communications where applicable."],
      },
    ],
  },
  {
    title: "7. Account Suspension",
    paragraphs: ["We reserve the right to suspend or terminate accounts involved in:"],
    bullets: ["Spam", "Fraud", "Abuse", "Fake verification", "Violation of platform policies"],
  },
  {
    title: "8. Intellectual Property",
    paragraphs: [
      "All platform branding, content, software, and systems belong to AffiliateChatBox unless otherwise stated.",
    ],
  },
  {
    title: "9. Limitation of Liability",
    paragraphs: ["AffiliateChatBox shall not be liable for:"],
    bullets: [
      "User interactions",
      "Business disputes",
      "Financial losses",
      "Data loss",
      "Unauthorized access",
      "Service interruptions",
      "Use of the platform is at your own risk.",
    ],
  },
  {
    title: "10. Governing Law",
    paragraphs: [
      "These Terms shall be governed by the laws of India.",
      "Any disputes shall fall under the jurisdiction of courts located in Delhi, India.",
    ],
  },
  {
    title: "Community Guidelines & Email Communication Consent",
    isMajorHeading: true,
    paragraphs: [],
    subsections: [
      {
        title: "Community Guidelines",
        paragraphs: [
          "AffiliateChatBox is a professional affiliate networking community. To maintain trust and quality, users must follow these guidelines:",
        ],
      },
      {
        title: "Allowed Activities",
        bullets: [
          "Professional networking",
          "Affiliate collaboration discussions",
          "Partnership opportunities",
          "Industry conversations",
          "Business relationship building",
        ],
      },
      {
        title: "Prohibited Activities",
        bullets: [
          "Spam or mass unsolicited messaging",
          "Fake profiles or impersonation",
          "Fraudulent offers",
          "Adult, illegal, or harmful content",
          "Harassment or abusive conduct",
          "Phishing or malicious links",
          "Misleading affiliate schemes",
        ],
        paragraphs: ["Violations may result in account suspension or permanent removal."],
      },
      {
        title: "Email Communication Consent",
        paragraphs: ["By registering on AffiliateChatBox, users expressly consent to receive:"],
        bullets: [
          "Connection notifications",
          "Chat alerts",
          "Verification updates",
          "Security notifications",
          "Account-related communications",
          "Platform announcements",
        ],
      },
      {
        title: "",
        paragraphs: [
          "Emails may be sent from: alerts@affiliatechatbox.com",
          "To ensure uninterrupted delivery, users are encouraged to whitelist and add the sender email to their contacts.",
          "AffiliateChatBox complies with applicable anti-spam and intermediary regulations. Users may opt out of non-essential communications where legally applicable.",
        ],
      },
      {
        title: "Grievance Officer (India IT Act Compliance)",
        paragraphs: [
          "In accordance with the Information Technology Act, 2000 and applicable Intermediary Rules, users may contact our Grievance Officer for complaints or concerns.",
          "Email: grievance@affiliatechatbox.com",
          "Response Time: We aim to acknowledge complaints within 24-72 hours and resolve valid concerns within the timelines prescribed under applicable Indian laws.",
        ],
      },
    ],
  },
];
