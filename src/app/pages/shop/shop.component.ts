import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { Category, Product } from '../../core/models/product.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { CategoryHeroComponent } from '../../shared/components/category-hero/category-hero.component';

@Component({
  selector: 'kk-shop',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent, CategoryHeroComponent],
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.scss',
})
export class ShopComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  activeCategory = '';
  searchTerm = '';
  loading = true;
  sortBy: 'default' | 'price-asc' | 'price-desc' = 'default';

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  get activeCategoryObj(): Category | null {
    if (!this.activeCategory) return null;
    return this.categories.find((c) => c.name === this.activeCategory) || null;
  }

  ngOnInit(): void {
    this.productService.getCategories().subscribe((res) => (this.categories = res.categories));

    this.route.queryParamMap.subscribe((params) => {
      this.activeCategory = params.get('category') || '';
      this.fetchProducts();
    });
  }

  fetchProducts() {
    this.loading = true;
    this.productService
      .getProducts({ category: this.activeCategory || undefined, search: this.searchTerm || undefined })
      .subscribe({
        next: (res) => {
          this.products = this.applySort(res.products);
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
  }

  applySort(products: Product[]): Product[] {
    const list = [...products];
    if (this.sortBy === 'price-asc') list.sort((a, b) => a.salePrice - b.salePrice);
    if (this.sortBy === 'price-desc') list.sort((a, b) => b.salePrice - a.salePrice);
    return list;
  }

  onSortChange() {
    this.products = this.applySort(this.products);
  }

  selectCategory(name: string) {
    this.router.navigate(['/shop'], { queryParams: name ? { category: name } : {} });
  }

  onSearch() {
    this.fetchProducts();
  }
}
