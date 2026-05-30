import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outPath = join(root, "public", "firebase-messaging-sw.js");

function loadEnvFile(rel) {
  const p = join(root, rel);
  if (!existsSync(p)) return;
  const text = readFileSync(p, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const required = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
];

function trimEnv(name) {
  return process.env[name]?.trim() || "";
}

const missing = required.filter((k) => !trimEnv(k));
if (missing.length > 0) {
  console.error(
    "generate-firebase-messaging-sw: missing env: " + missing.join(", ")
  );
  process.exit(1);
}

const firebaseConfig = {
  apiKey: trimEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
  appId: trimEnv("NEXT_PUBLIC_FIREBASE_APP_ID"),
  messagingSenderId: trimEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  projectId: trimEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
  authDomain: trimEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  storageBucket: trimEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
};
const measurementId = trimEnv("NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID");
if (measurementId) {
  firebaseConfig.measurementId = measurementId;
}

const body = `/* eslint-disable no-undef */
importScripts(
  "https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js"
);

firebase.initializeApp(${JSON.stringify(firebaseConfig, null, 2)});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  var title =
    (payload.notification && payload.notification.title) ||
    "Affiliate Chat Box";
  var body =
    (payload.notification && payload.notification.body) || "";
  var data = payload.data || {};
  var origin = self.location.origin || "https://affiliatechatbox.com";
  var url = origin + "/notifications";
  if (data.type === "chat_message" && data.senderId) {
    url =
      origin +
      "/chats?userId=" +
      encodeURIComponent(String(data.senderId));
  } else if (data.postId) {
    url = origin + "/post/" + encodeURIComponent(String(data.postId));
  }
  var tag =
    "acbx-fcm-" +
    (data.type || "n") +
    "-" +
    (data.senderId || data.postId || String(Date.now()));
  return self.registration.showNotification(title, {
    body: body,
    icon: origin + "/favicon.ico",
    tag: tag,
    data: { url: url },
    renotify: true,
  });
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var url =
    (event.notification.data && event.notification.data.url) ||
    self.location.origin + "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if ("focus" in client) {
            if ("navigate" in client) {
              return client.navigate(url).then(function (c) {
                return c.focus();
              });
            }
            client.focus();
            return client;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});
`;

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, body, "utf8");
console.log("Wrote " + outPath);
