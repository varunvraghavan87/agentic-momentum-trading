module.exports = {
  apps: [
    {
      name: 'amt-api',
      script: 'dist/index.js',
      cwd: './apps/api',
      env: {
        NODE_ENV: 'production',
        TZ: 'Asia/Kolkata',
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
    },
  ],
};
