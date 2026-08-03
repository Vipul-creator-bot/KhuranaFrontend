import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'kk-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  isScrolled = false;
  isMenuOpen = false;
  isCategoriesOpen = false;
  isAccountOpen = false;

  categories = [
    'Cookware',
    'Thermoware',
    'Thermosteel',
    'Appliances',
    'Melamine',
    'Cutlery',
    'Wooden',
    'Acrylic',
    'Silicone',
    'Plastic',
    'Glassware',
    'Alluminium',
    'Brass',
    'Bronze',
    'Copper',
    'Iron',
    'Nonstick',
    'GiftItems'
  ];

  currentUser$;
  cartItemCount$;

  constructor(private auth: AuthService, private cart: CartService, private router: Router) {
    this.currentUser$ = this.auth.currentUser$;
    this.cartItemCount$ = this.cart.itemCount$;
  }

  @HostListener('window:scroll')
  onScroll() {
    this.isScrolled = window.scrollY > 24;
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
    this.isCategoriesOpen = false;
    this.isAccountOpen = false;
  }

  logout() {
    this.auth.logout();
    this.closeMenu();
    this.router.navigateByUrl('/');
  }
}
