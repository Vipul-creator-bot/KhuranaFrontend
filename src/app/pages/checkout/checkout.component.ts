import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, map } from 'rxjs';
import { ProductService } from '../../core/services/product.service';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { DeliveryService, Coordinates } from '../../core/services/delivery.service';
import { Product } from '../../core/models/product.model';
import { RazorpayOptions, RazorpayPaymentResponse } from '../../core/models/razorpay.model';

type PayState = 'idle' | 'creating-order' | 'awaiting-payment' | 'verifying' | 'success' | 'error';
type LocationStatus = 'checking' | 'available' | 'unavailable' | 'denied' | 'unsupported' | 'idle';
type CustomerType = 'B2B' | 'B2C';

// Standard 15-character GSTIN: 2-digit state code, 10-char PAN, 1-digit entity
// number, literal 'Z', 1-char checksum. e.g. 07AABCU9603R1ZM
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// The regex above only checks the *shape* of a GSTIN — it can't tell a typo'd
// check digit from a real one, since the 15th char just has to be alphanumeric.
// This recomputes GSTN's official check digit (mod-36, factor alternating 2/1)
// and compares it against what was entered, so a mistyped digit is caught.
const GSTIN_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function isGstinChecksumValid(gstin: string): boolean {
  if (!GSTIN_REGEX.test(gstin)) return false;
  let factor = 1;
  let sum = 0;
  for (let i = 0; i < gstin.length - 1; i++) {
    let digit = factor * GSTIN_CHARSET.indexOf(gstin[i]);
    factor = factor === 1 ? 2 : 1;
    digit = Math.floor(digit / 36) + (digit % 36);
    sum += digit;
  }
  const checkCodePoint = (36 - (sum % 36)) % 36;
  return GSTIN_CHARSET[checkCodePoint] === gstin[gstin.length - 1];
}

interface CheckoutLine {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'kk-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit {
  // Two entry points share this component:
  //  - /checkout/:id  → quick "Buy Now" for a single product (own local qty stepper)
  //  - /checkout      → checkout for everything currently in the cart
  isCartMode = false;
  lines: CheckoutLine[] = [];
  loading = true;
  notFound = false;
  isEmpty = false;

  customerName = '';
  customerEmail = '';
  customerPhone = '';
  customerAddress = '';

  // B2B orders require a GSTIN for the Tally ledger/invoice; B2C orders never
  // collect or send one, even if the field was previously filled in.
  customerType: CustomerType = 'B2C';
  gstNumber = '';

  payState: PayState = 'idle';
  errorMessage = '';
  paymentId = '';

  // Discount info: an *estimate* shown before payment starts (based on cached
  // profile state), then overwritten with the authoritative figure the
  // backend actually charged once create-order responds.
  discountPercent = 0;
  finalAmount = 0;

  // Delivery-radius check: the browser's geolocation is used to show live
  // serviceability status here, but the backend re-checks this itself at
  // create-order time — that server-side check is what's authoritative.
  locationStatus: LocationStatus = 'idle';
  locationDistanceKm: number | null = null;
  locationMaxRadiusKm = 30;
  coordinates: Coordinates | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private paymentService: PaymentService,
    private cart: CartService,
    private delivery: DeliveryService,
    public auth: AuthService
  ) {}

  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.isCartMode = !idParam;

    const user = this.auth.currentUser;
    if (user) {
      this.customerName = user.name;
      this.customerEmail = user.email;
    }
    this.auth.firstOrderDiscountAvailable$.subscribe((available) => {
      this.discountPercent = this.auth.isLoggedIn && available ? 5 : 0;
      this.recomputeEstimate();
    });

    if (this.isCartMode) {
      this.loadFromCart();
    } else {
      this.loadSingleProduct(Number(idParam));
    }

    this.checkLocation();
  }

  checkLocation() {
    this.locationStatus = 'checking';
    this.delivery
      .getBrowserLocation()
      .then((coords) => {
        this.coordinates = coords;
        this.delivery.checkAvailability(coords.latitude, coords.longitude).subscribe({
          next: (res) => {
            this.locationStatus = res.withinRange ? 'available' : 'unavailable';
            this.locationDistanceKm = res.distanceKm;
            this.locationMaxRadiusKm = res.maxRadiusKm;
          },
          error: () => {
            this.locationStatus = 'unavailable';
          },
        });
      })
      .catch((err) => {
        this.coordinates = null;
        this.locationStatus = err?.code === 1 ? 'denied' : err?.message === 'unsupported' ? 'unsupported' : 'denied';
      });
  }

  private loadSingleProduct(id: number) {
    this.productService.getProduct(id).subscribe({
      next: (product) => {
        this.lines = [{ product, quantity: 1 }];
        this.recomputeEstimate();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notFound = true;
      },
    });
  }

  private loadFromCart() {
    combineLatest([this.cart.items$, this.productService.getProducts()])
      .pipe(
        map(([cartItems, productsRes]) => {
          const byId = new Map(productsRes.products.map((p) => [p.id, p]));
          return cartItems
            .map((item) => {
              const product = byId.get(item.productId);
              return product ? { product, quantity: item.quantity } : null;
            })
            .filter((line): line is CheckoutLine => line !== null);
        })
      )
      .subscribe((lines) => {
        this.lines = lines;
        this.isEmpty = lines.length === 0;
        this.recomputeEstimate();
        this.loading = false;
      });
  }

  incrementQty(line: CheckoutLine) {
    if (line.quantity >= 10) return;
    if (this.isCartMode) this.cart.updateQuantity(line.product.id, line.quantity + 1);
    else {
      line.quantity++;
      this.recomputeEstimate();
    }
  }
  decrementQty(line: CheckoutLine) {
    if (line.quantity <= 1) return;
    if (this.isCartMode) this.cart.updateQuantity(line.product.id, line.quantity - 1);
    else {
      line.quantity--;
      this.recomputeEstimate();
    }
  }

  get baseTotal(): number {
    return this.lines.reduce((sum, line) => sum + line.product.salePrice * line.quantity, 0);
  }

  private recomputeEstimate() {
    this.finalAmount = Math.round(this.baseTotal * (1 - this.discountPercent / 100));
  }

  goToLogin() {
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }
  goToRegister() {
    this.router.navigate(['/register'], { queryParams: { returnUrl: this.router.url } });
  }

  // Switching back to B2C clears any GST number typed while B2B was selected —
  // a B2C order must never carry one forward.
  onCustomerTypeChange() {
    if (this.customerType === 'B2C') {
      this.gstNumber = '';
    }
  }

  get isGstValid(): boolean {
    return isGstinChecksumValid(this.gstNumber.trim().toUpperCase());
  }

  get canPay(): boolean {
    const gstOk = this.customerType === 'B2C' || this.isGstValid;
    return (
      this.locationStatus === 'available' &&
      !!this.coordinates &&
      this.customerAddress.trim().length >= 10 &&
      gstOk
    );
  }

  payNow() {
    if (!this.lines.length || !this.coordinates || this.locationStatus !== 'available') return;
    if (this.customerAddress.trim().length < 10) {
      this.errorMessage = 'Please enter your complete delivery address.';
      this.payState = 'error';
      return;
    }
    if (this.customerType === 'B2B' && !this.isGstValid) {
      this.errorMessage = 'Please enter a valid 15-character GST number for a B2B order.';
      this.payState = 'error';
      return;
    }
    this.errorMessage = '';
    this.payState = 'creating-order';

    const items = this.lines.map((line) => ({ productId: line.product.id, quantity: line.quantity }));
    // Never send a GST number for a B2C order, regardless of what's in the field.
    const gstNumber = this.customerType === 'B2B' ? this.gstNumber.trim().toUpperCase() : '';

    this.paymentService
      .createOrder(items, this.coordinates, this.customerAddress.trim(), this.customerType, gstNumber)
      .subscribe({
      next: (order) => {
        // Use the server's authoritative discount/amount — it re-checks
        // eligibility itself and is what actually gets charged.
        this.discountPercent = order.discountPercent;
        this.finalAmount = order.finalAmount;
        this.payState = 'awaiting-payment';
        this.openRazorpay(order);
      },
      error: (err) => {
        this.payState = 'error';
        if (err?.error?.code === 'OUT_OF_DELIVERY_RANGE') {
          this.locationStatus = 'unavailable';
          this.locationDistanceKm = err.error.distanceKm;
        }
        this.errorMessage =
          err?.error?.error ||
          'Unable to start payment right now. Please try again in a moment.';
      },
    });
  }

  private openRazorpay(order: { orderId: string; amount: number; currency: string; keyId: string }) {
    const firstItem = this.lines[0]?.product;
    const description =
      this.lines.length === 1 ? firstItem?.name : `${this.lines.length} items from Khurana Kitchenware`;

    const options: RazorpayOptions = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: 'Khurana Kitchenware Private Limited',
      description,
      image: firstItem?.image,
      order_id: order.orderId,
      prefill: {
        name: this.customerName || undefined,
        email: this.customerEmail || undefined,
        contact: this.customerPhone || undefined,
      },
      theme: { color: '#A9662E' },
      handler: (response: RazorpayPaymentResponse) => this.onPaymentSuccess(response),
      modal: {
        ondismiss: () => {
          if (this.payState !== 'success') {
            this.payState = 'idle';
          }
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  }

  private onPaymentSuccess(response: RazorpayPaymentResponse) {
    this.payState = 'verifying';
    this.paymentService.verifyPayment(response).subscribe({
      next: (res) => {
        if (res.verified) {
          this.payState = 'success';
          this.paymentId = response.razorpay_payment_id;
          if (this.isCartMode) this.cart.clear();
          // Refresh profile so the discount banner correctly disappears on the next order.
          this.auth.refreshProfile().subscribe();
        } else {
          this.payState = 'error';
          this.errorMessage = 'We could not verify this payment. Please contact our support team.';
        }
      },
      error: () => {
        this.payState = 'error';
        this.errorMessage = 'We could not verify this payment. Please contact our support team.';
      },
    });
  }
}
