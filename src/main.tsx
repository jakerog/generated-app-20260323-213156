import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { enableMapSet } from "immer";
// Internal imports
import '@/lib/errorReporter';
import '@/index.css';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
// Page imports
import { HomePage } from '@/pages/HomePage';
import { PriceAlertPage } from '@/pages/PriceAlertPage';
import { AccountPage } from '@/pages/AccountPage';
import { AdminPortalPage } from '@/pages/AdminPortalPage';
import { SignInPage } from '@/pages/SignInPage';
import { SignUpPage } from '@/pages/SignUpPage';
// Initialize Immer plugins
enableMapSet();
// Initialize TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});
// Configure Browser Router
const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/alert/new",
    element: <PriceAlertPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/alert/:id",
    element: <PriceAlertPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/account",
    element: <AccountPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/admin",
    element: <AdminPortalPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/signin",
    element: <SignInPage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/signup",
    element: <SignUpPage />,
    errorElement: <RouteErrorBoundary />,
  }
]);
// Mount Application
const container = document.getElementById('root');
if (!container) {
  throw new Error('Failed to find the root element');
}
const root = createRoot(container);
root.render(
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </QueryClientProvider>
);