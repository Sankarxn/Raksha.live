'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function OfflineSync() {
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncCount, setSyncCount] = useState(0);

  const performSync = async () => {
    const queueStr = localStorage.getItem('raksha_offline_queue');
    if (!queueStr) return;

    try {
      const queue = JSON.parse(queueStr);
      if (!Array.isArray(queue) || queue.length === 0) return;

      setSyncState('syncing');
      setSyncCount(queue.length);
      console.log(`[Offline Sync] Starting sync for ${queue.length} reports...`);

      const failedItems: unknown[] = [];

      for (const payload of queue) {
        try {
          const res = await fetch('/api/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          const data = await res.json();
          if (!data.success) {
            console.error('[Offline Sync] Item failed to sync:', data.error);
            failedItems.push(payload);
          }
        } catch (itemErr) {
          console.error('[Offline Sync] Network post failure for queued item:', itemErr);
          failedItems.push(payload);
        }
      }

      // Update local storage with failed items, or delete queue if empty
      if (failedItems.length > 0) {
        localStorage.setItem('raksha_offline_queue', JSON.stringify(failedItems));
        setSyncState('error');
      } else {
        localStorage.removeItem('raksha_offline_queue');
        setSyncState('success');
      }

      // Trigger standard data reload dispatch
      window.dispatchEvent(new Event('raksha-data-synced'));

      // Hide toast after 4 seconds
      setTimeout(() => {
        setSyncState('idle');
      }, 4000);

    } catch (e) {
      console.error('[Offline Sync] Parsing/processing error:', e);
      setSyncState('idle');
    }
  };

  useEffect(() => {
    // Check sync immediately on mount in case we loaded while online
    if (navigator.onLine) {
      performSync();
    }

    const handleOnlineStatus = () => {
      console.log('[Offline Sync] Connection restored. Triggering database sync...');
      performSync();
    };

    window.addEventListener('online', handleOnlineStatus);
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
    };
  }, []);

  if (syncState === 'idle') return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-[slideUp_0.3s_cubic-bezier(0.175,0.885,0.32,1.275)]">
      <div className={`glass-card rounded-xl p-4 flex items-center gap-3 border shadow-2xl ${
        syncState === 'syncing' ? 'border-blue-500/30 bg-blue-950/20' :
        syncState === 'success' ? 'border-[#16a34a]/30 bg-[#16a34a]/10' : 'border-red-500/30 bg-red-950/20'
      }`}>
        {syncState === 'syncing' && (
          <>
            <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                Syncing Offline Reports...
              </span>
              <span className="text-[10px] text-gray-400 mt-0.5">Uploading {syncCount} reports to server database</span>
            </div>
          </>
        )}

        {syncState === 'success' && (
          <>
            <CheckCircle2 className="w-5 h-5 text-[#16a34a]" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#16a34a]">Sync Complete</span>
              <span className="text-[10px] text-gray-400 mt-0.5">All queued reports synced successfully.</span>
            </div>
          </>
        )}

        {syncState === 'error' && (
          <>
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-red-500">Sync Partial Failure</span>
              <span className="text-[10px] text-gray-400 mt-0.5">Some offline reports could not be synced. Retrying later.</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
