import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './auth.component.css'
})
export class ForgotPasswordComponent {
  email = '';
  loading = false;
  sent = false;
  errorMsg = '';

  constructor(private auth: AuthService) {}

  submit(): void {
    if (!this.email.trim()) {
      this.errorMsg = 'Ingresa tu correo electrónico.';
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    this.auth.forgotPassword(this.email.trim()).subscribe({
      next: () => {
        this.sent = true;
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = err.error?.message ?? 'Error al procesar la solicitud.';
        this.loading = false;
      }
    });
  }
}
