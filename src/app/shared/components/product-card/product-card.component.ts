import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../../core/models/product.model';
import { CartService } from '../../../core/services/cart.service';
import { TiltDirective } from '../../directives/tilt.directive';

@Component({
  selector: 'kk-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink, TiltDirective],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  // Off by default everywhere (home page, etc.) — only the Shop page turns
  // this on for logged-in admins, so nothing else changes appearance.
  @Input() editable = false;
  @Output() editClick = new EventEmitter<Product>();
  @Output() deleteClick = new EventEmitter<Product>();

  justAdded = false;

  constructor(private cart: CartService) {}

  onEdit(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.editClick.emit(this.product);
  }

  onDelete(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.deleteClick.emit(this.product);
  }

  get discountPercent(): number {
    if (!this.product || this.product.price <= this.product.salePrice) return 0;
    return Math.round(((this.product.price - this.product.salePrice) / this.product.price) * 100);
  }

  addToCart(event: Event) {
    event.preventDefault();
    this.cart.addItem(this.product.id, 1);
    this.justAdded = true;
    setTimeout(() => (this.justAdded = false), 1500);
  }
}
