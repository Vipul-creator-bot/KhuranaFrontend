import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContentService } from '../../../core/services/content.service';

@Component({
  selector: 'kk-newsletter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './newsletter.component.html',
  styleUrl: './newsletter.component.scss',
})
export class NewsletterComponent {
  email = '';
  status: 'idle' | 'loading' | 'success' | 'error' = 'idle';
  statusMessage = '';

  constructor(private content: ContentService) {}

  submit() {
    if (!this.email) return;
    this.status = 'loading';
    this.content.subscribeNewsletter(this.email).subscribe({
      next: (res) => {
        this.status = 'success';
        this.statusMessage = res.message;
        this.email = '';
      },
      error: (err) => {
        this.status = 'error';
        this.statusMessage = err?.error?.error || 'Something went wrong. Please try again.';
      },
    });
  }
}
