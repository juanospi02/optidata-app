import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProductsComponent } from './pages/products/products.component';
import { SalesComponent } from './pages/sales/sales.component';


export const routes: Routes = [ 
    { path: '', component: DashboardComponent },
    { path: 'products', component: ProductsComponent },
    { path: 'sales', component: SalesComponent }
];
