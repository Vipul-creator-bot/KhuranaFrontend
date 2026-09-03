import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { HowItWorksStep } from '../models/product.model';

// Envelope used by the inventory-management endpoints (organizations, catalog
// items/categories, stock), modeled on Zoho Inventory's API conventions
// (https://www.zoho.com/inventory/api/v1/introduction/#overview): every
// response carries a `code`/`message`, with the payload under `data`.
interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface BroadcastResult {
  totalMembers: number;
  eligible: number;
  sent: number;
  failedCount: number;
  failed: { memberId: string; name: string; phone: string; error: string }[];
}

export interface StockLevel {
  productId: number;
  name: string;
  sku: string;
  category: string;
  image: string;
  quantity: number;
}

export interface AddStockResult {
  productId: number;
  productName: string;
  addedQuantity: number;
  newQuantity: number;
  tallySync: { status: string; error: string | null };
}

export interface TallyQueueEntry {
  _id: string;
  productId: number;
  productName: string;
  quantity: number;
  isIncrease: boolean;
  reason: 'restock' | 'sale';
  orderId: string | null;
  status: 'pending' | 'synced' | 'failed';
  attempts: number;
  lastError: string | null;
  createdAt: string;
  syncedAt: string | null;
}

export interface TallyRetryResult {
  attempted: number;
  succeeded: number;
  failed: number;
  results: { id: string; productName: string; success: boolean; error?: string }[];
}

export interface CatalogProduct {
  id: number;
  name: string;
  category: string;
  sku: string;
  price: number;
  salePrice: number;
  image: string;
  images: string[];
  video: string;
  description: string;
  featured: boolean;
  inStock: boolean;
}

export interface CatalogCategory {
  id: number;
  name: string;
  tagline: string;
  images: string[];
  video: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly base = `${environment.apiBaseUrl}/admin`;
  private organizationId$?: Observable<string>;

  constructor(private http: HttpClient) {}

  getMembers(): Observable<{ count: number; members: Member[] }> {
    return this.http.get<{ count: number; members: Member[] }>(`${this.base}/members`);
  }

  sendWhatsAppBroadcast(message: string): Observable<BroadcastResult> {
    return this.http.post<BroadcastResult>(`${this.base}/broadcast/whatsapp`, { message });
  }

  // ---- Organization scoping ----
  // The inventory-management endpoints (stock, catalog items/categories)
  // require an organization_id on every request, mirroring Zoho Inventory's
  // API (see GET /organizations). This app has exactly one organization, so
  // it's fetched once and cached for the lifetime of the app.
  private ensureOrganizationId(): Observable<string> {
    if (!this.organizationId$) {
      this.organizationId$ = this.http
        .get<ApiEnvelope<{ organization_id: string }>>(`${environment.apiBaseUrl}/organizations`)
        .pipe(
          map((res) => res.data.organization_id),
          shareReplay(1)
        );
    }
    return this.organizationId$;
  }

  private withOrgParam(url: string): Observable<string> {
    return this.ensureOrganizationId().pipe(
      map((orgId) => `${url}${url.includes('?') ? '&' : '?'}organization_id=${encodeURIComponent(orgId)}`)
    );
  }

  // Normalizes inventory-endpoint errors back to the { error: { error } }
  // shape the rest of the admin panel already expects, so callers don't need
  // to know the payload came from a `{code, message}` envelope instead.
  private normalizeError(err: HttpErrorResponse) {
    const message = err?.error?.message || err?.error?.error;
    return throwError(() => ({ ...err, error: { ...(err.error || {}), error: message } }));
  }

  private orgScopedGet<T>(url: string): Observable<T> {
    return this.withOrgParam(url).pipe(
      switchMap((fullUrl) => this.http.get<ApiEnvelope<T>>(fullUrl)),
      map((res) => res.data),
      catchError((err) => this.normalizeError(err))
    );
  }

  private orgScopedPost<T>(url: string, body: unknown): Observable<T> {
    return this.withOrgParam(url).pipe(
      switchMap((fullUrl) => this.http.post<ApiEnvelope<T>>(fullUrl, body)),
      map((res) => res.data),
      catchError((err) => this.normalizeError(err))
    );
  }

  private orgScopedPut<T>(url: string, body: unknown): Observable<T> {
    return this.withOrgParam(url).pipe(
      switchMap((fullUrl) => this.http.put<ApiEnvelope<T>>(fullUrl, body)),
      map((res) => res.data),
      catchError((err) => this.normalizeError(err))
    );
  }

  private orgScopedDelete<T>(url: string): Observable<T> {
    return this.withOrgParam(url).pipe(
      switchMap((fullUrl) => this.http.delete<ApiEnvelope<T>>(fullUrl)),
      map((res) => res.data),
      catchError((err) => this.normalizeError(err))
    );
  }

  // per_page=200 (the API's max) keeps this a single call — the admin Stock
  // panel shows every product in one table, it doesn't paginate.
  getStockLevels(): Observable<{ count: number; stock: StockLevel[] }> {
    return this.orgScopedGet<StockLevel[]>(`${this.base}/stock?per_page=200`).pipe(
      map((stock) => ({ count: stock.length, stock }))
    );
  }

  addStock(productId: number, quantity: number): Observable<AddStockResult> {
    return this.orgScopedPost<AddStockResult>(`${this.base}/stock/add`, { productId, quantity });
  }

  getTallyQueue(status?: string): Observable<{ count: number; entries: TallyQueueEntry[] }> {
    const url = status ? `${this.base}/tally/queue?status=${status}` : `${this.base}/tally/queue`;
    return this.http.get<{ count: number; entries: TallyQueueEntry[] }>(url);
  }

  retryTallySync(): Observable<TallyRetryResult> {
    return this.http.post<TallyRetryResult>(`${this.base}/tally/retry`, {});
  }

  // ---- Catalog: products & categories (multipart — HttpClient sets the
  // multipart boundary itself when the body is a FormData, so no explicit
  // Content-Type header should be set here). ----

  createProduct(formData: FormData): Observable<CatalogProduct> {
    return this.orgScopedPost<CatalogProduct>(`${this.base}/catalog/products`, formData);
  }

  updateProduct(id: number, formData: FormData): Observable<CatalogProduct> {
    return this.orgScopedPut<CatalogProduct>(`${this.base}/catalog/products/${id}`, formData);
  }

  deleteProduct(id: number): Observable<{ product_id: number }> {
    return this.orgScopedDelete<{ product_id: number }>(`${this.base}/catalog/products/${id}`);
  }

  createCategory(formData: FormData): Observable<CatalogCategory> {
    return this.orgScopedPost<CatalogCategory>(`${this.base}/catalog/categories`, formData);
  }

  updateCategory(id: number, formData: FormData): Observable<CatalogCategory> {
    return this.orgScopedPut<CatalogCategory>(`${this.base}/catalog/categories/${id}`, formData);
  }

  deleteCategory(id: number): Observable<{ category_id: number }> {
    return this.orgScopedDelete<{ category_id: number }>(`${this.base}/catalog/categories/${id}`);
  }

  // ---- How It Works (homepage step cards) ----

  createHowItWorksStep(formData: FormData): Observable<HowItWorksStep> {
    return this.http.post<HowItWorksStep>(`${this.base}/how-it-works`, formData);
  }

  updateHowItWorksStep(id: number, formData: FormData): Observable<HowItWorksStep> {
    return this.http.put<HowItWorksStep>(`${this.base}/how-it-works/${id}`, formData);
  }

  deleteHowItWorksStep(id: number): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${this.base}/how-it-works/${id}`);
  }
}
