import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'kk-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  model = { name: '', email: '', phone: '', password: '' };
  status: 'idle' | 'loading' | 'error' = 'idle';
  errorMessage = '';
  returnUrl = '/';

  constructor(private auth: AuthService, private router: Router, private route: ActivatedRoute) {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
  }

  submit(form: NgForm) {
    if (form.invalid) return;
    this.status = 'loading';
    this.auth.register(this.model.name, this.model.email, this.model.password, this.model.phone).subscribe({
      next: () => {
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.status = 'error';
        this.errorMessage = err?.error?.error || 'Unable to create your account. Please try again.';
      },
    });
  }
}
