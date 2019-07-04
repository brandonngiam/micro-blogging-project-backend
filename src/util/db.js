const mongoose = require("mongoose");

//must add scenario for production
//we have three databases: local, production, in-memory for tests
const dbURL =
  process.env.NODE_ENV === "production"
    ? process.env.DATABASE_URL
    : global.__MONGO_URI__ || "mongodb://localhost:27017/twitta";
mongoose.connect(dbURL, { useNewUrlParser: true });
mongoose.set("useFindAndModify", false);
const db = mongoose.connection;

db.on("error", console.error.bind(console, "Mongo connection error:"));
db.once("open", () => {
  if (process.env.NODE_ENV === "production") {
    console.log(`Production: connection to mongoDB on ${dbURL}`);
  } else {
    console.log(`Development: connection to mongoDB on ${dbURL}`);
  }
});
