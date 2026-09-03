export const environment = {
  production: true,
  // Backend is deployed on its own subdomain, not the same origin as the
  // frontend — must be an absolute URL, not a relative '/api' path.
  apiBaseUrl: 'https://api.khuranakitchenware.com/api',
};
