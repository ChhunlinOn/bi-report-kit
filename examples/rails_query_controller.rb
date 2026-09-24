# examples/rails_query_controller.rb
# ---------------------------------------------------------------------------
# Example server-side implementation of the contract bi-report-kit's
# createRestAdapter expects: POST a QueryDefinition JSON body, respond with
# { "rows": [...] }. This is the Rails-side equivalent of what bi_report's
# engine did internally \u2014 here it's just a plain controller action so any
# frontend (this package, or anything else) can call it.
#
# POST /api/bi/query
# body: { "metrics": ["revenue"], "dimensions": ["region"], "filters": [...],
#          "dateRange": { "field": "date", "start": "...", "end": "..." } }

class Api::Bi::QueryController < ApplicationController
  before_action :authenticate_user!

  # Mirrors the semantic layer registered on the frontend \u2014 keep these in
  # sync (or generate the frontend semantic layer from this same source).
  MODELS = {
    "orders" => {
      table: Order.table_name,
      dimensions: { "date" => "date(orders.created_at)", "region" => "orders.region", "channel" => "orders.channel" },
      metrics: {
        "revenue" => "SUM(orders.total_cents) / 100.0",
        "order_count" => "COUNT(orders.id)",
      },
    },
  }.freeze

  def create
    model = MODELS.fetch("orders") # in a multi-model setup, pick based on requested metrics
    scope = Order.all

    scope = apply_filters(scope, params[:filters])
    scope = apply_date_range(scope, params[:dateRange])

    select_metrics = Array(params[:metrics]).map { |m| "#{model[:metrics].fetch(m)} AS #{m}" }
    group_dimensions = Array(params[:dimensions])
    select_dimensions = group_dimensions.map { |d| "#{model[:dimensions].fetch(d)} AS #{d}" }

    scope = scope
      .select((select_dimensions + select_metrics).join(", "))
      .group(group_dimensions.map { |d| model[:dimensions].fetch(d) })

    scope = scope.order(params[:sort].to_a.map { |s| "#{s['field']} #{s['direction']}" }.join(", ")) if params[:sort].present?
    scope = scope.limit(params[:limit]) if params[:limit].present?

    render json: { rows: scope.as_json }
  end

  private

  def apply_filters(scope, filters)
    Array(filters).reduce(scope) do |s, f|
      column = f["field"]
      case f["operator"]
      when "eq" then s.where(column => f["value"])
      when "neq" then s.where.not(column => f["value"])
      when "in" then s.where(column => f["value"])
      when "gt" then s.where("#{column} > ?", f["value"])
      when "gte" then s.where("#{column} >= ?", f["value"])
      when "lt" then s.where("#{column} < ?", f["value"])
      when "lte" then s.where("#{column} <= ?", f["value"])
      else s
      end
    end
  end

  def apply_date_range(scope, range)
    return scope unless range.present?
    scope.where(range["field"] => range["start"]..range["end"])
  end
end
