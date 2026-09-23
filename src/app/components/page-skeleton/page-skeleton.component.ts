import { booleanAttribute, Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-skeleton',
  standalone: true,
  imports: [],
  templateUrl: './page-skeleton.component.html',
  styleUrl: './page-skeleton.component.scss'
})
export class PageSkeletonComponent {
  @Input({ required: true }) cards = 0;
  @Input({ transform: booleanAttribute }) intro = false;
  @Input({ transform: booleanAttribute }) caption = false;
  @Input({ transform: booleanAttribute }) backButton = false;

  get cardIndexes(): number[] {
    return Array.from({ length: this.cards }, (_value, index) => index);
  }
}
