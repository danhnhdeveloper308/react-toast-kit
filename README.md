# React Toast Kit 🍞

A modern, accessible toast notification system for React applications with **automatic CSS injection** - no manual CSS imports required!

## ✨ Features

- 🎨 **Auto CSS Injection** - No need to manually import CSS files
- 🚀 **Zero Configuration** - Works out of the box
- 🎯 **TypeScript First** - Full type safety
- 📱 **Responsive** - Mobile-friendly design
- ♿ **Accessible** - ARIA compliant
- 🎭 **Multiple Themes** - Light, dark, and system theme support
- 🎨 **Visual Styles** - Glass, gradient, neon, retro, and more
- ⚡ **Performance Optimized** - Tree-shakeable and lightweight
- 🔧 **Customizable** - Extensive customization options
- 🎪 **Rich Animations** - Slide, fade, bounce, flip, zoom effects

## 🚀 Quick Start

### Installation

```bash
npm install react-toast-kit framer-motion
# or
yarn add react-toast-kit framer-motion
# or
pnpm add react-toast-kit framer-motion
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
      <button onClick={() => toast('Hello World!')}>
        Show Toast
      </button>
    </>
  );
}
```

### Next.js App Router (Recommended)

For Next.js 13+ with App Router, use the client-specific import:

```tsx
// app/layout.tsx
import { ToastProvider } from 'react-toast-kit/nextjs/client';
// CSS automatically injected ✨

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
```

```tsx
// app/page.tsx or any client component
'use client';
import { toast } from 'react-toast-kit';

export default function HomePage() {
  return (
    <button onClick={() => toast.success('Welcome!')}>
      Click me
    </button>
  );
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
toast('Custom toast', {
  duration: 5000,
  position: 'top-center',
  theme: 'dark',
  animation: 'bounce',
  visualStyle: 'glass'
});

// Promise handling
const promise = fetch('/api/data');
toast.promise(promise, {
  loading: 'Loading data...',
  success: 'Data loaded!',
  error: 'Failed to load data'
});

// Update existing toast
const id = toast.loading('Processing...');
// Later...
toast.update(id, {
  variant: 'success',
  description: 'Done!',
  duration: 3000
});

// Dismiss toasts
toast.dismiss(); // Dismiss all
toast.dismiss(id); // Dismiss specific toast
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
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  animation?: 'slide' | 'fade' | 'bounce' | 'flip' | 'zoom' | 'none';
  visualStyle?: 'solid' | 'glass' | 'gradient' | 'shimmer' | 'pill' | 'neon' | 'retro';
  
  // Advanced
  className?: string;
  style?: React.CSSProperties;
  customAnimation?: CustomAnimation;
  priority?: 'low' | 'normal' | 'high';
  stagger?: number; // Delay in ms
  floating?: boolean;
  rippleEffect?: boolean;
  progressBarStyle?: 'default' | 'fancy';
  
  // Callbacks
  onDismiss?: (id: string) => void;
}
```

## 🎨 Visual Styles

React Toast Kit includes 7 built-in visual styles:

- **solid** - Clean, modern solid backgrounds (default)
- **glass** - Glassmorphism effect with backdrop blur
- **gradient** - Beautiful gradient backgrounds
- **shimmer** - Animated shimmer effect
- **pill** - Rounded pill shape
- **neon** - Cyberpunk-style neon glow
- **retro** - Vintage terminal look

```tsx
toast('Glass effect!', { visualStyle: 'glass' });
toast('Neon style!', { visualStyle: 'neon' });
```

## 🎭 Animations

Choose from 6 animation types:

- **slide** - Smooth slide in/out (default)
- **fade** - Simple fade in/out
- **bounce** - Spring bounce effect
- **flip** - 3D flip animation
- **zoom** - Scale in/out
- **none** - No animation

```tsx
toast('Bouncy!', { animation: 'bounce' });
toast('Smooth fade', { animation: 'fade' });
```

## 🔧 Manual CSS Import (Optional)

While CSS is automatically injected, you can still manually import it if needed:

```tsx
// Optional - CSS is auto-injected by default
import 'react-toast-kit/styles';
```

Or import as CSS file:
```css
@import 'react-toast-kit/dist/styles.css';
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
import { toast, ToastProvider } from 'react-toast-kit();
// No CSS import needed! ✨
// Replace <ToastContainer /> with <ToastProvider />
```

## 💡 Pro Tips

1. **No CSS Import Needed** - The library automatically injects CSS
2. **Tree Shaking** - Only imports what you use
3. **SSR Safe** - Works with server-side rendering
4. **Performance** - Uses React 18 features for optimal performance
5. **Accessibility** - Built with screen readers in mind

## 🔧 Troubleshooting

### CSS Not Applied?

The CSS should be automatically injected. If styles aren't appearing:

1. Check browser console for any errors
2. Verify the library is properly imported
3. Try manual CSS import: `import 'react-toast-kit/styles'`

### Next.js Issues?

- Use `/nextjs/client` import for App Router
- Ensure client components are marked with `'use client'`

### TypeScript Errors?

- Ensure you have the latest types: `@types/react@^18`
- Check peer dependencies are installed

## 📄 License

MIT © [DanhDeveloper](https://github.com/danhnhdeveloper308)

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

---

**Made with ❤️ for the React community**