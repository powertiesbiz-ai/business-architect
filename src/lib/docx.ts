import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  PageBreak,
} from "docx";
import { saveAs } from "file-saver";
import type { Blueprint, PositionDetail } from "../types";

const ACCENT = "B45309";
const DARK = "1C1917";
const GRAY = "57534E";

const title = (text: string) =>
  new Paragraph({
    heading: HeadingLevel.TITLE,
    children: [new TextRun({ text, color: ACCENT, bold: true, size: 56 })],
  });

const h1 = (text: string) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, color: ACCENT, bold: true, size: 32 })],
    spacing: { before: 400, after: 200 },
  });

const h2 = (text: string) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, color: DARK, bold: true, size: 26 })],
    spacing: { before: 300, after: 150 },
  });

const body = (text: string) =>
  new Paragraph({
    children: [new TextRun({ text, color: DARK, size: 22 })],
    spacing: { after: 150 },
  });

const bullet = (text: string) =>
  new Paragraph({
    children: [new TextRun({ text, color: DARK, size: 22 })],
    bullet: { level: 0 },
    spacing: { after: 80 },
  });

const money = (n: number) =>
  "$" + Math.round(n).toLocaleString("en-US");

function costTable(p: PositionDetail): Table {
  const rows = p.costBreakdown.map(
    (c) =>
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(c.item)], width: { size: 70, type: WidthType.PERCENTAGE } }),
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun(money(c.annualCost))] })],
            width: { size: 30, type: WidthType.PERCENTAGE },
          }),
        ],
      })
  );
  rows.push(
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total annual cost", bold: true })] })] }),
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: money(p.totalAnnualCost), bold: true })],
            }),
          ],
        }),
      ],
    })
  );
  return new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } });
}

export async function downloadBlueprintDocx(bp: Blueprint): Promise<void> {
  const children: (Paragraph | Table)[] = [];

  // Cover
  children.push(
    new Paragraph({ spacing: { before: 1200 } }),
    title("BUSINESS BLUEPRINT"),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: bp.businessName || "Your Business", color: DARK, size: 36 })],
      spacing: { before: 200 },
    }),
    body("From owner-dependent to organization: the complete architecture, economics, and implementation plan."),
    body(`Prepared ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`),
    new Paragraph({ children: [new PageBreak()] })
  );

  // 1. Executive Summary
  children.push(h1("1. Executive Summary"), body(bp.executiveSummary));

  // 2. Owner Dependency Score
  children.push(
    h1("2. Owner Dependency Score"),
    body(`Current: ${bp.dependencyScore.current}/100 — Target: ${bp.dependencyScore.target}/100`),
    body(bp.dependencyScore.explanation)
  );

  // 3. Bottlenecks
  children.push(h1("3. Business Bottlenecks"));
  bp.bottlenecks.forEach((bn, i) => {
    children.push(h2(`${i + 1}. ${bn.title}`), body(bn.description), body(`Impact: ${bn.impact}`), body(`Recommended fix: ${bn.recommendedFix}`));
  });

  // 4. Recommended Organization
  children.push(h1("4. Recommended Organization"));
  bp.orgChart.forEach((p) => {
    children.push(bullet(`${p.title}${p.reportsTo ? ` — reports to ${p.reportsTo}` : " (top of organization)"}`));
  });

  // 5. Position-by-position
  children.push(h1("5. Position-by-Position Analysis"));
  bp.positions.forEach((p) => {
    children.push(
      h2(p.title),
      body(`Reports to: ${p.reportsTo}`),
      body(`Purpose: ${p.purpose}`),
      new Paragraph({ children: [new TextRun({ text: "Responsibilities", bold: true, color: GRAY, size: 22 })] })
    );
    p.responsibilities.forEach((r) => children.push(bullet(r)));
    children.push(
      body(`Compensation: ${p.compensation}`),
      new Paragraph({ children: [new TextRun({ text: "Annual cost breakdown", bold: true, color: GRAY, size: 22 })] }),
      costTable(p),
      new Paragraph({ children: [new TextRun({ text: "KPIs", bold: true, color: GRAY, size: 22 })], spacing: { before: 200 } })
    );
    p.kpis.forEach((k) => children.push(bullet(k)));
    children.push(body(`Revenue responsibility: ${p.revenueResponsibility}`));
  });

  // 6. Hiring sequence
  children.push(h1("6. Hiring Sequence"));
  [...bp.hiringSequence]
    .sort((a, b) => a.order - b.order)
    .forEach((h) => {
      children.push(
        h2(`${h.order}. ${h.position} — ${h.timing}`),
        body(`Why now: ${h.rationale}`),
        body(`Expected impact: ${h.expectedImpact}`)
      );
    });

  // 7. Financial model
  const fm = bp.financialModel;
  children.push(h1("7. Financial Model"));
  children.push(new Paragraph({ children: [new TextRun({ text: "Investment required", bold: true, color: GRAY, size: 22 })] }));
  fm.investmentBreakdown.forEach((inv) => children.push(bullet(`${inv.category}: ${money(inv.amount)}`)));
  children.push(body(`Total implementation investment: ${money(fm.totalInvestment)}`));
  children.push(new Paragraph({ children: [new TextRun({ text: "Revenue targets", bold: true, color: GRAY, size: 22 })], spacing: { before: 200 } }));
  fm.revenueTargets.forEach((rt) => children.push(bullet(`${rt.timeframe}: ${money(rt.revenue)}`)));
  children.push(new Paragraph({ children: [new TextRun({ text: "Profit projections", bold: true, color: GRAY, size: 22 })], spacing: { before: 200 } }));
  fm.profitProjections.forEach((pp) =>
    children.push(bullet(`${pp.year}: ${money(pp.revenue)} revenue, ${money(pp.profit)} profit (${pp.margin} margin)`))
  );
  children.push(body(`Estimated payback: ${fm.paybackMonths} months. ${fm.paybackExplanation}`));

  // 8. Implementation plan
  children.push(h1("8. Implementation Plan"));
  bp.implementationPlan.forEach((ph) => {
    children.push(h2(`${ph.phase} — ${ph.timeframe}`), body(ph.goal));
    ph.actions.forEach((a) => children.push(bullet(a)));
  });

  // 9. Owner future role
  const ofr = bp.ownerFutureRole;
  children.push(h1("9. What the Owner Does After the Transformation"));
  children.push(body(`Role: ${ofr.title} — ${ofr.hoursPerWeek}`));
  children.push(new Paragraph({ children: [new TextRun({ text: "Responsibilities", bold: true, color: GRAY, size: 22 })] }));
  ofr.responsibilities.forEach((r) => children.push(bullet(r)));
  children.push(new Paragraph({ children: [new TextRun({ text: "Things the owner gives up", bold: true, color: GRAY, size: 22 })], spacing: { before: 200 } }));
  ofr.giveUp.forEach((g) => children.push(bullet(g)));
  children.push(body(ofr.closingLine));

  // 10. Business completion scores
  children.push(h1("10. Business Completion Score"));
  bp.completionScores.forEach((s) => children.push(bullet(`${s.area}: ${s.score}%`)));
  children.push(body(`Overall business readiness: ${bp.overallReadiness}%`));

  // 11. Risks
  children.push(h1("11. Risks & Assumptions"));
  bp.risks.forEach((r) => {
    children.push(h2(r.risk), body(`Mitigation: ${r.mitigation}`));
  });

  const doc = new Document({
    sections: [{ children }],
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22, color: DARK } },
      },
    },
  });

  const blob = await Packer.toBlob(doc);
  const safeName = (bp.businessName || "business").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  saveAs(blob, `${safeName}-business-blueprint.docx`);
}
