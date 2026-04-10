import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config';

export interface ReportProduct {
  id: number;
  name: string;
  cost: number;
  current_price: number;
  totalSales: number | null;
  totalQuantity: number | null;
}

export interface PricingReport {
  totalProducts: number;
  topSelling: ReportProduct[];
  lowSelling: ReportProduct[];
  pricingAlerts: ReportProduct[];
}

@Injectable({ providedIn: 'root' })
export class PricingService {
  private readonly api = `${API_URL}/api/pricing`;

  constructor(private http: HttpClient) {}

  getReport(): Observable<{ success: boolean; data: PricingReport }> {
    return this.http.get<{ success: boolean; data: PricingReport }>(`${this.api}/report`);
  }

  applyAll(): Observable<{ success: boolean; data: any }> {
    return this.http.post<{ success: boolean; data: any }>(`${this.api}/apply-all`, {});
  }

  applyOne(productId: number): Observable<{ success: boolean; data: any }> {
    return this.http.post<{ success: boolean; data: any }>(`${this.api}/apply/${productId}`, {});
  }
}
