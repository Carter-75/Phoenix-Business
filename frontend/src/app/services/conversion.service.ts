import { Injectable } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class ConversionService {
  private seen = new Set<string>();
  private send(label: string, id: string, value: number, currency: string) {
    if (!id || !Number.isFinite(value) || value < 0) return;
    const key = 'phoenix_conversion_' + label + '_' + id;
    if (this.seen.has(key)) return;
    try { if (localStorage.getItem(key)) return; } catch { /* Storage is optional. Google also deduplicates transaction IDs. */ }
    const w = window as Window & { gtag?: (...args: unknown[]) => void };
    if (!w.gtag) return;
    w.gtag('event', 'conversion', { send_to: 'AW-18440324740/' + label,
      transaction_id: id, value, currency });
    this.seen.add(key);
    try { localStorage.setItem(key, 'sent'); } catch { /* Keep the in-memory guard. */ }
  }
  lead(id: string) { this.send('B0N5CNP4wPMcEISNhNlE', id, 0, 'USD'); }
  purchase(payment: { paid: boolean; live: boolean; transactionId: string; value: number; currency: string }) {
    if (payment.paid && payment.live && payment.value > 0) this.send('dVihCNb4wPMcEISNhNlE', payment.transactionId, payment.value, payment.currency);
  }
}
