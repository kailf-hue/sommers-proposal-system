/**
 * Auth Layout
 * Layout for authentication pages (sign in, sign up, etc.)
 */

import { Outlet, Link } from 'react-router-dom';
import { FileText } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-charcoal to-gray-900 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-red/10 items-center justify-center p-12">
        <div className="max-w-md text-center">
          {/* Logo */}
          <div className="mb-8">
            <div className="mx-auto h-20 w-20 rounded-2xl bg-brand-red flex items-center justify-center shadow-lg shadow-brand-red/30">
              <FileText className="h-10 w-10 text-white" />
            </div>
          </div>

          {/* Tagline */}
          <h1 className="text-4xl font-bold text-white mb-4">
            Sommer's Sealcoating
          </h1>
          <p className="text-lg text-gray-300 mb-8">
            Professional Proposal & CRM System
          </p>

          {/* Features */}
          <div className="space-y-4 text-left">
            {[
              'Create professional proposals in minutes',
              'Track client interactions & deals',
              'Schedule jobs with weather integration',
              'Get paid faster with integrated payments',
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-brand-red" />
                <span className="text-gray-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-brand-red flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Sommer's</span>
            </Link>
          </div>

          {/* Auth Content */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <Outlet />
          </div>

          {/* Footer Links */}
          <div className="mt-6 text-center text-sm text-gray-400">
            <a href="https://sommersealcoating.com" className="hover:text-white">
              © {new Date().getFullYear()} Sommer's Sealcoating
            </a>
            <span className="mx-2">·</span>
            <a href="/privacy" className="hover:text-white">Privacy</a>
            <span className="mx-2">·</span>
            <a href="/terms" className="hover:text-white">Terms</a>
          </div>
        </div>
      </div>
    </div>
  );
}
