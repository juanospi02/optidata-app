import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductService, Product } from '../../core/services/product.service';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css'
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  loading = false;

  // ── Modal de venta ──────────────────────────────────────────
  showSaleModal = false;
  selectedProduct: Product | null = null;
  saleQuantity = 1;
  saleLoading = false;

  // ── Modal de edición ────────────────────────────────────────
  showEditModal = false;
  editingProduct: Product | null = null;
  editForm = { name: '', cost: null as number | null, current_price: null as number | null };
  editLoading = false;

  // ── Highlight de precios cambiados ──────────────────────────
  priceChangedIds = new Set<number>();

  constructor(
    private productService: ProductService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.loading = false;
      },
      error: () => {
        this.toast.error('No se pudo cargar la lista de productos.');
        this.loading = false;
      }
    });
  }

  // ── Eliminar ─────────────────────────────────────────────────
  deleteProduct(product: Product): void {
    if (!confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return;

    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.toast.success(`"${product.name}" eliminado correctamente.`);
        this.loadProducts();
      },
      error: () => this.toast.error('No se pudo eliminar el producto.')
    });
  }

  // ── Editar ───────────────────────────────────────────────────
  openEditModal(product: Product): void {
    this.editingProduct = product;
    this.editForm = {
      name: product.name,
      cost: product.cost,
      current_price: product.current_price
    };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingProduct = null;
  }

  saveEdit(): void {
    if (!this.editingProduct) return;
    if (!this.editForm.name.trim() || !this.editForm.cost || !this.editForm.current_price) {
      this.toast.warning('Completa todos los campos.');
      return;
    }
    if (this.editForm.cost <= 0 || this.editForm.current_price <= 0) {
      this.toast.warning('Los valores deben ser mayores a 0.');
      return;
    }

    this.editLoading = true;
    this.productService.updateProduct(this.editingProduct.id, {
      name: this.editForm.name.trim(),
      cost: this.editForm.cost,
      current_price: this.editForm.current_price
    }).subscribe({
      next: () => {
        this.toast.success(`"${this.editForm.name}" actualizado correctamente.`);
        this.closeEditModal();
        this.loadProducts();
        this.editLoading = false;
      },
      error: () => {
        this.toast.error('No se pudo actualizar el producto.');
        this.editLoading = false;
      }
    });
  }

  // ── Venta ────────────────────────────────────────────────────
  openSaleModal(product: Product): void {
    this.selectedProduct = product;
    this.saleQuantity = 1;
    this.showSaleModal = true;
  }

  closeSaleModal(): void {
    this.showSaleModal = false;
    this.selectedProduct = null;
  }

  confirmSale(): void {
    if (!this.selectedProduct || this.saleQuantity < 1) return;

    this.saleLoading = true;
    const oldPrices = new Map<number, number>(
      this.products.map(p => [p.id, p.current_price])
    );
    const soldName = this.selectedProduct.name;

    this.productService.createSale(this.selectedProduct.id, this.saleQuantity).subscribe({
      next: () => {
        this.saleLoading = false;
        this.closeSaleModal();
        this.toast.success(`Venta de "${soldName}" registrada. Precio recalculado.`);

        this.productService.getProducts().subscribe({
          next: (data) => {
            this.priceChangedIds.clear();
            data.forEach(p => {
              if (oldPrices.get(p.id) !== p.current_price) {
                this.priceChangedIds.add(p.id);
              }
            });
            this.products = data;
            setTimeout(() => this.priceChangedIds.clear(), 3500);
          },
          error: () => this.toast.error('Error recargando productos.')
        });
      },
      error: () => {
        this.toast.error('No se pudo registrar la venta.');
        this.saleLoading = false;
      }
    });
  }

  // ── Helpers ──────────────────────────────────────────────────
  getMargin(product: Product): number {
    return product.cost > 0
      ? ((product.current_price - product.cost) / product.cost) * 100
      : 0;
  }
}
