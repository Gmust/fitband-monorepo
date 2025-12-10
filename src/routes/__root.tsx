import { createRootRoute, Outlet, Link } from "@tanstack/react-router";
import { authService } from "../services/auth";

export const Route = createRootRoute({
  component: () => {
    const isAuth = authService.isAuthenticated();
    const user = authService.getUser();

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex space-x-8">
                <Link
                  to="/"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
                >
                  Home
                </Link>
                {isAuth && (
                  <>
                    <Link
                      to="/devices"
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                    >
                      Devices
                    </Link>
                    <Link
                      to="/profile"
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                    >
                      Profile
                    </Link>
                    <Link
                      to="/socket-test"
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
                    >
                      Socket Test
                    </Link>
                  </>
                )}
              </div>
              <div className="flex items-center">
                {isAuth ? (
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-700">{user?.email}</span>
                    <button
                      onClick={() => authService.logout()}
                      className="text-sm font-medium text-gray-500 hover:text-gray-900"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/auth/login"
                    className="text-sm font-medium text-gray-500 hover:text-gray-900"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    );
  },
});
