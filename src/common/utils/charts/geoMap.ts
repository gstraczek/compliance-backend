import * as worldJson from 'assets/countries-110m.json';
import { createCanvas } from 'canvas';
import { Chart, PointElement } from 'chart.js';
import * as ChartGeo from 'chartjs-chart-geo';
import {
  BubbleMapController,
  Feature,
  GeoFeature,
  ProjectionScale,
  SizeLogarithmicScale,
  SizeScale,
} from 'chartjs-chart-geo';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { GeometryCollection } from 'topojson-specification';

export interface GeoMapEntry {
  label: string;
  value: number;
  latitude: number;
  longitude: number;
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export default class GeoMap {
  private static countries: Feature[];

  static {
    Chart.register(
      BubbleMapController,
      ProjectionScale,
      SizeScale,
      SizeLogarithmicScale,
      GeoFeature,
      ChartDataLabels,
      PointElement
    );
    const world = worldJson as any;
    GeoMap.countries = ChartGeo.topojson.feature(world, world.objects.countries as GeometryCollection).features;
  }

  public static getImage(entries: GeoMapEntry[], width = 2000, height = 1000): string {
    const canvas = createCanvas(width, height) as any;
    const doc = {
      createElement: () => {
        return createCanvas(width, height);
      },
    };

    canvas.ownerDocument = doc;

    const ctx = canvas.getContext('2d');

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const chart = new Chart(ctx, <any>{
      type: ChartGeo.BubbleMapController.id,
      data: {
        labels: entries.map((e) => e.label),
        datasets: [
          {
            outline: GeoMap.countries,
            outlineBackgroundColor: '#BDBDBD',
            outlineBorderWidth: 0.3,
            outlineBorderColor: '#424242',
            showOutline: true,
            backgroundColor: 'rgba(0, 0, 255,0.5)',
            data: entries,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            display: false,
          },
          datalabels: {
            align: 'top',
            color: 'rgba(0, 0, 255,0.5)',
            font: {
              size: 18,
              weight: 'bold',
            },
            padding: {
              bottom: 20,
            },
            formatter: (v: GeoMapEntry) => {
              return v.label;
            },
          },
        },
        scales: {
          projection: {
            projection: 'equirectangular',
            axis: 'xy',
          },
          r: {
            type: 'sizeLogarithmic',
            range: [5, 20],
            min: 0,
            max: 100,
          },
        },
      },
    });

    return chart.toBase64Image().split(',')[1];
  }
}
