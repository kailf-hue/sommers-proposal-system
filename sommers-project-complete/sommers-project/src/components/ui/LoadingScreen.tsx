/**
 * Loading Screen Component
 * Full-screen loading indicator
 */

import { motion } from 'framer-motion';

export default function LoadingScreen() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        {/* Logo */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-brand-red shadow-lg">
          <svg
            className="h-10 w-10 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>

        {/* Spinner */}
        <div className="relative mx-auto h-12 w-12">
          <div className="absolute h-full w-full animate-spin rounded-full border-4 border-gray-200 border-t-brand-red" />
        </div>

        {/* Text */}
        <p className="mt-6 text-sm font-medium text-gray-600 dark:text-gray-400">
          Loading...
        </p>
      </motion.div>
    </div>
  );
}
