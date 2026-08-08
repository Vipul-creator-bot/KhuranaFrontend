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
    { year: '1979 – The Beginning', text: 'KHURANA KITCHENWARE began its journey as a retail store specializing in kitchenware and household essentials. From day one, our focus was simple—provide quality products, honest pricing, and exceptional customer service.' },
    { year: '*1980s – Building Customer Trust', text: 'Throughout the 1980s, we established ourselves as a trusted destination for families seeking premium kitchenware and household products. Our commitment to quality and ethical business practices helped us build lasting customer relationships.' },
    { year: '1990 – Expansion into Hotelware Wholesale', text: 'Recognizing the growing demand from the hospitality industry, we expanded into the *Hotelware* segment and began serving hotels, restaurants, caterers, institutions, and commercial kitchens as wholesale suppliers. This marked the beginning of a new phase of sustained business growth.' },
    { year: '1990–2020 – Three Decades of Wholesale Excellence', text: 'Over the next three decades, we strengthened our position as a reliable wholesale partner by continuously expanding our product range, enhancing our supply network, and serving businesses with quality products, competitive pricing, and dependable service.' },
    
  ];


  team = [
  { name: 'Entering Brand Distribution', text: 'As the business continued to evolve, we expanded into the distribution sector, partnering with leading manufacturers to make trusted kitchenware brands more accessible across our market.' },
  { 
    name: 'Authorized Distributor of Leading Brands', 
    text: 'Today, KHURANA KITCHENWARE PVT. LTD. is proud to be an authorized distributor of renowned brands including:',
    brand:['SERVEWELL', 'COCONUT', 'RUDRA', 'SHAPES']
  },
  { name: 'Today', text: 'With *47+ years of experience, KHURANA KITCHENWARE PVT. LTD. continues to serve retail customers, wholesalers, hospitality businesses, institutions, and dealers with the same principles that have guided us since 1979—Quality, Trust, Integrity, and Customer Satisfaction*. As we look toward the future, we remain committed to innovation, expanding our product offerings, and building lasting relationships with customers and business partners alike.' },
];
}
