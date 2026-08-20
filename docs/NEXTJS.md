# Next.js integration

React Toast Kit works with both the App Router and Pages Router. The package is
SSR-safe and ships a `use client` directive; keep the provider in a small Client
Component because it uses browser events and a portal.

## App Router

```tsx
// app/toast-provider.tsx
'use client';

import { ToastProvider } from 'react-toast-kit';

export function AppToastProvider({ children }: { children: React.ReactNode }) {
  return <ToastProvider theme="system">{children}</ToastProvider>;
}
```

```tsx
// app/layout.tsx
import { AppToastProvider } from './toast-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppToastProvider>{children}</AppToastProvider>
      </body>
    </html>
  );
}
```

## Pages Router

Wrap the page component in `_app.tsx`:

```tsx
import { ToastProvider } from 'react-toast-kit';

export default function App({ Component, pageProps }) {
  return (
    <ToastProvider>
      <Component {...pageProps} />
    </ToastProvider>
  );
}
```

Styles are injected once automatically. With a strict Content Security Policy,
use the side-effect-free entry and import the stylesheet from the framework's
global style entry:

```tsx
import { ToastProvider, toast } from 'react-toast-kit/core';
import 'react-toast-kit/styles.css';
```

The same provider pattern works in Vite, Remix, React Router and other React
frameworks. Toast content accepts Unicode text, wraps long unbroken strings, and
uses logical CSS properties for left-to-right and right-to-left documents.
