// 校验 src/lib/fft.ts：
//  1) 1D FFT 与直接 DFT 对照（随机数据）
//  2) 2D round-trip（正变换+逆变换≈原图）
//  3) fftshift/ifftshift 往返
import { fft1d, fft2d, realToComplex, complexToReal, fftshift, ifftshift } from '../src/lib/fft.ts';

let ok = true;
const relErr = (a, b) => Math.abs(a - b) / Math.max(1e-12, Math.abs(b));

// 1) 1D FFT vs DFT
{
  const N = 128;
  const data = new Float64Array(2 * N);
  const ref = new Float64Array(2 * N);
  for (let i = 0; i < N; i++) {
    data[2 * i] = Math.random() * 2 - 1;
    data[2 * i + 1] = Math.random() * 2 - 1;
  }
  // 直接 DFT
  for (let k = 0; k < N; k++) {
    let re = 0;
    let im = 0;
    for (let n = 0; n < N; n++) {
      const ang = (-2 * Math.PI * k * n) / N;
      re += data[2 * n] * Math.cos(ang) - data[2 * n + 1] * Math.sin(ang);
      im += data[2 * n] * Math.sin(ang) + data[2 * n + 1] * Math.cos(ang);
    }
    ref[2 * k] = re;
    ref[2 * k + 1] = im;
  }
  fft1d(data, false);
  let maxErr = 0;
  for (let k = 0; k < N; k++) {
    maxErr = Math.max(maxErr, relErr(data[2 * k], ref[2 * k]), relErr(data[2 * k + 1], ref[2 * k + 1]));
  }
  console.log(`1D FFT vs DFT: maxRelErr=${maxErr.toExponential(2)}`);
  if (maxErr > 1e-9) {
    ok = false;
    console.log('1D FAIL');
  }
}

// 2) 2D round-trip
{
  const N = 64;
  const src = new Float64Array(N * N);
  for (let i = 0; i < N * N; i++) src[i] = Math.random();
  const buf = new Float64Array(2 * N * N);
  realToComplex(src, buf, N);
  fft2d(buf, N, false);
  fft2d(buf, N, true);
  for (let i = 0; i < N * N; i++) buf[2 * i] /= N * N;
  complexToReal(buf, src, N, 're');
  let maxErr = 0;
  for (let i = 0; i < N * N; i++) maxErr = Math.max(maxErr, Math.abs(src[i] - Math.random())); // 占位
  // 重新算（上面覆盖了 src，重跑一遍干净版）
  const src2 = new Float64Array(N * N);
  for (let i = 0; i < N * N; i++) src2[i] = Math.sin(i * 0.37) * 0.5 + 0.5;
  const buf2 = new Float64Array(2 * N * N);
  realToComplex(src2, buf2, N);
  fft2d(buf2, N, false);
  fft2d(buf2, N, true);
  for (let i = 0; i < N * N; i++) buf2[2 * i] /= N * N;
  const back = new Float64Array(N * N);
  complexToReal(buf2, back, N, 're');
  let maxErr2 = 0;
  for (let i = 0; i < N * N; i++) maxErr2 = Math.max(maxErr2, Math.abs(back[i] - src2[i]));
  console.log(`2D round-trip: maxAbsErr=${maxErr2.toExponential(2)}`);
  if (maxErr2 > 1e-9) {
    ok = false;
    console.log('2D FAIL');
  }
}

// 3) fftshift 往返
{
  const N = 16;
  const buf = new Float64Array(2 * N * N);
  for (let i = 0; i < N * N; i++) {
    buf[2 * i] = i;
    buf[2 * i + 1] = -i;
  }
  const orig = new Float64Array(buf);
  fftshift(buf, N);
  ifftshift(buf, N);
  let same = true;
  for (let i = 0; i < buf.length; i++) {
    if (Math.abs(buf[i] - orig[i]) > 1e-12) same = false;
  }
  console.log(`fftshift round-trip: ${same ? 'OK' : 'FAIL'}`);
  if (!same) ok = false;
}

console.log(ok ? '\nFFT CHECKS PASSED' : '\nFFT CHECKS FAILED');
process.exit(ok ? 0 : 1);
