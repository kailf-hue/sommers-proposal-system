/**
 * Portal Layout
 * Layout for public client portal pages
 */

import { Outlet, Link } from 'react-router-dom';
import { FileText, Phone, Mail } from 'lucide-react';

export default function PortalLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-brand-red flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Sommer's Sealcoating
                </h1>
                <p className="text-xs text-gray-500">Professional Proposals</p>
              </div>
            </Link>

            {/* Contact Info */}
            <div className="hidden sm:flex items-center gap-6">
              <a
                href="tel:+15551234567"
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-brand-red"
              >
                <Phone className="h-4 w-4" />
                (555) 123-4567
              </a>
              <a
                href="mailto:info@sommersealcoating.com"
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-brand-red"
              >
                <Mail className="h-4 w-4" />
                info@sommersealcoating.com
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-brand-charcoal text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-brand-red flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold">Sommer's Sealcoating</span>
              </div>
              <p className="text-gray-400 text-sm">
                Professional asphalt maintenance and sealcoating services.
                Quality work, competitive prices.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold mb-4">Contact Us</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <p>123 Industrial Way</p>
                <p>Toledo, OH 43612</p>
                <p>(555) 123-4567</p>
                <p>info@sommersealcoating.com</p>
              </div>
            </div>

            {/* Hours */}
            <div>
              <h3 className="font-semibold mb-4">Business Hours</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <p>Monday - Friday: 7am - 6pm</p>
                <p>Saturday: 8am - 4pm</p>
                <p>Sunday: Closed</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
            <p>
              © {new Date().getFullYear()} Sommer's Sealcoating. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
