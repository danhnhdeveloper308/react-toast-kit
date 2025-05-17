# React Toast Kit

A modern, performant, and theme-aware toast notification library for React applications.

![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)
![React](https://img.shields.io/badge/React-17%2B-blue)
![Bundle Size](https://img.shields.io/badge/Bundle%20Size-Tiny-green)
![License](https://img.shields.io/npm/l/react-toast-kit)

## Features

- 🚀 **High Performance**: Built with performance in mind using React, Framer Motion, and Zustand
- 🎭 **Theme Support**: Supports light and dark mode with system preference detection
- 🌈 **Multiple Animation Types**: Choose from slide, fade, bounce, or disable animations entirely
- ⏳ **Loading Toasts**: Built-in support for loading states and promise handling
- 🧩 **Flexible API**: Simple function calls or object-based configuration
- 📱 **Responsive**: Works great on mobile and desktop
- 🔄 **Promise Integration**: Built-in promise handling for async operations
- ♿ **Accessible**: ARIA attributes and screen reader announcements
- 🔧 **Customizable**: Easy to customize appearance and behavior
- 📦 **Small Bundle Size**: Minimal dependencies and tree-shakeable with tsup
- 🖥️ **Framework Agnostic**: Works with Next.js (App Router & Pages Router), Create React App, Vite, etc.
- 🔍 **TypeScript Support**: Built with TypeScript for better developer experience
- 🎛️ **Sticky Element Support**: Automatically adjusts position to avoid sticky headers and footers

## Installation

```bash
npm install react-toast-kit
# or
yarn add react-toast-kit
# or
pnpm add react-toast-kit
```

## Quick Start

```jsx
import { ToastProvider, toast } from 'react-toast-kit';

// Wrap your app with the ToastProvider
function App() {
  return (
    <ToastProvider>
      <MyComponent />
    </ToastProvider>
  );
}

// Use the toast function anywhere in your components
function MyComponent() {
  const showToast = () => {
    toast.success('Successfully saved!');
  };

  return <button onClick={showToast}>Save</button>;
}
```

## Toast Types

```jsx
toast('Default toast message');
toast.success('Successfully saved!');
toast.error('Something went wrong!');
toast.warning('Please be careful!');
toast.info('Here is some information.');
toast.loading('Processing your request...');

// With more options
toast.success({
  title: 'Success!',
  description: 'Data has been saved successfully.',
  duration: 5000,
  position: 'top-right'
});
```

## Promise Support

```jsx
const promise = saveData();

toast.promise(promise, {
  loading: 'Saving your data...',
  success: (data) => `Successfully saved ${data.items.length} items!`,
  error: (err) => `Error: ${err.message}`
});
```

## Custom Components

```jsx
toast.custom(
  <div className="flex items-center bg-gradient-to-r from-purple-500 to-indigo-500 p-2 rounded">
    <div>🚀</div>
    <div className="ml-2">
      <div className="font-bold">Custom Toast</div>
      <div className="text-sm">This is a fully custom toast component!</div>
    </div>
  </div>
);
```

## Configuration

### Provider Configuration

```jsx
<ToastProvider
  defaultDuration={4000}
  defaultPosition="top-right"
  defaultTheme="system"
  defaultAnimation="slide"
  maxToasts={3}
  // Support for sticky headers and footers
  topOffset={64} // Adjust if you have a sticky header (height in pixels)
  bottomOffset={48} // Adjust if you have a sticky footer (height in pixels)
  leftOffset={16} // Distance from left edge in pixels
  rightOffset={16} // Distance from right edge in pixels
  // Accessibility
  enableAccessibleAnnouncements={true}
  // Styling
  containerClassName="my-toast-container"
  toastClassName="my-toast"
>
  <App />
</ToastProvider>
```

### Toast Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | string | auto-generated | Unique identifier for the toast |
| `title` | string | - | Toast title |
| `description` | string | - | Toast description |
| `variant` | 'success' \| 'error' \| 'warning' \| 'info' \| 'loading' \| 'default' \| 'custom' | 'default' | Type of toast |
| `duration` | number | 4000 | Duration in milliseconds |
| `position` | 'top-right' \| 'top-center' \| 'top-left' \| 'bottom-right' \| 'bottom-center' \| 'bottom-left' | 'top-right' | Position of the toast |
| `dismissible` | boolean | true | Whether the toast can be dismissed with a close button |
| `pauseOnHover` | boolean | true | Whether to pause the timer when hovering over the toast |
| `dismissOnClick` | boolean | false | Whether to dismiss the toast when clicking on it |
| `theme` | 'light' \| 'dark' \| 'system' | 'system' | Toast theme |
| `icon` | ReactNode | - | Custom icon component |
| `component` | ReactNode | - | Custom toast component (for `toast.custom()`) |
| `onDismiss` | (id: string) => void | - | Callback function when toast is dismissed |
| `className` | string | - | Additional CSS class for styling |
| `style` | React.CSSProperties | - | Inline styles for the toast |
| `animation` | 'slide' \| 'fade' \| 'bounce' \| 'none' | 'slide' | Animation style |

## Sticky Header and Footer Support

React Toast Kit includes support for applications with fixed or sticky headers and footers. You can adjust the positioning of toasts to ensure they don't overlap with these elements:

```jsx
<ToastProvider
  // Offset from top edge - set this to your header height
  topOffset={64}
  
  // Offset from bottom edge - set this to your footer height
  bottomOffset={48}
  
  // Horizontal offsets if needed
  leftOffset={16}
  rightOffset={16}
>
  <App />
</ToastProvider>
```

This ensures that:
- Top-positioned toasts (top-left, top-center, top-right) will appear below your sticky header
- Bottom-positioned toasts (bottom-left, bottom-center, bottom-right) will appear above your sticky footer

## Animation Options

React Toast Kit supports multiple animation styles:

```jsx
<ToastProvider defaultAnimation="bounce">
  <App />
</ToastProvider>

// Or at the individual toast level
toast.success({
  title: 'Success!',
  description: 'Action completed',
  animation: 'fade'
});
```

Available animations:
- `slide` (default): Slides in from the edge
- `fade`: Simple fade in/out
- `bounce`: Bouncy spring animation
- `none`: No animation (instant appearance)

## Hook-based API

For more control, use the `useToast` hook:

```jsx
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

## Next.js App Router Support

For Next.js applications using the App Router, use the `ClientToastProvider` component:

```jsx
// In your layout.js or page.js
'use client';

import { ClientToastProvider } from 'react-toast-kit';

export default function Layout({ children }) {
  return (
    <ClientToastProvider
      topOffset={64} // If you have a sticky header
      bottomOffset={48} // If you have a sticky footer
    >
      {children}
    </ClientToastProvider>
  );
}
```

## Using in Client Components

```jsx
'use client';

import { toast } from 'react-toast-kit';

export default function ClientComponent() {
  return (
    <button 
      onClick={() => toast.success('This works in client components!')}
    >
      Show Toast
    </button>
  );
}
```

## TypeScript Support

React Toast Kit is built with TypeScript and exports all the types you need:

```tsx
import { toast, type ToastOptions, type ToastPosition } from 'react-toast-kit';

// Example of using the types
const position: ToastPosition = 'bottom-center';
const options: ToastOptions = {
  title: 'Hello TypeScript',
  position,
  duration: 5000
};

toast(options);
```

## CSS Styles and Tailwind

React Toast Kit includes default styling that works out of the box, with or without Tailwind CSS. The library exports a CSS file that you can import:

```jsx
// Import base styles
import 'react-toast-kit/dist/styles.css';
```

For Tailwind users, the component is built with Tailwind classes, which works automatically with your Tailwind setup.

## Browser Support

React Toast Kit supports all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)

## Bundle Size

React Toast Kit is built with performance in mind using tsup for optimal bundling, resulting in a minimal footprint for your application.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT