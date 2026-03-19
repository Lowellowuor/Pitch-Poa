module.exports = {
  // OpenAI for business idea generation
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4-turbo-preview', 
    maxTokens: 2000,
    temperature: 0.7,
  },

  // Google Places API for market research
  googlePlaces: {
    apiKey: process.env.GOOGLE_PLACES_API_KEY,
    baseUrl: 'https://maps.googleapis.com/maps/api/place',
  },

  // World Bank Open Data for economic indicators
  worldBank: {
    baseUrl: 'https://api.worldbank.org/v2',
    format: 'json',
  },

  // Kenyan Government APIs
  kra: {
    baseUrl: process.env.KRA_API_URL,
    apiKey: process.env.KRA_API_KEY,
  },

  // Market research APIs 
  marketResearch: {
    baseUrl: process.env.MARKET_RESEARCH_API_URL,
    apiKey: process.env.MARKET_RESEARCH_API_KEY,
  },

  // African Development Bank data
  afdb: {
    baseUrl: 'https://data.opendevelopmentafrica.org/api',
  },

  // KNBS (Kenya National Bureau of Statistics)
  knbs: {
    baseUrl: process.env.KNBS_API_URL,
  },
};