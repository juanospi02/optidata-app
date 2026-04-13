import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './auth.component.css'
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  form = { password: '', confirmPassword: '' };
  loading = false;
  done = false;
  errorMsg = '';

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.errorMsg = 'El enlace es inválido. Solicita uno nuevo.';
    }
  }

  private isPasswordValid(pwd: string): boolean {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(pwd);
  }

  submit(): void {
    if (!this.form.password || !this.form.confirmPassword) {
      this.errorMsg = 'Completa todos los campos.';
      return;
    }
    if (!this.isPasswordValid(this.form.password)) {
      this.errorMsg = 'La contraseña debe tener al menos una mayúscula, una minúscula, un número y un carácter especial.';
      return;
    }
    if (this.form.password !== this.form.confirmPassword) {
      this.errorMsg = 'Las contraseñas no coinciden.';
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    this.auth.resetPassword(this.token, this.form.password).subscribe({
      next: () => {
        this.done = true;
        this.loading = false;
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        this.errorMsg = err.error?.message ?? 'El enlace es inválido o ha expirado.';
        this.loading = false;
      }
    });
  }
}
