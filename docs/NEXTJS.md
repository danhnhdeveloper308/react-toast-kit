# Next.js Integration Guide

React Toast Kit seamlessly integrates with Next.js applications using both the App Router and Pages Router architectures.

## Installation

```bash
npm install react-toast-kit
# or
yarn add react-toast-kit
# or
pnpm add react-toast-kit
```

## App Router (Next.js 13+)

The App Router requires special handling for client components. React Toast Kit provides a specific `ClientToastProvider` component for this purpose.

### Step 1: Add the Provider to Your Root Layout

```tsx
// app/layout.tsx
'use client';

import { ClientToastProvider } from 'react-toast-kit';
import 'react-toast-kit/dist/styles.css'; // Import the styles

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClientToastProvider
          // Configure your toast settings here
          topOffset={64} // If you have a sticky header
          bottomOffset={48} // If you have a sticky footer
        >
          {children}
        </ClientToastProvider>
      </body>
    </html>
  );
}
```

### Step 2: Use Toasts in Client Components

```tsx
// components/ExampleButton.tsx
'use client';

import { toast } from 'react-toast-kit';

export default function ExampleButton() {
  return (
    <button 
      onClick={() => toast.success('Action completed successfully!')}
      className="px-4 py-2 rounded bg-blue-500 text-white"
    >
      Show Toast
    </button>
  );
}
```

### Important Note for Server Components

You cannot directly import the `toast` function in Server Components. Instead:

1. Create a client component for your toast interactions
2. Import and use this client component in your server component

```tsx
// components/ToastButton.tsx (Client Component)
'use client';

import { toast } from 'react-toast-kit';

export function ToastButton() {
  return (
    <button onClick={() => toast.success('Success!')}>
      Show Toast
    </button>
  );
}

// app/server-page/page.tsx (Server Component)
import { ToastButton } from '@/components/ToastButton';

export default function ServerPage() {
  return (
    <div>
      <h1>Server Component Page</h1>
      <ToastButton />
    </div>
  );
}
```

## Pages Router (Traditional Next.js)

For Next.js applications using the Pages Router, the integration is straightforward.

### Step 1: Add the Provider to Your App Component

```tsx
// pages/_app.tsx
import type { AppProps } from 'next/app';
import { ToastProvider } from 'react-toast-kit';
import 'react-toast-kit/dist/styles.css'; // Import the styles

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider>
      <Component {...pageProps} />
    </ToastProvider>
  );
}
```

### Step 2: Use Toasts in Your Components

```tsx
// pages/index.tsx
import { toast } from 'react-toast-kit';

export default function Home() {
  return (
    <div>
      <h1>Welcome to Next.js!</h1>
      <button 
        onClick={() => toast.success('Action completed successfully!')}
        className="px-4 py-2 rounded bg-blue-500 text-white"
      >
        Show Toast
      </button>
    </div>
  );
}
```

## Configuration Options

You can customize the toast behavior by passing props to the provider:

```tsx
<ToastProvider
  defaultDuration={5000}
  defaultPosition="top-right"
  defaultTheme="system" // 'light', 'dark', or 'system'
  defaultAnimation="slide" // 'slide', 'fade', 'bounce', or 'none'
  maxToasts={3}
  
  // Support for sticky headers and footers
  topOffset={64} // Adjust for sticky headers
  bottomOffset={48} // Adjust for sticky footers
  leftOffset={16}
  rightOffset={16}
  
  // Accessibility
  enableAccessibleAnnouncements={true}
>
  <Component {...pageProps} />
</ToastProvider>
```

## Using the Hook API

If you need more control or want to access toast state, you can use the hook API:

```tsx
import { useToast } from 'react-toast-kit';

function MyComponent() {
  const { toast, dismiss, theme, setTheme } = useToast();
  
  return (
    <div>
      <button onClick={() => toast.success('Success!')}>Show Toast</button>
      <button onClick={() => dismiss()}>Dismiss All</button>
      <button onClick={() => setTheme('dark')}>Dark Mode</button>
    </div>
  );
}
```

## Optimized Bundle

React Toast Kit is built with tsup for optimal bundling, ensuring the smallest possible impact on your application's bundle size. The package:

- Is tree-shakeable
- Provides ESM and CommonJS modules
- Includes TypeScript declarations
- Has minimal dependencies

This makes it a perfect choice for Next.js applications where performance is critical.

## Animations with Next.js

React Toast Kit uses Framer Motion for animations. Make sure to properly import and configure Framer Motion if your project has specific requirements, such as reduced motion preferences.

## Tailwind CSS Integration

If you're using Tailwind CSS (which is common in Next.js projects), our toast notifications are designed to work seamlessly with your Tailwind configuration.

For the best experience, ensure your `tailwind.config.js` includes:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // ...other config
  darkMode: 'class',
  // ...other config
};
```

## TypeScript Support

React Toast Kit is written in TypeScript and provides full type definitions. You can import types as needed:

```tsx
import { toast, type ToastOptions, type ToastPosition } from 'react-toast-kit';

// Example of using the types
const position: ToastPosition = 'bottom-center';
const options: ToastOptions = {
  title: "Hello TypeScript",
  position,
  duration: 5000
};

toast(options);
```

## Advanced Usage Examples

Check out the main [README.md](../README.md) file for more advanced usage examples and configuration options.