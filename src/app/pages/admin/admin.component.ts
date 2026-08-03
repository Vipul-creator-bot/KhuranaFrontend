import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, Member, BroadcastResult } from '../../core/services/admin.service';

type SendState = 'idle' | 'sending' | 'success' | 'error';

@Component({
  selector: 'kk-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  members: Member[] = [];
  loadingMembers = true;

  message = '';
  sendState: SendState = 'idle';
  errorMessage = '';
  result: BroadcastResult | null = null;

  constructor(private admin: AdminService) {}

  ngOnInit(): void {
    this.admin.getMembers().subscribe({
      next: (res) => {
        this.members = res.members;
        this.loadingMembers = false;
      },
      error: () => {
        this.loadingMembers = false;
      },
    });
  }

  get membersWithPhone(): number {
    return this.members.filter((m) => m.phone).length;
  }

  sendBroadcast() {
    if (!this.message.trim()) return;
    this.sendState = 'sending';
    this.errorMessage = '';
    this.result = null;

    this.admin.sendWhatsAppBroadcast(this.message.trim()).subscribe({
      next: (res) => {
        this.sendState = 'success';
        this.result = res;
      },
      error: (err) => {
        this.sendState = 'error';
        this.errorMessage = err?.error?.error || 'Unable to send the broadcast right now.';
      },
    });
  }

  sendAnother() {
    this.sendState = 'idle';
    this.message = '';
    this.result = null;
    this.errorMessage = '';
  }
}
