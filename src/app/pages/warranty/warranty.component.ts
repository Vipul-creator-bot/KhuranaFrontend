import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'kk-warranty',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './warranty.component.html',
  styleUrl: './warranty.component.scss',
})
export class WarrantyComponent {
  effectiveDate = '[Add effective date]';
}
