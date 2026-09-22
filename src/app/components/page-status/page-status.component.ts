import { booleanAttribute, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PageState } from '../../models/page-state.model';

type Status = Exclude<PageState, 'loaded'>;

const MESSAGES: Record<Status, string> = {
  loading: 'Loading…',
  empty: 'No data available.',
  error: 'Unable to load the data. Please try again later.'
};

@Component({
  selector: 'app-page-status',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './page-status.component.html'
})
export class PageStatusComponent {
  @Input({ required: true }) state: Status = 'loading';
  @Input() message = '';
  @Input({ transform: booleanAttribute }) backLink = false;

  get text(): string {
    return this.message || MESSAGES[this.state];
  }
}
