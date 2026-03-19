class DashboardSummaryDTO {
  constructor(data) {
    this.period = data.period;
    this.totalSales = data.totalSales?.total || 0;
    this.totalProfit = data.totalProfit?.profit || 0;
    this.profitMargin = data.totalProfit?.margin || 0;
    this.transactions = data.totalSales?.transactionCount || 0;
    this.averageTransaction = data.totalSales?.averageTransaction || 0;
  }
}

class SalesTrendDTO {
  constructor(data) {
    this.daily = data.daily?.map(d => ({
      date: d._id,
      total: d.total,
      count: d.count
    })) || [];
    this.growthRate = data.growthRate || 0;
    this.period = data.period;
  }
}

class ExpensesDTO {
  constructor(data) {
    this.byCategory = data.map(c => ({
      category: c.category,
      total: c.total,
      count: c.count,
      percentage: c.percentage
    }));
  }
}

class BusinessSnapshotDTO {
  constructor(data) {
    this.snapshot = data.snapshot;
    this.recentActivity = data.recentActivity;
    this.healthScore = data.healthScore;
    this.timestamp = data.snapshot?.date;
  }
}

module.exports = {
  DashboardSummaryDTO,
  SalesTrendDTO,
  ExpensesDTO,
  BusinessSnapshotDTO
};