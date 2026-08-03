import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'Khurana Kitchenware | Premium Cookware & Kitchen Essentials',
  },
  {
    path: 'shop',
    loadComponent: () => import('./pages/shop/shop.component').then((m) => m.ShopComponent),
    title: 'Shop | Khurana Kitchenware',
  },
  {
    path: 'product/:id',
    loadComponent: () =>
      import('./pages/product-detail/product-detail.component').then((m) => m.ProductDetailComponent),
    title: 'Product | Khurana Kitchenware',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
    title: 'Log In | Khurana Kitchenware',
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then((m) => m.RegisterComponent),
    title: 'Create Account | Khurana Kitchenware',
  },
  {
    path: 'cart',
    loadComponent: () => import('./pages/cart/cart.component').then((m) => m.CartComponent),
    title: 'Your Cart | Khurana Kitchenware',
  },
  {
    path: 'checkout',
    loadComponent: () => import('./pages/checkout/checkout.component').then((m) => m.CheckoutComponent),
    title: 'Checkout | Khurana Kitchenware',
  },
  {
    path: 'checkout/:id',
    loadComponent: () => import('./pages/checkout/checkout.component').then((m) => m.CheckoutComponent),
    title: 'Checkout | Khurana Kitchenware',
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then((m) => m.AboutComponent),
    title: 'About Us | Khurana Kitchenware',
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.component').then((m) => m.ContactComponent),
    title: 'Contact Us | Khurana Kitchenware',
  },
  {
    path: 'terms',
    loadComponent: () => import('./pages/terms/terms.component').then((m) => m.TermsComponent),
    title: 'Terms & Conditions | Khurana Kitchenware',
  },
  {
    path: 'returns',
    loadComponent: () => import('./pages/returns/returns.component').then((m) => m.ReturnsComponent),
    title: 'Return & Refund Policy | Khurana Kitchenware',
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.component').then((m) => m.AdminComponent),
    canActivate: [adminGuard],
    title: 'Admin | Khurana Kitchenware',
  },
  { path: '**', redirectTo: '' },
];
