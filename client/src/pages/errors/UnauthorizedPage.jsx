import React from 'react';
import { Link } from 'react-router-dom';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h1 className="text-4xl font-bold text-yellow-500 mb-2">403</h1>
      <h2 className="text-xl font-semibold mb-4">Unauthorized Access</h2>
      <p className="text-gray-600 mb-6">You do not have the required permissions to view this page.</p>
      <Link to="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Back to Dashboard
      </Link>
    </div>
  );
}
