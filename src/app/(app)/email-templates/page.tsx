"use client";

import { useState } from "react";
import { appendEmailDisclaimer, affiliatePromoSectionHtml, emailPreferencesFooterHtml, NEW_POST_EMAIL_SUBJECT, WEB_LOGIN_URL } from "@/lib/email-disclaimer";

// ─── Email Templates ─────────────────────────────────────────────────────────

type EmailTemplate = {
  id: string;
  label: string;
  trigger: string;
  recipient: string;
  subject: string;
  html: (vars: Record<string, string>) => string;
  vars: { key: string; label: string; default: string }[];
};

const emailTemplates: EmailTemplate[] = [
  {
    id: "new_message",
    label: "New Message",
    trigger: "POST /api/chat/send — fires on every message if receiver has email notifications enabled",
    recipient: "Message receiver",
    subject: "New message from {senderName}",
    vars: [
      { key: "receiverFirstName", label: "Receiver First Name", default: "Sarah" },
      { key: "senderName", label: "Sender Name", default: "John Doe" },
      { key: "message", label: "Message", default: "Hey! Are you interested in partnering on affiliate campaigns?" },
    ],
    html: (v) => `
      <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
        <div style="background-color:#0A7EA4;padding:24px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;">New Message!</h1>
        </div>
        <div style="padding:32px;background-color:#ffffff;">
          <p style="font-size:16px;color:#333333;line-height:1.6;">Hello <strong>${v.receiverFirstName || "there"}</strong>,</p>
          <p style="font-size:16px;color:#333333;line-height:1.6;">You have received a new message from <strong>${v.senderName}</strong> on Affiliate Chat Box.</p>
          <div style="margin:24px 0;padding:20px;background-color:#f8fafc;border-left:4px solid #0A7EA4;border-radius:4px;">
            <p style="margin:0;font-style:italic;color:#4a5568;font-size:15px;">"${v.message}"</p>
          </div>
          <div style="text-align:center;margin-top:32px;">
            <a href="https://affiliatechatbox.com/chats" style="background-color:#0A7EA4;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;display:inline-block;">Reply Now</a>
          </div>
          ${affiliatePromoSectionHtml()}
        </div>
        <div style="background-color:#fcfcfc;padding:20px;text-align:center;border-top:1px solid #f0f0f0;">
          ${emailPreferencesFooterHtml({ automated: true })}
        </div>
      </div>`,
  },
  {
    id: "chat_request",
    label: "Chat Request",
    trigger: "GET /api/email/chatRequestEmail/:id/:senderName — legacy route for first-ever contact",
    recipient: "The user being contacted",
    subject: "Request to chat",
    vars: [
      { key: "userName", label: "Recipient Name", default: "Sarah" },
      { key: "senderName", label: "Sender Name", default: "John Doe" },
    ],
    html: (v) => `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background-color:#f4f4f4;padding:20px;">
          <h2 style="color:#333;">Chat Request Notification</h2>
          <p style="color:#555;">Hello ${v.userName},</p>
          <p style="color:#555;">You have received a chat request from ${v.senderName}.</p>
          <p style="color:#555;">To accept the chat request, please login to Affiliate Chat Box</p>
          <p style="color:#555;">Thank you!</p>
          <br>
          <p style="color:#888;">This email was sent automatically. Please do not reply to this email.</p>
          ${affiliatePromoSectionHtml()}
          <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;">
            ${emailPreferencesFooterHtml({ automated: true })}
          </div>
        </div>
      </div>`,
  },
  {
    id: "new_post_users",
    label: "New Post — All Users",
    trigger: "POST /api/email/newPostEmail — called by admin approve flow to notify all verified users",
    recipient: "All users with email notifications enabled",
    subject: NEW_POST_EMAIL_SUBJECT,
    vars: [
      { key: "userName", label: "Recipient Name", default: "Sarah" },
      { key: "senderName", label: "Post Author", default: "John Doe" },
      { key: "postContent", label: "Post Content", default: "Looking for affiliate partners in the health & wellness niche. DM me if interested!" },
    ],
    html: (v) => `
      <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden;">
        <div style="background-color:#0A7EA4;padding:24px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;">New posting update on Affiliatechatbox.com</h1>
        </div>
        <div style="padding:32px;background:#fff;">
          <p style="font-size:16px;color:#333;">Hello <strong>${v.userName || "there"}</strong>,</p>
          <p style="font-size:15px;color:#555;">A new post has been published by <strong>${v.senderName}</strong>:</p>
          <div style="margin:20px 0;padding:16px;background:#f8fafc;border-left:4px solid #0A7EA4;border-radius:4px;">
            <p style="margin:0;color:#4a5568;white-space:pre-wrap;">${v.postContent || "(media post)"}</p>
          </div>
          ${affiliatePromoSectionHtml()}
          <div style="text-align:center;margin-top:28px;">
            <a href="${WEB_LOGIN_URL}" style="background-color:#0A7EA4;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">View on Affiliatechatbox.com</a>
          </div>
        </div>
        <div style="background:#fcfcfc;padding:16px;text-align:center;border-top:1px solid #f0f0f0;">
          ${emailPreferencesFooterHtml()}
        </div>
      </div>`,
  },
  {
    id: "new_partner_users",
    label: "New Partner — All Users",
    trigger: "POST /api/users/addpartner — fires when admin adds a partner from the admin panel",
    recipient: "All active users with email notifications enabled",
    subject: "New Partner on Affiliate Chat Box",
    vars: [
      { key: "userName", label: "Recipient Name", default: "Sarah" },
      { key: "description", label: "Description", default: "Acme Affiliate Network — premium offers in health & wellness." },
      { key: "link", label: "Partner Link", default: "https://acme-affiliates.com" },
    ],
    html: (v) => `
      <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden;">
        <div style="background-color:#0A7EA4;padding:24px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;">New Partner on Affiliate Chat Box</h1>
        </div>
        <div style="padding:32px;background:#fff;">
          <p style="font-size:16px;color:#333;margin:0 0 8px;">Hello <strong>${v.userName || "there"}</strong>,</p>
          <p style="font-size:15px;color:#555;margin:0 0 24px;">A new business partner has been added to Affiliate Chat Box.</p>
          <div style="margin:0 0 28px;padding:24px;background:#f8fafc;border:1px solid #e8edf2;border-radius:8px;">
            <p style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#0A7EA4;">Description</p>
            <p style="margin:0 0 20px;font-size:16px;line-height:1.65;color:#374151;">${v.description || "—"}</p>
            <p style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#0A7EA4;">Link</p>
            <a href="${v.link || "https://affiliatechatbox.com/partners"}" style="font-size:15px;line-height:1.5;color:#0A7EA4;font-weight:600;text-decoration:underline;word-break:break-all;">${v.link || "https://affiliatechatbox.com/partners"}</a>
          </div>
          <div style="text-align:center;">
            <a href="https://affiliatechatbox.com/partners" style="background-color:#0A7EA4;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">View Partners</a>
          </div>
          ${affiliatePromoSectionHtml()}
        </div>
        <div style="background:#fcfcfc;padding:16px;text-align:center;border-top:1px solid #f0f0f0;">
          ${emailPreferencesFooterHtml()}
        </div>
      </div>`,
  },
  {
    id: "new_post_admin",
    label: "New Post Pending — Admin",
    trigger: "POST /:userId/posts/add_post — fires immediately when any user submits a post",
    recipient: "Admin (akidelhi@gmail.com)",
    subject: "New post pending approval",
    vars: [
      { key: "senderName", label: "Post Author", default: "John Doe" },
      { key: "postContent", label: "Post Content", default: "Looking for affiliate partners in the health & wellness niche. DM me if interested!" },
    ],
    html: (v) => `
      <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden;">
        <div style="background-color:#0A7EA4;padding:24px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:22px;">New Post Pending Approval</h1>
        </div>
        <div style="padding:32px;background-color:#ffffff;">
          <p style="font-size:16px;color:#333;">A new post has been submitted and requires your approval.</p>
          <div style="margin:20px 0;padding:16px;background:#f8fafc;border-left:4px solid #0A7EA4;border-radius:4px;">
            <p style="margin:0 0 8px;font-weight:bold;color:#333;">Posted by: ${v.senderName}</p>
            <p style="margin:0;color:#4a5568;">${v.postContent || "(media only)"}</p>
          </div>
          <div style="text-align:center;margin-top:28px;">
            <a href="https://dev-affadmin.netlify.app/Admin/AdminDashboard/Posts" style="background-color:#0A7EA4;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">Review Post</a>
          </div>
          ${affiliatePromoSectionHtml()}
        </div>
        <div style="background:#fcfcfc;padding:16px;text-align:center;border-top:1px solid #f0f0f0;">
          <p style="font-size:12px;color:#94a3b8;margin:0;">Affiliate Chat Box — automated notification</p>
        </div>
      </div>`,
  },
  {
    id: "report_admin",
    label: "Post Reported — Admin",
    trigger: "POST /api/email/newReportEmailToAdmin — called from Flutter when a user reports a post or user",
    recipient: "Admin (akidelhi@gmail.com)",
    subject: "New reported post",
    vars: [
      { key: "reporterName", label: "Reporter Name", default: "Jane Smith" },
      { key: "postUserName", label: "Post Author", default: "Bad Actor" },
      { key: "postContent", label: "Post Content", default: "Spam content promoting illegal supplements..." },
      { key: "reportReason", label: "Report Reason", default: "Spam / Misleading content" },
    ],
    html: (v) => `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background-color:#f4f4f4;padding:20px;">
          <h2 style="color:#333;">New Reported post Notification</h2>
          <p style="color:#555;">Hello Anshul Mahajan,</p>
          <p style="color:#555;">A posting has been reported by user : ${v.reporterName}.</p>
          <div style="padding-left:20px;">
            <p style="color:#555;font-weight:bold;">Post made by : ${v.postUserName}</p>
            <p style="color:#555;">Description of post: ${v.postContent}</p>
            <p style="color:#555;">Report reason: ${v.reportReason}</p>
          </div>
          <p style="color:#555;">Check it out in the app to see more details.</p>
          <p style="color:#555;">Thank you!</p>
          <br>
          <p style="color:#888;">This email was sent automatically. Please do not reply to this email.</p>
          ${affiliatePromoSectionHtml()}
        </div>
      </div>`,
  },
  {
    id: "test_email",
    label: "Test Email",
    trigger: "POST /api/email/testEmail — manual test endpoint",
    recipient: "hastigabani1109@gmail.com (hardcoded)",
    subject: "test email",
    vars: [],
    html: () => `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background-color:#f4f4f4;padding:20px;">
          <h2 style="color:#333;">Test Email</h2>
          <p style="color:#555;">Hello,</p>
          <p style="color:#555;">You have received a chat request from Sender name.</p>
          <p style="color:#555;">To accept the chat request, please login to Affiliate Chat Box</p>
          <p style="color:#555;">Thank you!</p>
          <br>
          <p style="color:#888;">This email was sent automatically. Please do not reply to this email.</p>
          ${affiliatePromoSectionHtml()}
        </div>
      </div>`,
  },
];

// ─── Push / In-App Notifications ─────────────────────────────────────────────

type NotifKind = "push" | "bell";

type Notif = {
  id: string;
  label: string;
  kind: NotifKind;
  trigger: string;
  route: string;
  recipient: string;
  transport: string;
  vars: { key: string; label: string; default: string }[];
  title: (v: Record<string, string>) => string;
  body: (v: Record<string, string>) => string;
  link?: (v: Record<string, string>) => string;
  dataType?: string;
};

const notifications: Notif[] = [
  {
    id: "push_chat_message",
    label: "New Chat Message",
    kind: "push",
    trigger: "Every time a message is sent via web or Flutter app",
    route: "POST /api/chat/send  ·  POST /api/notification/chat",
    recipient: "Message receiver — mobile (FCM token) + web (webFcmToken)",
    transport: "FCM HTTP v1 API",
    dataType: "chat_message",
    vars: [
      { key: "senderFirstName", label: "Sender First Name", default: "John" },
      { key: "senderLastName", label: "Sender Last Name", default: "Doe" },
      { key: "message", label: "Message", default: "Hey! Are you interested in partnering on affiliate campaigns?" },
    ],
    title: (v) => `${v.senderFirstName} ${v.senderLastName}`,
    body: (v) => v.message,
    link: () => "affiliatechatbox.com/chats?userId=…",
  },
  {
    id: "push_post_approved",
    label: "Post Approved",
    kind: "push",
    trigger: "When admin approves a post via the admin dashboard",
    route: "POST /:postId/Approve_post  (appproveStatus = true)",
    recipient: "Post author — mobile + web push",
    transport: "Firebase Admin SDK (getMessaging)",
    dataType: "post_approved",
    vars: [
      { key: "postContent", label: "Post Content", default: "Looking for affiliate partners in health & wellness niche!" },
    ],
    title: () => "Your post has been approved by Admin",
    body: (v) => v.postContent,
    link: () => "affiliatechatbox.com/post/{postId}",
  },
  {
    id: "bell_user",
    label: "Bell — User Specific",
    kind: "bell",
    trigger: "Manually sent to a specific user (e.g. from admin or system event)",
    route: "POST /api/notification/addUserNotif",
    recipient: "A single specific user (by receiverId)",
    transport: "Stored in MongoDB → polled by client",
    dataType: "custom type field",
    vars: [
      { key: "title", label: "Title", default: "Welcome to Affiliate Chat Box!" },
      { key: "message", label: "Message", default: "Your account has been verified. Start connecting with affiliates now." },
      { key: "type", label: "Type", default: "system" },
    ],
    title: (v) => v.title,
    body: (v) => v.message,
  },
  {
    id: "bell_global",
    label: "Bell — Global Broadcast",
    kind: "bell",
    trigger: "Broadcast to all users (no receiverId — shown to everyone)",
    route: "POST /api/notification/addGlobalNotif",
    recipient: "All users",
    transport: "Stored in MongoDB → polled by client (receiverId = null)",
    dataType: "custom type field",
    vars: [
      { key: "title", label: "Title", default: "🎉 New Feature Released!" },
      { key: "message", label: "Message", default: "You can now share posts directly to LinkedIn from your profile. Try it out!" },
      { key: "type", label: "Type", default: "announcement" },
    ],
    title: (v) => v.title,
    body: (v) => v.message,
  },
];

// ─── Push Notification Phone Mockup ──────────────────────────────────────────

function PushPreview({ title, body, link }: { title: string; body: string; link?: string }) {
  return (
    <div className="flex justify-center pt-4">
      <div className="w-80 rounded-3xl bg-gray-900 p-3 shadow-2xl">
        {/* Phone top bar */}
        <div className="flex items-center justify-between px-4 py-1 text-white">
          <span className="text-xs font-medium">9:41</span>
          <div className="flex gap-1">
            <span className="text-xs">●●●</span>
            <span className="text-xs">WiFi</span>
            <span className="text-xs">🔋</span>
          </div>
        </div>

        {/* Lock screen */}
        <div className="rounded-2xl bg-linear-to-b from-blue-900 to-indigo-900 px-4 pb-6 pt-10">
          <p className="mb-4 text-center text-3xl font-light text-white">9:41</p>
          <p className="mb-3 text-center text-xs text-white/60">Monday, May 25</p>

          {/* Notification banner */}
          <div className="rounded-2xl bg-white/20 backdrop-blur-sm p-3 shadow">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0A7EA4] text-lg">
                💬
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-white">Affiliate Chat Box</span>
                  <span className="text-[10px] text-white/60">now</span>
                </div>
                <p className="text-xs font-medium text-white leading-snug mt-0.5 truncate">{title}</p>
                <p className="text-xs text-white/80 leading-snug line-clamp-2 mt-0.5">{body}</p>
              </div>
            </div>
          </div>

          {link && (
            <p className="mt-3 text-center text-[10px] text-white/40">Tap to open → {link}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Bell Notification Mockup ─────────────────────────────────────────────────

function BellPreview({ title, body, type }: { title: string; body: string; type: string }) {
  return (
    <div className="mx-auto max-w-sm pt-4">
      {/* Browser bell dropdown mockup */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🔔</span>
            <span className="text-sm font-semibold text-gray-800">Notifications</span>
          </div>
          <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">1 new</span>
        </div>

        {/* Notification item — highlighted as new */}
        <div className="border-l-4 border-[#0A7EA4] bg-blue-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0A7EA4] text-sm text-white">
              {type === "announcement" ? "📢" : "ℹ️"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 leading-snug">{title}</p>
              <p className="mt-0.5 text-xs text-gray-600 leading-snug">{body}</p>
              <p className="mt-1.5 text-[10px] text-gray-400">Just now · {type}</p>
            </div>
          </div>
        </div>

        {/* Older placeholder items */}
        {["Yesterday", "2 days ago"].map((time) => (
          <div key={time} className="border-t border-gray-50 px-4 py-3 opacity-40">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-gray-200" />
              <div className="space-y-1.5">
                <div className="h-2.5 w-32 rounded bg-gray-200" />
                <div className="h-2 w-48 rounded bg-gray-100" />
                <div className="h-2 w-16 rounded bg-gray-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EmailTemplatesPage() {
  const [tab, setTab] = useState<"email" | "notifications">("email");

  // Email tab state
  const [activeEmailId, setActiveEmailId] = useState(emailTemplates[0].id);
  const [emailVars, setEmailVars] = useState<Record<string, Record<string, string>>>(() =>
    Object.fromEntries(emailTemplates.map((t) => [t.id, Object.fromEntries(t.vars.map((v) => [v.key, v.default]))]))
  );

  // Notifications tab state
  const [activeNotifId, setActiveNotifId] = useState(notifications[0].id);
  const [notifVars, setNotifVars] = useState<Record<string, Record<string, string>>>(() =>
    Object.fromEntries(notifications.map((n) => [n.id, Object.fromEntries(n.vars.map((v) => [v.key, v.default]))]))
  );

  const activeEmail = emailTemplates.find((t) => t.id === activeEmailId)!;
  const activeNotif = notifications.find((n) => n.id === activeNotifId)!;
  const currentEmailVars = emailVars[activeEmailId] ?? {};
  const currentNotifVars = notifVars[activeNotifId] ?? {};

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Communication Templates</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            All emails and notifications sent by the backend — live preview.
          </p>
        </div>
        <a
          href="/email-templates/print"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Save PDF
        </a>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-200 bg-white px-6">
        <div className="flex gap-0">
          {(["email", "notifications"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === t
                  ? "border-[#0A7EA4] text-[#0A7EA4]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "email" ? (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email Templates
                  <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
                    {emailTemplates.length}
                  </span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Push & In-App Notifications
                  <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
                    {notifications.length}
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── EMAIL TAB ── */}
      {tab === "email" && (
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-60 shrink-0 overflow-y-auto border-r border-gray-200 bg-white">
            <div className="p-3">
              {emailTemplates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveEmailId(t.id)}
                  className={`w-full rounded-lg px-3 py-3 text-left transition-colors ${
                    activeEmailId === t.id ? "bg-[#0A7EA4] text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="block text-sm font-medium">{t.label}</span>
                  <span className={`mt-0.5 block truncate text-xs ${activeEmailId === t.id ? "text-blue-100" : "text-gray-400"}`}>
                    {t.recipient}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          {/* Controls */}
          <div className="w-72 shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-4">
            <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Trigger</p>
              <p className="mt-1 text-xs text-blue-800">{activeEmail.trigger}</p>
            </div>
            <div className="mb-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Subject</p>
              <p className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                {activeEmail.subject}
              </p>
            </div>
            {activeEmail.vars.length > 0 ? (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Variables</p>
                <div className="space-y-3">
                  {activeEmail.vars.map((v) => (
                    <div key={v.key}>
                      <label className="mb-1 block text-xs font-medium text-gray-600">{v.label}</label>
                      <textarea
                        rows={v.key === "message" || v.key === "postContent" ? 3 : 1}
                        value={currentEmailVars[v.key] ?? v.default}
                        onChange={(e) =>
                          setEmailVars((prev) => ({ ...prev, [activeEmailId]: { ...prev[activeEmailId], [v.key]: e.target.value } }))
                        }
                        className="w-full resize-none rounded border border-gray-200 px-2 py-1.5 text-sm text-gray-800 focus:border-[#0A7EA4] focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs italic text-gray-400">No editable variables — static template.</p>
            )}
          </div>

          {/* Preview */}
          <div className="flex flex-1 flex-col overflow-hidden bg-gray-100">
            <div className="border-b border-gray-200 bg-white px-4 py-2">
              <span className="text-xs text-gray-500">Preview</span>
              <span className="mx-2 text-gray-300">·</span>
              <span className="text-xs font-semibold text-gray-700">{activeEmail.label}</span>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div className="mx-auto max-w-[640px]">
                <iframe
                  key={activeEmailId + JSON.stringify(currentEmailVars)}
                  srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f3f4f6;">${appendEmailDisclaimer(activeEmail.html(currentEmailVars))}</body></html>`}
                  className="w-full rounded-xl border border-gray-200 bg-white shadow-sm"
                  style={{ minHeight: 500, border: "none" }}
                  onLoad={(e) => {
                    const doc = e.currentTarget.contentDocument;
                    if (doc) e.currentTarget.style.height = doc.documentElement.scrollHeight + "px";
                  }}
                  title={activeEmail.label}
                  sandbox="allow-same-origin allow-popups"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS TAB ── */}
      {tab === "notifications" && (
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-60 shrink-0 overflow-y-auto border-r border-gray-200 bg-white">
            <div className="p-3">
              {/* Push section */}
              <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Push (FCM)
              </p>
              {notifications.filter((n) => n.kind === "push").map((n) => (
                <button
                  key={n.id}
                  onClick={() => setActiveNotifId(n.id)}
                  className={`w-full rounded-lg px-3 py-3 text-left transition-colors ${
                    activeNotifId === n.id ? "bg-[#0A7EA4] text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="block text-sm font-medium">{n.label}</span>
                  <span className={`mt-0.5 block truncate text-xs ${activeNotifId === n.id ? "text-blue-100" : "text-gray-400"}`}>
                    {n.recipient}
                  </span>
                </button>
              ))}

              {/* Bell section */}
              <p className="mb-1 mt-4 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                In-App Bell
              </p>
              {notifications.filter((n) => n.kind === "bell").map((n) => (
                <button
                  key={n.id}
                  onClick={() => setActiveNotifId(n.id)}
                  className={`w-full rounded-lg px-3 py-3 text-left transition-colors ${
                    activeNotifId === n.id ? "bg-[#0A7EA4] text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="block text-sm font-medium">{n.label}</span>
                  <span className={`mt-0.5 block truncate text-xs ${activeNotifId === n.id ? "text-blue-100" : "text-gray-400"}`}>
                    {n.recipient}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          {/* Controls */}
          <div className="w-72 shrink-0 overflow-y-auto border-r border-gray-200 bg-white p-4">
            {/* Kind badge */}
            <div className="mb-3 flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  activeNotif.kind === "push"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {activeNotif.kind === "push" ? "📱 FCM Push" : "🔔 In-App Bell"}
              </span>
            </div>

            <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Trigger</p>
              <p className="mt-1 text-xs text-blue-800">{activeNotif.trigger}</p>
            </div>

            <div className="mb-3 space-y-2">
              <div>
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Route</p>
                <p className="rounded bg-gray-50 px-2 py-1.5 font-mono text-xs text-gray-700">{activeNotif.route}</p>
              </div>
              <div>
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Transport</p>
                <p className="text-xs text-gray-700">{activeNotif.transport}</p>
              </div>
              {activeNotif.dataType && (
                <div>
                  <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-gray-400">Data Type</p>
                  <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-700">{activeNotif.dataType}</span>
                </div>
              )}
            </div>

            {activeNotif.vars.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Variables</p>
                <div className="space-y-3">
                  {activeNotif.vars.map((v) => (
                    <div key={v.key}>
                      <label className="mb-1 block text-xs font-medium text-gray-600">{v.label}</label>
                      <textarea
                        rows={v.key === "message" || v.key === "body" ? 2 : 1}
                        value={currentNotifVars[v.key] ?? v.default}
                        onChange={(e) =>
                          setNotifVars((prev) => ({ ...prev, [activeNotifId]: { ...prev[activeNotifId], [v.key]: e.target.value } }))
                        }
                        className="w-full resize-none rounded border border-gray-200 px-2 py-1.5 text-sm text-gray-800 focus:border-[#0A7EA4] focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="flex flex-1 flex-col overflow-hidden bg-gray-100">
            <div className="border-b border-gray-200 bg-white px-4 py-2">
              <span className="text-xs text-gray-500">Preview</span>
              <span className="mx-2 text-gray-300">·</span>
              <span className="text-xs font-semibold text-gray-700">{activeNotif.label}</span>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {activeNotif.kind === "push" ? (
                <PushPreview
                  title={activeNotif.title(currentNotifVars)}
                  body={activeNotif.body(currentNotifVars)}
                  link={activeNotif.link?.(currentNotifVars)}
                />
              ) : (
                <BellPreview
                  title={activeNotif.title(currentNotifVars)}
                  body={activeNotif.body(currentNotifVars)}
                  type={currentNotifVars.type ?? "system"}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
