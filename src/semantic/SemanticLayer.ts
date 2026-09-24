import type { ModelDef, MetricDef, DimensionDef } from "./types";
import type { QueryResult, QueryResultRow } from "../query/types";

export function defineModel(def: ModelDef): ModelDef {
  return def;
}

/**
 * The semantic layer is a small registry of "what metrics and dimensions
 * exist, and what do they mean" \u2014 the same role config/*.yml files play in
 * bi_report-style Rails gems. Dashboards and charts reference metrics by
 * name ("revenue", "active_users") instead of hardcoding SQL or API shapes,
 * so the underlying schema can change without breaking every widget.
 */
export class SemanticLayer {
  private models = new Map<string, ModelDef>();
  private metricIndex = new Map<string, { model: string; metric: MetricDef }>();
  private dimensionIndex = new Map<string, { model: string; dimension: DimensionDef }>();

  register(model: ModelDef) {
    this.models.set(model.name, model);
    for (const metric of model.metrics) {
      this.metricIndex.set(metric.name, { model: model.name, metric });
    }
    for (const dimension of model.dimensions) {
      this.dimensionIndex.set(dimension.name, { model: model.name, dimension });
    }
    return this;
  }

  getModel(name: string): ModelDef | undefined {
    return this.models.get(name);
  }

  getMetric(name: string): MetricDef | undefined {
    return this.metricIndex.get(name)?.metric;
  }

  getDimension(name: string): DimensionDef | undefined {
    return this.dimensionIndex.get(name)?.dimension;
  }

  listModels(): ModelDef[] {
    return [...this.models.values()];
  }

  /** All metrics across all registered models \u2014 handy for a "pick a metric" UI. */
  listMetrics(): MetricDef[] {
    return [...this.metricIndex.values()].map((v) => v.metric);
  }

  listDimensions(): DimensionDef[] {
    return [...this.dimensionIndex.values()].map((v) => v.dimension);
  }

  /**
   * Fills in any `derivedFrom` metrics client-side once raw rows come back
   * from the adapter (e.g. avg_order_value = revenue / order_count computed
   * per-row without asking the backend to know about the derived metric).
   */
  hydrateDerivedMetrics(result: QueryResult, metricNames: string[]): QueryResult {
    const derived = metricNames
      .map((name) => this.getMetric(name))
      .filter((m): m is MetricDef => !!m?.derivedFrom);

    if (derived.length === 0) return result;

    const rows: QueryResultRow[] = result.rows.map((row) => {
      const next = { ...row };
      for (const metric of derived) {
        const inputs: Record<string, number> = {};
        for (const dep of metric.derivedFrom!.metrics) inputs[dep] = Number(row[dep] ?? 0);
        next[metric.name] = metric.derivedFrom!.compute(inputs);
      }
      return next;
    });

    return { ...result, rows };
  }

  /** Human label lookup, used by chart legends/tooltips/table headers. */
  labelFor(fieldName: string): string {
    return this.getMetric(fieldName)?.label ?? this.getDimension(fieldName)?.label ?? fieldName;
  }

  formatFor(fieldName: string): MetricDef["format"] | undefined {
    return this.getMetric(fieldName)?.format;
  }
}
