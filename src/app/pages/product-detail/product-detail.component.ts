import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { CartService } from '../../core/services/cart.service';
import { MediaGalleryComponent } from '../../shared/components/media-gallery/media-gallery.component';

@Component({
  selector: 'kk-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent, MediaGalleryComponent],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  related: Product[] = [];
  loading = true;
  notFound = false;

  quantity = 1;
  justAdded = false;

  constructor(private route: ActivatedRoute, private productService: ProductService, private cart: CartService) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.loading = true;
          this.notFound = false;
          this.quantity = 1;
          const id = Number(params.get('id'));
          return this.productService.getProduct(id);
        })
      )
      .subscribe({
        next: (product) => {
          this.product = product;
          this.loading = false;
          this.productService.getProducts({ category: product.category }).subscribe((res) => {
            this.related = res.products.filter((p) => p.id !== product.id).slice(0, 4);
          });
        },
        error: () => {
          this.loading = false;
          this.notFound = true;
        },
      });
  }

  incrementQty() {
    if (this.quantity < 10) this.quantity++;
  }
  decrementQty() {
    if (this.quantity > 1) this.quantity--;
  }

  addToCart() {
    if (!this.product) return;
    this.cart.addItem(this.product.id, this.quantity);
    this.justAdded = true;
    setTimeout(() => (this.justAdded = false), 1500);
  }

  get discountPercent(): number {
    if (!this.product || this.product.price <= this.product.salePrice) return 0;
    return Math.round(((this.product.price - this.product.salePrice) / this.product.price) * 100);
  }

  get whatsappLink(): string {
    if (!this.product) return '#';
    const text = encodeURIComponent(
      `Hi, I am interested in: ${this.product.name} (SKU: ${this.product.sku}). Please share more details.`
    );
    return `https://wa.me/911244567890?text=${text}`;
  }
}
