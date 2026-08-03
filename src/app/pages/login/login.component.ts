import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'kk-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  model = { email: '', password: '' };
  status: 'idle' | 'loading' | 'error' = 'idle';
  errorMessage = '';
  returnUrl = '/';

  constructor(private auth: AuthService, private router: Router, private route: ActivatedRoute) {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
  }

  submit(form: NgForm) {
    if (form.invalid) return;
    this.status = 'loading';
    this.auth.login(this.model.email, this.model.password).subscribe({
      next: () => {
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.status = 'error';
        this.errorMessage = err?.error?.error || 'Unable to log in. Please try again.';
      },
    });
  }
}
