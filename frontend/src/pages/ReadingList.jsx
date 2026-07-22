import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineSearch } from 'react-icons/hi';
import { readingService } from '../services/readingService';
import { meterService } from '../services/meterService';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

function ReadingList() {
  const [searchParams] = useSearchParams();
  const initialMeterId = searchParams.get('meterId') || '';

  const [readings, setReadings] = useState([]);
  const [meters, setMeters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [meterFilter, setMeterFilter] = useState(initialMeterId);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    meterService.getAll({ limit: 100 })
      .then(res => { if (!ignore) setMeters(res.data.meters || []); })
      .catch(() => {});
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    let ignore = false;
    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    const params = { page, limit: 10 };
    if (meterFilter) params.meterId = meterFilter;
    readingService.getAll(params)
      .then(res => {
        if (!ignore) {
          setReadings(res.data.readings || []);
          setTotalPages(res.data.totalPages || 1);
        }
      })
      .catch(() => { if (!ignore) toast.error('Failed to load readings'); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [page, meterFilter, refreshKey]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Water Readings</h1>
          <p className="text-sm text-gray-500">Track water consumption data</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <HiOutlinePlus className="w-5 h-5" />
          Add Reading
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <select
                value={meterFilter}
                onChange={(e) => { setMeterFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">All Meters</option>
                {meters.map((m) => (
                  <option key={m.id} value={m.id}>{m.meterNumber} — {m.location}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner className="py-12" />
        ) : readings.length === 0 ? (
          <EmptyState
            icon={HiOutlineSearch}
            title="No readings found"
            message="Record your first water meter reading."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Meter</th>
                    <th className="px-4 py-3">Value (m³)</th>
                    <th className="px-4 py-3">Recorded At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {readings.map((reading) => (
                    <tr key={reading.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-800">
                          {reading.meter?.meterNumber || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-gray-800">
                          {Number(reading.value).toFixed(4)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {new Date(reading.recordedAt).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-gray-100">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>

      {showForm && (
        <ReadingForm
          meters={meters}
          initialMeterId={meterFilter}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); setRefreshKey(k => k + 1); }}
        />
      )}
    </div>
  );
}

function ReadingForm({ meters, initialMeterId, onClose, onSaved }) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      meterId: initialMeterId || '',
      value: '',
      recordedAt: new Date().toISOString().slice(0, 16),
    },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await readingService.create({
        ...data,
        value: parseFloat(data.value),
        recordedAt: new Date(data.recordedAt).toISOString(),
      });
      toast.success('Reading recorded');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record reading');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Reading</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meter</label>
            <select
              {...register('meterId', { required: 'Meter is required' })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            >
              <option value="">Select a meter</option>
              {meters.map((m) => (
                <option key={m.id} value={m.id}>{m.meterNumber} — {m.location}</option>
              ))}
            </select>
            {errors.meterId && <p className="text-red-500 text-xs mt-1">{errors.meterId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Value (m³)</label>
            <input
              type="number"
              step="0.0001"
              {...register('value', { required: 'Value is required', min: { value: 0, message: 'Must be positive' } })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              placeholder="0.0000"
            />
            {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recorded At</label>
            <input
              type="datetime-local"
              {...register('recordedAt', { required: 'Date is required' })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
            {errors.recordedAt && <p className="text-red-500 text-xs mt-1">{errors.recordedAt.message}</p>}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : 'Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReadingList;
