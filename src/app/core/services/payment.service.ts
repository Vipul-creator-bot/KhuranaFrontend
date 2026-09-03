import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface OrderLineItem {
  productId: number;
  quantity: number;
}

export interface CreateOrderResponseItem {
  productId: number;
  name: string;
  image: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  items: CreateOrderResponseItem[];
  baseAmount: number;
  discountPercent: number;
  finalAmount: number;
  customerType: 'B2B' | 'B2C';
  gstNumber: string;
}

export interface VerifyPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly base = `${environment.apiBaseUrl}/payment`;

  constructor(private http: HttpClient) {}

  createOrder(
    items: OrderLineItem[],
    location: { latitude: number; longitude: number },
    address: string,
    customerType: 'B2B' | 'B2C',
    gstNumber: string
  ): Observable<CreateOrderResponse> {
    return this.http.post<CreateOrderResponse>(`${this.base}/create-order`, {
      items,
      latitude: location.latitude,
      longitude: location.longitude,
      address,
      customerType,
      gstNumber,
    });
  }

  verifyPayment(payload: VerifyPayload): Observable<{ verified: boolean; message?: string }> {
    return this.http.post<{ verified: boolean; message?: string }>(`${this.base}/verify`, payload);
  }
}
