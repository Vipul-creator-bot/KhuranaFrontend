import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { Category, Product } from '../../core/models/product.model';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { CategoryHeroComponent } from '../../shared/components/category-hero/category-hero.component';
import { AuthService } from '../../core/services/auth.service';
import { AdminService } from '../../core/services/admin.service';

interface CategoryQuickForm {
  id: number | null;
  name: string;
  tagline: string;
}

const EMPTY_CATEGORY_FORM: CategoryQuickForm = { id: null, name: '', tagline: '' };

interface ProductQuickForm {
  id: number | null;
  name: string;
  category: string;
  sku: string;
  price: number | null;
  salePrice: number | null;
  description: string;
  featured: boolean;
  initialStock: number | null;
}

const EMPTY_PRODUCT_FORM: ProductQuickForm = {
  id: null,
  name: '',
  category: '',
  sku: '',
  price: null,
  salePrice: null,
  description: '',
  featured: false,
  initialStock: null,
};

type QuickSaveState = 'idle' | 'saving' | 'error';

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

  isAdmin = false;

  // Inline category quick add/edit (admin only)
  showCategoryForm = false;
  categoryForm: CategoryQuickForm = { ...EMPTY_CATEGORY_FORM };
  categoryFiles: File[] = [];
  categorySaveState: QuickSaveState = 'idle';
  categorySaveError = '';

  // Inline product quick add/edit (admin only)
  showProductForm = false;
  productForm: ProductQuickForm = { ...EMPTY_PRODUCT_FORM };
  productFiles: File[] = [];
  productSaveState: QuickSaveState = 'idle';
  productSaveError = '';

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private admin: AdminService
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

    this.auth.currentUser$.subscribe((user) => (this.isAdmin = !!user?.isAdmin));
  }

  private reloadCategories() {
    this.productService.getCategories().subscribe((res) => (this.categories = res.categories));
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

  // ---- Inline category management (admin only) ----

  toggleAddCategory() {
    this.categoryForm = { ...EMPTY_CATEGORY_FORM };
    this.categoryFiles = [];
    this.categorySaveState = 'idle';
    this.categorySaveError = '';
    this.showCategoryForm = !this.showCategoryForm;
  }

  editCategoryInline(cat: Category) {
    this.categoryForm = { id: cat.id, name: cat.name, tagline: cat.tagline || '' };
    this.categoryFiles = [];
    this.categorySaveState = 'idle';
    this.categorySaveError = '';
    this.showCategoryForm = true;
  }

  cancelCategoryForm() {
    this.showCategoryForm = false;
    this.categoryForm = { ...EMPTY_CATEGORY_FORM };
    this.categoryFiles = [];
  }

  onCategoryFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.categoryFiles = input.files ? Array.from(input.files) : [];
  }

  submitCategoryForm() {
    const f = this.categoryForm;
    if (!f.name.trim()) {
      this.categorySaveError = 'Category name is required.';
      this.categorySaveState = 'error';
      return;
    }
    this.categorySaveState = 'saving';
    this.categorySaveError = '';

    const formData = new FormData();
    formData.append('name', f.name);
    formData.append('tagline', f.tagline);
    for (const file of this.categoryFiles) formData.append('images', file);

    const request$ = f.id ? this.admin.updateCategory(f.id, formData) : this.admin.createCategory(formData);
    request$.subscribe({
      next: () => {
        this.cancelCategoryForm();
        this.reloadCategories();
      },
      error: (err) => {
        this.categorySaveState = 'error';
        this.categorySaveError = err?.error?.error || 'Unable to save this category right now.';
      },
    });
  }

  deleteCategoryInline() {
    const f = this.categoryForm;
    if (!f.id) return;
    if (!confirm(`Delete "${f.name}"? This cannot be undone.`)) return;

    this.admin.deleteCategory(f.id).subscribe({
      next: () => {
        this.cancelCategoryForm();
        this.reloadCategories();
        if (this.activeCategory === f.name) this.selectCategory('');
      },
      error: (err) => alert(err?.error?.error || 'Unable to delete this category right now.'),
    });
  }

  // ---- Inline product management (admin only) ----

  toggleAddProduct() {
    this.productForm = { ...EMPTY_PRODUCT_FORM, category: this.activeCategory };
    this.productFiles = [];
    this.productSaveState = 'idle';
    this.productSaveError = '';
    this.showProductForm = !this.showProductForm;
  }

  editProductInline(product: Product) {
    this.productForm = {
      id: product.id,
      name: product.name,
      category: product.category,
      sku: product.sku,
      price: product.price,
      salePrice: product.salePrice,
      description: product.description,
      featured: product.featured,
      initialStock: null,
    };
    this.productFiles = [];
    this.productSaveState = 'idle';
    this.productSaveError = '';
    this.showProductForm = true;
  }

  cancelProductForm() {
    this.showProductForm = false;
    this.productForm = { ...EMPTY_PRODUCT_FORM };
    this.productFiles = [];
  }

  onProductFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.productFiles = input.files ? Array.from(input.files) : [];
  }

  submitProductForm() {
    const f = this.productForm;
    if (!f.name || !f.category || !f.sku || f.price == null || f.salePrice == null) {
      this.productSaveError = 'Name, category, SKU, price and sale price are required.';
      this.productSaveState = 'error';
      return;
    }
    this.productSaveState = 'saving';
    this.productSaveError = '';

    const formData = new FormData();
    formData.append('name', f.name);
    formData.append('category', f.category);
    formData.append('sku', f.sku);
    formData.append('price', String(f.price));
    formData.append('salePrice', String(f.salePrice));
    formData.append('description', f.description);
    formData.append('featured', String(f.featured));
    if (f.initialStock != null) formData.append('initialStock', String(f.initialStock));
    for (const file of this.productFiles) formData.append('images', file);

    const request$ = f.id ? this.admin.updateProduct(f.id, formData) : this.admin.createProduct(formData);
    request$.subscribe({
      next: () => {
        this.cancelProductForm();
        this.fetchProducts();
      },
      error: (err) => {
        this.productSaveState = 'error';
        this.productSaveError = err?.error?.error || 'Unable to save this product right now.';
      },
    });
  }

  deleteProductInline(product: Product) {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    this.admin.deleteProduct(product.id).subscribe({
      next: () => this.fetchProducts(),
      error: (err) => alert(err?.error?.error || 'Unable to delete this product right now.'),
    });
  }
}
