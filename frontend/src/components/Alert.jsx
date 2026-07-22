import { HiOutlineExclamationCircle, HiOutlineCheckCircle, HiOutlineInformationCircle, HiOutlineX } from 'react-icons/hi';

const variants = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: HiOutlineInformationCircle,
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: HiOutlineCheckCircle,
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: HiOutlineExclamationCircle,
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: HiOutlineExclamationCircle,
  },
};

function Alert({ variant = 'info', title, message, onClose }) {
  const v = variants[variant];
  const Icon = v.icon;

  return (
    <div className={`rounded-lg border p-4 ${v.bg} ${v.border}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${v.text}`} />
        <div className="flex-1">
          {title && <h4 className={`text-sm font-semibold ${v.text}`}>{title}</h4>}
          {message && <p className={`text-sm mt-1 ${v.text}`}>{message}</p>}
        </div>
        {onClose && (
          <button onClick={onClose} className={`p-1 rounded hover:bg-black/5 ${v.text}`}>
            <HiOutlineX className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default Alert;
