# 数据来源说明

## 内置的 PDB 文件

本项目内置两个真实 PDB 条目，全部取自 [RCSB Protein Data Bank](https://www.rcsb.org/)。
RCSB 明确声明：PDB 数据属于公共领域（no copyright claims），可以自由下载与使用；
唯一的义务是正确地标注来源。

| 文件 | 条目 | 说明 | 关键字段 |
|---|---|---|---|
| `public/data/1crn.pdb` | [1CRN](https://www.rcsb.org/structure/1CRN) | crambin，1981 年测定 | RESOLUTION 1.50 Å；R 值字段全部为 NULL（R-free 尚未发明） |
| `public/data/1ejg.pdb` | [1EJG](https://www.rcsb.org/structure/1EJG) | crambin，2000 年超高分辨测定 | RESOLUTION 0.54 Å；R_work 0.090 / R_free 0.094 |

下载地址：

- `https://files.rcsb.org/download/1CRN.pdb`
- `https://files.rcsb.org/download/1EJG.pdb`

下载时间：2026-09-01。

## 引用建议

- RCSB PDB 主数据：wvPDB 联盟（RCSB PDB / PDBe / PDBj / BMRB）。可在 [rcsb.org](https://www.rcsb.org/) 首页获取最新引用信息。
- 1CRN 原始论文：Teeter M.M. (1984) *Proc. Natl. Acad. Sci. USA* 81, 6014（PDB 内 DOI: 10.1073/PNAS.81.19.6014）。
- 1EJG 原始论文：Jelsch C., Teeter M.M., Lamzin V., Pichon-Pesme V., Blessing R.H., Lecomte C. (2000) *Proc. Natl. Acad. Sci. USA* 97, 3171（DOI: 10.1073/PNAS.97.7.3171）。

## 文件说明

- `1crn.pdb` 为 RCSB 当前在线版本（2024-10 修订），包含完整的头注释与 46 个残基的坐标。
- `1ejg.pdb` 包含 0.54 Å 超高分辨数据与完整验证字段（REMARK 3），并记录了结晶条件
  （REMARK 280：40 mg/mL 蛋白溶于 80% 乙醇，对 60% 乙醇汽相扩散）——本教程第 9 幕将引用此条件讨论「晶体环境并非细胞环境」。
