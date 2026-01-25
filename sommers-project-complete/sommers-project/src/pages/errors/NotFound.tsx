/**
 * 404 Not Found Page
 */

import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="mt-4 text-gray-500">Page not found</p>
        <Link to="/" className="mt-6 inline-block text-brand-red hover:underline">
          Go home
        </Link>
      </div>
    </div>
  );
}
