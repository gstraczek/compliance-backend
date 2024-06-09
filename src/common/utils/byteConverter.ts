import ByteConverter from '@wtfcode/byte-converter';

interface ByteConverterAutoscaleOptions {
  preferByte: boolean;
  preferBit: boolean;
  preferBinary: boolean;
  preferDecimal: boolean;
  preferSameBase: boolean;
  preferOppositeBase: boolean;
  preferSameUnit: boolean;
  preferOppositeUnit: boolean;
  // eslint-disable-next-line @typescript-eslint/ban-types
  handler: (curDataFormat: string, isUppingDataFormat: boolean) => {};
}

interface ByteConverterAutoscaleOptions {
  preferByte: boolean;
  preferBit: boolean;
  preferBinary: boolean;
  preferDecimal: boolean;
  preferSameBase: boolean;
  preferOppositeBase: boolean;
  preferSameUnit: boolean;
  preferOppositeUnit: boolean;
  // eslint-disable-next-line @typescript-eslint/ban-types
  handler: (curDataFormat: string, isUppingDataFormat: boolean) => {};
}

export function bytesToiB(inputBytes: number, isBinary: boolean): string {
  const byteConverter = new ByteConverter();
  const options: {
    preferByte: boolean;
    preferBinary: boolean;
    preferDecimal: boolean;
  } = {
    preferByte: true,
    preferBinary: isBinary,
    preferDecimal: !isBinary,
  };
  let autoscale = byteConverter.autoScale(inputBytes, 'B', options as ByteConverterAutoscaleOptions);
  let stringVal = '';
  if (autoscale.dataFormat === 'YiB') {
    autoscale = byteConverter.autoScale(inputBytes - 32, 'B', options as ByteConverterAutoscaleOptions);
    return `${autoscale.value.toFixed(1)}${autoscale.dataFormat}`;
  }
  stringVal = String(autoscale.value);

  const indexOfDot = stringVal.indexOf('.');
  return `${stringVal.substring(
    0,
    indexOfDot > 0 ? indexOfDot : stringVal.length
  )}${indexOfDot > 0 ? stringVal.substring(indexOfDot, indexOfDot + 3) : ''}${autoscale.dataFormat}`;
}
