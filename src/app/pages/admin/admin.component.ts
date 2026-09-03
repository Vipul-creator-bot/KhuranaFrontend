import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdminService,
  Member,
  BroadcastResult,
  StockLevel,
  TallyQueueEntry,
  CatalogProduct,
  CatalogCategory,
} from '../../core/services/admin.service';
import { ProductService } from '../../core/services/product.service';
import { ContentService } from '../../core/services/content.service';
import { HowItWorksStep } from '../../core/models/product.model';

type SendState = 'idle' | 'sending' | 'success' | 'error';
type AdminTab = 'broadcast' | 'stock' | 'catalog' | 'howItWorks';
type AddStockState = 'idle' | 'saving' | 'success' | 'error';
type RetryState = 'idle' | 'retrying' | 'done';
type SaveState = 'idle' | 'saving' | 'error';
type CatalogSubTab = 'products' | 'categories';

interface ProductFormModel {
  id: number | null; // null = creating new
  name: string;
  category: string;
  sku: string;
  price: number | null;
  salePrice: number | null;
  description: string;
  featured: boolean;
  video: string;
  initialStock: number | null;
}

interface CategoryFormModel {
  id: number | null;
  name: string;
  tagline: string;
  video: string;
}

const EMPTY_PRODUCT_FORM: ProductFormModel = {
  id: null,
  name: '',
  category: '',
  sku: '',
  price: null,
  salePrice: null,
  description: '',
  featured: false,
  video: '',
  initialStock: null,
};

const EMPTY_CATEGORY_FORM: CategoryFormModel = { id: null, name: '', tagline: '', video: '' };

interface HowItWorksFormModel {
  id: number | null;
  title: string;
  points: string; // one bullet point per line in the textarea
  order: number | null;
}

const EMPTY_HOW_IT_WORKS_FORM: HowItWorksFormModel = { id: null, title: '', points: '', order: null };

@Component({
  selector: 'kk-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  activeTab: AdminTab = 'broadcast';

  // Broadcast tab
  members: Member[] = [];
  loadingMembers = true;
  message = '';
  sendState: SendState = 'idle';
  errorMessage = '';
  result: BroadcastResult | null = null;

  // Stock & Tally tab
  stockLevels: StockLevel[] = [];
  loadingStock = true;
  addStockProductId: number | null = null;
  addStockQuantity: number | null = null;
  addStockState: AddStockState = 'idle';
  addStockMessage = '';

  tallyQueue: TallyQueueEntry[] = [];
  loadingQueue = true;
  retryState: RetryState = 'idle';
  retryMessage = '';

  // Catalog tab
  catalogSubTab: CatalogSubTab = 'products';
  products: CatalogProduct[] = [];
  categories: CatalogCategory[] = [];
  loadingCatalog = true;

  productForm: ProductFormModel = { ...EMPTY_PRODUCT_FORM };
  productFiles: File[] = [];
  productSaveState: SaveState = 'idle';
  productSaveError = '';

  categoryForm: CategoryFormModel = { ...EMPTY_CATEGORY_FORM };
  categoryFiles: File[] = [];
  categorySaveState: SaveState = 'idle';
  categorySaveError = '';

  // How It Works tab
  howItWorksSteps: HowItWorksStep[] = [];
  loadingHowItWorks = true;
  howItWorksForm: HowItWorksFormModel = { ...EMPTY_HOW_IT_WORKS_FORM };
  howItWorksFile: File | null = null;
  howItWorksSaveState: SaveState = 'idle';
  howItWorksSaveError = '';

  constructor(
    private admin: AdminService,
    private products$: ProductService,
    private content: ContentService
  ) {}

  ngOnInit(): void {
    this.admin.getMembers().subscribe({
      next: (res) => {
        this.members = res.members;
        this.loadingMembers = false;
      },
      error: () => (this.loadingMembers = false),
    });

    this.loadStock();
    this.loadTallyQueue();
    this.loadCatalog();
    this.loadHowItWorks();
  }

  switchTab(tab: AdminTab) {
    this.activeTab = tab;
  }

  get membersWithPhone(): number {
    return this.members.filter((m) => m.phone).length;
  }

  sendBroadcast() {
    if (!this.message.trim()) return;
    this.sendState = 'sending';
    this.errorMessage = '';
    this.result = null;

    this.admin.sendWhatsAppBroadcast(this.message.trim()).subscribe({
      next: (res) => {
        this.sendState = 'success';
        this.result = res;
      },
      error: (err) => {
        this.sendState = 'error';
        this.errorMessage = err?.error?.error || 'Unable to send the broadcast right now.';
      },
    });
  }

  sendAnother() {
    this.sendState = 'idle';
    this.message = '';
    this.result = null;
    this.errorMessage = '';
  }

  // ---- Stock & Tally ----

  loadStock() {
    this.loadingStock = true;
    this.admin.getStockLevels().subscribe({
      next: (res) => {
        this.stockLevels = res.stock;
        this.loadingStock = false;
      },
      error: () => (this.loadingStock = false),
    });
  }

  loadTallyQueue() {
    this.loadingQueue = true;
    this.admin.getTallyQueue().subscribe({
      next: (res) => {
        this.tallyQueue = res.entries;
        this.loadingQueue = false;
      },
      error: () => (this.loadingQueue = false),
    });
  }

  get pendingCount(): number {
    return this.tallyQueue.filter((e) => e.status === 'pending').length;
  }
  get syncedCount(): number {
    return this.tallyQueue.filter((e) => e.status === 'synced').length;
  }

  submitAddStock() {
    if (!this.addStockProductId || !this.addStockQuantity || this.addStockQuantity <= 0) return;
    this.addStockState = 'saving';
    this.addStockMessage = '';

    this.admin.addStock(this.addStockProductId, this.addStockQuantity).subscribe({
      next: (res) => {
        this.addStockState = 'success';
        this.addStockMessage = `Added ${res.addedQuantity} unit(s) to "${res.productName}" — new total: ${res.newQuantity}. Tally sync: ${res.tallySync.status}${res.tallySync.error ? ' (' + res.tallySync.error + ')' : ''}.`;
        this.addStockProductId = null;
        this.addStockQuantity = null;
        this.loadStock();
        this.loadTallyQueue();
      },
      error: (err) => {
        this.addStockState = 'error';
        this.addStockMessage = err?.error?.error || 'Unable to add stock right now.';
      },
    });
  }

  retrySync() {
    this.retryState = 'retrying';
    this.admin.retryTallySync().subscribe({
      next: (res) => {
        this.retryState = 'done';
        this.retryMessage = `Retried ${res.attempted} item(s) — ${res.succeeded} synced, ${res.failed} still failing.`;
        this.loadTallyQueue();
      },
      error: (err) => {
        this.retryState = 'done';
        this.retryMessage = err?.error?.error || 'Unable to retry sync right now.';
      },
    });
  }

  // ---- Catalog: products & categories ----

  switchCatalogSubTab(tab: CatalogSubTab) {
    this.catalogSubTab = tab;
  }

  loadCatalog() {
    this.loadingCatalog = true;
    this.products$.getProducts().subscribe({
      next: (res) => (this.products = res.products as unknown as CatalogProduct[]),
      error: () => {},
    });
    this.products$.getCategories().subscribe({
      next: (res) => {
        this.categories = res.categories as unknown as CatalogCategory[];
        this.loadingCatalog = false;
      },
      error: () => (this.loadingCatalog = false),
    });
  }

  onProductFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.productFiles = input.files ? Array.from(input.files) : [];
  }

  onCategoryFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.categoryFiles = input.files ? Array.from(input.files) : [];
  }

  editProduct(p: CatalogProduct) {
    this.productForm = {
      id: p.id,
      name: p.name,
      category: p.category,
      sku: p.sku,
      price: p.price,
      salePrice: p.salePrice,
      description: p.description,
      featured: p.featured,
      video: p.video || '',
      initialStock: null,
    };
    this.productFiles = [];
    this.productSaveState = 'idle';
    this.productSaveError = '';
  }

  cancelProductEdit() {
    this.productForm = { ...EMPTY_PRODUCT_FORM };
    this.productFiles = [];
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
    formData.append('video', f.video);
    if (f.initialStock != null) formData.append('initialStock', String(f.initialStock));
    for (const file of this.productFiles) formData.append('images', file);

    const request$ = f.id
      ? this.admin.updateProduct(f.id, formData)
      : this.admin.createProduct(formData);

    request$.subscribe({
      next: () => {
        this.cancelProductEdit();
        this.loadCatalog();
      },
      error: (err) => {
        this.productSaveState = 'error';
        this.productSaveError = err?.error?.error || 'Unable to save this product right now.';
      },
    });
  }

  deleteProduct(p: CatalogProduct) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    this.admin.deleteProduct(p.id).subscribe({
      next: () => this.loadCatalog(),
      error: (err) => alert(err?.error?.error || 'Unable to delete this product right now.'),
    });
  }

  editCategory(c: CatalogCategory) {
    this.categoryForm = { id: c.id, name: c.name, tagline: c.tagline || '', video: c.video || '' };
    this.categoryFiles = [];
    this.categorySaveState = 'idle';
    this.categorySaveError = '';
  }

  cancelCategoryEdit() {
    this.categoryForm = { ...EMPTY_CATEGORY_FORM };
    this.categoryFiles = [];
  }

  submitCategoryForm() {
    const f = this.categoryForm;
    if (!f.name) {
      this.categorySaveError = 'Category name is required.';
      this.categorySaveState = 'error';
      return;
    }
    this.categorySaveState = 'saving';
    this.categorySaveError = '';

    const formData = new FormData();
    formData.append('name', f.name);
    formData.append('tagline', f.tagline);
    formData.append('video', f.video);
    for (const file of this.categoryFiles) formData.append('images', file);

    const request$ = f.id
      ? this.admin.updateCategory(f.id, formData)
      : this.admin.createCategory(formData);

    request$.subscribe({
      next: () => {
        this.cancelCategoryEdit();
        this.loadCatalog();
      },
      error: (err) => {
        this.categorySaveState = 'error';
        this.categorySaveError = err?.error?.error || 'Unable to save this category right now.';
      },
    });
  }

  deleteCategory(c: CatalogCategory) {
    if (!confirm(`Delete "${c.name}"? This cannot be undone.`)) return;
    this.admin.deleteCategory(c.id).subscribe({
      next: () => this.loadCatalog(),
      error: (err) => alert(err?.error?.error || 'Unable to delete this category right now.'),
    });
  }

  // ---- How It Works ----

  loadHowItWorks() {
    this.loadingHowItWorks = true;
    this.content.getHowItWorks().subscribe({
      next: (res) => {
        this.howItWorksSteps = res.steps;
        this.loadingHowItWorks = false;
      },
      error: () => (this.loadingHowItWorks = false),
    });
  }

  onHowItWorksFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.howItWorksFile = input.files && input.files.length ? input.files[0] : null;
  }

  editHowItWorksStep(s: HowItWorksStep) {
    this.howItWorksForm = { id: s.id, title: s.title, points: (s.points || []).join('\n'), order: s.order };
    this.howItWorksFile = null;
    this.howItWorksSaveState = 'idle';
    this.howItWorksSaveError = '';
  }

  cancelHowItWorksEdit() {
    this.howItWorksForm = { ...EMPTY_HOW_IT_WORKS_FORM };
    this.howItWorksFile = null;
  }

  submitHowItWorksForm() {
    const f = this.howItWorksForm;
    if (!f.title.trim()) {
      this.howItWorksSaveError = 'Title is required.';
      this.howItWorksSaveState = 'error';
      return;
    }
    this.howItWorksSaveState = 'saving';
    this.howItWorksSaveError = '';

    const formData = new FormData();
    formData.append('title', f.title);
    formData.append('points', f.points);
    if (f.order != null) formData.append('order', String(f.order));
    if (this.howItWorksFile) formData.append('image', this.howItWorksFile);

    const request$ = f.id
      ? this.admin.updateHowItWorksStep(f.id, formData)
      : this.admin.createHowItWorksStep(formData);

    request$.subscribe({
      next: () => {
        this.cancelHowItWorksEdit();
        this.loadHowItWorks();
      },
      error: (err) => {
        this.howItWorksSaveState = 'error';
        this.howItWorksSaveError = err?.error?.error || 'Unable to save this step right now.';
      },
    });
  }

  deleteHowItWorksStep(s: HowItWorksStep) {
    if (!confirm(`Delete "${s.title}"? This cannot be undone.`)) return;
    this.admin.deleteHowItWorksStep(s.id).subscribe({
      next: () => this.loadHowItWorks(),
      error: (err) => alert(err?.error?.error || 'Unable to delete this step right now.'),
    });
  }

  // Swaps this step's order with its neighbour and persists both — no
  // separate reorder endpoint needed since order is just a plain field.
  moveHowItWorksStep(step: HowItWorksStep, direction: -1 | 1) {
    const sorted = [...this.howItWorksSteps].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((s) => s.id === step.id);
    const neighbourIndex = index + direction;
    if (neighbourIndex < 0 || neighbourIndex >= sorted.length) return;

    const neighbour = sorted[neighbourIndex];
    const stepFd = new FormData();
    stepFd.append('order', String(neighbour.order));
    const neighbourFd = new FormData();
    neighbourFd.append('order', String(step.order));

    this.admin.updateHowItWorksStep(step.id, stepFd).subscribe({
      next: () => {
        this.admin.updateHowItWorksStep(neighbour.id, neighbourFd).subscribe({
          next: () => this.loadHowItWorks(),
          error: () => this.loadHowItWorks(),
        });
      },
      error: () => {},
    });
  }
}
