import type { Content, ContentTable, TableCell, TDocumentDefinitions } from "pdfmake/interfaces";

import { exportFileName } from "@/features/import-export/utils/download-file";
import {
  getPrintableReportFields,
  getReportFieldValue,
  hasReportValue,
  PDF_REPORT_MESSAGES,
} from "@/features/reports/utils/report-data";
import {
  DEFAULT_EXPENSE_PDF_FIELDS,
  expensePdfOptionsSchema,
} from "@/features/reports/utils/report-options";
import { formatCurrency } from "@/shared/utils/currency";

import type {
  ExpensePdfField,
  PdfReportData,
  ReportExpense,
} from "@/features/reports/types/reports.types";

const INK = "#25213D";
const ACCENT = "#6544AD";
const MUTED = "#615C70";
const BODY_FONT_SIZE = 10.5;
const COLUMN_SPACING = 8;
const A4_LANDSCAPE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;
const PAGE_SIDE_MARGIN = 32;
const MAX_PAGE_WIDTH = 14_400;
const DESCRIPTION_MAX_WIDTH = 240;
const WIDTH_TOLERANCE = 0.5;
const PDF_FONTS = {
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf",
  },
};
const BALANCE_PDF_FIELDS: ExpensePdfField[] = [
  "date",
  "name",
  "amount",
  "paid-by",
  "category",
  "tags",
  "member-shares",
];

type MeasureText = (text: string, bold?: boolean) => number;

interface ColumnMetrics {
  header: string;
  width: number;
  wrap: boolean;
}

interface ExpenseColumn extends ColumnMetrics {
  cell: (expense: ReportExpense, index: number) => string;
}

const widestText = (texts: string[], measure: MeasureText, bold = false): number =>
  texts.reduce(
    (widest, text) =>
      text
        .split(/\r\n|\r|\n/u)
        .reduce((width, line) => Math.max(width, measure(line, bold)), widest),
    0,
  );

const measureColumn = (
  header: string,
  values: string[],
  measure: MeasureText,
  maximum = Infinity,
): ColumnMetrics => {
  const width = Math.min(
    maximum,
    Math.max(widestText([header], measure, true), widestText(values, measure)) + WIDTH_TOLERANCE,
  );
  return { header, width, wrap: Number.isFinite(maximum) };
};

// Ordinary description wrapping is left to pdfmake. Only overlong individual tokens need breaks.
const wrapDescription = (text: string, width: number, measure: MeasureText): string =>
  text.replace(/\S+/gu, (word) => {
    if (measure(word) <= width) return word;
    let result = "";
    let chunk = "";
    for (const character of word) {
      if (chunk && measure(chunk + character) > width) {
        result += `${chunk}\u200B`;
        chunk = "";
      }
      chunk += character;
    }
    return result + chunk;
  });

const table = (columns: ColumnMetrics[], rows: string[][], measure: MeasureText): ContentTable => ({
  table: {
    headerRows: 1,
    widths: columns.map((column) => column.width),
    body: [
      columns.map(
        (column): TableCell => ({
          text: column.header,
          bold: true,
          color: INK,
          fillColor: "#F1EEF8",
          margin: [0, 2, 0, 2],
        }),
      ),
      ...rows.map((row) =>
        row.map((cell, index) =>
          columns[index].wrap ? wrapDescription(cell, columns[index].width, measure) : cell,
        ),
      ),
    ],
  },
  layout: {
    hLineWidth: () => 0.5,
    vLineWidth: () => 0,
    hLineColor: () => "#DED9E9",
    paddingLeft: () => 4,
    paddingRight: () => 4,
    paddingTop: () => 4,
    paddingBottom: () => 4,
  },
  margin: [0, 4, 0, 10],
});

const expenseColumn = (
  report: PdfReportData,
  header: string,
  cell: ExpenseColumn["cell"],
  measure: MeasureText,
  maximum = Infinity,
): ExpenseColumn => ({
  ...measureColumn(header, report.expenses.map(cell), measure, maximum),
  cell,
});

const expenseColumns = (
  report: PdfReportData,
  fields: ExpensePdfField[],
  measure: MeasureText,
): ExpenseColumn[] => {
  const headers: Record<Exclude<ExpensePdfField, "member-shares">, string> = {
    name: "Expense name",
    amount: "Amount",
    "paid-by": "Paid by",
    date: "Date",
    "added-date": "Added date",
    category: "Category",
    tags: "Tags",
    description: "Description",
    "split-method": "Split method",
  };
  return [
    expenseColumn(report, "Sl. No.", (_expense, index) => String(index + 1), measure),
    ...fields.flatMap((field) => {
      if (field !== "member-shares") {
        return [
          expenseColumn(
            report,
            headers[field],
            (expense) => getReportFieldValue(expense, field, report.group.currency),
            measure,
            field === "description" ? DESCRIPTION_MAX_WIDTH : Infinity,
          ),
        ];
      }
      return report.members.flatMap((member) => {
        const cell = (expense: ReportExpense): string => {
          const allocation = expense.allocations.find((row) => row.memberId === member.id);
          if (!allocation) throw new Error("A PDF expense is missing a member allocation.");
          return allocation.owed === null
            ? ""
            : formatCurrency(allocation.owed, report.group.currency);
        };
        return report.expenses.some((expense) => hasReportValue(cell(expense)))
          ? [expenseColumn(report, `${member.name} share`, cell, measure)]
          : [];
      });
    }),
  ];
};

const numberedTable = (headers: string[], rows: string[][], measure: MeasureText): ContentTable => {
  const numberedRows = rows.map((row, index) => [String(index + 1), ...row]);
  const indices = [
    0,
    ...headers.flatMap((_header, index) =>
      rows.some((row) => hasReportValue(row[index])) ? [index + 1] : [],
    ),
  ];
  const allHeaders = ["Sl. No.", ...headers];
  const columns = indices.map((index) =>
    measureColumn(
      allHeaders[index],
      numberedRows.map((row) => row[index]),
      measure,
    ),
  );
  return table(
    columns,
    numberedRows.map((row) => indices.map((index) => row[index])),
    measure,
  );
};

const expenseTable = (
  report: PdfReportData,
  columns: ExpenseColumn[],
  measure: MeasureText,
): ContentTable =>
  table(
    columns,
    report.expenses.map((expense, index) => columns.map((column) => column.cell(expense, index))),
    measure,
  );

const buildPdfDefinition = (report: PdfReportData, measure: MeasureText): TDocumentDefinitions => {
  const money = (amount: number | bigint) => formatCurrency(amount, report.group.currency);
  const balanceReport = report.kind === "balances";
  const fields = getPrintableReportFields(
    report,
    balanceReport
      ? BALANCE_PDF_FIELDS
      : expensePdfOptionsSchema.parse({ fields: report.fields ?? [...DEFAULT_EXPENSE_PDF_FIELDS] })
          .fields,
  );
  const baseColumns = expenseColumns(report, fields, measure);
  if (baseColumns.length < 2) throw new Error(PDF_REPORT_MESSAGES.NO_FIELD_VALUES);
  const title = balanceReport ? "Balances and suggested payments" : "Expense report";
  const content: Content[] = [
    { text: report.group.name, style: "title" },
    {
      text: `${title} · Generated ${report.generatedAt} · ${report.group.currency}`,
      style: "caption",
    },
    {
      text: `${report.expenses.length} of ${report.sourceExpenseCount} expenses${fields.includes("amount") ? ` · Total spending: ${money(report.total)}` : ""}`,
      style: "summary",
    },
    {
      text: balanceReport
        ? `Scope: All group expenses and recorded repayments. · Sort: ${report.sort}`
        : `Scope: Matching expenses only. Repayments excluded. · Sort: ${report.sort}`,
      style: "caption",
    },
    {
      text: report.filters.length
        ? `Applied filters: ${report.filters.join(" · ")}`
        : "Applied filters: None",
      style: "caption",
    },
  ];

  if (fields.includes("member-shares")) {
    content.push({
      text: "Member shares are saved amounts owed. Blank = not involved; 0.00 = a saved zero share.",
      style: "caption",
    });
  }
  content.push({ text: "Expenses", style: "section" });
  content.push(expenseTable(report, baseColumns, measure));

  if (balanceReport) {
    content.push({ text: "Member balances", style: "section" });
    content.push(
      report.members.length
        ? numberedTable(
            ["Member", "Balance"],
            report.members.map((member) => [
              member.name,
              member.net > 0
                ? `${money(member.net)} to receive`
                : member.net < 0
                  ? `${money(-member.net)} to pay`
                  : "Settled",
            ]),
            measure,
          )
        : { text: "No members.", style: "caption" },
    );
    content.push({ text: "Recorded repayments", style: "section" });
    content.push(
      report.payments.length
        ? numberedTable(
            ["Date", "From", "To", "Amount", "Tags"],
            report.payments.map((payment) => [
              payment.date,
              payment.from,
              payment.to,
              money(payment.amount),
              payment.tags,
            ]),
            measure,
          )
        : { text: "No repayments recorded.", margin: [0, 8, 0, 12] },
    );
    content.push({ text: "Suggested payments", style: "section" });
    content.push({
      text: "Suggestions only, not payment records or original person-to-person debts. Split Slate does not move money.",
      style: "caption",
    });
    content.push(
      report.transfers.length
        ? numberedTable(
            ["From", "To", "Amount"],
            report.transfers.map((transfer) => [
              transfer.from,
              transfer.to,
              money(transfer.amount),
            ]),
            measure,
          )
        : { text: "No payments needed.", margin: [0, 8, 0, 12] },
    );
  }

  const reportTables = content.filter(
    (node): node is ContentTable => typeof node === "object" && node !== null && "table" in node,
  );
  const widestTable = reportTables.reduce(
    (widest, node) =>
      Math.max(
        widest,
        (node.table.widths as number[]).reduce((sum, width) => sum + width + COLUMN_SPACING, 0),
      ),
    0,
  );
  const pageWidth = Math.max(
    A4_LANDSCAPE_WIDTH,
    Math.ceil((widestTable + PAGE_SIDE_MARGIN * 2 + 1) * 100) / 100,
  );
  if (!Number.isFinite(pageWidth) || pageWidth > MAX_PAGE_WIDTH) {
    throw new Error(
      "This report exceeds the supported PDF page width. No columns were omitted. Try fewer fields or a narrower report.",
    );
  }

  return {
    info: { title: `${report.group.name} — ${title}`, author: "Split Slate", subject: title },
    pageSize: { width: pageWidth, height: PAGE_HEIGHT },
    pageOrientation: "landscape",
    pageMargins: [PAGE_SIDE_MARGIN, 40, PAGE_SIDE_MARGIN, 40],
    defaultStyle: { font: "Roboto", fontSize: BODY_FONT_SIZE, color: INK, lineHeight: 1.15 },
    styles: {
      title: { fontSize: 18, bold: true, color: ACCENT, margin: [0, 0, 0, 3] },
      caption: { fontSize: 9, color: MUTED, margin: [0, 1, 0, 3] },
      summary: { fontSize: 11, bold: true, margin: [0, 5, 0, 4] },
      section: { fontSize: 11, bold: true, color: ACCENT, margin: [0, 6, 0, 3] },
    },
    header: { text: "SPLIT SLATE", fontSize: 8, color: MUTED, margin: [32, 17, 32, 0] },
    footer: (page, count) => ({
      columns: [
        {
          text: balanceReport
            ? "Full-group balances and repayment suggestions"
            : "Filtered expense report · Not a full-group settlement statement",
        },
        { text: `Page ${page} of ${count}`, alignment: "right", width: 95 },
      ],
      fontSize: 8,
      color: MUTED,
      margin: [32, 12, 32, 0],
    }),
    content,
  };
};

const loadPdfEngine = async () => {
  const [{ default: pdfMake }, { default: fonts }] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
  ]);
  return (definition: TDocumentDefinitions) =>
    pdfMake.createPdf(definition, {}, PDF_FONTS, fonts).getStream();
};

export const createPdfDefinition = async (report: PdfReportData): Promise<TDocumentDefinitions> => {
  if (!report.expenses.length) {
    throw new Error(
      report.sourceExpenseCount ? PDF_REPORT_MESSAGES.NO_MATCHES : PDF_REPORT_MESSAGES.NO_EXPENSES,
    );
  }
  const fields =
    report.kind === "balances"
      ? BALANCE_PDF_FIELDS
      : expensePdfOptionsSchema.parse({ fields: report.fields ?? [...DEFAULT_EXPENSE_PDF_FIELDS] })
          .fields;
  if (!getPrintableReportFields(report, fields).length) {
    throw new Error(PDF_REPORT_MESSAGES.NO_FIELD_VALUES);
  }
  const createStream = await loadPdfEngine();
  // PDFKit's public font/widthOfString APIs use the same bundled fonts as final rendering.
  // This measurement-only stream is discarded, not downloaded or added to the report.
  const metrics = createStream({
    content: [],
    defaultStyle: { font: "Roboto", fontSize: BODY_FONT_SIZE },
  });
  const cache = new Map<string, number>();
  try {
    return buildPdfDefinition(report, (text, bold = false) => {
      const normalized = text.replace(/\t/gu, "    ");
      const key = `${bold ? "bold" : "normal"}:${normalized}`;
      const cached = cache.get(key);
      if (cached !== undefined) return cached;
      const width = metrics
        .font(bold ? PDF_FONTS.Roboto.bold : PDF_FONTS.Roboto.normal)
        .fontSize(BODY_FONT_SIZE)
        .widthOfString(normalized);
      cache.set(key, width);
      return width;
    });
  } finally {
    metrics.destroy();
  }
};

export const generateReportPdf = async (report: PdfReportData): Promise<Blob> => {
  const definition = await createPdfDefinition(report);
  const createStream = await loadPdfEngine();
  const stream = createStream(definition);
  return new Promise((resolve, reject) => {
    const chunks: ArrayBuffer[] = [];
    stream.on("data", (chunk: Uint8Array) => chunks.push(new Uint8Array(chunk).buffer));
    stream.on("error", reject);
    stream.on("end", () => resolve(new Blob(chunks, { type: "application/pdf" })));
    stream.end();
  });
};

export const downloadReportPdf = async (report: PdfReportData): Promise<void> => {
  const blob = await generateReportPdf(report);
  const fileName = exportFileName(
    `${report.group.name}-${report.kind === "balances" ? "balances" : "expenses"}`,
    "pdf",
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
    // Keep the URL alive long enough for a mobile/PWA download to consume the blob.
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
};
