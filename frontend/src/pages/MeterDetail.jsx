import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlinePencilAlt,
  HiOutlineTrash,
  HiOutlineChartBar,
} from 'react-icons/hi';
import { meterService } from '../services/meterService';
import { readingService } from '../services/readingService';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';

function MeterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meter, setMeter] = useState(null);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meterRes, readingsRes] = await Promise.all([
          meterService.getById(id),
          readingService.getByMeter(id, { limit: 10 }),
        ]);
        setMeter(meterRes.data);
        setReadings(readingsRes.data.readings || []);
      } catch {
        toast.error('Failed to load meter details');
        navigate('/meters');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleDelete = async () => {
    try {
      await meterService.delete(id);
      toast.success('Meter deleted');
      navigate('/meters');
    } catch {
      toast.error('Failed to delete meter');
    }
  };

  if (loading) return <LoadingSpinner className="mt-20" />;
  if (!meter) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to="/meters"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <HiOutlineArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">{meter.meterNumber}</h1>
          <p className="text-sm text-gray-500">{meter.location}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={meter.status} />
          <Link
            to={`/meters/${id}/edit`}
            className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
          >
            <HiOutlinePencilAlt className="w-5 h-5" />
          </Link>
          <button
            onClick={() => setDeleteTarget(true)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <HiOutlineTrash className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-500 mb-1">Meter Number</p>
          <p className="text-lg font-semibold text-gray-800">{meter.meterNumber}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-500 mb-1">Location</p>
          <p className="text-lg font-semibold text-gray-800">{meter.location}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm text-gray-500 mb-1">Installed Date</p>
          <p className="text-lg font-semibold text-gray-800">
            {meter.installedAt ? new Date(meter.installedAt).toLocaleDateString() : '—'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Readings</h2>
          <Link
            to={`/readings?meterId=${id}`}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View all <HiOutlineChartBar className="w-4 h-4" />
          </Link>
        </div>
        {readings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Value (m³)</th>
                  <th className="px-4 py-3">Recorded At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {readings.map((reading) => (
                  <tr key={reading.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      {Number(reading.value).toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(reading.recordedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">No readings recorded yet</p>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget}
        title="Delete Meter"
        message={`Are you sure you want to delete meter "${meter.meterNumber}"? All associated readings will also be deleted.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(false)}
      />
    </div>
  );
}

export default MeterDetail;
