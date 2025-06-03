self.addEventListener("push", (event) => {
  const data = event.data.json();

  const promise = self.registration.showNotification(data.title, {
    body: data.body,
    icon: "/favicon.ico",
    data: { url: data.url },
  });

  event.waitUntil(promise);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.notification.data?.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});
