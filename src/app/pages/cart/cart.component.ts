import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { combineLatest, map } from 'rxjs';
import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';

export interface CartLine {
  product: Product;
  quantity: number;
  lineTotal: number;
}

@Component({
  selector: 'kk-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent implements OnInit {
  lines: CartLine[] = [];
  loading = true;

  constructor(private cart: CartService, private productService: ProductService) {}

  ngOnInit(): void {
    // Product prices/details always come fresh from the API — the cart only
    // ever stores { productId, quantity }, never a cached price.
    combineLatest([this.cart.items$, this.productService.getProducts()])
      .pipe(
        map(([cartItems, productsRes]) => {
          const byId = new Map(productsRes.products.map((p) => [p.id, p]));
          return cartItems
            .map((item) => {
              const product = byId.get(item.productId);
              if (!product) return null;
              return { product, quantity: item.quantity, lineTotal: product.salePrice * item.quantity };
            })
            .filter((line): line is CartLine => line !== null);
        })
      )
      .subscribe((lines) => {
        this.lines = lines;
        this.loading = false;
      });
  }

  get subtotal(): number {
    return this.lines.reduce((sum, line) => sum + line.lineTotal, 0);
  }

  increment(productId: number, currentQty: number) {
    this.cart.updateQuantity(productId, currentQty + 1);
  }

  decrement(productId: number, currentQty: number) {
    this.cart.updateQuantity(productId, currentQty - 1);
  }

  remove(productId: number) {
    this.cart.removeItem(productId);
  }
}
