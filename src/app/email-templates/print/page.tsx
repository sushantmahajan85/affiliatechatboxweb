"use client";

import { useEffect } from "react";
import { appendEmailDisclaimer, emailPreferencesFooterHtml } from "@/lib/email-disclaimer";

const BRAND = "#0A7EA4";

const templates = [
  {
    id: "new_message",
    label: "New Message",
    trigger: "POST /api/chat/send — fires on every message if receiver has email notifications on.",
    subject: "New message from {senderName}",
    recipient: "Message receiver",
    html: `
      <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color:#0A7EA4;padding:24px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;">New Message!</h1>
        </div>
        <div style="padding:32px;background-color:#ffffff;">
          <p style="font-size:16px;color:#333333;line-height:1.6;">Hello <strong>Sarah</strong>,</p>
          <p style="font-size:16px;color:#333333;line-height:1.6;">You have received a new message from <strong>John Doe</strong> on Affiliate Chat Box.</p>
          <div style="margin:24px 0;padding:20px;background-color:#f8fafc;border-left:4px solid #0A7EA4;border-radius:4px;">
            <p style="margin:0;font-style:italic;color:#4a5568;font-size:15px;">"Hey! Are you interested in partnering on affiliate campaigns?"</p>
          </div>
          <div style="text-align:center;margin-top:32px;">
            <a href="https://affiliatechatbox.com/chats" style="background-color:#0A7EA4;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;display:inline-block;">Reply Now</a>
          </div>
        </div>
        <div style="background-color:#fcfcfc;padding:20px;text-align:center;border-top:1px solid #f0f0f0;">
          ${emailPreferencesFooterHtml({ automated: true })}
        </div>
      </div>`,
    variables: ["receiver.firstName", "senderName", "message"],
  },
  {
    id: "chat_request",
    label: "Chat Request",
    trigger: "GET /api/email/chatRequestEmail/:id/:senderName — legacy route triggered when someone initiates first contact.",
    subject: "Request to chat",
    recipient: "User being contacted",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
        <div style="background-color:#f4f4f4;padding:20px;border-radius:8px;">
          <h2 style="color:#333;">Chat Request Notification</h2>
          <p style="color:#555;">Hello Sarah,</p>
          <p style="color:#555;">You have received a chat request from John Doe.</p>
          <p style="color:#555;">To accept the chat request, please login to Affiliate Chat Box</p>
          <p style="color:#555;">Thank you!</p>
          <br/>
          <p style="color:#888;">This email was sent automatically. Please do not reply to this email.</p>
          <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;">
            ${emailPreferencesFooterHtml({ automated: true })}
          </div>
        </div>
      </div>`,
    variables: ["userName (firstName)", "senderName"],
  },
  {
    id: "new_post_users",
    label: "New Post — All Users",
    trigger: "POST /api/email/newPostEmail — called by admin approve flow to notify all verified users.",
    subject: "New Posting Notification",
    recipient: "All verified users with email notifications enabled",
    html: `
      <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden;">
        <div style="background-color:#0A7EA4;padding:24px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;">New Post on Affiliate Chat Box</h1>
        </div>
        <div style="padding:32px;background:#fff;">
          <p style="font-size:16px;color:#333;">Hello <strong>Sarah</strong>,</p>
          <p style="font-size:15px;color:#555;">A new post has been published by <strong>John Doe</strong>:</p>
          <div style="margin:20px 0;padding:16px;background:#f8fafc;border-left:4px solid #0A7EA4;border-radius:4px;">
            <p style="margin:0;color:#4a5568;">Looking for affiliate partners in the health &amp; wellness niche. DM me if interested!</p>
          </div>
          <div style="text-align:center;margin-top:28px;">
            <a href="https://affiliatechatbox.com" style="background-color:#0A7EA4;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">View Post</a>
          </div>
        </div>
        <div style="background:#fcfcfc;padding:16px;text-align:center;border-top:1px solid #f0f0f0;">
          ${emailPreferencesFooterHtml()}
        </div>
      </div>`,
    variables: ["userName (firstName)", "senderName", "postContent"],
  },
  {
    id: "new_partner_users",
    label: "New Partner — All Users",
    trigger: "POST /api/users/addpartner — fires when admin adds a partner from the admin panel.",
    subject: "New Partner on Affiliate Chat Box",
    recipient: "All active users with email notifications enabled",
    html: `
      <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden;">
        <div style="background-color:#0A7EA4;padding:24px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;">New Partner on Affiliate Chat Box</h1>
        </div>
        <div style="padding:32px;background:#fff;">
          <p style="font-size:16px;color:#333;">Hello <strong>Sarah</strong>,</p>
          <p style="font-size:15px;color:#555;">A new business partner has been added to Affiliate Chat Box.</p>
          <div style="margin:20px 0;padding:16px;background:#f8fafc;border-left:4px solid #0A7EA4;border-radius:4px;">
            <p style="margin:0 0 8px;color:#333;"><strong>Description:</strong> Acme Affiliate Network — premium offers in health &amp; wellness.</p>
            <p style="margin:0 0 8px;color:#333;"><strong>Link:</strong> <a href="https://acme-affiliates.com" style="color:#0A7EA4;">https://acme-affiliates.com</a></p>
            <p style="margin:0 0 8px;color:#333;"><strong>Button label:</strong> Visit Partner</p>
            <p style="margin:0;color:#333;"><strong>Logo:</strong> <a href="https://affiliatechatbox.com/logo.png" style="color:#0A7EA4;">View logo</a></p>
          </div>
          <div style="text-align:center;margin-top:28px;">
            <a href="https://affiliatechatbox.com/partners" style="background-color:#0A7EA4;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">View Partners</a>
          </div>
        </div>
        <div style="background:#fcfcfc;padding:16px;text-align:center;border-top:1px solid #f0f0f0;">
          ${emailPreferencesFooterHtml()}
        </div>
      </div>`,
    variables: ["userName (firstName)", "description", "link", "btntext", "logo"],
  },
  {
    id: "new_post_admin",
    label: "New Post Pending — Admin",
    trigger: "POST /:userId/posts/add_post — fires immediately when any user submits a post, before admin review.",
    subject: "New post pending approval",
    recipient: "Admin (akidelhi@gmail.com)",
    html: `
      <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden;">
        <div style="background-color:#0A7EA4;padding:24px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:22px;">New Post Pending Approval</h1>
        </div>
        <div style="padding:32px;background-color:#ffffff;">
          <p style="font-size:16px;color:#333;">A new post has been submitted and requires your approval.</p>
          <div style="margin:20px 0;padding:16px;background:#f8fafc;border-left:4px solid #0A7EA4;border-radius:4px;">
            <p style="margin:0 0 8px;font-weight:bold;color:#333;">Posted by: John Doe</p>
            <p style="margin:0;color:#4a5568;">Looking for affiliate partners in the health &amp; wellness niche. DM me if interested!</p>
          </div>
          <div style="text-align:center;margin-top:28px;">
            <a href="https://dev-affadmin.netlify.app/Admin/AdminDashboard/Posts" style="background-color:#0A7EA4;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">Review Post</a>
          </div>
        </div>
        <div style="background:#fcfcfc;padding:16px;text-align:center;border-top:1px solid #f0f0f0;">
          <p style="font-size:12px;color:#94a3b8;margin:0;">Affiliate Chat Box — automated notification</p>
        </div>
      </div>`,
    variables: ["senderName", "postContent"],
  },
  {
    id: "report_admin",
    label: "Post Reported — Admin",
    trigger: "POST /api/email/newReportEmailToAdmin — called from Flutter app when a user reports a post or another user.",
    subject: "New reported post",
    recipient: "Admin (akidelhi@gmail.com)",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
        <div style="background-color:#f4f4f4;padding:20px;border-radius:8px;">
          <h2 style="color:#333;">New Reported post Notification</h2>
          <p style="color:#555;">Hello Anshul Mahajan,</p>
          <p style="color:#555;">A posting has been reported by user: <strong>Jane Smith</strong>.</p>
          <div style="padding-left:20px;">
            <p style="color:#555;font-weight:bold;">Post made by: Bad Actor</p>
            <p style="color:#555;">Description of post: Spam content promoting illegal supplements...</p>
            <p style="color:#555;">Report reason: Spam / Misleading content</p>
          </div>
          <p style="color:#555;">Check it out in the app to see more details.</p>
          <p style="color:#555;">Thank you!</p>
          <br/>
          <p style="color:#888;">This email was sent automatically. Please do not reply to this email.</p>
        </div>
      </div>`,
    variables: ["reporterName", "postContent", "postUserName", "reportReason"],
  },
  {
    id: "test_email",
    label: "Test Email",
    trigger: "POST /api/email/testEmail — manual test endpoint, sends to hardcoded address.",
    subject: "test email",
    recipient: "hastigabani1109@gmail.com (hardcoded)",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
        <div style="background-color:#f4f4f4;padding:20px;border-radius:8px;">
          <h2 style="color:#333;">Test Email</h2>
          <p style="color:#555;">Hello,</p>
          <p style="color:#555;">You have received a chat request from Sender name.</p>
          <p style="color:#555;">To accept the chat request, please login to Affiliate Chat Box</p>
          <p style="color:#555;">Thank you!</p>
          <br/>
          <p style="color:#888;">This email was sent automatically. Please do not reply to this email.</p>
        </div>
      </div>`,
    variables: ["none — static content"],
  },
];

const printStyles = `
  @media print {
    .no-print { display: none !important; }
    .template-section { break-after: page; }
    .cover { break-after: page; min-height: 100vh; }
    .toc { break-after: page; }
  }
  body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #fff; }
  .cover { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: #0A7EA4; color: #fff; text-align: center; padding: 40px; }
  .cover h1 { font-size: 40px; margin: 0 0 12px; }
  .cover p { font-size: 17px; opacity: 0.85; margin: 4px 0; }
  .cover .meta { margin-top: 40px; font-size: 13px; opacity: 0.65; }
  .toc { padding: 48px 56px; }
  .toc h2 { font-size: 24px; color: #0A7EA4; border-bottom: 2px solid #0A7EA4; padding-bottom: 8px; margin-bottom: 24px; }
  .toc-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
  .toc-num { width: 28px; height: 28px; border-radius: 50%; background: #0A7EA4; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; margin-top: 2px; }
  .toc-label { font-size: 15px; font-weight: 600; color: #1a1a1a; }
  .toc-sub { font-size: 12px; color: #888; margin-top: 2px; }
  .template-section { padding: 40px 56px; }
  .section-header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
  .section-num { width: 36px; height: 36px; border-radius: 50%; background: #0A7EA4; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; flex-shrink: 0; }
  .section-title { font-size: 22px; font-weight: 700; color: #1a1a1a; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 28px; }
  .meta-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
  .meta-card.full { grid-column: 1 / -1; }
  .meta-card.trigger { border-left: 3px solid #0A7EA4; }
  .meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 4px; }
  .meta-value { font-size: 13px; color: #334155; line-height: 1.4; }
  .vars-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
  .var-tag { background: #e0f2fe; color: #0369a1; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 999px; font-family: monospace; }
  .preview-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 10px; }
  .preview-box { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #f3f4f6; padding: 20px; }
`;

export default function EmailTemplatesPrintPage() {
  useEffect(() => {
    document.title = "Affiliate Chat Box — Email Templates";
    const timer = setTimeout(() => window.print(), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />

      {/* Print button */}
      <div
        className="no-print"
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <button
          onClick={() => window.print()}
          style={{
            background: BRAND,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          Save as PDF
        </button>
      </div>

      {/* Cover */}
      <div className="cover">
        <div style={{ fontSize: 56, marginBottom: 16 }}>✉️</div>
        <h1>Email Templates</h1>
        <p>Affiliate Chat Box — Transactional Email Reference</p>
        <p style={{ fontSize: 14, opacity: 0.7 }}>Backend: Online Media Tools Server</p>
        <div className="meta">
          <p>
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p>{templates.length} templates · nodemailer SMTP + EmailJS</p>
        </div>
      </div>

      {/* Table of contents */}
      <div className="toc">
        <h2>Contents</h2>
        {templates.map((t, i) => (
          <div className="toc-item" key={t.id}>
            <div className="toc-num">{i + 1}</div>
            <div>
              <div className="toc-label">{t.label}</div>
              <div className="toc-sub">Subject: {t.subject}</div>
              <div className="toc-sub">→ {t.recipient}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Templates */}
      {templates.map((t, i) => (
        <div className="template-section" key={t.id}>
          <div className="section-header">
            <div className="section-num">{i + 1}</div>
            <div className="section-title">{t.label}</div>
          </div>

          <div className="meta-grid">
            <div className="meta-card trigger full">
              <div className="meta-label">Trigger</div>
              <div className="meta-value">{t.trigger}</div>
            </div>
            <div className="meta-card">
              <div className="meta-label">Recipient</div>
              <div className="meta-value">{t.recipient}</div>
            </div>
            <div className="meta-card">
              <div className="meta-label">Subject</div>
              <div className="meta-value" style={{ fontFamily: "monospace", fontSize: 12 }}>
                {t.subject}
              </div>
            </div>
            <div className="meta-card full">
              <div className="meta-label">Template Variables</div>
              <div className="vars-list">
                {t.variables.map((v) => (
                  <span className="var-tag" key={v}>{`{${v}}`}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="preview-label">Email Preview</div>
          <div className="preview-box">
            <div dangerouslySetInnerHTML={{ __html: appendEmailDisclaimer(t.html) }} />
          </div>
        </div>
      ))}
    </>
  );
}
