importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAsZ7huPhBJ3JbYtwGyQz6WBktDcpu0yFo",
  authDomain: "nearbuy-d7daf.firebaseapp.com",
  projectId: "nearbuy-d7daf",
  storageBucket: "nearbuy-d7daf.firebasestorage.app",
  messagingSenderId: "1009771297153",
  appId: "1:1009771297153:web:fd18e7ca3d15c8581d9080",
  measurementId: "G-S6MDPVPQBV"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  // Firebase automatically shows a notification if the payload contains a 'notification' object.
  // Do not manually call self.registration.showNotification here, or it will show duplicate notifications!
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data.url || '/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      let matchingClient = null;
      for (let i = 0; i < windowClients.length; i++) {
        const windowClient = windowClients[i];
        if (windowClient.url === urlToOpen) {
          matchingClient = windowClient;
          break;
        }
      }
      if (matchingClient) {
        return matchingClient.focus();
      } else {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
