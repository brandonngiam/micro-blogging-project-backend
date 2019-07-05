secretkey =
  process.env.NODE_ENV === "production" ? process.env.JWT_KEY : "secret key";

module.exports = secretkey;
