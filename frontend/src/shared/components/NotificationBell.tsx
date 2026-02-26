import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
}

interface NotificationBellProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}

export function NotificationBell({
  notifications,
  onMarkAsRead,
  onClearAll,
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-md p-2 hover:bg-gray-100"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-200 p-3">
            <h3 className="font-medium text-gray-900">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => onMarkAsRead(notification.id)}
                  className={cn(
                    'block w-full border-b border-gray-200 p-3 text-left hover:bg-gray-50',
                    !notification.isRead && 'bg-blue-50'
                  )}
                >
                  <p className="font-medium text-gray-900">{notification.title}</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {notification.message}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
