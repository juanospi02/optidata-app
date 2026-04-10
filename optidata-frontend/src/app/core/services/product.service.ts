import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config';

export interface Product {
  id: number;
  user_id: number;
  name: string;
  cost: number;
  current_price: number;
}

export interface CreateProductDto {
  name: string;
  cost: number;
  current_price: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly api = `${API_URL}/api`;

  constructor(private http: HttpClient) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.api}/products`);
  }

  createProduct(data: CreateProductDto): Observable<{ message: string; productId: number }> {
    return this.http.post<{ message: string; productId: number }>(`${this.api}/products`, data);
  }

  deleteProduct(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api}/products/${id}`);
  }

  updateProduct(id: number, data: CreateProductDto): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.api}/products/${id}`, data);
  }

  createSale(product_id: number, quantity: number): Observable<any> {
    return this.http.post<any>(`${this.api}/products/sales`, { product_id, quantity });
  }
}
