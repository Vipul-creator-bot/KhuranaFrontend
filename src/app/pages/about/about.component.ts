import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'kk-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {
  milestones = [
    { year: '2010', text: 'Khurana Kitchenware began as a small manufacturing unit supplying steel cookware to local retailers in Delhi NCR.' },
    { year: '2015', text: 'Expanded into bakeware and cutlery, and opened our first dedicated design and quality-testing studio.' },
    { year: '2019', text: 'Launched our premium vegan-leather serveware line — trays, coasters and cutlery stands — for the modern table.' },
    { year: '2024', text: 'Now shipping pan-India, serving thousands of homes, restaurants and corporate gifting partners.' },
  ];

  team = [
    { name: 'Manufacturing Excellence', text: 'In-house quality control at every stage, from raw material sourcing to final finishing.' },
    { name: 'Design Studio', text: 'A dedicated team focused on functional, long-lasting kitchen and table design.' },
    { name: 'Customer Care', text: 'A responsive support team for enquiries, bulk orders and after-sales care.' },
  ];
}
