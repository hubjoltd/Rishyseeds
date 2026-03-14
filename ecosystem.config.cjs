require("dotenv").config();

module.exports = {
  apps: [
    {
      name: "rishi-seeds",
      script: "dist/index.cjs",
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || "5000",
        DATABASE_URL: process.env.DATABASE_URL,
        SESSION_SECRET: process.env.SESSION_SECRET,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
    },
  ],
};
