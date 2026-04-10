import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PricingService, PricingReport, ReportProduct } from '../../core/services/pricing.service';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  report: PricingReport | null = null;
  loading = false;
  applyingAll = false;

  constructor(
    private pricingService: PricingService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.loading = true;
    this.pricingService.getReport().subscribe({
      next: (res) => {
        this.report = res.data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando reporte:', err);
        this.toast.error('No se pudo cargar el reporte de pricing.');
        this.loading = false;
      }
    });
  }

  applyAll(): void {
    if (!confirm('¿Aplicar pricing inteligente a todos los productos?')) return;

    this.applyingAll = true;
    this.pricingService.applyAll().subscribe({
      next: (res) => {
        this.applyingAll = false;
        const count = res.data?.updates?.length ?? 0;
        this.toast.success(`Pricing aplicado a ${count} producto(s) correctamente.`);
        this.loadReport();
      },
      error: (err) => {
        console.error('Error aplicando pricing:', err);
        this.toast.error('Error al aplicar pricing. Intenta de nuevo.');
        this.applyingAll = false;
      }
    });
  }

  totalQuantity(): number {
    return this.report?.topSelling.reduce((sum, p) => sum + (p.totalQuantity || 0), 0) ?? 0;
  }

  countNoSales(): number {
    return this.report?.lowSelling.filter(p => !p.totalQuantity).length ?? 0;
  }

  marginOf(p: ReportProduct): number {
    return p.cost > 0 ? ((p.current_price - p.cost) / p.cost) * 100 : 0;
  }
}
