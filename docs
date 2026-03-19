const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Pitch Poa API',
      version: '1.0.0',
      description: 'AI-Powered Sales Platform for Small Vendors in Kenya',
      contact: {
        name: 'API Support',
        email: 'support@pitch-poa.com'
      },
      license: {
        name: 'Proprietary',
        url: 'https://pitch-poa.com/terms'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'API Server',
      },
      {
        url: 'https://api.pitch-poa.com',
        description: 'Production Server',
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            stack: {
              type: 'string',
              description: 'Stack trace (only in development)'
            }
          }
        },
        ComplianceCheck: {
          type: 'object',
          properties: {
            businessId: {
              type: 'string',
              example: '60d21b4667d0d8992e610c85'
            },
            overallScore: {
              type: 'number',
              example: 85.5
            },
            complianceLevel: {
              type: 'string',
              enum: ['excellent', 'good', 'fair', 'poor'],
              example: 'good'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                '': '#/components/schemas/Error'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                '': '#/components/schemas/Error'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  errors: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        msg: { type: 'string' },
                        param: { type: 'string' },
                        location: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    security: [{
      bearerAuth: [],
    }],
    tags: [
      {
        name: 'Compliance',
        description: 'Compliance checking and management'
      },
      {
        name: 'Tax',
        description: 'Tax calculation and filing'
      },
      {
        name: 'Business',
        description: 'Business registration and permits'
      },
      {
        name: 'Data Protection',
        description: 'Data protection and consent management'
      },
      {
        name: 'Health',
        description: 'Health checks and monitoring'
      },
      {
        name: 'Monitoring',
        description: 'Performance metrics and monitoring'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/models/*.js',
    './src/controllers/*.js'
  ],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
