import { ScanResultEvent } from '../types';

export function subscribeToEvents(
  onScanEvent: (data: ScanResultEvent) => void,
  onPartyUpdated?: (data: any) => void,
  onBuffChanged?: (data: any) => void
): () => void {
  const isPublic = window.location.pathname.includes('/tv');
  const token = localStorage.getItem('gremio_token') || '';

  if (!isPublic && !token) {
    return () => {};
  }

  const url = isPublic ? '/api/v1/public/events' : `/api/v1/player/events?token=${encodeURIComponent(token)}`;
  const eventSource = new EventSource(url);

  eventSource.onerror = () => {
    if (eventSource.readyState === EventSource.CLOSED) return;
    eventSource.close();
  };

  eventSource.addEventListener('scan_event', (e: MessageEvent) => {
    try {
      const data: ScanResultEvent = JSON.parse(e.data);
      onScanEvent(data);
    } catch (err) {
      console.error('Error parsing scan_event:', err);
    }
  });

  if (onPartyUpdated) {
    eventSource.addEventListener('party_updated', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        onPartyUpdated(data);
      } catch (err) {}
    });
  }

  if (onBuffChanged) {
    eventSource.addEventListener('tavern_buff_changed', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        onBuffChanged(data);
      } catch (err) {}
    });
  }

  return () => {
    eventSource.close();
  };
}
