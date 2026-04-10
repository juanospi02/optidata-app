import { Routes } from '@angular/router';
import { authGuard }   from './core/guards/auth.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';
import { LoginComponent }           from './features/auth/login.component';
import { RegisterComponent }        from './features/auth/register.component';
import { ForgotPasswordComponent }  from './features/auth/forgot-password.component';
import { ResetPasswordComponent }   from './features/auth/reset-password.component';
import { DashboardComponent }     from './features/dashboard/dashboard.component';
import { ProductsComponent }      from './features/products/products.component';
import { CreateProductComponent } from './features/create-product/create-product.component';
import { ProfileComponent }       from './features/profile/profile.component';
import { LandingComponent }       from './features/landing/landing.component';

export const routes: Routes = [
  // Página de inicio pública (landing)
  { path: 'inicio', component: LandingComponent },

  // Públicas (solo sin sesión)
  { path: 'login',            component: LoginComponent,          canActivate: [noAuthGuard] },
  { path: 'register',         component: RegisterComponent,        canActivate: [noAuthGuard] },
  { path: 'forgot-password',  component: ForgotPasswordComponent,  canActivate: [noAuthGuard] },
  { path: 'reset-password',   component: ResetPasswordComponent,   canActivate: [noAuthGuard] },

  // Privadas (requieren sesión)
  { path: 'dashboard',      component: DashboardComponent,     canActivate: [authGuard] },
  { path: 'productos',      component: ProductsComponent,      canActivate: [authGuard] },
  { path: 'crear-producto', component: CreateProductComponent, canActivate: [authGuard] },
  { path: 'perfil',         component: ProfileComponent,       canActivate: [authGuard] },

  { path: '',  redirectTo: 'inicio', pathMatch: 'full' },
  { path: '**', redirectTo: 'inicio' }
];
