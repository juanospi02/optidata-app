import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './auth.component.css'
})
export class LoginComponent {
  form = { email: '', password: '' };
  loading = false;
  errorMsg = '';

  constructor(
    private auth: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  submit(): void {
    if (!this.form.email || !this.form.password) {
      this.errorMsg = 'Completa todos los campos.';
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    this.auth.login(this.form).subscribe({
      next: () => {
        this.toast.success('Sesión iniciada correctamente.');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.errorMsg = err.error?.message ?? 'Credenciales inválidas.';
        this.loading = false;
      }
    });
  }
}
