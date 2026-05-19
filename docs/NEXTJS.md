# Sử dụng React Toast Kit với Next.js

React Toast Kit hoàn toàn tương thích với Next.js, bao gồm cả App Router và Pages Router. Tài liệu này sẽ hướng dẫn chi tiết cách tích hợp thư viện với Next.js.

## Cài đặt

```bash
# Với npm
npm install react-toast-kit

# Với yarn
yarn add react-toast-kit

# Với pnpm
pnpm add react-toast-kit
```

## Tích hợp cơ bản

### App Router (Next.js 13+)

Trong App Router của Next.js, bạn cần đảm bảo các component liên quan đến client-side như `ToastProvider` và `ToastPortal` được đánh dấu là client components:

```tsx
// app/providers.tsx
'use client';

import { ToastProvider } from 'react-toast-kit';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}
```

Sau đó sử dụng trong layout gốc:

```tsx
// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Pages Router (Next.js < 13)

Với Pages Router, bạn có thể thêm `ToastProvider` vào `_app.tsx`:

```tsx
// pages/_app.tsx
import { AppProps } from 'next/app';
import { ToastProvider } from 'react-toast-kit';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider>
      <Component {...pageProps} />
    </ToastProvider>
  );
}

export default MyApp;
```

## Sử dụng DevTools với Next.js

React Toast Kit cung cấp DevTools để giúp bạn debug và kiểm tra toast. Với Next.js, bạn cần đảm bảo DevTools chỉ chạy ở client-side.

### App Router (Next.js 13+)

Tạo một component client riêng cho DevTools:

```tsx
// app/components/ToastDevToolsClient.tsx
'use client';

import { ClientDevTools } from 'react-toast-kit/DevToolsWrapper';

export default function ToastDevToolsClient() {
  return <ClientDevTools />;
}
```

Sau đó sử dụng nó trong layout hoặc page của bạn:

```tsx
// app/layout.tsx
import ToastDevToolsClient from './components/ToastDevToolsClient';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
        {/* DevTools sẽ chỉ hiển thị trong development mode */}
        <ToastDevToolsClient />
      </body>
    </html>
  );
}
```

### Pages Router (Next.js < 13)

Với Pages Router, bạn có thể thêm DevTools vào `_app.tsx` tương tự:

```tsx
// pages/_app.tsx
import { AppProps } from 'next/app';
import { ToastProvider } from 'react-toast-kit';
import dynamic from 'next/dynamic';

// Import DevTools với dynamic import để đảm bảo nó chỉ chạy ở client-side
const DevTools = dynamic(
  () => import('react-toast-kit/DevToolsWrapper').then(mod => mod.default),
  { ssr: false }
);

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider>
      <Component {...pageProps} />
      <DevTools />
    </ToastProvider>
  );
}

export default MyApp;
```

## Sử dụng hook useToast

Hook `useToast` có thể được sử dụng trong bất kỳ client component nào:

```tsx
// app/components/MyComponent.tsx
'use client';

import { useToast } from 'react-toast-kit';

export default function MyComponent() {
  const toast = useToast();

  const handleClick = () => {
    toast.success('Thành công!');
  };

  return (
    <button onClick={handleClick}>
      Hiển thị toast
    </button>
  );
}
```

## Cấu hình toàn cục

Bạn có thể cấu hình DevTools toàn cục:

```tsx
// app/providers.tsx
'use client';

import { ToastProvider } from 'react-toast-kit';
import { configureDevTools } from 'react-toast-kit/DevToolsWrapper';

// Bạn có thể bật DevTools thậm chí trong production
configureDevTools({ enable: true });

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}
```

## Các tip khi sử dụng với Next.js

1. **Server Components**: Không sử dụng `useToast` hook trong Server Components. Tạo một Client Component riêng biệt khi bạn cần sử dụng toast.

2. **Hydration Errors**: Để tránh lỗi hydration, hãy đảm bảo rằng trạng thái toast giữa server và client là nhất quán, hoặc chỉ render ToastPortal ở phía client.

3. **Dark Mode**: Khi sử dụng dark mode với Next.js và React Toast Kit, đảm bảo theme được đồng bộ giữa các thành phần.

```tsx
'use client';

import { useTheme } from 'next-themes';
import { ToastProvider } from 'react-toast-kit';

export function Providers({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  
  return (
    <ToastProvider theme={theme as 'light' | 'dark' | 'system'}>
      {children}
    </ToastProvider>
  );
}
```

4. **URLs trong Toast**: Khi hiển thị liên kết trong toast với Next.js, bạn nên sử dụng Next.js `Link` component:

```tsx
'use client';

import { useToast } from 'react-toast-kit';
import Link from 'next/link';

export default function MyComponent() {
  const toast = useToast();
  
  const showLinkToast = () => {
    toast({
      title: 'Thông báo',
      component: (
        <div>
          Xem chi tiết <Link href="/details">tại đây</Link>
        </div>
      )
    });
  };
  
  return <button onClick={showLinkToast}>Hiển thị toast với liên kết</button>;
}
```

## Tắt DevTools trong Production

DevTools tự động bị tắt trong production mode, nhưng bạn có thể bật nó bằng URL query param `?devtools=true` hoặc bằng cách thiết lập localStorage:

```js
// Để bật DevTools trong production:
localStorage.setItem('react-toast-kit:devtools', 'true');

// Để tắt:
localStorage.removeItem('react-toast-kit:devtools');
```

Hoặc sử dụng API cấu hình:

```tsx
import { configureDevTools } from 'react-toast-kit/DevToolsWrapper';

// Bật DevTools (ngay cả trong production)
configureDevTools({ enable: true });

// Tắt DevTools (ngay cả trong development)
configureDevTools({ enable: false });
```