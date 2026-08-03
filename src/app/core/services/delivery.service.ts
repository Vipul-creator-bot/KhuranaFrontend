import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DeliveryCheckResult {
  withinRange: boolean;
  distanceKm: number;
  maxRadiusKm: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

@Injectable({ providedIn: 'root' })
export class DeliveryService {
  private readonly base = `${environment.apiBaseUrl}/data/delivery`;

  constructor(private http: HttpClient) {}

  /** Wraps the browser Geolocation API in a Promise for easy async/await use. */
  getBrowserLocation(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('unsupported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }

  checkAvailability(latitude: number, longitude: number): Observable<DeliveryCheckResult> {
    const params = new HttpParams().set('lat', latitude).set('lng', longitude);
    return this.http.get<DeliveryCheckResult>(`${this.base}/check`, { params });
  }
}
