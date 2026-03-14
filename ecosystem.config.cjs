module.exports = {
  apps: [
    {
      name: "rishi-seeds",
      script: "dist/index.cjs",
      env: {
        NODE_ENV: "production",
        PORT: "5000",
        DATABASE_URL: process.env.DATABASE_URL || "",
        SESSION_SECRET: process.env.SESSION_SECRET || "change-me-to-a-long-random-string",
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
    },
  ],
};
