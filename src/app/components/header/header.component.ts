import { DecimalPipe } from '@angular/common';
import { Component, Input } from '@angular/core';

import { Indicator } from '../../models/indicator.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  @Input({ required: true }) title = '';
  @Input() indicators: Indicator[] = [];
}
