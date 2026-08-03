import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TiltDirective } from '../../directives/tilt.directive';

@Component({
  selector: 'kk-media-gallery',
  standalone: true,
  imports: [CommonModule, TiltDirective],
  templateUrl: './media-gallery.component.html',
  styleUrl: './media-gallery.component.scss',
})
export class MediaGalleryComponent implements OnChanges {
  @Input({ required: true }) images: string[] = [];
  @Input() video?: string;
  @Input({ required: true }) alt = '';
  @Input() badge: string | null = null;

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
