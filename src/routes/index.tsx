import { createFileRoute, Link } from '@tanstack/react-router';
import { authService } from '../services/auth';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const isAuth = authService.isAuthenticated();

  return (
    <div className="px-4 py-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Mock Fitband Device Dashboard
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          IoT fitness band simulator and monitoring platform
        </p>
        {isAuth ? (
          <div className="space-x-4">
            <Link
              to="/devices"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              View Devices
            </Link>
            <Link
              to="/profile"
              className="inline-block bg-gray-200 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-300"
            >
              My Profile
            </Link>
          </div>
        ) : (
          <div className="space-x-4">
            <Link
              to="/auth/login"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Login
            </Link>
            <Link
              to="/auth/register"
              className="inline-block bg-gray-200 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-300"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

