import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ProductService } from '../../core/services/product.service';
import { ContentService } from '../../core/services/content.service';
import { Category, Faq, HowItWorksStep, Product, Testimonial } from '../../core/models/product.model';
import { TiltDirective } from '../../shared/directives/tilt.directive';

@Component({
  selector: 'kk-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent, TiltDirective],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  categories: Category[] = [];
  bestSellers: Product[] = [];
  testimonials: Testimonial[] = [];
  faqs: Faq[] = [];
  howItWorksSteps: HowItWorksStep[] = [];
  openFaqId: number | null = null;
  loading = true;

  values = [
    {
      title: 'Enduring Quality',
      text: 'Every piece is engineered from premium-grade materials to withstand daily use for years, not seasons.',
    },
    {
      title: 'Thoughtful Design',
      text: 'We design for the way you actually cook, serve and live — form always follows function.',
    },
    {
      title: 'Honest Craftsmanship',
      text: 'From sourcing to finishing, our process is built on transparency and consistent standards.',
    },
  ];

  constructor(private productService: ProductService, private contentService: ContentService) {}

  ngOnInit(): void {
    forkJoin({
      categories: this.productService.getCategories(),
      bestSellers: this.productService.getProducts({ featured: true }),
      testimonials: this.contentService.getTestimonials(),
      faqs: this.contentService.getFaqs(),
      howItWorks: this.contentService.getHowItWorks(),
    }).subscribe({
      next: ({ categories, bestSellers, testimonials, faqs, howItWorks }) => {
        this.categories = categories.categories;
        this.bestSellers = bestSellers.products;
        this.testimonials = testimonials.testimonials;
        this.faqs = faqs.faqs;
        this.howItWorksSteps = howItWorks.steps;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  toggleFaq(id: number) {
    this.openFaqId = this.openFaqId === id ? null : id;
  }
}
