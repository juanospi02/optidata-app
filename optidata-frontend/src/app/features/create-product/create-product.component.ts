import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-create-product',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './create-product.component.html',
  styleUrl: './create-product.component.css'
})
export class CreateProductComponent {
  product = {
    name: '',
    cost: null as number | null,
    current_price: null as number | null
  };

  loading = false;
  submitted = false;
  errorMsg = '';

  constructor(
    private productService: ProductService,
    private toast: ToastService,
    private router: Router
  ) {}

  submit(form: NgForm): void {
    this.submitted = true;

    if (form.invalid) return;
    if (!this.product.cost || this.product.cost <= 0) return;
    if (!this.product.current_price || this.product.current_price <= 0) return;

    this.loading = true;
    this.errorMsg = '';

    this.productService.createProduct({
      name: this.product.name.trim(),
      cost: this.product.cost,
      current_price: this.product.current_price
    }).subscribe({
      next: () => {
        this.toast.success(`"${this.product.name.trim()}" creado correctamente.`);
        this.router.navigate(['/productos']);
      },
      error: () => {
        this.errorMsg = 'No se pudo crear el producto. Verifica que el servidor esté activo.';
        this.loading = false;
      }
    });
  }
}
