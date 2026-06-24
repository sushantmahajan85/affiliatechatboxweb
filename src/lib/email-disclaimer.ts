import { getSiteUrl } from "./site-url";
import { EMAIL_PROMO_ICON_DATA_URIS } from "./email-promo-icons";

const WEB_APP_ORIGIN = getSiteUrl();

export const ACCOUNT_SETTINGS_URL = `${WEB_APP_ORIGIN}/settings`;
export const LINKEDIN_COMPANY_POSTS_URL =
  "https://www.linkedin.com/company/affiliatechatbox/posts/";
export const WEB_LOGIN_URL = `${WEB_APP_ORIGIN}/login`;
export const ANDROID_APP_URL =
  "https://play.google.com/store/apps/details?id=com.project.omd";
export const IPHONE_APP_URL =
  "https://apps.apple.com/app/affiliate-chat-box/id6477887051";
export const NEW_POST_EMAIL_SUBJECT = "New posting update on Affiliatechatbox.com";

function affiliatePromoIconLink(href: string, iconSrc: string, label: string): string {
  return `
    <td align="center" valign="top" style="padding:0 10px;">
      <a href="${href}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:inline-block;">
        <img src="${iconSrc}" width="48" height="48" alt="${label}" style="display:block;margin:0 auto 8px;border:0;border-radius:12px;" />
        <span style="display:block;font-size:12px;line-height:1.3;color:#475569;font-family:'Segoe UI',Arial,sans-serif;font-weight:600;">${label}</span>
      </a>
    </td>`;
}

function affiliatePromoIconRowHtml(): string {
  const icons = EMAIL_PROMO_ICON_DATA_URIS;
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:20px auto 0;">
      <tr>
        ${affiliatePromoIconLink(LINKEDIN_COMPANY_POSTS_URL, icons.linkedin, "LinkedIn")}
        ${affiliatePromoIconLink(WEB_LOGIN_URL, icons.web, "Web Signup")}
        ${affiliatePromoIconLink(ANDROID_APP_URL, icons.googlePlay, "Android")}
        ${affiliatePromoIconLink(IPHONE_APP_URL, icons.apple, "iPhone")}
      </tr>
    </table>`;
}

export function affiliatePromoSectionHtml(): string {
  return `
    <div style="margin:28px 0 0;padding:20px;background:#f0f9fc;border:1px solid #d0e8f0;border-radius:8px;text-align:center;">
      <p style="margin:0 0 8px;font-size:15px;color:#333;font-weight:600;">Connect with Global Affiliates Online now.</p>
      <p style="margin:0 0 4px;font-size:14px;color:#555;">Follow updates on LinkedIn and get the app on any device.</p>
      <p style="margin:0 0 4px;font-size:14px;color:#0A7EA4;font-weight:600;">#Affiliatechatbox</p>
      ${affiliatePromoIconRowHtml()}
    </div>`;
}

export function accountSettingsLinkHtml(label = "account settings"): string {
  return `<a href="${ACCOUNT_SETTINGS_URL}" style="color:#0A7EA4;text-decoration:underline;">${label}</a>`;
}

export function emailPreferencesFooterHtml(options?: { automated?: boolean }): string {
  const prefix = options?.automated ? "This is an automated notification. " : "";
  return `<p style="font-size:12px;color:#94a3b8;margin:0;">${prefix}You can manage your email preferences in ${accountSettingsLinkHtml()}.</p>`;
}

export const EMAIL_DISCLAIMER_HTML = `
<div style="max-width:600px;margin:0 auto;padding:14px 20px 20px;border-top:1px solid #e8ecf0;background:#fafbfc;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <p style="margin:0 0 6px;font-size:9px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Email Disclaimer</p>
  <p style="margin:0 0 8px;font-size:9px;line-height:1.5;color:#94a3b8;">You are receiving this email because you are a registered user of AffiliateChatBox. AffiliateChatBox is a professional affiliate networking platform designed to help verified users connect and communicate. Profiles on our platform may be verified through Google and/or LinkedIn authentication. However, only LinkedIn-verified users are permitted to initiate and participate in member-to-member chat conversations.</p>
  <p style="margin:0 0 4px;font-size:9px;font-weight:600;color:#94a3b8;">Please note:</p>
  <ul style="margin:0 0 8px;padding-left:16px;font-size:9px;line-height:1.5;color:#94a3b8;">
    <li style="margin-bottom:3px;">AffiliateChatBox does not guarantee the identity, credibility, business practices, or intentions of any user beyond the verification methods displayed on their profile.</li>
    <li style="margin-bottom:3px;">Any discussions, offers, partnerships, transactions, or agreements made between users are solely the responsibility of the individuals involved.</li>
    <li style="margin-bottom:3px;">Users should exercise their own judgment and due diligence before sharing confidential information, making payments, or entering into business relationships.</li>
    <li>AffiliateChatBox is not liable for any direct or indirect loss, damages, disputes, or claims arising from user interactions or communications.</li>
  </ul>
  <p style="margin:0 0 8px;font-size:9px;line-height:1.5;color:#94a3b8;">If you believe you received this email in error or wish to report misuse, spam, or inappropriate behavior, please contact our support team immediately.</p>
  <p style="margin:0 0 8px;font-size:9px;line-height:1.5;color:#94a3b8;">By continuing to use AffiliateChatBox, you agree to our platform policies, terms, and communication guidelines.</p>
  <p style="margin:0;font-size:9px;line-height:1.5;color:#94a3b8;">To ensure you continue receiving important connection alerts and chat notifications from AffiliateChatBox, please add our email address to your contacts/safe sender list: <a href="mailto:alerts@affiliatechatbox.com" style="color:#0A7EA4;text-decoration:none;">alerts@affiliatechatbox.com</a></p>
</div>`;

export function appendEmailDisclaimer(html: string): string {
  return `${html}${EMAIL_DISCLAIMER_HTML}`;
}
