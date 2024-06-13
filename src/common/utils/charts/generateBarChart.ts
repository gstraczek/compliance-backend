import 'chartjs-adapter-dayjs-4';

import { createCanvas } from 'canvas';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  LegendOptions,
  LogarithmicScale,
  TimeScale,
  TimeSeriesScale,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import xbytes from 'xbytes';

import { customCanvasBackgroundColor } from './plugins';

type Color = string;
export interface BarChartEntry {
  label: string;
  data: {
    x: number;
    y: string;
    label: string;
  }[];
  backgroundColor: string[];
  borderWidth: number;
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
}

export default class GenerateBarChart {
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
      TimeSeriesScale
    );
  }

  public static getBase64Image(datasets: BarChartEntry[], opts: BarOptions): string {
    const canvas = createCanvas(opts?.width ?? 2000, opts?.height ?? 1000);
    const ctx = canvas.getContext('2d');

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        // labels: datasets.map((entry) => {
        //   return Number(entry.label);
        // }),
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
            offset: 5,
            anchor: 'center',
            align: 'center',
            clamp: true,
            font: {
              size: 20,
              weight: 800,
            },
            formatter: (_, context) => {
              const data: any = context.dataset.data[context.dataIndex];
              return data.label;
            },
          },
        },
        scales: {
          y: {
            stacked: true,
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
            stacked: true,
            type: 'time',
            // type: 'timeseries',
            title: {
              display: true,
              text: opts.titleXText,
            },
            time: {
              displayFormats: {
                day: 'YYYY-MM-DD',
              },
            },
          },
        },
      },
      plugins: [customCanvasBackgroundColor],
    });
    return chart.toBase64Image().split(',')[1];
  }
}
