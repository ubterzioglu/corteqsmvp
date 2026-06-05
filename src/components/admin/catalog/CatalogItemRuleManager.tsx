import { type ReactNode, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  getCatalogItemRules,
  removeCatalogItemAttributeOverride,
  removeCatalogItemFeatureOverride,
  removeCatalogItemSectionOverride,
  setCatalogItemAttributeOverride,
  setCatalogItemFeatureOverride,
  setCatalogItemSectionOverride,
} from "@/lib/admin-catalog";
import type { CatalogItemAttribute, CatalogItemFeature, CatalogItemRules, CatalogItemSection } from "@/lib/catalog-types";

type CatalogItemRuleManagerProps = {
  itemId: string;
  rules: CatalogItemRules;
  onRulesChanged: (rules: CatalogItemRules) => void;
};

const CatalogItemRuleManager = ({ itemId, rules, onRulesChanged }: CatalogItemRuleManagerProps) => {
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshRules = async () => {
    const nextRules = await getCatalogItemRules(itemId);
    onRulesChanged(nextRules);
  };

  const runAction = async (key: string, callback: () => Promise<void>) => {
    setPendingKey(key);
    setErrorMessage(null);

    try {
      await callback();
      await refreshRules();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kural güncellenemedi.");
    } finally {
      setPendingKey(null);
    }
  };

  return (
    <div className="space-y-4">
      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

      <RuleGroup
        title="Attributes"
        description="Alan bazında görünürlük, sıra ve özel label override yönetimi."
        count={rules.attributes.length}
      >
        <div className="space-y-3">
          {rules.attributes.map((attribute) => (
            <AttributeRuleRow
              key={attribute.key}
              attribute={attribute}
              isSaving={pendingKey === `attribute:${attribute.key}`}
              onSave={(nextValue) =>
                runAction(`attribute:${attribute.key}`, () =>
                  setCatalogItemAttributeOverride(itemId, attribute.key, nextValue),
                )
              }
              onReset={() =>
                runAction(`attribute:${attribute.key}`, () =>
                  removeCatalogItemAttributeOverride(itemId, attribute.key),
                )
              }
            />
          ))}
          {rules.attributes.length === 0 ? <EmptyRulesMessage /> : null}
        </div>
      </RuleGroup>

      <RuleGroup title="Features" description="Feature flag override yönetimi." count={rules.features.length}>
        <div className="space-y-3">
          {rules.features.map((feature) => (
            <FeatureRuleRow
              key={feature.key}
              feature={feature}
              isSaving={pendingKey === `feature:${feature.key}`}
              onSave={(isEnabled) =>
                runAction(`feature:${feature.key}`, () => setCatalogItemFeatureOverride(itemId, feature.key, isEnabled))
              }
              onReset={() =>
                runAction(`feature:${feature.key}`, () => removeCatalogItemFeatureOverride(itemId, feature.key))
              }
            />
          ))}
          {rules.features.length === 0 ? <EmptyRulesMessage /> : null}
        </div>
      </RuleGroup>

      <RuleGroup title="Sections" description="Profil bölüm görünürlüğü ve sıra override yönetimi." count={rules.sections.length}>
        <div className="space-y-3">
          {rules.sections.map((section) => (
            <SectionRuleRow
              key={section.key}
              section={section}
              isSaving={pendingKey === `section:${section.key}`}
              onSave={(nextValue) =>
                runAction(`section:${section.key}`, () => setCatalogItemSectionOverride(itemId, section.key, nextValue))
              }
              onReset={() =>
                runAction(`section:${section.key}`, () => removeCatalogItemSectionOverride(itemId, section.key))
              }
            />
          ))}
          {rules.sections.length === 0 ? <EmptyRulesMessage /> : null}
        </div>
      </RuleGroup>
    </div>
  );
};

const RuleGroup = ({
  title,
  description,
  count,
  children,
}: {
  title: string;
  description: string;
  count: number;
  children: ReactNode;
}) => (
  <Card>
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <Badge variant="secondary">{count}</Badge>
      </div>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const RuleBadges = ({ isOverride }: { isOverride: boolean }) => (
  <div className="flex flex-wrap gap-2">
    <Badge variant={isOverride ? "secondary" : "outline"}>{isOverride ? "Override" : "Inherited"}</Badge>
  </div>
);

const AttributeRuleRow = ({
  attribute,
  isSaving,
  onSave,
  onReset,
}: {
  attribute: CatalogItemAttribute;
  isSaving: boolean;
  onSave: (config: { isEnabled: boolean; displayOrder: number | null; overrideLabel: string | null }) => Promise<void>;
  onReset: () => Promise<void>;
}) => {
  const [isEnabled, setIsEnabled] = useState(attribute.isEnabled ?? true);
  const [displayOrder, setDisplayOrder] = useState(String(attribute.displayOrder));
  const [overrideLabel, setOverrideLabel] = useState(attribute.isOverride ? attribute.label : "");

  useEffect(() => {
    setIsEnabled(attribute.isEnabled ?? true);
    setDisplayOrder(String(attribute.displayOrder));
    setOverrideLabel(attribute.isOverride ? attribute.label : "");
  }, [attribute]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-slate-950">{attribute.label}</div>
            <Badge variant="outline">{attribute.key}</Badge>
            <Badge variant="outline">{attribute.dataType}</Badge>
            <Badge variant="outline">{attribute.visibility}</Badge>
            {attribute.isRequired ? <Badge variant="outline">Required</Badge> : null}
          </div>
          <RuleBadges isOverride={attribute.isOverride} />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Aktif</span>
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} disabled={isSaving} aria-label={`${attribute.key} aktif`} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,2fr)_140px_auto]">
        <Input
          value={overrideLabel}
          onChange={(event) => setOverrideLabel(event.target.value)}
          placeholder="Özel label (opsiyonel)"
          aria-label={`${attribute.key} label override`}
          disabled={isSaving}
        />
        <Input
          value={displayOrder}
          onChange={(event) => setDisplayOrder(event.target.value)}
          inputMode="numeric"
          placeholder="Sıra"
          aria-label={`${attribute.key} display order`}
          disabled={isSaving}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() =>
              onSave({
                isEnabled,
                displayOrder: displayOrder.trim() ? Number(displayOrder) : null,
                overrideLabel: overrideLabel.trim() || null,
              })
            }
            disabled={isSaving}
          >
            {isSaving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
          {attribute.isOverride ? (
            <Button type="button" size="sm" variant="outline" onClick={onReset} disabled={isSaving}>
              Varsayılana Dön
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const FeatureRuleRow = ({
  feature,
  isSaving,
  onSave,
  onReset,
}: {
  feature: CatalogItemFeature;
  isSaving: boolean;
  onSave: (isEnabled: boolean) => Promise<void>;
  onReset: () => Promise<void>;
}) => {
  const [isEnabled, setIsEnabled] = useState(feature.isEnabled);

  useEffect(() => {
    setIsEnabled(feature.isEnabled);
  }, [feature]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-slate-950">{feature.label ?? feature.key}</div>
            <Badge variant="outline">{feature.key}</Badge>
          </div>
          <RuleBadges isOverride={feature.isOverride} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Aktif</span>
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} disabled={isSaving} aria-label={`${feature.key} aktif`} />
          </div>
          <Button type="button" size="sm" onClick={() => onSave(isEnabled)} disabled={isSaving}>
            {isSaving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
          {feature.isOverride ? (
            <Button type="button" size="sm" variant="outline" onClick={onReset} disabled={isSaving}>
              Varsayılana Dön
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const SectionRuleRow = ({
  section,
  isSaving,
  onSave,
  onReset,
}: {
  section: CatalogItemSection;
  isSaving: boolean;
  onSave: (config: { isVisible: boolean; displayOrder: number | null }) => Promise<void>;
  onReset: () => Promise<void>;
}) => {
  const [isVisible, setIsVisible] = useState(section.isVisible);
  const [displayOrder, setDisplayOrder] = useState(String(section.displayOrder));

  useEffect(() => {
    setIsVisible(section.isVisible);
    setDisplayOrder(String(section.displayOrder));
  }, [section]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-slate-950">{section.label ?? section.key}</div>
            <Badge variant="outline">{section.key}</Badge>
          </div>
          <RuleBadges isOverride={section.isOverride} />
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>Görünür</span>
          <Switch checked={isVisible} onCheckedChange={setIsVisible} disabled={isSaving} aria-label={`${section.key} görünür`} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[140px_auto]">
        <Input
          value={displayOrder}
          onChange={(event) => setDisplayOrder(event.target.value)}
          inputMode="numeric"
          placeholder="Sıra"
          aria-label={`${section.key} display order`}
          disabled={isSaving}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() =>
              onSave({
                isVisible,
                displayOrder: displayOrder.trim() ? Number(displayOrder) : null,
              })
            }
            disabled={isSaving}
          >
            {isSaving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
          {section.isOverride ? (
            <Button type="button" size="sm" variant="outline" onClick={onReset} disabled={isSaving}>
              Varsayılana Dön
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const EmptyRulesMessage = () => <p className="text-sm text-muted-foreground">Bu grupta kural bulunamadı.</p>;

export default CatalogItemRuleManager;
