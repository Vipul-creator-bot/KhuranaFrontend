import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface BroadcastResult {
  totalMembers: number;
  eligible: number;
  sent: number;
  failedCount: number;
  failed: { memberId: string; name: string; phone: string; error: string }[];
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly base = `${environment.apiBaseUrl}/admin`;

  constructor(private http: HttpClient) {}

  getMembers(): Observable<{ count: number; members: Member[] }> {
    return this.http.get<{ count: number; members: Member[] }>(`${this.base}/members`);
  }

  sendWhatsAppBroadcast(message: string): Observable<BroadcastResult> {
    return this.http.post<BroadcastResult>(`${this.base}/broadcast/whatsapp`, { message });
  }
}
