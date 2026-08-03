import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ContentService } from '../../core/services/content.service';

@Component({
  selector: 'kk-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent {
  model = { name: '', email: '', phone: '', subject: 'General Enquiry', message: '' };
  status: 'idle' | 'loading' | 'success' | 'error' = 'idle';
  statusMessage = '';

  constructor(private contentService: ContentService) {}

  submit(form: NgForm) {
    if (form.invalid) return;
    this.status = 'loading';
    this.contentService.submitContact(this.model).subscribe({
      next: (res) => {
        this.status = 'success';
        this.statusMessage = res.message;
        form.resetForm({ subject: 'General Enquiry' });
      },
      error: (err) => {
        this.status = 'error';
        this.statusMessage = err?.error?.error || 'Something went wrong. Please try again.';
      },
    });
  }
}
