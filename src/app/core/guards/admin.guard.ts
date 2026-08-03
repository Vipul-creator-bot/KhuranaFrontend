import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // initialized$ starts false and only flips to true once the initial /me
  // profile check (triggered from a stored token on app load) resolves.
  // We must wait for it to actually become true — not just take whatever
  // value happens to be current — otherwise this guard runs before that
  // async check finishes, sees currentUser as still null, and incorrectly
  // bounces a valid, already-logged-in admin back to /login.
  return auth.initialized$.pipe(
    filter((ready) => ready),
    take(1),
    map(() => {
      if (auth.currentUser?.isAdmin) return true;
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: '/admin' } });
    })
  );
};
