module.exports = {
  apps: [
    {
      name: 'ironcompass',
      cwd: __dirname,
      script: 'npm',
      args: 'start -- -H 127.0.0.1', // localhost only: the hub has no host firewall (lifeos#2195)
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
