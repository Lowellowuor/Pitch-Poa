const axios = require('axios');

class SocialMetricsAPIService {
  constructor() {
    this.facebookToken = process.env.FACEBOOK_ACCESS_TOKEN;
    this.instagramToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    this.twitterBearer = process.env.TWITTER_BEARER_TOKEN;
  }

  /**
   * Get Facebook page insights
   */
  async getFacebookInsights(pageId, period = 'day') {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${pageId}/insights`,
        {
          params: {
            metric: 'page_impressions,page_engaged_users,page_follows,page_post_engagements',
            period,
            access_token: this.facebookToken
          }
        }
      );

      const metrics = {};
      response.data.data.forEach(m => {
        metrics[m.name] = m.values[0]?.value || 0;
      });

      return {
        pageId,
        period,
        impressions: metrics.page_impressions,
        engagements: metrics.page_engaged_users,
        newFollowers: metrics.page_follows,
        postEngagements: metrics.page_post_engagements,
        date: new Date().toISOString()
      };
    } catch (error) {
      throw new Error('Failed to fetch Facebook insights');
    }
  }

  /**
   * Get Instagram insights
   */
  async getInstagramInsights(instagramId, period = 'day') {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${instagramId}/insights`,
        {
          params: {
            metric: 'impressions,reach,profile_views,follower_count',
            period,
            access_token: this.instagramToken
          }
        }
      );

      const metrics = {};
      response.data.data.forEach(m => {
        metrics[m.name] = m.values[0]?.value || 0;
      });

      return {
        instagramId,
        period,
        impressions: metrics.impressions,
        reach: metrics.reach,
        profileViews: metrics.profile_views,
        followers: metrics.follower_count,
        date: new Date().toISOString()
      };
    } catch (error) {
      throw new Error('Failed to fetch Instagram insights');
    }
  }

  /**
   * Get Twitter analytics
   */
  async getTwitterAnalytics(username, days = 7) {
    try {
      // First get user ID
      const userResponse = await axios.get(
        `https://api.twitter.com/2/users/by/username/${username}`,
        {
          headers: {
            'Authorization': `Bearer ${this.twitterBearer}`
          }
        }
      );

      const userId = userResponse.data.data.id;

      // Get tweet metrics
      const tweetsResponse = await axios.get(
        `https://api.twitter.com/2/users/${userId}/tweets`,
        {
          params: {
            'tweet.fields': 'public_metrics,created_at',
            max_results: 100
          },
          headers: {
            'Authorization': `Bearer ${this.twitterBearer}`
          }
        }
      );

      const tweets = tweetsResponse.data.data || [];
      
      let totalLikes = 0;
      let totalRetweets = 0;
      let totalReplies = 0;

      tweets.forEach(tweet => {
        if (tweet.public_metrics) {
          totalLikes += tweet.public_metrics.like_count || 0;
          totalRetweets += tweet.public_metrics.retweet_count || 0;
          totalReplies += tweet.public_metrics.reply_count || 0;
        }
      });

      return {
        username,
        userId,
        tweetCount: tweets.length,
        engagement: {
          likes: totalLikes,
          retweets: totalRetweets,
          replies: totalReplies,
          total: totalLikes + totalRetweets + totalReplies
        },
        period: `${days} days`
      };
    } catch (error) {
      throw new Error('Failed to fetch Twitter analytics');
    }
  }

  /**
   * Get WhatsApp Business analytics
   */
  async getWhatsAppAnalytics(phoneNumberId, period = 'day') {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/insights`,
        {
          params: {
            metric: 'sent,messages_delivered,messages_read,conversations',
            period,
            access_token: process.env.WHATSAPP_ACCESS_TOKEN
          }
        }
      );

      const metrics = {};
      response.data.data.forEach(m => {
        metrics[m.name] = m.values[0]?.value || 0;
      });

      return {
        phoneNumberId,
        period,
        sent: metrics.sent,
        delivered: metrics.messages_delivered,
        read: metrics.messages_read,
        conversations: metrics.conversations,
        date: new Date().toISOString()
      };
    } catch (error) {
      throw new Error('Failed to fetch WhatsApp analytics');
    }
  }
}

module.exports = new SocialMetricsAPIService();