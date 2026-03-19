const axios = require('axios');

class WeatherAPIService {
  constructor() {
    // OpenWeatherMap API (register at openweathermap.org)
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      params: {
        appid: this.apiKey,
        units: 'metric'
      }
    });
  }

  /**
   * Get current weather for location
   */
  async getCurrentWeather(lat, lon) {
    try {
      const response = await this.client.get('/weather', {
        params: { lat, lon }
      });

      return {
        temperature: response.data.main.temp,
        feelsLike: response.data.main.feels_like,
        humidity: response.data.main.humidity,
        conditions: response.data.weather[0].description,
        windSpeed: response.data.wind.speed,
        icon: response.data.weather[0].icon,
        location: response.data.name
      };
    } catch (error) {
      console.error('Weather API Error:', error.message);
      throw new Error('Failed to fetch weather data');
    }
  }

  /**
   * Get weather forecast
   */
  async getForecast(lat, lon, days = 5) {
    try {
      const response = await this.client.get('/forecast', {
        params: { lat, lon, cnt: days * 8 } // 8 readings per day
      });

      return {
        daily: this.aggregateDailyForecast(response.data.list),
        current: {
          temperature: response.data.list[0].main.temp,
          conditions: response.data.list[0].weather[0].description
        }
      };
    } catch (error) {
      throw new Error('Failed to fetch forecast');
    }
  }

  /**
   * Get historical weather
   */
  async getHistoricalWeather(lat, lon, date) {
    try {
      // Using One Call API 3.0 for historical data
      const timestamp = Math.floor(date.getTime() / 1000);
      
      const response = await this.client.get('/onecall/timemachine', {
        params: { lat, lon, dt: timestamp }
      });

      return {
        temperature: response.data.current.temp,
        conditions: response.data.current.weather[0].description,
        humidity: response.data.current.humidity,
        windSpeed: response.data.current.wind_speed
      };
    } catch (error) {
      throw new Error('Failed to fetch historical weather');
    }
  }

  /**
   * Aggregate daily forecast from 3-hour intervals
   */
  aggregateDailyForecast(forecastList) {
    const daily = {};

    forecastList.forEach(item => {
      const date = item.dt_txt.split(' ')[0];
      
      if (!daily[date]) {
        daily[date] = {
          date,
          temps: [],
          conditions: [],
          humidity: [],
          windSpeed: []
        };
      }

      daily[date].temps.push(item.main.temp);
      daily[date].conditions.push(item.weather[0].description);
      daily[date].humidity.push(item.main.humidity);
      daily[date].windSpeed.push(item.wind.speed);
    });

    return Object.values(daily).map(day => ({
      date: day.date,
      tempMin: Math.min(...day.temps),
      tempMax: Math.max(...day.temps),
      tempAvg: day.temps.reduce((a, b) => a + b, 0) / day.temps.length,
      condition: this.getDominantCondition(day.conditions),
      humidityAvg: day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length,
      windAvg: day.windSpeed.reduce((a, b) => a + b, 0) / day.windSpeed.length
    }));
  }

  /**
   * Get dominant weather condition
   */
  getDominantCondition(conditions) {
    const counts = {};
    conditions.forEach(c => counts[c] = (counts[c] || 0) + 1);
    
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])[0][0];
  }
}

module.exports = new WeatherAPIService();