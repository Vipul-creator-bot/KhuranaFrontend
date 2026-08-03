import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { CartItem } from '../models/product.model';

const CART_KEY = 'kk_cart';
const MAX_QTY_PER_ITEM = 10;

@Injectable({ providedIn: 'root' })
export class CartService {
  private itemsSubject = new BehaviorSubject<CartItem[]>(this.load());
  readonly items$ = this.itemsSubject.asObservable();
  readonly itemCount$ = this.items$.pipe(map((items) => items.reduce((sum, i) => sum + i.quantity, 0)));

  get items(): CartItem[] {
    return this.itemsSubject.value;
  }

  addItem(productId: number, quantity = 1): void {
    const items = [...this.itemsSubject.value];
    const existing = items.find((i) => i.productId === productId);
    if (existing) {
      existing.quantity = Math.min(MAX_QTY_PER_ITEM, existing.quantity + quantity);
    } else {
      items.push({ productId, quantity: Math.min(MAX_QTY_PER_ITEM, Math.max(1, quantity)) });
    }
    this.update(items);
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity < 1) {
      this.removeItem(productId);
      return;
    }
    const items = this.itemsSubject.value.map((i) =>
      i.productId === productId ? { ...i, quantity: Math.min(MAX_QTY_PER_ITEM, quantity) } : i
    );
    this.update(items);
  }

  removeItem(productId: number): void {
    this.update(this.itemsSubject.value.filter((i) => i.productId !== productId));
  }

  clear(): void {
    this.update([]);
  }

  private update(items: CartItem[]) {
    this.itemsSubject.next(items);
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      // localStorage unavailable (private browsing, etc.) — cart just won't persist across reloads
    }
  }

  private load(): CartItem[] {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}
