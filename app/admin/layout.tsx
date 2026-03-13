// app/admin/layout.tsx
// Wraps ALL /admin/* pages with AdminAuthProvider.
// The login page is the only child that renders without a session.
import { AdminAuthProvider } from '@/app/admin/context/AdminAuthContext';
import { Metadata } from 'next';

export const metadata : Metadata = {
  title: 'Admin Panel - GreenKart',
  description: 'Manage products, orders, users and payments on GreenKart.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      {children}
    </AdminAuthProvider>
  );
}