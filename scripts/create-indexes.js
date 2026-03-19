const mongoose = require('mongoose');
require('dotenv').config();

// Import all models to ensure they're registered
const Business = require('../src/models/Business');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Sale = require('../src/models/Sale');
const TaxFiling = require('../src/models/TaxFiling');
const ComplianceRecord = require('../src/models/ComplianceRecord');
const BusinessPermit = require('../src/models/BusinessPermit');
const AuditLog = require('../src/models/AuditLog');

async function createIndexes() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');

    const models = [
      { name: 'Business', model: Business },
      { name: 'User', model: User },
      { name: 'Product', model: Product },
      { name: 'Sale', model: Sale },
      { name: 'TaxFiling', model: TaxFiling },
      { name: 'ComplianceRecord', model: ComplianceRecord },
      { name: 'BusinessPermit', model: BusinessPermit },
      { name: 'AuditLog', model: AuditLog }
    ];
    
    for (const { name, model } of models) {
      console.log(Creating indexes for ...);
      await model.createIndexes();
      console.log(✅ Indexes created for );
    }
    
    console.log('🎉 All indexes created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  }
}

createIndexes();
