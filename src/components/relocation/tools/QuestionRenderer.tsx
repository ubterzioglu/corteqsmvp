// Soru tipine göre input — QuestionStepper tarafından kullanılır.
// answer_type: single|multi|scale|number|currency|text|date|country|city|profession|consent.
// country/city/profession: MVP'de serbest metin fallback; ileride zengin seçici (relocation geo).

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { TOOLS_UI_COPY } from "@/lib/relocation-tools-copy";
import type {
  RelocationToolQuestionRow,
  ToolAnswerValue,
} from "@/lib/relocation-tools-types";

interface QuestionRendererProps {
  question: RelocationToolQuestionRow;
  value: ToolAnswerValue | undefined;
  onChange: (value: ToolAnswerValue) => void;
}

export function QuestionRenderer({ question, value, onChange }: QuestionRendererProps) {
  const { answer_type, options, id } = question;

  switch (answer_type) {
    case "single":
      return (
        <div>
          <p className="mb-2 text-xs text-muted-foreground">{TOOLS_UI_COPY.selectHint}</p>
          <RadioGroup
            value={typeof value === "string" ? value : ""}
            onValueChange={onChange}
            className="space-y-2"
          >
            {options.map((opt) => (
              <label
                key={opt.value}
                htmlFor={`${id}-${opt.value}`}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent"
              >
                <RadioGroupItem id={`${id}-${opt.value}`} value={opt.value} />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </RadioGroup>
        </div>
      );

    case "multi": {
      const selected = Array.isArray(value) ? value : [];
      const toggle = (v: string, checked: boolean) =>
        onChange(checked ? [...selected, v] : selected.filter((x) => x !== v));
      return (
        <div>
          <p className="mb-2 text-xs text-muted-foreground">{TOOLS_UI_COPY.multiHint}</p>
          <div className="space-y-2">
            {options.map((opt) => (
              <label
                key={opt.value}
                htmlFor={`${id}-${opt.value}`}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent"
              >
                <Checkbox
                  id={`${id}-${opt.value}`}
                  checked={selected.includes(opt.value)}
                  onCheckedChange={(c) => toggle(opt.value, c === true)}
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }

    case "scale": {
      const current = typeof value === "number" ? value : 3;
      return (
        <div className="space-y-3">
          <Slider min={1} max={5} step={1} value={[current]} onValueChange={(v) => onChange(v[0])} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{TOOLS_UI_COPY.scaleLow}</span>
            <span className="font-semibold text-foreground">{current}</span>
            <span>{TOOLS_UI_COPY.scaleHigh}</span>
          </div>
        </div>
      );
    }

    case "number":
    case "currency":
      return (
        <Input
          type="number"
          inputMode="numeric"
          value={typeof value === "number" ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder={question.help_tr ?? ""}
        />
      );

    case "consent":
      return (
        <label
          htmlFor={id}
          className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3"
        >
          <Checkbox
            id={id}
            checked={value === true}
            onCheckedChange={(c) => onChange(c === true)}
          />
          <span className="text-sm">{question.help_tr ?? question.prompt_tr}</span>
        </label>
      );

    // text / date / country / city / profession → serbest metin fallback (MVP).
    default:
      return (
        <div className="space-y-1">
          {question.help_tr && (
            <Label htmlFor={id} className="text-xs text-muted-foreground">
              {question.help_tr}
            </Label>
          )}
          <Input
            id={id}
            type={answer_type === "date" ? "date" : "text"}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
  }
}
