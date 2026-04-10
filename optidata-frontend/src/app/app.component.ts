import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { ToastComponent } from './shared/toast/toast.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  auth   = inject(AuthService);
  router = inject(Router);

  // Páginas que no muestran el navbar (auth + landing)
  private noNavRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/inicio', '/'];

  private isNoNavUrl(url: string): boolean {
    return this.noNavRoutes.includes(url) || url.startsWith('/inicio');
  }

  // Oculta el navbar en páginas de auth y en la landing.
  // El initialValue usa la URL actual para evitar el parpadeo en primera carga.
  isAuthPage = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => this.isNoNavUrl((e as NavigationEnd).urlAfterRedirects))
    ),
    { initialValue: this.isNoNavUrl(this.router.url) }
  );

  logout(): void {
    this.auth.logout();
  }
}
