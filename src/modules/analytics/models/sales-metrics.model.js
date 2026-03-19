const mongoose = require('mongoose');

const salesMetricsSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  costOfGoods: Number,
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  channel: {
    type: String,
    enum: ['direct', 'whatsapp', 'facebook', 'instagram', 'website', 'mpesa']
  },
  scriptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Script'
  },
  scriptName: String,
  converted: Boolean,
  expenseCategory: String,
  expenseAmount: Number,
  mpesaReference: String,
  paymentMethod: {
    type: String,
    enum: ['cash', 'mpesa', 'card', 'bank']
  },
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes for analytics queries
salesMetricsSchema.index({ businessId: 1, date: -1 });
salesMetricsSchema.index({ businessId: 1, channel: 1, date: -1 });
salesMetricsSchema.index({ businessId: 1, productId: 1, date: -1 });

// Aggregation pipelines for common queries
salesMetricsSchema.statics.getDailyTotals = function(businessId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        businessId: mongoose.Types.ObjectId(businessId),
        date: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);
};

module.exports = mongoose.model('SalesMetrics', salesMetricsSchema);