// PM2 Ecosystem configuration for production deployment
module.exports = {
  apps: [{
    name: 'wizone-portal',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    restart_delay: 4000,
    min_uptime: '10s',
    max_restarts: 5
  }],

  deploy: {
    production: {
      user: 'ubuntu',
      host: 'task.wizoneit.com',
      ref: 'origin/main',
      repo: 'git@github.com:wizone/it-portal.git',
      path: '/var/www/wizone-portal',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};