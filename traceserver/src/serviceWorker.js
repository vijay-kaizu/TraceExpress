// This optional code is used to register a service worker.
// register() is not called by default.

// This allows the app to load faster on subsequent visits in production and provides offline capabilities.
// Note: Updates will only apply after all open tabs of the page are closed since cached resources update in the background.

// To learn more about this model, visit https://bit.ly/CRA-PWA

const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]' ||
    // 127.0.0.0/8 are considered localhost for IPv4.
    window.location.hostname.match(
        /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
);

export function register(config) {
    if (import.meta.env.MODE === 'production' && 'serviceWorker' in navigator) {
        const publicUrl = new URL(import.meta.env.BASE_URL, window.location.href);
        if (publicUrl.origin !== window.location.origin) {
            // Service worker won't work if served from a different origin.
            return;
        }

        window.addEventListener('load', () => {
            const swUrl = `${import.meta.env.BASE_URL}service-worker.js`;

            if (isLocalhost) {
                // Check if a service worker exists or not.
                checkValidServiceWorker(swUrl, config);

                // Log additional information in development mode.
                navigator.serviceWorker.ready.then(() => {
                    console.log(
                        'This app is served cache-first by a service worker. Learn more: https://bit.ly/CRA-PWA'
                    );
                });
            } else {
                // Register the service worker for non-localhost environments.
                registerValidSW(swUrl, config);
            }
        });
    }
}

async function registerValidSW(swUrl, config) {
    try {
        const registration = await navigator.serviceWorker.register(swUrl);

        registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (!installingWorker) return;

            installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                    if (navigator.serviceWorker.controller) {
                        // Updated content available; will be used when all tabs are closed.
                        console.log(
                            'New content is available; it will be used after closing all tabs. More info: https://bit.ly/CRA-PWA'
                        );
                        if (config?.onUpdate) config.onUpdate(registration);
                    } else {
                        // Precached content available for offline use.
                        console.log('Content is cached for offline use.');
                        if (config?.onSuccess) config.onSuccess(registration);
                    }
                }
            };
        };
    } catch (error) {
        console.error('Error during service worker registration:', error);
    }
}

async function checkValidServiceWorker(swUrl, config) {
    try {
        const response = await fetch(swUrl, { headers: { 'Service-Worker': 'script' } });

        const contentType = response.headers.get('content-type');
        if (
            response.status === 404 ||
            (contentType && !contentType.includes('javascript'))
        ) {
            // No service worker found; unregister and reload the page.
            const registration = await navigator.serviceWorker.ready;
            await registration.unregister();
            window.location.reload();
        } else {
            // Service worker found; register as usual.
            registerValidSW(swUrl, config);
        }
    } catch {
        console.log('No internet connection. App is running in offline mode.');
    }
}

export function unregister() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
            .then(registration => registration.unregister())
            .catch(error => console.error('Error during service worker unregistration:', error));
    }
}
