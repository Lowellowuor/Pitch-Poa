module.exports = {
  apps: [{
    name: 'ai-sales-backend',
    script: 'server.js',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '2G',
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
    },
    
    // Logging
    error_file: '/var/log/pm2/ai-sales-error.log',
    out_file: '/var/log/pm2/ai-sales-out.log',
    log_file: '/var/log/pm2/ai-sales-combined.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Advanced options
    min_uptime: '30s',
    max_restarts: 5,
    kill_timeout: 10000,
    listen_timeout: 8000,
    shutdown_with_message: true,
    
    // Metrics
    instance_var: 'INSTANCE_ID',
    
    // Auto-restart
    autorestart: true,
    cron_restart: '0 0 * * *', // Restart daily at midnight
    
    // Environment variables
    env_production: {
      NODE_ENV: 'production',
    },
  }],

  // Deploy configuration (optional)
  deploy: {
    production: {
      user: 'node',
      host: 'your-production-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/ai-sales-backend.git',
      path: '/var/www/ai-sales-backend',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
    },
  },
};