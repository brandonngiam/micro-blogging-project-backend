module.exports = {
  mongodbMemoryServerOptions: {
    instance: {
      dbName: "twitta"
    },
    binary: {
      version: "3.6.10",
      skipMD5: true
    },
    autoStart: false
  }
};
