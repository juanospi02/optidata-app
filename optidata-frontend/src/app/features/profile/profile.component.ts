/**
 * features/profile/profile.component.ts — Perfil de usuario
 *
 * Permite al usuario autenticado:
 *  - Ver y editar su nombre y correo (auto-guardado al perder el foco)
 *  - Cambiar su contraseña (con validación de contraseña actual)
 *
 * Auto-save: cuando el usuario deja de editar un campo (blur),
 * se espera 400ms y si hubo cambios se guarda automáticamente en la BD.
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {

  // ── Datos del perfil ─────────────────────────────────────────
  profile = { name: '', email: '' };
  originalProfile = { name: '', email: '' }; // Para detectar cambios reales
  profileSaving = false;
  profileSaved  = false;
  private saveTimer: any;

  // ── Cambio de contraseña ─────────────────────────────────────
  passwords = { current: '', new: '', confirm: '' };
  passwordLoading = false;
  showCurrentPwd  = false;
  showNewPwd      = false;

  constructor(
    public auth: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    // Cargar datos frescos del servidor al entrar a la página
    this.auth.getProfile().subscribe({
      next: (data) => {
        this.profile = { name: data.name, email: data.email };
        this.originalProfile = { ...this.profile };
      },
      error: () => this.toast.error('No se pudo cargar el perfil.')
    });
  }

  // ── Auto-save al perder foco ─────────────────────────────────
  /**
   * Se llama en el evento (blur) de cada campo del perfil.
   * Espera 400ms y guarda solo si hubo cambios reales.
   */
  onProfileBlur(): void {
    clearTimeout(this.saveTimer);

    // Solo guardar si algo cambió respecto al valor original
    const changed = this.profile.name  !== this.originalProfile.name ||
                    this.profile.email !== this.originalProfile.email;
    if (!changed) return;

    this.saveTimer = setTimeout(() => this.saveProfile(), 400);
  }

  saveProfile(): void {
    if (!this.profile.name.trim() || !this.profile.email.trim()) return;

    this.profileSaving = true;
    this.profileSaved  = false;

    this.auth.updateProfile(this.profile).subscribe({
      next: () => {
        this.originalProfile = { ...this.profile }; // Actualizar baseline
        this.profileSaving = false;
        this.profileSaved  = true;
        // El toast es discreto — solo mostrar el indicador visual en el campo
        setTimeout(() => this.profileSaved = false, 3000);
      },
      error: (err) => {
        this.toast.error(err.error?.message ?? 'Error al guardar el perfil.');
        this.profileSaving = false;
      }
    });
  }

  // ── Cambio de contraseña ─────────────────────────────────────
  submitPasswordChange(): void {
    if (!this.passwords.current || !this.passwords.new || !this.passwords.confirm) {
      this.toast.warning('Completa todos los campos de contraseña.');
      return;
    }
    if (this.passwords.new.length < 6) {
      this.toast.warning('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (this.passwords.new !== this.passwords.confirm) {
      this.toast.warning('Las contraseñas no coinciden.');
      return;
    }

    this.passwordLoading = true;

    this.auth.changePassword(this.passwords.current, this.passwords.new).subscribe({
      next: () => {
        this.toast.success('Contraseña actualizada correctamente.');
        this.passwords = { current: '', new: '', confirm: '' };
        this.passwordLoading = false;
      },
      error: (err) => {
        this.toast.error(err.error?.message ?? 'Error al cambiar la contraseña.');
        this.passwordLoading = false;
      }
    });
  }

  /** Getter para calcular las iniciales del avatar */
  get initials(): string {
    return this.profile.name
      ? this.profile.name.trim().charAt(0).toUpperCase()
      : '?';
  }
}
