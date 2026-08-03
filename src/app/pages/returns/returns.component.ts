import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'kk-returns',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './returns.component.html',
  styleUrl: './returns.component.scss',
})
export class ReturnsComponent {
  lastUpdated = 'July 2026';
}
