import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  public currentUser = signal<any>(null);

  // Dynamic API URL mapping
  private get apiUrl(): string {
    const isProd = ('__PRODUCTION__' as string) === 'true';
    if (isProd) {
      return '/api';
    }
    return '/api';
  }

  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, { withCredentials: true });
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, body, { withCredentials: true });
  }

  // --- Auth Methods ---
  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(user => this.currentUser.set(user))
    );
  }

  // Redirect-based Google Login
  loginWithGoogle(returnTo: string = '/dashboard'): void {
    window.location.href = `${this.apiUrl}/auth/google?returnTo=${encodeURIComponent(returnTo)}`;
  }

  checkStatus(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auth/user`, { withCredentials: true }).pipe(
      tap(user => this.currentUser.set(user)),
      catchError(() => {
        this.currentUser.set(null);
        return of(null);
      })
    );
  }

  logout(): void {
    this.http.get(`${this.apiUrl}/auth/logout`, { withCredentials: true }).subscribe();
    this.currentUser.set(null);
    localStorage.removeItem('checkout_tier');
    localStorage.removeItem('member_email');
  }
}
