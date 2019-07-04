const mongoose = require("mongoose");

//must add scenario for production
//we have three databases: local, production, in-memory for tests
const dbURL = global.__MONGO_URI__ || "mongodb://localhost:27017/twitta";
mongoose.connect(dbURL, { useNewUrlParser: true });
mongoose.set("useFindAndModify", false);
const db = mongoose.connection;

db.on("error", console.error.bind(console, "Mongo connection error:"));
db.once("open", () => {
  console.log(`Connection to mongoDB on ${dbURL}`);
});
