module.exports = {
  apps: [
    {
      name: 'HTPC API',
      script: './out/main.js',
      // node_args: ['-r', 'dotenv/config'],
      watch: ['./out'],
    },
  ],
};
