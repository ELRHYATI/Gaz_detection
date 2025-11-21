import React, { useEffect, useMemo, useState } from 'react';
import { FiBell, FiTrash2 } from 'react-icons/fi';
import { useI18n } from '../contexts/I18nContext';
import { subscribeToAlertLogs, acknowledgeAlertLog, deleteAlertLog, deleteAllAlertLogs, restoreAlertLog } from '../utils/firebase';
import type { AlertLogEntry } from '../utils/firebase';
import { useLocation, useNavigate } from 'react-router-dom';
import { createSafeStorage, safeJSONStringify, safeJSONParse } from '../utils/storage';

  const Notifications: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<AlertLogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical' | 'danger' | 'warning'>('all');
  // selection removed; bulk actions operate on all notifications
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [isDeletingAll, setIsDeletingAll] = useState<boolean>(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string; actionLabel?: string; onAction?: () => void } | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const storage = React.useMemo(() => createSafeStorage('local', 'alerts:'), []);

  // Persist filters across sessions
  useEffect(() => {
    const persisted = safeJSONParse<{ filter: typeof filter; startDate: string; endDate: string }>(storage.get('filters'));
    if (persisted) {
      setFilter(persisted.filter);
      setStartDate(persisted.startDate);
      setEndDate(persisted.endDate);
    }
  }, [storage]);
  useEffect(() => {
    storage.set('filters', safeJSONStringify({ filter, startDate, endDate }));
  }, [filter, startDate, endDate, storage]);

  useEffect(() => {
    const unsub = subscribeToAlertLogs((logs) => setNotifications(logs), console.error);
    return () => unsub();
  }, []);

  // Track deep link selection via query param ?id=
  useEffect(() => {
    const id = new URLSearchParams(location.search).get('id');
    setSelectedId(id);
    if (id) {
      // auto-scroll into view after DOM paints
      setTimeout(() => {
        const el = document.getElementById(`notif-${id}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [location.search]);

  const timeAgo = (ts?: number) => {
    if (!ts) return ''
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
    const diffMs = ts - Date.now()
    const diffMin = Math.round(diffMs / 60000)
    if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute')
    const diffHour = Math.round(diffMin / 60)
    return rtf.format(diffHour, 'hour')
  }

  const stylesFor = (sev: AlertLogEntry['severity']) => {
    const token = (sev === 'critical')
      ? (localStorage.getItem('palette.critical') ?? 'red')
      : (sev === 'danger')
        ? (localStorage.getItem('palette.danger') ?? 'orange')
        : (localStorage.getItem('palette.warning') ?? 'amber');
    const map = (t: string) => {
      switch (t) {
        case 'red':
          return { badge: 'bg-red-100 dark:bg-red-900/40', icon: 'text-red-600 dark:text-red-400' };
        case 'orange':
          return { badge: 'bg-orange-100 dark:bg-orange-900/40', icon: 'text-orange-600 dark:text-orange-400' };
        case 'amber':
        default:
          return { badge: 'bg-amber-100 dark:bg-amber-900/40', icon: 'text-amber-600 dark:text-amber-400' };
      }
    };
    return map(token);
  }

  const displayed = useMemo(() => {
    let list = notifications;
    switch (filter) {
      case 'unread':
        list = list.filter((n) => !n.acknowledged);
        break;
      case 'critical':
        list = list.filter((n) => n.severity === 'critical');
        break;
      case 'danger':
        list = list.filter((n) => n.severity === 'danger');
        break;
      case 'warning':
        list = list.filter((n) => n.severity === 'warning');
        break;
      default:
        break;
    }
    const startMs = startDate ? new Date(`${startDate}T00:00:00`).getTime() : undefined;
    const endMs = endDate ? new Date(`${endDate}T23:59:59.999`).getTime() : undefined;
    if (startMs || endMs) {
      list = list.filter((n) => {
        const ts = n.timestamp || 0;
        if (startMs && ts < startMs) return false;
        if (endMs && ts > endMs) return false;
        return true;
      });
    }
    return list;
  }, [notifications, filter, startDate, endDate]);

  const markAllRead = async () => {
    const ids = notifications.filter((n) => !n.acknowledged && n.id).map((n) => n.id!)
    // optimistic update
    setNotifications((prev) => prev.map((n) => (n.id && ids.includes(n.id)) ? { ...n, acknowledged: true } : n))
    await Promise.all(ids.map((id) => acknowledgeAlertLog(id)))
  };

  const deleteAll = async () => {
    if (notifications.length === 0) return;
    setIsDeletingAll(true);
    const previous = notifications;
    // optimistic clear
    setNotifications([]);
    try {
      await deleteAllAlertLogs();
      setToast({ type: 'success', message: 'All notifications deleted.' });
      try { (alertsChannel as any)?.postMessage?.({ type: 'deleted_all' }); } catch {}
    } catch (err) {
      // rollback on error
      setNotifications(previous);
      setToast({ type: 'error', message: 'Failed to delete all notifications. Please try again.' });
    } finally {
      setIsDeletingAll(false);
    }
  };

  // BroadcastChannel to notify global header about deletes/acks immediately
  const [alertsChannel] = useState(() => {
    try {
      return new (window as any).BroadcastChannel('alerts');
    } catch {
      return null;
    }
  });
  useEffect(() => {
    return () => { try { (alertsChannel as any)?.close?.(); } catch {} };
  }, [alertsChannel]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <FiBell className="h-6 w-6" />
            <span>{t('notifications.title', 'Notifications')}</span>
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">View and manage recent alerts.</p>
        </div>
      </div>

      {/* Filters & bulk actions */}
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          {(['all','unread','critical','danger','warning'] as const).map((key) => (
            <button
              key={key}
              className={`px-3 py-1.5 text-sm ${filter === key ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300'} border-r border-gray-200 dark:border-gray-700 last:border-r-0`}
              onClick={() => setFilter(key)}
            >
              {key === 'all' ? 'All' : key === 'unread' ? 'Unread' : key === 'critical' ? 'Critical' : key === 'danger' ? 'Danger' : 'Warning'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field text-sm bg-white/70 dark:bg-gray-800"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field text-sm bg-white/70 dark:bg-gray-800"
            />
            {(startDate || endDate) && (
              <button
                className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                onClick={() => { setStartDate(''); setEndDate(''); }}
              >
                Clear
              </button>
            )}
          </div>
          <button
            className="text-sm px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
            onClick={markAllRead}
          >
            Mark all as read
          </button>
          <button
            className="text-sm px-3 py-1.5 rounded bg-danger-50 dark:bg-danger-900/30 hover:bg-danger-100 dark:hover:bg-danger-800 text-danger-700 dark:text-danger-300"
            onClick={() => setConfirmOpen(true)}
          >
            Delete all
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {displayed.length === 0 ? (
          <div className="p-4 text-sm text-gray-600 dark:text-gray-300">No notifications</div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {displayed.map((n) => {
              const styles = stylesFor(n.severity)
              const title = n.message || `${n.parameter.toUpperCase()} ${n.severity}`
              return (
                <li
                  id={n.id ? `notif-${n.id}` : undefined}
                  key={n.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${selectedId === n.id ? 'bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-300 dark:ring-primary-700' : ''} ${n.id && removingIds.has(n.id) ? 'opacity-0 scale-95 transition ease-out duration-200' : ''}`}
                  onClick={() => { if (n.id) navigate(`/notifications?id=${encodeURIComponent(n.id)}`); }}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${styles.badge}`}>
                      <FiBell className={`h-5 w-5 ${styles.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{n.location || ''}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{timeAgo(n.timestamp)}</p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      {!n.acknowledged ? (
                        <button
                          className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                          onClick={(e) => { e.stopPropagation(); if (n.id) { acknowledgeAlertLog(n.id); try { (alertsChannel as any)?.postMessage?.({ type: 'acknowledged', id: n.id }); } catch {} } }}
                        >
                          Mark read
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Read</span>
                      )}
                      {n.id && (
                        <button
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-danger-50 dark:bg-danger-900/30 hover:bg-danger-100 dark:hover:bg-danger-800 text-danger-700 dark:text-danger-300"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const id = n.id!;
                            const entry = n;
                            // animate out then remove
                            setRemovingIds((prev) => new Set(prev).add(id));
                            setTimeout(() => {
                              setNotifications((prev) => prev.filter((x) => x.id !== id));
                            }, 250);
                            try {
                              await deleteAlertLog(id);
                              setToast({
                                type: 'info',
                                message: 'Notification deleted.',
                                actionLabel: 'Undo',
                                onAction: async () => {
                                  try {
                                    await restoreAlertLog(entry);
                                    setNotifications((prev) => [entry, ...prev]);
                                    setToast({ type: 'success', message: 'Notification restored.' });
                                  } catch {
                                    setToast({ type: 'error', message: 'Failed to restore notification.' });
                                  }
                                },
                              });
                              try { (alertsChannel as any)?.postMessage?.({ type: 'deleted', id }); } catch {}
                            } catch {
                              setToast({ type: 'error', message: 'Failed to delete notification.' });
                              // rollback remove animation
                              setRemovingIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
                            }
                          }}
                          aria-label="Delete notification"
                        >
                          <FiTrash2 className="h-3 w-3" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 w-[min(90vw,420px)]" role="dialog" aria-modal="true" aria-labelledby="confirm-delete-title">
            <h3 id="confirm-delete-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">Confirm delete</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
              Are you sure you want to delete {notifications.length} notification{notifications.length !== 1 ? 's' : ''}? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200"
                onClick={() => setConfirmOpen(false)}
                >
                Cancel
              </button>
              <button
                className={`px-3 py-1.5 rounded bg-danger-600 text-white hover:bg-danger-700 inline-flex items-center gap-2 ${isDeletingAll ? 'opacity-75 cursor-not-allowed' : ''}`}
                onClick={async () => { if (isDeletingAll) return; await deleteAll(); setConfirmOpen(false); }}
                aria-busy={isDeletingAll}
              >
                {isDeletingAll && (<span className="inline-block h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></span>)}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Toast */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50" aria-live="polite" aria-atomic="true">
        {toast && (
          <div className={`px-4 py-2 rounded shadow-md border text-sm ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
            <div className="flex items-center gap-3">
              <span>{toast.message}</span>
              {toast.actionLabel && toast.onAction && (
                <button className="text-primary-600 hover:text-primary-700 font-medium" onClick={() => { const cb = toast?.onAction; setToast(null); cb && cb(); }}>
                  {toast.actionLabel}
                </button>
              )}
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setToast(null)} aria-label="Dismiss notification">✕</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;