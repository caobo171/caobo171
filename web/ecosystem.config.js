module.exports = {
  apps: [
    {
      name: "caobo171.web",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 41717",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 41717,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 41717,
      },
      max_memory_restart: "512M",
      time: true,
    },
  ],
};
