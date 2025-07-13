if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/tendency/service-worker.js', { scope: '/tendency/' })
        .then(reg => console.log('Service Worker registered', reg))
        .catch(err => console.error('Service Worker registration failed', err));
}
