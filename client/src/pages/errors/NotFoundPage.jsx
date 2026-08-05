import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h1 className="text-4xl font-bold text-red-500 mb-2">404</h1>
      <h2 className="text-xl font-semibold mb-4">Page Not Found</h2>
      <p className="text-gray-600 mb-6">The requested page does not exist or has been moved.</p>
      <Link to="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Go to Dashboard
      </Link>
    </div>
  );
}
