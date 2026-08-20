# React Toast Kit 🍞

A modern, accessible toast notification system for React applications with **automatic CSS injection** - no manual CSS imports required!

[Documentation](https://danhnhdeveloper308.github.io/react-toast-kit-docs/) · [Live playground](https://danhnhdeveloper308.github.io/react-toast-kit-docs/#playground) · [npm](https://www.npmjs.com/package/react-toast-kit) · [GitHub](https://github.com/danhnhdeveloper308/react-toast-kit)

## ✨ Features

- 🎨 **Auto CSS Injection** - No need to manually import CSS files
- 🚀 **Zero Configuration** - Works out of the box
- 🎯 **TypeScript First** - Full type safety
- 📱 **Responsive** - Mobile-friendly design
- ♿ **Accessible** - ARIA compliant
- 🎭 **Multiple Themes** - Light, dark, and system theme support
- 🎨 **Visual Styles** - Glass, gradient, neon, retro, and more
- ⚡ **Performance Optimized** - Tree-shakeable and lightweight
- 🪶 **Zero Runtime Dependencies** - A tiny `useSyncExternalStore` state core
- 🔧 **Customizable** - Extensive customization options
- 🎪 **Rich Animations** - Slide, fade, bounce, flip, zoom effects

## 🚀 Quick Start

### Installation

```bash
npm install react-toast-kit
# or
yarn add react-toast-kit
# or
pnpm add react-toast-kit
```

### Basic Usage

**No CSS import needed!** The CSS is automatically injected when you import the library.

```tsx
import { toast, ToastProvider } from 'react-toast-kit';
// CSS is automatically injected - no manual import required! ✨

function App() {
  return (
    <>
      <ToastProvider />
      <button onClick={() => toast('Hello World!')}>Show Toast</button>
    </>
  );
}
```

For strict CSP or explicit stylesheet control, use the side-effect-free entry:

```tsx
import { toast, ToastProvider } from 'react-toast-kit/core';
import 'react-toast-kit/styles.css';
```

### Next.js App Router (Recommended)

For Next.js App Router, keep the provider in a small Client Component:

```tsx
// app/toast-provider.tsx
'use client';
import { ToastProvider } from 'react-toast-kit';

export function AppToastProvider({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
```

```tsx
// app/page.tsx or any client component
'use client';
import { toast } from 'react-toast-kit';

export default function HomePage() {
  return <button onClick={() => toast.success('Welcome!')}>Click me</button>;
}
```

### Next.js Pages Router

```tsx
// pages/_app.tsx
import { ToastProvider } from 'react-toast-kit';
// CSS automatically injected ✨

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <ToastProvider />
    </>
  );
}
```

## 📚 API Reference

### Toast Functions

```tsx
import { toast } from 'react-toast-kit';

// Basic toast
toast('Hello World!');

// Variant toasts
toast.success('Success message');
toast.error('Error message');
toast.warning('Warning message');
toast.info('Info message');
toast.loading('Loading...');

// Custom options
toast({
  title: 'Custom toast',
  duration: 5000,
  position: 'top-center',
  theme: 'dark',
  animation: 'bounce',
  visualStyle: 'glass',
});

// Promise handling
const promise = fetch('/api/data');
toast.promise(promise, {
  loading: 'Loading data...',
  success: 'Data loaded!',
  error: 'Failed to load data',
});

// Update existing toast
const id = toast.loading('Processing...');
// Later...
toast.update(id, {
  variant: 'success',
  description: 'Done!',
  duration: 3000,
});

// Dismiss toasts
toast.dismiss(); // Dismiss all
toast.dismiss(id); // Dismiss specific toast
```

Dismissal waits for the exit animation before removing the element and firing `onDismiss`. Custom
motion uses the browser Web Animations API and does not add an animation dependency:

```tsx
toast({
  title: 'Native custom motion',
  customAnimation: {
    initial: { opacity: 0, y: -12, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -8, scale: 0.96 },
    transition: { duration: 0.24, ease: 'cubic-bezier(.2,.8,.2,1)' },
  },
});
```

### ToastProvider Props

```tsx
<ToastProvider
  theme="system" // 'light' | 'dark' | 'system'
  position="top-right" // Default position for all toasts
  maxToasts={5} // Maximum number of toasts
  defaultAnimation="slide" // Default animation
  defaultStyle="solid" // Default visual style
  topOffset={16} // Offset from top (px)
  bottomOffset={16} // Offset from bottom (px)
  leftOffset={16} // Offset from left (px)
  rightOffset={16} // Offset from right (px)
/>
```

### Toast Options

```tsx
interface ToastOptions {
  // Content
  title?: string;
  description?: string;
  emoji?: string;
  icon?: JSX.Element;
  component?: JSX.Element;

  // Behavior
  duration?: number; // ms, 0 = persistent
  dismissible?: boolean;
  pauseOnHover?: boolean;
  dismissOnClick?: boolean;
  swipeToDismiss?: boolean;

  // Styling
  variant?: 'success' | 'error' | 'warning' | 'info' | 'loading' | 'default' | 'custom';
  theme?: 'light' | 'dark' | 'system';
  position?:
    'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  animation?: 'slide' | 'fade' | 'bounce' | 'flip' | 'zoom' | 'elastic' | 'none';
  visualStyle?:
    | 'solid'
    | 'glass'
    | 'gradient'
    | 'shimmer'
    | 'pill'
    | 'neon'
    | 'retro'
    | 'confetti'
    | 'minimal'
    | 'outlined';

  // Advanced
  className?: string;
  style?: React.CSSProperties;
  priority?: 'low' | 'normal' | 'high';
  stagger?: number; // Delay in ms
  floating?: boolean;
  rippleEffect?: boolean;
  progressBarStyle?: ProgressBarStyle;

  // Callbacks
  onDismiss?: (id: string) => void;
}
```

## 🎨 Visual Styles

React Toast Kit includes 10 built-in visual styles:

- **solid** - Clean, modern solid backgrounds (default)
- **glass** - Glassmorphism effect with backdrop blur
- **gradient** - Beautiful gradient backgrounds
- **shimmer** - Animated shimmer effect
- **pill** - Rounded pill shape
- **neon** - Cyberpunk-style neon glow
- **retro** - Vintage terminal look
- **confetti** - Lightweight celebratory pattern
- **minimal** - Quiet surface with a semantic accent
- **outlined** - Transparent semantic outline

```tsx
toast({ description: 'Glass effect!', visualStyle: 'glass' });
toast({ description: 'Neon style!', visualStyle: 'neon' });
```

## 🎭 Animations

Choose from 7 animation types:

- **slide** - Smooth slide in/out (default)
- **fade** - Simple fade in/out
- **bounce** - Spring bounce effect
- **flip** - 3D flip animation
- **zoom** - Scale in/out
- **elastic** - Soft elastic entrance
- **none** - No animation

```tsx
toast({ description: 'Bouncy!', animation: 'bounce' });
toast({ description: 'Smooth fade', animation: 'fade' });
```

## 🔧 Manual CSS Import (Optional)

While CSS is automatically injected, you can still manually import it if needed:

```tsx
// Optional - CSS is auto-injected by default
import 'react-toast-kit/styles.css';
```

Or import as CSS file:

```css
@import 'react-toast-kit/styles.css';
```

## 🎯 Framework Support

### Supported Frameworks

- ✅ **React** 17+
- ✅ **Next.js** 12+ (Pages & App Router)
- ✅ **Remix**
- ✅ **Vite + React**
- ✅ **Create React App**
- ✅ **Gatsby**

### Bundler Compatibility

- ✅ **Webpack** 5+
- ✅ **Vite** 3+
- ✅ **Rollup** 3+
- ✅ **Parcel** 2+
- ✅ **esbuild**

## 🚨 Migration from Other Toast Libraries

### From react-hot-toast

```tsx
// Before
import toast, { Toaster } from 'react-hot-toast';

// After
import { toast, ToastProvider } from 'react-toast-kit';
// Replace <Toaster /> with <ToastProvider />
```

### From react-toastify

```tsx
// Before
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Manual CSS import

// After
import { toast, ToastProvider } from 'react-toast-kit';
// No CSS import needed! ✨
// Replace <ToastContainer /> with <ToastProvider />
```

## 💡 Pro Tips

1. **No CSS Import Needed** - The library automatically injects CSS
2. **Tree Shaking** - Only imports what you use
3. **SSR Safe** - Works with server-side rendering
4. **Performance** - Uses selective store subscriptions and platform-native animations
5. **Accessibility** - Built with screen readers in mind

## 🔧 Troubleshooting

### CSS Not Applied?

The CSS should be automatically injected. If styles aren't appearing:

1. Check browser console for any errors
2. Verify the library is properly imported
3. For strict CSP, use `react-toast-kit/core` with `react-toast-kit/styles.css`

### Next.js Issues?

- Keep `ToastProvider` in a Client Component when using the App Router
- Ensure client components are marked with `'use client'`

### TypeScript Errors?

- Use matching React and React DOM versions (React 17, 18, and 19 are supported)
- Check peer dependencies are installed

## 📄 License

MIT © [DanhDeveloper](https://github.com/danhnhdeveloper308)

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

---

**Made with ❤️ for the React community**
