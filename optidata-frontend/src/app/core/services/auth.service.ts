import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_URL } from '../config';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = `${API_URL}/api/auth`;
  private readonly TOKEN_KEY = 'optidata_token';
  private readonly USER_KEY  = 'optidata_user';

  // Signal reactivo con el usuario actual
  private _user = signal<AuthUser | null>(this.loadUser());
  readonly user   = this._user.asReadonly();
  readonly isAuth = computed(() => this._user() !== null);

  constructor(private http: HttpClient, private router: Router) {}

  login(data: LoginDto): Observable<any> {
    return this.http.post<{ token: string; user: AuthUser }>(`${this.api}/login`, data).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
        this._user.set(res.user);
      })
    );
  }

  register(data: RegisterDto): Observable<any> {
    return this.http.post(`${this.api}/register`, data);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  /** Obtiene los datos del perfil del usuario autenticado */
  getProfile(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.api}/profile`);
  }

  /** Actualiza nombre y email. Actualiza también el signal local */
  updateProfile(data: { name: string; email: string }): Observable<any> {
    return this.http.put<any>(`${this.api}/profile`, data).pipe(
      tap(res => {
        const current = this._user();
        if (current) {
          const updated = { ...current, name: res.user?.name ?? data.name, email: res.user?.email ?? data.email };
          this._user.set(updated);
          localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
        }
      })
    );
  }

  /** Cambia la contraseña validando la contraseña actual */
  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.api}/change-password`, { currentPassword, newPassword });
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.api}/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.api}/reset-password`, { token, password });
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private loadUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
