import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Category } from '../../../core/models/product.model';
import { TiltDirective } from '../../directives/tilt.directive';

@Component({
  selector: 'kk-category-hero',
  standalone: true,
  imports: [CommonModule, TiltDirective],
  templateUrl: './category-hero.component.html',
  styleUrl: './category-hero.component.scss',
})
export class CategoryHeroComponent implements OnChanges {
  @Input({ required: true }) category!: Category;

  activeImageIndex = 0;
  showVideo = false;

  ngOnChanges(): void {
    this.activeImageIndex = 0;
    this.showVideo = false;
  }

  selectImage(index: number) {
    this.showVideo = false;
    this.activeImageIndex = index;
  }

  playVideo() {
    this.showVideo = true;
  }
}
