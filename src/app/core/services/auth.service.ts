import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/product.model';

const TOKEN_KEY = 'kk_auth_token';

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

export interface MeResponse {
  user: User;
  firstOrderDiscountAvailable: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = `${environment.apiBaseUrl}/auth`;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private firstOrderDiscountSubject = new BehaviorSubject<boolean>(false);
  private initializedSubject = new BehaviorSubject<boolean>(false);

  readonly currentUser$ = this.currentUserSubject.asObservable();
  readonly firstOrderDiscountAvailable$ = this.firstOrderDiscountSubject.asObservable();
  readonly initialized$ = this.initializedSubject.asObservable();

  constructor(private http: HttpClient) {
    this.restoreSession();
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get isLoggedIn(): boolean {
    return !!this.token && !!this.currentUserSubject.value;
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  register(name: string, email: string, password: string, phone: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/register`, { name, email, password, phone }).pipe(
      tap((res) => this.setSession(res))
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, { email, password }).pipe(
      tap((res) => this.setSession(res))
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.currentUserSubject.next(null);
    this.firstOrderDiscountSubject.next(false);
  }

  refreshProfile(): Observable<MeResponse | null> {
    if (!this.token) return of(null);
    return this.http.get<MeResponse>(`${this.base}/me`).pipe(
      tap((res) => {
        this.currentUserSubject.next(res.user);
        this.firstOrderDiscountSubject.next(res.firstOrderDiscountAvailable);
      }),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  private setSession(res: AuthResponse) {
    localStorage.setItem(TOKEN_KEY, res.token);
    this.currentUserSubject.next(res.user);
    // A freshly registered/logged-in user with no orders yet is first-order eligible;
    // refreshProfile() will correct this from the server right after.
    this.firstOrderDiscountSubject.next(true);
    this.refreshProfile().subscribe();
  }

  private restoreSession() {
    if (!this.token) {
      this.initializedSubject.next(true);
      return;
    }
    this.refreshProfile().subscribe(() => this.initializedSubject.next(true));
  }
}
