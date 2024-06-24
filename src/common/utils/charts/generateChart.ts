import 'chartjs-adapter-date-fns';

import { createCanvas } from 'canvas';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  LegendOptions,
  LinearScale,
  LogarithmicScale,
  TimeScale,
  Title,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import xbytes from 'xbytes';

import { customCanvasBackgroundColor } from './plugins';

type Color = string;
export interface BarChartEntry {
  labels?: string;
  data: {
    x: string;
    y: number;
    label?: string;
  }[];
  backgroundColor: string[];
  borderWidth?: number;
  categoryPercentage?: number;
  barPercentage?: number;
}

interface BarOptions {
  title: string;
  titleYText: string;
  titleXText: string;
  legendOpts?: Partial<LegendOptions<'bar'>>;
  backgroundColors?: Color[];
  borderColors?: Color[];
  width?: number;
  height?: number;
  labels?: string[];
}

export default class GenerateChart {
  static {
    Chart.defaults.font.weight = 'bold';
    Chart.defaults.font.size = 24;
    Chart.register(
      ChartDataLabels,
      LogarithmicScale,
      CategoryScale,
      BarController,
      BarElement,
      TimeScale,
      LinearScale,
      Title
    );
  }

  public static getBase64Image(datasets: BarChartEntry[], opts: BarOptions): string {
    const canvas = createCanvas(opts?.width ?? 2000, opts?.height ?? 1200);
    const ctx = canvas.getContext('2d');

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: opts.labels,
        datasets: datasets,
      },
      options: {
        elements: {
          bar: {
            borderRadius: 10,
          },
        },
        plugins: {
          legend: opts.legendOpts,
          title: {
            display: true,
            text: opts.title,
          },
          customCanvasBackgroundColor: {
            color: '#fff',
          },
          datalabels: {
            display: false,
          },
        },
        scales: {
          y: {
            type: 'logarithmic',
            title: {
              display: true,
              text: opts.titleYText,
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              callback: (tickValue: number | string) => {
                return xbytes(tickValue as number, { iec: true, fixed: 0 });
              },
            },
          },
          x: {
            type: 'time',
            time: {
              displayFormats: {
                day: 'yy-MM-dd',
              },
            },
            stacked: true,
            title: {
              display: true,
              text: opts.titleXText,
            },
          },
        },
      },
      plugins: [customCanvasBackgroundColor],
    });
    return chart.toBase64Image().split(',')[1];
  }
  public static getBase64HistogramImage(datasets: BarChartEntry[], opts: BarOptions): string {
    const canvas = createCanvas(opts?.width ?? 2000, opts?.height ?? 1000);
    const ctx = canvas.getContext('2d');
    const labels = opts.labels;
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: datasets,
      },
      options: {
        plugins: {
          legend: opts.legendOpts,
          title: {
            display: true,
            text: opts.title,
          },
          customCanvasBackgroundColor: {
            color: '#fff',
          },
          datalabels: {
            display: false,
          },
        },
        scales: {
          y: {
            ticks: {
              callback: function (value) {
                return Number.isInteger(value) ? value : null;
              },
            },
            title: {
              display: true,
              text: opts.titleYText,
            },
          },
          x: {
            title: {
              display: true,
              text: opts.titleXText,
            },
          },
        },
      },
      plugins: [customCanvasBackgroundColor],
    });
    return chart.toBase64Image().split(',')[1];
  }
}
