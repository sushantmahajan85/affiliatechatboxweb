/* eslint-disable no-undef */
importScripts(
  "https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  "apiKey": "AIzaSyBRcZs3nv3uHLH1LdN5Vp3dO2JUpA2LL3o",
  "appId": "1:603565223533:web:a0e1224d476bd339b21964",
  "messagingSenderId": "603565223533",
  "projectId": "omd-app-76987",
  "authDomain": "omd-app-76987.firebaseapp.com",
  "storageBucket": "omd-app-76987.appspot.com",
  "measurementId": "G-NJRYJWECRX"
});

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
          if (client.url && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});
