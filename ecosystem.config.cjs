module.exports = {
  apps: [
    { script: 'src/index.js', watch: false },
    { script: 'src/worker/otp.worker.js', watch: false },
  ],
};
