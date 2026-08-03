import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NewsletterComponent } from '../newsletter/newsletter.component';

@Component({
  selector: 'kk-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, NewsletterComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  year = new Date().getFullYear();
}
