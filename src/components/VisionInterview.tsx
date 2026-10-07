import type { VisionData } from "../types";
import { StepShell, Field, TextInput, TextArea, Select, NavButtons } from "./ui";

export default function VisionInterview({ data, onChange, onBack, onNext }: {
  data: VisionData; onChange: (d: VisionData) => void; onBack: () => void; onNext: () => void;
}) {
  const set = (k: keyof VisionData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    onChange({ ...data, [k]: e.target.value });

  const ready = data.companyKind.trim() && data.targetRevenue.trim();

  return (
    <StepShell step={2} total={5} kicker="Grow — Founder Vision"
      title="What are you trying to build?"
      subtitle="Don't start with today's numbers. Start with the company you want. Be ambitious — this is the target everything else gets designed around.">
      <div className="space-y-6">
        <Field label="Business name">
          <TextInput value={data.businessName} onChange={set("businessName")} placeholder="e.g. Acme Tree Service" />
        </Field>
        <Field label="What kind of company do you want this to be?">
          <TextArea value={data.companyKind} onChange={set("companyKind")}
            placeholder="e.g. The most trusted tree service in the county — the one people recommend without thinking." />
        </Field>
        <Field label="Why does this company exist?">
          <TextArea value={data.whyExists} onChange={set("whyExists")}
            placeholder="e.g. To give homeowners peace of mind and give my crew careers they can build a life on." />
        </Field>
        <div className="grid gap-6 md:grid-cols-3">
          <Field label="Target annual revenue">
            <TextInput value={data.targetRevenue} onChange={set("targetRevenue")} placeholder="e.g. $2.5M" />
          </Field>
          <Field label="Target annual profit">
            <TextInput value={data.targetProfit} onChange={set("targetProfit")} placeholder="e.g. $500K" />
          </Field>
          <Field label="Target employees">
            <TextInput value={data.targetEmployees} onChange={set("targetEmployees")} placeholder="e.g. 12" />
          </Field>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="How many hours per week do YOU want to work?">
            <TextInput value={data.ownerHours} onChange={set("ownerHours")} placeholder="e.g. 20" />
          </Field>
          <Field label="What should your role be?">
            <TextInput value={data.ownerRole} onChange={set("ownerRole")} placeholder="e.g. CEO — strategy, key relationships, finances" />
          </Field>
        </div>
        <Field label="What do you never want to do again?">
          <TextArea value={data.neverAgain} onChange={set("neverAgain")}
            placeholder="e.g. Answering the phones, chasing invoices, climbing on roofs..." />
        </Field>
        <Field label="What do you enjoy doing — and what are you genuinely good at?">
          <TextArea value={data.enjoyExcel} onChange={set("enjoyExcel")}
            placeholder="e.g. I love winning big jobs and building relationships. I'm great at estimating." />
        </Field>
        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Do you want to sell the business eventually?">
            <Select value={data.sellEventually} onChange={set("sellEventually")}>
              <option value="maybe">Not sure yet</option>
              <option value="yes">Yes, build to sell</option>
              <option value="no">No, keep it long-term</option>
            </Select>
          </Field>
        </div>
        <Field label="What does success look like 5 years from now?">
          <TextArea value={data.fiveYearVision} onChange={set("fiveYearVision")}
            placeholder="Paint the picture: the business, your life, your role in it..." />
        </Field>
      </div>
      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!ready} />
    </StepShell>
  );
}
