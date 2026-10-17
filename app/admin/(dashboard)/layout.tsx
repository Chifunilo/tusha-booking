"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Building2, Briefcase, Calendar, ScrollText, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '@/app/context/AuthContext';
import { API_URL } from '@/lib/api';
import { fadeInVariants } from '@/lib/motion';

interface AdminNavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: AdminNavItem[] = [
  { href: '/admin', label: 'Overview', icon: <LayoutDashboard size={20} /> },
  { href: '/admin/properties', label: 'Properties', icon: <Building2 size={20} /> },
  { href: '/admin/businesses', label: 'Businesses', icon: <Briefcase size={20} /> },
  { href: '/admin/bookings', label: 'Bookings', icon: <Calendar size={20} /> },
  { href: '/admin/audit', label: 'Audit Log', icon: <ScrollText size={20} /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/me`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setAdminEmail(data?.user?.email ?? null))
      .catch(() => setAdminEmail(null));
  }, []);

  const handleLogout = () => {
    logout('/admin/login');
  };

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="flex gap-8 max-w-[1600px] mx-auto">
        {/* Sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: -16, filter: 'blur(6px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          transition={{ type: 'spring', duration: 0.65, bounce: 0 }}
          className="w-72 shrink-0 bg-white rounded-3xl shadow-xl shadow-black/10 ring-1 ring-black/5 p-4 flex flex-col h-fit sticky top-20"
        >
          <div className="flex items-center gap-2 py-3 px-2">
            <span className="font-semibold text-2xl tracking-tight text-black">tusha</span>
            <span className="rounded-full bg-black px-2.5 py-0.5 text-xs font-medium text-white">Admin</span>
          </div>

          <nav className="flex-1 space-y-1 py-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-4 rounded-xl px-6 py-3.5
                  transition-[background-color,color,transform] duration-200 ease-out active:scale-[0.98]
                  ${isActive(item.href)
                    ? 'bg-black text-white font-medium shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                {item.icon}
                <span className="text-base tracking-tight">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="border-t border-gray-100 pt-3">
            <div className="flex items-center gap-3 rounded-xl px-2 py-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">
                {adminEmail ? adminEmail.charAt(0).toUpperCase() : 'A'}
              </span>
              <span className="flex-1 truncate text-sm font-medium text-gray-800">
                {adminEmail ?? 'Loading...'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 rounded-xl px-6 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 mt-1"
            >
              <LogOut size={20} />
              <span className="text-base tracking-tight">Log Out</span>
            </button>
          </div>
        </motion.aside>

        {/* Main content */}
        <motion.main
          key={pathname}
          initial="hidden"
          animate="visible"
          variants={fadeInVariants}
          className="flex-1 min-w-0"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
