const sharp = require('sharp');

function detectJpegTrailingData(buffer) {
  for (let i = buffer.length - 2; i >= 0; i -= 1) {
    if (buffer[i] === 0xff && buffer[i + 1] === 0xd9) {
      const trailing = buffer.length - (i + 2);
      return trailing > 16 ? trailing : 0;
    }
  }
  return 0;
}

function detectPngTrailingData(buffer) {
  const iend = Buffer.from([0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
  const index = buffer.lastIndexOf(iend);
  if (index < 0) {
    return 0;
  }
  const trailing = buffer.length - (index + iend.length);
  return trailing > 0 ? trailing : 0;
}

async function evaluateLsbNoise(buffer) {
  const { data, info } = await sharp(buffer)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const sampleSize = Math.min(data.length, 220000);
  let ones = 0;
  let flips = 0;

  for (let i = 0; i < sampleSize; i += 1) {
    const bit = data[i] & 1;
    ones += bit;
    if (i > 0) {
      const prev = data[i - 1] & 1;
      if (prev !== bit) {
        flips += 1;
      }
    }
  }

  const ratio = ones / sampleSize;
  const flipRatio = sampleSize > 1 ? flips / (sampleSize - 1) : 0;
  return {
    ratio,
    flipRatio,
    width: info.width,
    height: info.height,
    channels: info.channels
  };
}

function scoreMetrics({ trailingData, lsbStats, sizeBytes }) {
  let score = 0;
  const reasons = [];

  if (trailingData > 0) {
    score += 65;
    reasons.push(`Datos adicionales al final del archivo (${trailingData} bytes).`);
  }

  const ratioDistance = Math.abs(lsbStats.ratio - 0.5);
  if (ratioDistance < 0.01) {
    score += 20;
    reasons.push('Patron LSB cercano a aleatoriedad ideal, posible insercion oculta.');
  }

  if (lsbStats.flipRatio > 0.53) {
    score += 15;
    reasons.push('Alta variacion en LSB, patron sospechoso para imagen natural.');
  }

  if (sizeBytes > 5 * 1024 * 1024) {
    score += 10;
    reasons.push('Archivo muy grande, se recomienda revision manual.');
  }

  return {
    score: Math.min(score, 100),
    reasons
  };
}

async function analyzeImageBuffer(buffer, mime) {
  let trailingData = 0;
  if (mime === 'image/jpeg') {
    trailingData = detectJpegTrailingData(buffer);
  } else if (mime === 'image/png') {
    trailingData = detectPngTrailingData(buffer);
  }

  const lsbStats = await evaluateLsbNoise(buffer);
  const scored = scoreMetrics({
    trailingData,
    lsbStats,
    sizeBytes: buffer.length
  });

  const suspicious = scored.score >= 50;
  return {
    suspicious,
    score: scored.score,
    reason: scored.reasons.length > 0 ? scored.reasons.join(' | ') : 'Sin indicadores fuertes.',
    details: {
      trailingData,
      lsb: lsbStats
    }
  };
}

module.exports = {
  analyzeImageBuffer
};
