import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Faq, HowItWorksStep, Testimonial } from '../models/product.model';

export interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly api = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getTestimonials(): Observable<{ count: number; testimonials: Testimonial[] }> {
    return this.http.get<{ count: number; testimonials: Testimonial[] }>(`${this.api}/testimonials`);
  }

  getFaqs(): Observable<{ count: number; faqs: Faq[] }> {
    return this.http.get<{ count: number; faqs: Faq[] }>(`${this.api}/faqs`);
  }

  getHowItWorks(): Observable<{ count: number; steps: HowItWorksStep[] }> {
    return this.http.get<{ count: number; steps: HowItWorksStep[] }>(`${this.api}/how-it-works`);
  }

  submitContact(payload: ContactPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.api}/contact`, payload);
  }

  subscribeNewsletter(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.api}/newsletter`, { email });
  }
}
