import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineChip,
  HiOutlineChartBar,
  HiOutlineBell,
  HiOutlineUsers,
  HiOutlineArrowRight,
} from 'react-icons/hi';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { dashboardService } from '../services/dashboardService';
import { useAuth } from '../context/AuthContext';

function Home() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentReadings, setRecentReadings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, readingsRes] = await Promise.allSettled([
          dashboardService.getStats(),
          dashboardService.getRecentReadings({ limit: 5 }),
        ]);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        if (readingsRes.status === 'fulfilled') setRecentReadings(readingsRes.value.data || []);
      } catch {
        // Use default values
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner className="mt-20" />;
  }

  return (
    <div className="space-y-6">
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 md:p-8 text-white">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">
          Welcome back, {user?.fullName?.split(' ')[0] || 'User'}
        </h2>
        <p className="text-blue-100 text-sm md:text-base">
          Here's an overview of your water management system.
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Meters"
          value={stats?.totalMeters ?? '—'}
          icon={HiOutlineChip}
          color="blue"
        />
        <StatCard
          title="Active Meters"
          value={stats?.activeMeters ?? '—'}
          icon={HiOutlineChartBar}
          color="green"
        />
        <StatCard
          title="Notifications"
          value={stats?.unreadNotifications ?? '—'}
          icon={HiOutlineBell}
          color="yellow"
        />
        <StatCard
          title="Users"
          value={stats?.totalUsers ?? '—'}
          icon={HiOutlineUsers}
          color="purple"
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Recent Readings</h3>
            <Link
              to="/readings"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View all <HiOutlineArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {recentReadings.length > 0 ? (
            <div className="space-y-3">
              {recentReadings.map((reading) => (
                <div key={reading.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      Meter {reading.meter?.meterNumber || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(reading.recordedAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">
                    {Number(reading.value).toFixed(2)} m³
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">No readings yet</p>
          )}
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/meters"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors text-center"
            >
              <HiOutlineChip className="w-8 h-8 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Manage Meters</span>
            </Link>
            <Link
              to="/readings"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-colors text-center"
            >
              <HiOutlineChartBar className="w-8 h-8 text-green-600" />
              <span className="text-sm font-medium text-green-800">View Readings</span>
            </Link>
            <Link
              to="/notifications"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-yellow-50 hover:bg-yellow-100 transition-colors text-center"
            >
              <HiOutlineBell className="w-8 h-8 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Notifications</span>
            </Link>
            {user?.role?.name === 'ADMIN' && (
              <Link
                to="/users"
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors text-center"
              >
                <HiOutlineUsers className="w-8 h-8 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Manage Users</span>
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home;
