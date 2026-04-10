/**
 * features/landing/landing.component.ts — Página de inicio pública
 *
 * Contiene:
 *  - Hero con CTA a login/registro
 *  - Sección "Cómo funciona" (3 pasos)
 *  - Sección "Sobre nosotros"
 *  - QR code que apunta a la landing
 *  - Footer con enlace de acceso
 *
 * Es pública (sin authGuard). Tiene su propio navbar sin el menú privado.
 */

import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { QRCodeModule } from 'angularx-qrcode';
import { API_URL } from '../../core/config';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, QRCodeModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent implements OnInit {
  /**
   * URL del QR. Se inicializa con localhost como fallback y se reemplaza
   * al obtener la IP real del backend para que funcione desde móviles.
   */
  landingUrl = 'https://uncover-gnarly-staring.ngrok-free.dev/inicio';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {}

  /** Pasos del flujo "Cómo funciona" */
  readonly steps = [
    {
      icon: '📦',
      title: 'Registra tus productos',
      desc: 'Agrega nombre, costo base y precio inicial de cada artículo en segundos.'
    },
    {
      icon: '📊',
      title: 'Registra ventas diarias',
      desc: 'Lleva el conteo de unidades vendidas. El sistema analiza la demanda automáticamente.'
    },
    {
      icon: '🤖',
      title: 'Precios optimizados',
      desc: 'OptiData ajusta los precios según la demanda para maximizar tus ingresos sin esfuerzo.'
    }
  ];
}
