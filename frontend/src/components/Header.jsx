import { HiOutlineBell, HiOutlineMenu } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

function Header({ onMenuClick }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    notificationService.getUnreadCount()
      .then(res => setUnreadCount(res.data.count))
      .catch(() => {});
  }, []);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-20">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-500 hover:text-gray-700"
        >
          <HiOutlineMenu className="w-6 h-6" />
        </button>

        <div className="hidden md:block">
          <h2 className="text-lg font-semibold text-gray-800">
            Welcome, {user?.fullName?.split(' ')[0] || 'User'}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/notifications"
            className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <HiOutlineBell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <Link
            to="/profile"
            className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">
                {user?.fullName?.charAt(0) || 'U'}
              </span>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
