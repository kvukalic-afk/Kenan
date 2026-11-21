// Pomoćne funkcije za izradu službenih dokumenata (docx-js).
const fs = require('fs');
const path = require('path');
const d = require('docx');
const {
  Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, AlignmentType,
  HeadingLevel, BorderStyle, VerticalAlign, PageBreak, ImageRun, TableLayoutType,
  Header, Footer, PageNumber, PageOrientation, TableOfContents, LevelFormat,
} = d;

const FONT = 'Arial';
const C = {
  navy: '1F3864', blue: '2E5597', grey: '595959', light: 'EAF0F8', head: 'D9E2F3',
  band: 'F2F2F2', red: 'A50021', warn: 'FFF4D6', ok: 'E2EFDA', hi: 'F8CBAD', mid: 'FFE699', lo: 'C6E0B4',
};
// A4, margine 2 cm
const PAGE = { w: 11906, h: 16838, m: 1134 };
const W_PORTRAIT = PAGE.w - 2 * PAGE.m; // 9638
const W_LANDSCAPE = PAGE.h - 2 * PAGE.m; // 14570

// Inline oznake: **podebljano**, [POTVRDITI ...] crveno podebljano, [NACRT] i sl.
function runs(text, base = {}) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|\[(?:POTVRDITI|DOPUNITI|NACRT|PRIJEDLOG|RADNA OCJENA)[^\]]*\])/g;
  let last = 0; let m;
  const s = String(text ?? '');
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(new TextRun({ text: s.slice(last, m.index), font: FONT, ...base }));
    const tok = m[0];
    if (tok.startsWith('**')) out.push(new TextRun({ text: tok.slice(2, -2), bold: true, font: FONT, ...base }));
    else out.push(new TextRun({ text: tok, bold: true, color: C.red, font: FONT, ...base }));
    last = m.index + tok.length;
  }
  if (last < s.length) out.push(new TextRun({ text: s.slice(last), font: FONT, ...base }));
  if (!out.length) out.push(new TextRun({ text: '', font: FONT, ...base }));
  return out;
}

function P(text, o = {}) {
  return new Paragraph({
    children: Array.isArray(text) ? text : runs(text, { size: o.size, bold: o.bold, italics: o.italics, color: o.color }),
    alignment: o.align ?? AlignmentType.JUSTIFIED,
    spacing: { before: o.before ?? 0, after: o.after ?? 120, line: o.line ?? 276 },
    indent: o.indent,
    keepNext: o.keepNext,
    keepLines: o.keepLines,
    pageBreakBefore: o.pageBreakBefore,
    border: o.border,
    shading: o.shading,
    style: o.style,
  });
}
const center = (t, o = {}) => P(t, { align: AlignmentType.CENTER, ...o });
const right = (t, o = {}) => P(t, { align: AlignmentType.RIGHT, ...o });
const left = (t, o = {}) => P(t, { align: AlignmentType.LEFT, ...o });
const bullet = (t, lvl = 0, o = {}) => new Paragraph({
  children: runs(t, { size: o.size }), numbering: { reference: 'bul', level: lvl },
  alignment: AlignmentType.LEFT, spacing: { after: o.after ?? 60, line: 264 }, keepNext: o.keepNext,
});
const H1 = (t, o = {}) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_1, pageBreakBefore: o.pb ?? true });
const H2 = (t, o = {}) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_2, pageBreakBefore: o.pb ?? false });
const H3 = (t, o = {}) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_3, pageBreakBefore: o.pb ?? false });
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });
const spacer = (pt = 6) => new Paragraph({ children: [], spacing: { before: 0, after: pt * 20 } });

const thin = { style: BorderStyle.SINGLE, size: 4, color: '8EA9C1' };
const BORDERS = { top: thin, bottom: thin, left: thin, right: thin, insideHorizontal: thin, insideVertical: thin };

// Ćelija: string ili {t, b, fill, span, rspan, align, size, color, paras:[...]}
function cell(spec, width, def = {}) {
  const s = (typeof spec === 'object' && spec !== null && !Array.isArray(spec)) ? spec : { t: spec };
  const size = s.size ?? def.size ?? 18;
  const lines = Array.isArray(s.t) ? s.t : String(s.t ?? '').split('\n');
  const children = s.paras ?? lines.map((ln, i) => {
    const isB = /^\s*[-•]\s+/.test(ln);
    const txt = isB ? ln.replace(/^\s*[-•]\s+/, '') : ln;
    return new Paragraph({
      children: runs(txt, { size, bold: s.b ?? def.b, color: s.color ?? def.color, italics: s.i }),
      alignment: s.align ?? def.align ?? AlignmentType.LEFT,
      spacing: { before: 0, after: i === lines.length - 1 ? 0 : 40, line: 240 },
      indent: isB ? { left: 200, hanging: 140 } : undefined,
      ...(isB ? { children: [new TextRun({ text: '• ', font: FONT, size }), ...runs(txt, { size, bold: s.b ?? def.b })] } : {}),
    });
  });
  return new TableCell({
    children,
    width: { size: width, type: WidthType.DXA },
    columnSpan: s.span, rowSpan: s.rspan,
    shading: (s.fill ?? def.fill) ? { type: ShadingType.CLEAR, color: 'auto', fill: s.fill ?? def.fill } : undefined,
    verticalAlign: s.valign ?? def.valign ?? VerticalAlign.TOP,
    margins: { top: 50, bottom: 50, left: 80, right: 80 },
  });
}

// Tabela: widths (DXA), rows: niz nizova; opts: {header: n redova zaglavlja, size, cantSplit}
function table(widths, rows, o = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  const hdr = o.header ?? 1;
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: widths,
    layout: TableLayoutType.FIXED,
    borders: BORDERS,
    rows: rows.map((r, ri) => {
      // izračun širina uz colspan
      let ci = 0;
      const cells = r.map((spec) => {
        const s = (typeof spec === 'object' && spec !== null && !Array.isArray(spec)) ? spec : { t: spec };
        const span = s.span ?? 1;
        const w = widths.slice(ci, ci + span).reduce((a, b) => a + b, 0);
        ci += span;
        const isH = ri < hdr;
        return cell(s, w, isH ? { b: true, fill: o.hfill ?? C.head, size: o.hsize ?? o.size ?? 18, align: o.halign ?? AlignmentType.CENTER, valign: VerticalAlign.CENTER } : { size: o.size ?? 18, fill: o.fill });
      });
      return new TableRow({ children: cells, tableHeader: ri < hdr, cantSplit: o.cantSplit ?? (ri < hdr) });
    }),
  });
}

// Dvokolonska tabela "oznaka – vrijednost"
function kv(rows, w1 = 3400, total = W_PORTRAIT, o = {}) {
  return table([w1, total - w1], rows.map(([k, v]) => [{ t: k, b: true, fill: C.light }, v]), { header: 0, size: o.size ?? 20 });
}

// Okvir s napomenom
function note(title, lines, o = {}) {
  const fill = o.fill ?? C.warn;
  const paras = [];
  if (title) paras.push(new Paragraph({ children: runs(title, { bold: true, size: o.size ?? 19, color: o.tcolor ?? '7F6000' }), spacing: { after: 60 } }));
  (Array.isArray(lines) ? lines : [lines]).forEach((ln) => {
    const isB = /^\s*-\s+/.test(ln);
    paras.push(new Paragraph({
      children: [...(isB ? [new TextRun({ text: '• ', font: FONT, size: o.size ?? 19 })] : []), ...runs(isB ? ln.replace(/^\s*-\s+/, '') : ln, { size: o.size ?? 19 })],
      alignment: AlignmentType.LEFT, spacing: { after: 50, line: 252 }, indent: isB ? { left: 220, hanging: 160 } : undefined,
    }));
  });
  const width = o.width ?? W_PORTRAIT;
  return new Table({
    width: { size: width, type: WidthType.DXA }, columnWidths: [width], layout: TableLayoutType.FIXED,
    borders: { top: { style: BorderStyle.SINGLE, size: 6, color: o.border ?? 'BF9000' }, bottom: { style: BorderStyle.SINGLE, size: 6, color: o.border ?? 'BF9000' }, left: { style: BorderStyle.SINGLE, size: 18, color: o.border ?? 'BF9000' }, right: { style: BorderStyle.SINGLE, size: 6, color: o.border ?? 'BF9000' }, insideHorizontal: thin, insideVertical: thin },
    rows: [new TableRow({ cantSplit: o.cantSplit ?? false, children: [new TableCell({ children: paras, width: { size: width, type: WidthType.DXA }, shading: { type: ShadingType.CLEAR, color: 'auto', fill }, margins: { top: 100, bottom: 100, left: 160, right: 160 } })] })],
  });
}

function image(file, w, h) {
  return new ImageRun({ type: file.endsWith('.png') ? 'png' : 'jpg', data: fs.readFileSync(path.join(__dirname, file)), transformation: { width: w, height: h } });
}

// Potpisni blok (desno)
function signature(role, name, o = {}) {
  return [
    spacer(6),
    right(role, { after: 360, bold: true, keepNext: true }),
    right('_______________________________', { after: 0, keepNext: true }),
    right(name, { after: 120 }),
  ];
}

const STYLES = {
  default: { document: { run: { font: FONT, size: 22 } } },
  paragraphStyles: [
    { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run: { font: FONT, size: 28, bold: true, color: C.navy },
      paragraph: { spacing: { before: 120, after: 200 }, keepNext: true, outlineLevel: 0,
        border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: C.navy, space: 4 } } } },
    { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run: { font: FONT, size: 24, bold: true, color: C.blue },
      paragraph: { spacing: { before: 240, after: 120 }, keepNext: true, outlineLevel: 1 } },
    { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
      run: { font: FONT, size: 21, bold: true, color: C.grey },
      paragraph: { spacing: { before: 180, after: 80 }, keepNext: true, outlineLevel: 2 } },
  ],
};
const NUMBERING = {
  config: [{ reference: 'bul', levels: [
    { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 500, hanging: 260 } } } },
    { level: 1, format: LevelFormat.BULLET, text: '–', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 900, hanging: 260 } } } },
  ] }],
};

function headerFooter(title) {
  return {
    headers: { default: new Header({ children: [new Paragraph({
      children: [new TextRun({ text: title, font: FONT, size: 16, color: C.grey })],
      alignment: AlignmentType.RIGHT, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF', space: 2 } },
    })] }) },
    footers: { default: new Footer({ children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'Stranica ', font: FONT, size: 16, color: C.grey }),
        new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: C.grey }),
        new TextRun({ text: ' od ', font: FONT, size: 16, color: C.grey }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: C.grey }),
      ],
    })] }) },
  };
}
const portrait = { page: { size: { width: PAGE.w, height: PAGE.h }, margin: { top: PAGE.m, bottom: PAGE.m, left: PAGE.m, right: PAGE.m, header: 567, footer: 567 } } };
const landscape = { page: { size: { width: PAGE.w, height: PAGE.h, orientation: PageOrientation.LANDSCAPE }, margin: { top: PAGE.m, bottom: PAGE.m, left: PAGE.m, right: PAGE.m, header: 567, footer: 567 } } };

function toc(title = 'Sadržaj') {
  return [new Paragraph({ children: runs(title, { bold: true, size: 28, color: C.navy }), spacing: { after: 200 } }),
    new TableOfContents('Sadržaj', { hyperlink: true, headingStyleRange: '1-2' })];
}

module.exports = { d, C, FONT, PAGE, W_PORTRAIT, W_LANDSCAPE, runs, P, center, right, left, bullet, H1, H2, H3, pageBreak, spacer, cell, table, kv, note, image, signature, STYLES, NUMBERING, headerFooter, portrait, landscape, toc, AlignmentType, VerticalAlign };
