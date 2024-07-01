import './timeScalePlugin';

import { createCanvas } from 'canvas';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartType,
  LegendOptions,
  LinearScale,
  LogarithmicScale,
  TimeScale,
  Title,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import xbytes from 'xbytes';

import { customCanvasBackgroundColor, customNoData } from './plugins';
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

declare module 'chart.js' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface PluginOptionsByType<TType extends ChartType> {
    customCanvasBackgroundColor?: {
      color: string;
    };
  }
}
export default class GenerateChart {
  constructor() {
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

  getBase64Image(datasets: BarChartEntry[], opts: BarOptions): string {
    const canvas = createCanvas(opts?.width ?? 2000, opts?.height ?? 1200) as any;
    const ctx = canvas.getContext('2d');

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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
  getBase64HistogramImage(datasets: BarChartEntry[], opts: BarOptions): string {
    const canvas = createCanvas(opts?.width ?? 2000, opts?.height ?? 1000) as any;
    const ctx = canvas.getContext('2d');
    const labels = opts.labels;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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
            font: {
              size: 50,
            },
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
              callback: function (value: any) {
                return Number.isInteger(value) ? value : null;
              },
              font: {
                size: 50,
              },
            },
            title: {
              display: true,
              text: opts.titleYText,
              font: {
                size: 50,
              },
            },
          },
          x: {
            ticks: {
              font: {
                size: 50,
              },
            },
            title: {
              display: true,
              text: opts.titleXText,
              font: {
                size: 50,
              },
            },
          },
        },
      },
      plugins: [customCanvasBackgroundColor, customNoData],
    });
    return chart.toBase64Image().split(',')[1];
  }
}
