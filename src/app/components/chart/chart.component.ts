import {
  AfterViewInit,
  booleanAttribute,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  ViewChild
} from '@angular/core';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartConfiguration,
  LinearScale,
  LineController,
  LineElement,
  Plugin,
  PointElement,
  Tooltip
} from 'chart.js';
import { toFont } from 'chart.js/helpers';

import { ChartItem } from '../../models/chart-item.model';

// Same values as $color-primary and $color-text in src/styles/_variables.scss
const CHART_COLOR = '#0a7a82';
const CHART_TEXT_COLOR = '#1f1f1f';
const CHART_PALETTE = ['#6b86b3', '#7a3c53', '#c06200', '#8f6263', '#94819d'];
const LABEL_OFFSET = { x: 6, y: 2 };

const barLabels: Plugin<'bar' | 'line'> = {
  id: 'barLabels',
  afterDatasetsDraw: (chart) => {
    const { ctx } = chart;
    const labels = chart.data.labels ?? [];
    ctx.save();
    ctx.font = toFont(Chart.defaults.font).string;
    ctx.fillStyle = CHART_TEXT_COLOR;
    ctx.textBaseline = 'bottom';
    chart.getDatasetMeta(0).data.forEach((bar, index) => {
      const { base, y, height } = bar.getProps(['base', 'y', 'height'], true);
      ctx.fillText(String(labels[index]), base + LABEL_OFFSET.x, y - height / 2 - LABEL_OFFSET.y);
    });
    ctx.restore();
  }
};

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip
);

// Chart text size (Chart.js default: 12px)
Chart.defaults.font.size = 14;

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss'
})
export class ChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) type: 'bar' | 'line' = 'bar';
  @Input({ required: true }) items: ChartItem[] = [];
  @Input({ required: true }) description = '';
  @Input({ transform: booleanAttribute }) showDescription = false;
  @Input({ transform: booleanAttribute }) multicolor = false;
  @Output() itemClick = new EventEmitter<number>();

  @ViewChild('canvas', { static: true }) private canvas?: ElementRef<HTMLCanvasElement>;
  private chart?: Chart<'bar' | 'line'>;

  get ariaLabel(): string {
    const values = this.items.map((item) => `${item.label}: ${item.value}`).join(', ');
    return `${this.description}. ${values}`;
  }

  ngAfterViewInit(): void {
    this.render();
  }

  ngOnChanges(): void {
    if (this.chart) {
      this.render();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private render(): void {
    if (!this.canvas) {
      return;
    }
    this.chart?.destroy();
    this.chart = new Chart(this.canvas.nativeElement, this.buildConfiguration());
  }

  private buildConfiguration(): ChartConfiguration<'bar' | 'line'> {
    const isBar = this.type === 'bar';
    return {
      type: this.type,
      data: {
        labels: this.items.map((item) => item.label),
        datasets: [
          {
            data: this.items.map((item) => item.value),
            backgroundColor: this.multicolor
              ? this.items.map((_item, index) => CHART_PALETTE[index % CHART_PALETTE.length])
              : CHART_COLOR,
            borderColor: CHART_COLOR,
            barPercentage: 0.6
          }
        ]
      },
      options: {
        indexAxis: isBar ? 'y' : 'x',
        layout: { padding: { top: isBar ? 8 : 0 } },
        maintainAspectRatio: false,
        scales: {
          x: { beginAtZero: true },
          y: {
            beginAtZero: true,
            grid: { display: !isBar },
            ticks: { display: !isBar }
          }
        },
        onClick: (_event, elements) => {
          const index = elements[0]?.index;
          if (index !== undefined) {
            this.itemClick.emit(this.items[index].id);
          }
        },
        onHover: (event, elements) => {
          const target = event.native?.target;
          if (target instanceof HTMLElement) {
            target.style.cursor = elements.length > 0 && this.itemClick.observed ? 'pointer' : 'default';
          }
        }
      },
      plugins: isBar ? [barLabels] : []
    };
  }
}
