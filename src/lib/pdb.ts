/**
 * pdb.ts —— 极简 PDB 文件解析器（第 10 幕检查清单用）
 *
 * 只提取关键校验字段，不做完整 PDB 解析。所有字段都对应正文里讲过的概念。
 */

export interface PdbStats {
  id: string;
  method: string;
  resolution: number | null;
  rValue: number | null;
  rFree: number | null;
  completeness: number | null;
  missingResidues: number;
  nAtoms: number;
  nHetatm: number;
  meanB: number | null;
  spaceGroup: string | null;
  redundancy: number | null;
  iSigma: number | null;
}

function numOf(s: string | undefined): number | null {
  if (s === undefined || s === null) return null;
  const m = s.match(/[-+]?\d*\.?\d+/);
  return m ? parseFloat(m[0]) : null;
}

export function parsePdb(text: string, id: string): PdbStats {
  const stats: PdbStats = {
    id,
    method: '',
    resolution: null,
    rValue: null,
    rFree: null,
    completeness: null,
    missingResidues: 0,
    nAtoms: 0,
    nHetatm: 0,
    meanB: null,
    spaceGroup: null,
    redundancy: null,
    iSigma: null,
  };

  let bSum = 0;
  let bCount = 0;

  for (const raw of text.split('\n')) {
    const line = raw.replace(/\s+$/, '');
    if (line.startsWith('EXPDTA')) {
      stats.method = line.slice(10).trim().split(/[,;]/)[0] || 'unknown';
    } else if (line.startsWith('CRYST1')) {
      stats.spaceGroup = line.slice(55, 66).trim() || null;
    } else if (line.startsWith('REMARK   2')) {
      const res = numOf(line.match(/RESOLUTION\.?\s+([\d.]+)/)?.[1]);
      if (res !== null) stats.resolution = res;
    } else if (line.startsWith('REMARK 465')) {
      // 缺失残基：每行列出 3-5 个残基
      const rest = line.slice(10).trim();
      const groups = rest.match(/[A-Z]{3}\s+[A-Z]\s+-?\d+/g);
      if (groups) stats.missingResidues += groups.length;
    } else if (line.match(/FREE R VALUE\s*:\s*([\d.]+)/) && stats.rFree === null) {
      const v = numOf(line.split(':').slice(-1)[0]);
      if (v !== null) stats.rFree = v;
    } else if (line.match(/R VALUE\s*\(WORKING SET\)\s*:\s*([\d.]+)/) && stats.rValue === null) {
      const v = numOf(line.split(':').slice(-1)[0]);
      if (v !== null) stats.rValue = v;
    } else if (line.match(/COMPLETENESS\s*\(WORKING\+TEST\)\s*\(%\)\s*:\s*([\d.]+)/) && stats.completeness === null) {
      const v = numOf(line.split(':').slice(-1)[0]);
      if (v !== null) stats.completeness = v;
    } else if (line.includes('DATA REDUNDANCY') && stats.redundancy === null) {
      const v = numOf(line.split(':')[1]);
      if (v !== null) stats.redundancy = v;
    } else if (line.includes('I/SIGMA(I)') && stats.iSigma === null) {
      const v = numOf(line.split(':')[1]);
      if (v !== null) stats.iSigma = v;
    } else if (line.startsWith('ATOM  ') || line.startsWith('ATOM   ')) {
      stats.nAtoms++;
      const b = parseFloat(line.slice(60, 66));
      if (!Number.isNaN(b)) {
        bSum += b;
        bCount++;
      }
    } else if (line.startsWith('HETATM')) {
      stats.nHetatm++;
      const b = parseFloat(line.slice(60, 66));
      if (!Number.isNaN(b)) {
        bSum += b;
        bCount++;
      }
    }
  }

  if (bCount > 0) stats.meanB = bSum / bCount;
  return stats;
}
