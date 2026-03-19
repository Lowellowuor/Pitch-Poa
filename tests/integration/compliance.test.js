const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const Business = require('../../src/models/Business');
const User = require('../../src/models/User');

// Generate test token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1d'
  });
};

describe('Compliance API', () => {
  let token;
  let businessId;
  let testUser;

  beforeAll(async () => {
    // Connect to test database
    const testUri = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/pitch-poa-test';
    await mongoose.connect(testUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'business_owner'
    });
    
    token = generateToken(testUser._id);
    
    // Create test business
    const business = await Business.create({
      name: 'Test Business',
      owner: testUser._id,
      kraPin: 'A123456789B',
      registrationNumber: 'REG123456',
      businessType: 'retail',
      annualTurnover: 1000000
    });
    
    businessId = business._id;
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  describe('GET /api/compliance/check/:businessId', () => {
    it('should return compliance status', async () => {
      const res = await request(app)
        .get(/api/compliance/check/)
        .set('Authorization', Bearer )
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('overallScore');
      expect(res.body.data).toHaveProperty('complianceLevel');
      expect(res.body.data).toHaveProperty('checks');
    }, 10000);

    it('should return 404 for non-existent business', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(/api/compliance/check/)
        .set('Authorization', Bearer )
        .expect(404);
    });

    it('should return 401 without token', async () => {
      await request(app)
        .get(/api/compliance/check/)
        .expect(401);
    });
  });

  describe('GET /api/compliance/dashboard/:businessId', () => {
    it('should return compliance dashboard', async () => {
      const res = await request(app)
        .get(/api/compliance/dashboard/)
        .set('Authorization', Bearer )
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('summary');
      expect(res.body.data).toHaveProperty('healthScore');
    });
  });

  describe('GET /api/compliance/deadlines/:businessId', () => {
    it('should return upcoming deadlines', async () => {
      const res = await request(app)
        .get(/api/compliance/deadlines/)
        .set('Authorization', Bearer )
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should respect days parameter', async () => {
      const res = await request(app)
        .get(/api/compliance/deadlines/?days=15)
        .set('Authorization', Bearer )
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/compliance/tax/calculations', () => {
    it('should calculate VAT correctly', async () => {
      const calculationData = {
        type: 'vat',
        data: {
          sales: 116000,
          purchases: 58000,
          type: 'standard'
        }
      };

      const res = await request(app)
        .post('/api/compliance/tax/calculations')
        .set('Authorization', Bearer )
        .send(calculationData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('outputVAT');
      expect(res.body.data).toHaveProperty('inputVAT');
      expect(res.body.data).toHaveProperty('payable');
    });

    it('should calculate PAYE correctly', async () => {
      const calculationData = {
        type: 'paye',
        data: {
          grossPay: 50000,
          deductions: {}
        }
      };

      const res = await request(app)
        .post('/api/compliance/tax/calculations')
        .set('Authorization', Bearer )
        .send(calculationData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('paye');
      expect(res.body.data).toHaveProperty('nssf');
      expect(res.body.data).toHaveProperty('shif');
      expect(res.body.data).toHaveProperty('netPay');
    });
  });

  describe('GET /api/compliance/permits/:businessId', () => {
    it('should return business permits', async () => {
      const res = await request(app)
        .get(/api/compliance/permits/)
        .set('Authorization', Bearer )
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/compliance/data-protection/consent', () => {
    it('should record user consent', async () => {
      const consentData = {
        purpose: 'data_processing',
        granted: true
      };

      const res = await request(app)
        .post('/api/compliance/data-protection/consent')
        .set('Authorization', Bearer )
        .send(consentData)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors', async () => {
      const invalidData = {
        type: 'vat',
        data: {}
      };

      const res = await request(app)
        .post('/api/compliance/tax/calculations')
        .set('Authorization', Bearer )
        .send(invalidData)
        .expect(400);

      expect(res.body).toHaveProperty('errors');
    });

    it('should handle unauthorized access', async () => {
      const fakeBusinessId = new mongoose.Types.ObjectId();
      
      await request(app)
        .get(/api/compliance/check/)
        .set('Authorization', Bearer )
        .expect(403);
    });
  });
});
