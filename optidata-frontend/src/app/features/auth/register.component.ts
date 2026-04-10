import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './auth.component.css'
})
export class RegisterComponent {
  form = { name: '', email: '', password: '', confirmPassword: '' };
  loading = false;
  errorMsg = '';

  constructor(
    private auth: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  submit(): void {
    if (!this.form.name || !this.form.email || !this.form.password) {
      this.errorMsg = 'Completa todos los campos.';
      return;
    }
    if (this.form.password.length < 6) {
      this.errorMsg = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }
    if (this.form.password !== this.form.confirmPassword) {
      this.errorMsg = 'Las contraseñas no coinciden.';
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    this.auth.register({
      name: this.form.name.trim(),
      email: this.form.email.trim(),
      password: this.form.password
    }).subscribe({
      next: () => {
        this.toast.success('Cuenta creada. Ahora inicia sesión.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.errorMsg = err.error?.message ?? 'Error al registrarse.';
        this.loading = false;
      }
    });
  }
}
