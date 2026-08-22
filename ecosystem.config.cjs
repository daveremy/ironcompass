module.exports = {
  apps: [
    {
      name: 'ironcompass',
      cwd: __dirname,
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
