# Next.js Integration Guide

This guide will help you integrate React Toast Kit with Next.js projects, including proper setup for both Pages Router and App Router.

## Important: React Toast Kit is Framework-Agnostic

React Toast Kit is designed to be framework-agnostic and doesn't include `"use client"` directives in its components. This means:

1. You need to create your own client component wrappers in Next.js App Router projects
2. You'll benefit from better tree-shaking and more control over client/server boundaries 
3. The library works in any React environment without framework-specific optimizations affecting bundle size

## Quick Start

### 1. Install the package

```bash
npm install react-toast-kit
# or
yarn add react-toast-kit
# or
pnpm add react-toast-kit
```

### 2. Import CSS Styles

Add the CSS import to your main CSS file or at the top of your layout file:

```css
/* In your globals.css or main CSS file */
@import 'react-toast-kit/dist/styles.css';
```

Or import directly in your layout component:

```tsx
// In your layout.tsx or _app.tsx
import 'react-toast-kit/dist/styles.css';
```

### 3. Setup for Next.js App Router (Recommended)

For Next.js 13+ with App Router, create a client wrapper component to handle client-side functionality properly.

#### Create a Client Wrapper Component (Required)

Create a file `components/ClientToastProvider.tsx`:

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ToastProvider } from 'react-toast-kit';
import type { 
  ToastPosition, 
  ToastTheme, 
  ToastAnimation, 
  ToastStyle 
} from 'react-toast-kit';

interface ClientToastProviderProps {
  children?: React.ReactNode;
  defaultDuration?: number;
  defaultPosition?: ToastPosition;
  defaultTheme?: ToastTheme;
  maxToasts?: number;
  topOffset?: number;
  bottomOffset?: number;
  leftOffset?: number;
  rightOffset?: number;
  defaultAnimation?: ToastAnimation;
  defaultStyle?: ToastStyle;
  enableAccessibleAnnouncements?: boolean;
  containerClassName?: string;
  toastClassName?: string;
  enableDevMode?: boolean;
  onError?: (error: Error, context: string) => void;
  suppressHydrationWarning?: boolean;
}

export function ClientToastProvider({ 
  children, 
  ...props 
}: ClientToastProviderProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Prevent hydration mismatch by only rendering ToastProvider on client
  if (!mounted) {
    return <>{children}</>;
  }
  
  return (
    <ToastProvider {...props}>
      {children}
    </ToastProvider>
  );
}
```

#### Setup in Root Layout

Add the provider to your `app/layout.tsx`:

```tsx
import { ClientToastProvider } from '@/components/ClientToastProvider';
// Import the CSS styles
import 'react-toast-kit/dist/styles.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClientToastProvider
          defaultPosition="top-right"
          defaultTheme="system"
          maxToasts={3}
          suppressHydrationWarning={true}
        >
          {children}
        </ClientToastProvider>
      </body>
    </html>
  );
}
```

### 4. Setup for Next.js Pages Router

For Next.js with Pages Router, add the provider to your `_app.tsx`:

```tsx
import type { AppProps } from 'next/app';
import { ToastProvider } from 'react-toast-kit';
// Import the CSS styles
import 'react-toast-kit/dist/styles.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider
      defaultPosition="top-right"
      defaultTheme="system"
      maxToasts={3}
    >
      <Component {...pageProps} />
    </ToastProvider>
  );
}
```

## Using Toasts in Client Components

### Creating a Client-Side Toast Hook (Recommended)

For better organization, create a custom toast hook in a client component:

```tsx
// hooks/useClientToast.ts
'use client';

import { useToast } from 'react-toast-kit';

export function useClientToast() {
  return useToast();
}
```

### Using Toasts in Client Components

For components that use toasts, make sure they're client components:

```tsx
'use client';

import { toast } from 'react-toast-kit';
// or import your custom hook: import { useClientToast } from '@/hooks/useClientToast';

export function MyClientComponent() {
  const handleClick = () => {
    toast.success('Hello from Next.js!');
  };
  
  return (
    <button onClick={handleClick}>
      Show Toast
    </button>
  );
}
```

### Handling Server Actions (App Router)

You can use toasts with Server Actions by calling them in the client after the action completes:

```tsx
'use client';

import { toast } from 'react-toast-kit';
import { myServerAction } from '@/app/actions';

export function ServerActionForm() {
  const handleSubmit = async (formData: FormData) => {
    try {
      const result = await myServerAction(formData);
      toast.success('Action completed successfully!');
    } catch (error) {
      toast.error('Action failed!');
    }
  };
  
  return (
    <form action={handleSubmit}>
      {/* form content */}
    </form>
  );
}
```

## Alternative: Using the Next.js Specific Entry Point

React Toast Kit provides a Next.js specific entry point with `"use client"` pre-applied:

```tsx
// In your client components
'use client';
import { toast, ToastProvider } from 'react-toast-kit/nextjs/client';

// In your server components (only type imports and toast function)
import { toast } from 'react-toast-kit/nextjs/server';
import type { ToastOptions } from 'react-toast-kit/nextjs/server';
```

However, we recommend creating your own client wrapper as shown above for better control and customization.

## Configuration Options

### Theme Configuration

```tsx
<ClientToastProvider
  defaultTheme="system" // "light" | "dark" | "system"
  defaultPosition="top-right"
  defaultAnimation="slide"
  defaultStyle="solid"
>
  {children}
</ClientToastProvider>
```

### Custom Styling

```tsx
<ClientToastProvider
  containerClassName="my-custom-container"
  toastClassName="my-custom-toast"
  topOffset={20}
  rightOffset={20}
>
  {children}
</ClientToastProvider>
```

### Advanced Configuration

```tsx
<ClientToastProvider
  maxToasts={5}
  defaultDuration={4000}
  enableAccessibleAnnouncements={true}
  enableDevMode={process.env.NODE_ENV === 'development'}
  onError={(error, context) => {
    console.error(`Toast error in ${context}:`, error);
  }}
>
  {children}
</ClientToastProvider>
```

## Common Patterns

### Loading States

```tsx
'use client';

import { toast } from 'react-toast-kit';

export function AsyncOperation() {
  const handleAsyncOperation = async () => {
    const loadingToast = toast.loading('Processing...');
    
    try {
      await someAsyncOperation();
      toast.update(loadingToast, {
        variant: 'success',
        title: 'Success!',
        description: 'Operation completed successfully'
      });
    } catch (error) {
      toast.update(loadingToast, {
        variant: 'error',
        title: 'Error!',
        description: 'Operation failed'
      });
    }
  };
  
  return (
    <button onClick={handleAsyncOperation}>
      Start Operation
    </button>
  );
}
```

### Promise-based Toasts

```tsx
'use client';

import { toast } from 'react-toast-kit';

export function PromiseExample() {
  const handlePromise = () => {
    const myPromise = fetch('/api/data').then(res => res.json());
    
    toast.promise(myPromise, {
      loading: 'Fetching data...',
      success: (data) => `Loaded ${data.length} items!`,
      error: 'Failed to fetch data'
    });
  };
  
  return (
    <button onClick={handlePromise}>
      Fetch Data
    </button>
  );
}
```

## Troubleshooting

### Hydration Mismatches

If you see hydration warnings, make sure you're:

1. Using the `ClientToastProvider` pattern shown above
2. Including `suppressHydrationWarning={true}` in the props
3. Using the `mounted` state pattern to prevent rendering during SSR

### TypeScript Issues

Make sure to import types correctly:

```tsx
import type { ToastPosition, ToastTheme } from 'react-toast-kit';
```

### Styling Issues

If toasts don't appear styled correctly:

1. Make sure you've imported the styles: `import 'react-toast-kit/dist/styles.css'`
2. If using Tailwind, ensure that React Toast Kit's styles aren't being overridden by your Tailwind configuration

## Advanced Usage

### Creating Component-Specific Toast Contexts

For more complex applications, you might want to create component-specific toast contexts:

```tsx
// components/DashboardToasts.tsx
'use client';

import { createContext, useContext } from 'react';
import { toast } from 'react-toast-kit';

const DashboardToastContext = createContext({
  showSuccessToast: (message: string) => toast.success(`Dashboard: ${message}`),
  showErrorToast: (message: string) => toast.error(`Dashboard: ${message}`),
  // Add more specialized toast functions
});

export const useDashboardToast = () => useContext(DashboardToastContext);

export function DashboardToastProvider({ children }) {
  return (
    <DashboardToastContext.Provider value={{
      showSuccessToast: (message: string) => toast.success(`Dashboard: ${message}`),
      showErrorToast: (message: string) => toast.error(`Dashboard: ${message}`),
      // Add more specialized toast functions
    }}>
      {children}
    </DashboardToastContext.Provider>
  );
}
```

### Custom Toast Components

```tsx
'use client';

import { toast } from 'react-toast-kit';

const CustomToast = () => (
  <div className="flex items-center space-x-2">
    <span>🎉</span>
    <span>Custom message!</span>
  </div>
);

export function CustomToastExample() {
  const showCustom = () => {
    toast.custom(<CustomToast />, {
      duration: 3000,
      position: 'top-center'
    });
  };
  
  return (
    <button onClick={showCustom}>
      Show Custom Toast
    </button>
  );
}
```

## Best Practices

1. **Always mark toast-using components with `'use client'`** directive
2. **Use the ClientToastProvider pattern** to prevent hydration mismatches
3. **Place the provider high in the component tree** (layout.tsx or _app.tsx)
4. **Create specialized hooks** for different parts of your application
5. **Handle errors gracefully** with proper error messages
6. **Consider accessibility** by keeping default announcements enabled

## Migration from Other Libraries

### From react-hot-toast

React Toast Kit has a similar API to react-hot-toast:

```tsx
// react-hot-toast
import toast from 'react-hot-toast';

// React Toast Kit
import { toast } from 'react-toast-kit';

// Usage is very similar
toast.success('Success!');
toast.error('Error!');
toast.loading('Loading...');
```

### From react-toastify

```tsx
// react-toastify
import { toast } from 'react-toastify';

// React Toast Kit
import { toast } from 'react-toast-kit';

// Similar patterns
toast.success('Success message');
toast.error('Error message');
```

The main difference is in the provider setup and some advanced configuration options.