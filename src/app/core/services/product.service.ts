import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category, Product } from '../models/product.model';

export interface ProductQuery {
  category?: string;
  featured?: boolean;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly base = `${environment.apiBaseUrl}/products`;
  private readonly categoriesBase = `${environment.apiBaseUrl}/categories`;

  constructor(private http: HttpClient) {}

  getProducts(query: ProductQuery = {}): Observable<{ count: number; products: Product[] }> {
    let params = new HttpParams();
    if (query.category) params = params.set('category', query.category);
    if (query.featured !== undefined) params = params.set('featured', String(query.featured));
    if (query.search) params = params.set('search', query.search);
    return this.http.get<{ count: number; products: Product[] }>(this.base, { params });
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.base}/${id}`);
  }

  getCategories(): Observable<{ count: number; categories: Category[] }> {
    return this.http.get<{ count: number; categories: Category[] }>(this.categoriesBase);
  }
}
