"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { CalendarCheck, CalendarRange, Home, UserPlus, ArrowRight } from 'lucide-react';
import { API_URL } from '@/lib/api';
import { fadeInVariants, staggerContainerVariants } from '@/lib/motion';

interface AdminStats {
  pendingProperties: number;
  pendingBusinesses: number;
  bookingsToday: number;
  bookingsThisWeek: number;
  activeProperties: number;
  newSignupsThisWeek: number;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/admin/stats`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setStats(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-4xl font-semibold tracking-tight text-gray-900">Overview</h1>
      <p className="mt-1 text-sm text-gray-500">What needs your attention right now.</p>

      {loading ? (
        <p className="mt-8 text-gray-500">Loading...</p>
      ) : !stats ? (
        <p className="mt-8 text-gray-500">Couldn&apos;t load stats.</p>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={staggerContainerVariants} className="mt-8 space-y-6">
          {/* Action queue */}
          <motion.div variants={fadeInVariants} className="grid grid-cols-2 gap-6">
            <Link
              href="/admin/properties"
              className="group bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-8 flex items-center justify-between transition-colors hover:bg-yellow-100"
            >
              <div>
                <p className="text-sm font-medium text-gray-600">Properties awaiting approval</p>
                <p className="mt-2 text-5xl font-semibold tracking-tight">{stats.pendingProperties}</p>
              </div>
              <ArrowRight className="text-gray-500 transition-transform group-hover:translate-x-1" size={28} />
            </Link>

            <Link
              href="/admin/businesses"
              className="group bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-8 flex items-center justify-between transition-colors hover:bg-yellow-100"
            >
              <div>
                <p className="text-sm font-medium text-gray-600">Businesses awaiting verification</p>
                <p className="mt-2 text-5xl font-semibold tracking-tight">{stats.pendingBusinesses}</p>
              </div>
              <ArrowRight className="text-gray-500 transition-transform group-hover:translate-x-1" size={28} />
            </Link>
          </motion.div>

          {/* Simple counts */}
          <motion.div variants={fadeInVariants} className="grid grid-cols-4 gap-6">
            <StatCard title="Bookings Today" value={stats.bookingsToday} icon={<CalendarCheck size={28} />} />
            <StatCard title="Bookings This Week" value={stats.bookingsThisWeek} icon={<CalendarRange size={28} />} />
            <StatCard title="Active Properties" value={stats.activeProperties} icon={<Home size={28} />} />
            <StatCard title="New Signups This Week" value={stats.newSignupsThisWeek} icon={<UserPlus size={28} />} />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-white rounded-2xl shadow-xl shadow-black/5 ring-1 ring-black/5 p-6">
    <div className="flex items-center justify-between mb-4 text-gray-400">
      <span className="text-sm font-medium text-gray-500">{title}</span>
      {icon}
    </div>
    <p className="text-4xl font-semibold tracking-tight">{value}</p>
  </div>
);
