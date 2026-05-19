# Changelog

All notable changes to this project will be documented in this file.

## [1.0.5] - 2024-05-24

### 🐛 Critical Bug Fix

#### CSS Compatibility Fix
- **Fixed**: CSS now works reliably in all projects regardless of styling framework
- **Enhanced CSS Injection**: Improved CSS injection mechanism with fail-safe backup
- **Framework Agnostic**: CSS no longer depends on Tailwind or other frameworks
- **Self-healing**: Added automatic CSS detection and recovery mechanism

### ⚡️ Improvements
- Better CSS specificity for consistent styling across all environments
- Added CSS namespacing to prevent conflicts with other libraries
- Enhanced emergency CSS fallback when main injection fails
- CSS now properly works with Next.js, Vite, Create React App and all frameworks
- Improved CSS organization for better maintainability

### 🔍 Technical Details
- Changed CSS injection from tsup's injectStyle to custom banner injection
- Added priority injection at beginning of head element
- Created auto-recovery system for potentially missing CSS
- Fully namespaced all CSS classes with react-toast-* prefix

## [1.0.4] - 2024-05-24

### 🎉 Major Enhancement

#### CSS Automatically Bundled
- **BREAKING IMPROVEMENT**: CSS is now automatically injected into the JavaScript bundle
- **No more manual CSS imports required** - just import the package and everything works
- Eliminates the need for `import 'react-toast-kit/dist/index.css'`
- Better developer experience with one-import setup

### ✨ Features
- ✅ **Zero-config CSS**: Styles are automatically included when you import the package
- ✅ **Optional standalone CSS**: Still available at `react-toast-kit/styles` for custom styling
- ✅ **Better bundling**: CSS and JS are optimized together
- ✅ **Faster loading**: No separate CSS file requests
- ✅ **Version sync**: CSS and JS are always in sync

### 🔧 Technical Changes
- Updated `tsup.config.ts` to use `injectStyle: true`
- Enhanced build process to automatically inject CSS into bundle
- Added standalone CSS file generation for optional use
- Improved package exports configuration
- Better Next.js compatibility with client-side wrappers

### 📦 Bundle Size
- Main bundle: ~31KB (including CSS)
- Gzipped: ~10KB
- Standalone CSS: ~16KB (optional)

### 🚀 Migration Guide

#### Before (v1.0.3 and earlier):
```tsx
import { ToastProvider, useToast } from 'react-toast-kit';
import 'react-toast-kit/dist/index.css'; // ❌ Manual CSS import required
```

#### After (v1.0.4+):
```tsx
import { ToastProvider, useToast } from 'react-toast-kit';
// ✅ That's it! CSS is automatically included
```

#### Optional (if you need external CSS for customization):
```tsx
import { ToastProvider, useToast } from 'react-toast-kit';
import 'react-toast-kit/styles'; // Optional for custom styling
```

### 💡 Benefits
- **Simpler setup**: One import, everything works
- **Better DX**: No need to remember CSS imports
- **Faster loading**: Everything cached together
- **Better bundling**: CSS optimized with JS bundle
- **No version mismatches**: CSS and JS always in sync

---

## [1.0.3] - 2024-05-23

### ✨ Features
- Enhanced TypeScript support with stricter types
- Improved accessibility with better ARIA labels
- Added plugin system for extensibility
- Performance optimizations with better memoization

### 🐛 Bug Fixes
- Fixed SSR compatibility issues
- Resolved theme detection edge cases
- Improved mobile responsiveness

### 🔧 Technical
- Better error handling and recovery
- Enhanced development tools
- Improved bundle size optimization

---

## [1.0.2] - 2024-05-22

### ✨ Features
- Added visual styles: gradient, glass, neon, pill, retro, confetti
- Enhanced animations: flip, zoom, bounce
- Mobile swipe-to-dismiss functionality
- Ripple effect on click

### 🎨 Styling
- Improved dark mode support
- Better responsive design
- Enhanced glassmorphism effects

---

## [1.0.1] - 2024-05-21

### 🐛 Bug Fixes
- Fixed Next.js compatibility issues
- Resolved hydration warnings
- Improved error boundaries

### 📚 Documentation
- Enhanced README with better examples
- Added framework integration guides

---

## [1.0.0] - 2024-05-20

### 🎉 Initial Release

#### Core Features
- Multiple toast variants (success, error, warning, info, loading, custom)
- Flexible positioning system
- Theme support (light, dark, system)
- Animation system with multiple options
- TypeScript support
- React 18+ compatibility

#### Advanced Features
- Performance optimized with Zustand
- Framer Motion animations
- Accessibility first design
- Mobile-friendly touch interactions
- Plugin architecture
- Development tools

#### Framework Support
- Next.js (App Router & Pages Router)
- Create React App
- Vite
- Any React 17+ application