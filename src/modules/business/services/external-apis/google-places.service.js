const axios = require('axios');
const config = require('../../config/api-config');

class GooglePlacesService {
  constructor() {
    this.client = axios.create({
      baseURL: config.googlePlaces.baseUrl,
      params: {
        key: config.googlePlaces.apiKey,
      },
      timeout: 10000,
    });
  }

  /**
   * Get competitor analysis in area
   */
  async getCompetitorAnalysis(businessType, location) {
    try {
      const response = await this.client.get('/nearbysearch/json', {
        params: {
          location: `${location.lat},${location.lng}`,
          radius: 5000, // 5km radius
          keyword: businessType,
          type: 'establishment',
        },
      });

      const competitors = response.data.results;
      
      return {
        totalCompetitors: competitors.length,
        averageRating: this.calculateAverageRating(competitors),
        topCompetitors: competitors.slice(0, 5).map(c => ({
          name: c.name,
          rating: c.rating,
          userRatingsTotal: c.user_ratings_total,
          vicinity: c.vicinity,
        })),
        competitionDensity: this.calculateDensity(competitors.length, 5000),
        marketGaps: this.identifyMarketGaps(competitors, businessType),
      };
    } catch (error) {
      console.error('Google Places API Error:', error);
      // Return basic analysis instead of failing
      return {
        totalCompetitors: 0,
        error: 'Could not fetch competitor data',
        suggestedAction: 'Perform manual market research in your area',
      };
    }
  }

  /**
   * Get area demographics and business density
   */
  async getAreaAnalysis(location) {
    try {
      // Get place details for the area
      const response = await this.client.get('/nearbysearch/json', {
        params: {
          location: `${location.lat},${location.lng}`,
          radius: 2000,
          type: 'establishment',
        },
      });

      const businesses = response.data.results;
      
      // Categorize businesses
      const categories = this.categorizeBusinesses(businesses);
      
      return {
        totalBusinesses: businesses.length,
        businessCategories: categories,
        popularAreas: this.identifyPopularAreas(businesses),
        consumerTraffic: this.estimateConsumerTraffic(businesses),
      };
    } catch (error) {
      console.error('Area Analysis Error:', error);
      return null;
    }
  }

  calculateAverageRating(competitors) {
    const rated = competitors.filter(c => c.rating);
    if (rated.length === 0) return 0;
    const sum = rated.reduce((acc, c) => acc + c.rating, 0);
    return sum / rated.length;
  }

  calculateDensity(count, radius) {
    const area = Math.PI * radius * radius / 1000000; // in sq km
    return count / area;
  }

  identifyMarketGaps(competitors, businessType) {
    // Analyze what's missing in the market
    const existingServices = new Set();
    competitors.forEach(c => {
      if (c.types) {
        c.types.forEach(t => existingServices.add(t));
      }
    });

    // Define common service types for this business category
    const expectedServices = this.getExpectedServices(businessType);
    
    return expectedServices.filter(s => !existingServices.has(s));
  }

  getExpectedServices(businessType) {
    const services = {
      restaurant: ['meal_delivery', 'catering', 'takeaway'],
      retail: ['delivery', 'online_ordering'],
      services: ['mobile_service', 'home_service'],
    };
    return services[businessType] || [];
  }

  categorizeBusinesses(businesses) {
    const categories = {};
    businesses.forEach(b => {
      if (b.types) {
        b.types.forEach(type => {
          categories[type] = (categories[type] || 0) + 1;
        });
      }
    });
    return categories;
  }

  identifyPopularAreas(businesses) {
    // Simple clustering to find dense areas
    const areas = {};
    businesses.forEach(b => {
      const area = b.vicinity?.split(',')[0] || 'unknown';
      areas[area] = (areas[area] || 0) + 1;
    });
    return Object.entries(areas)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([area, count]) => ({ area, businessCount: count }));
  }

  estimateConsumerTraffic(businesses) {
    // Estimate based on opening hours and ratings count
    let totalTraffic = 0;
    businesses.forEach(b => {
      if (b.user_ratings_total) {
        totalTraffic += b.user_ratings_total * 10; // Rough estimate
      }
    });
    return {
      estimatedDaily: Math.round(totalTraffic / 30),
      confidence: 'low', // This is a rough estimate
    };
  }
}

module.exports = new GooglePlacesService();