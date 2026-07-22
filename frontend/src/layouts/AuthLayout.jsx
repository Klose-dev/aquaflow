import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">AquaFlow</h1>
          <p className="text-blue-100 mt-2">Smart Water Management System</p>
        </div>
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <Outlet />
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

export default AuthLayout;
