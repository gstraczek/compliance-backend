import { Chart } from 'chart.js';

export const customCanvasBackgroundColor = {
  id: 'customCanvasBackgroundColor',
  beforeDraw: (chart: Chart, _args: any, options: { color: string }) => {
    const { ctx } = chart;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = options.color !== '' ? options.color : '#fff';
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  },
};

export const customNoData = {
  id: 'customNoData',
  beforeDraw: (chart: Chart) => {
    if (chart.data.datasets.length === 0 || chart.data.datasets[0].data.length === 0) {
      const ctx = chart.ctx;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = "40px normal 'Helvetica Nueue'";
      ctx.fillText('No data', chart.width / 2, chart.height / 2);
      ctx.restore();
    }
  },
};
