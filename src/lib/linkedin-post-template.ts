/** Plain-text template for LinkedIn post shares — must match backend `linkedinPostTemplate.js`. */

const LINKEDIN_COMPANY_POSTS_URL =
  "https://www.linkedin.com/company/affiliatechatbox/posts/";
const WEB_LOGIN_URL = "https://affiliatechatbox.com/login";
const ANDROID_APP_URL =
  "https://play.google.com/store/apps/details?id=com.project.omd";
const IPHONE_APP_URL =
  "https://apps.apple.com/app/affiliate-chat-box/id6477887051";

export function buildLinkedInPostShareText(postContent: string): string {
  const body = String(postContent || "").trim();
  return `New posting update on Affiliatechatbox.com

${body}

Connect with Global Affiliates Online now.
You can also follow all updates on Linkedin
${LINKEDIN_COMPANY_POSTS_URL}
#Affiliatechatbox

Web Signup: ${WEB_LOGIN_URL}
Mobile App Available on both Android & iPhone now.
Download now to get started.
Android: ${ANDROID_APP_URL}
iPhone: ${IPHONE_APP_URL}`;
}
