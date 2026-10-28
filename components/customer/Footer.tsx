"use client";

import Link from 'next/link';
import { motion, type Variants } from 'motion/react';
import { ArrowRight } from 'lucide-react';

interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

const columns: FooterColumn[] = [
  {
    title: 'Explore',
    links: [
      { label: 'Stays', href: '/' },
      { label: 'Venues', href: '/?tab=venues' },
      { label: 'My bookings', href: '/bookings' },
    ],
  },
  {
    title: 'For businesses',
    links: [
      { label: 'List your property', href: '/signup' },
      { label: 'Business dashboard', href: '/business-dashboard' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help center', href: '#' },
      { label: 'Contact us', href: '#' },
      { label: 'Safety', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy policy', href: '#' },
      { label: 'Terms of service', href: '#' },
    ],
  },
];

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const riseItem: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', duration: 0.6, bounce: 0 } },
};

const navStagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.02 } },
};

const linkStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const linkItem: Variants = {
  hidden: { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', duration: 0.4, bounce: 0 } },
};

const wordmarkVariant: Variants = {
  hidden: { opacity: 0, y: 40, filter: 'blur(12px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', duration: 1.1, bounce: 0 } },
};

export default function Footer() {
  return (
    <footer className="w-full overflow-hidden rounded-t-[2.5rem] bg-black sm:rounded-t-[3rem]">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        className="px-6 pt-14 sm:px-10 lg:px-14 xl:px-20"
      >
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-10 lg:flex-row lg:gap-16">
          <motion.div variants={riseItem} className="flex shrink-0 flex-col gap-5 lg:max-w-[260px]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-2xl tracking-tight text-white">tusha</span>
            </div>

            <p className="text-sm leading-[1.6] text-gray-400">
              Find and book stays and event spaces, the easy way.
            </p>

            <Link
              href="/signup"
              className="group mt-1 inline-flex w-fit items-center gap-2.5 rounded-full bg-yellow-400 py-0.5 pr-1 pl-5 shadow-[inset_0_2px_0_0_rgba(255,255,255,0.7),inset_0_-1px_0_0_rgba(0,0,0,0.15)] transition-colors duration-200 hover:bg-yellow-500"
            >
              <span className="text-sm font-semibold text-black">List your property</span>
              <span className="flex size-10 items-center justify-center rounded-full bg-black">
                <ArrowRight className="size-4 text-white transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </Link>
          </motion.div>

          <motion.nav
            variants={navStagger}
            aria-label="Footer navigation"
            className="grid w-full max-w-[540px] grid-cols-2 gap-y-8 sm:grid-cols-4"
          >
            {columns.map((col) => (
              <motion.div key={col.title} variants={riseItem}>
                <h3 className="text-sm font-medium tracking-wide text-gray-300">{col.title}</h3>
                <motion.ul variants={linkStagger} className="mt-3 flex flex-col gap-3">
                  {col.links.map((link) => (
                    <motion.li key={link.label} variants={linkItem}>
                      <Link
                        href={link.href}
                        className="inline-block text-sm text-gray-400 transition-colors duration-200 hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.div>
            ))}
          </motion.nav>
        </div>
      </motion.div>

      <motion.div
        variants={wordmarkVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        className="relative flex items-end justify-center overflow-hidden px-4 pt-12 sm:pt-16"
      >
        <div className="flex w-full items-center justify-between border-t border-white/10 pt-6 pb-6 text-xs text-gray-500">
          <span>&copy; {new Date().getFullYear()} tusha. All rights reserved.</span>
        </div>
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 translate-y-1/3 select-none text-[22vw] font-semibold leading-none tracking-tight text-white/5"
        >
          tusha
        </span>
      </motion.div>
    </footer>
  );
}
