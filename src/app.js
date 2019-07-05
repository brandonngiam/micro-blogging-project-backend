const express = require("express");
const cors = require("cors");
const app = express();
const signupRouter = require("./routes/signupRoute");
const loginRouter = require("./routes/loginRoute");
const profileRouter = require("./routes/profileRoute");
require("./util/db");

app.use(express.json());
app.use(cors());

app.use("/signup", signupRouter);
app.use("/login", loginRouter);
app.use("/u", profileRouter);

//error handler
app.use(function(err, req, res, next) {
  if (!err.statusCode) {
    res.status(500).json({ err: "Internal server error" });
  } else {
    res.status(err.statusCode).json({ err: err.message });
  }
});

module.exports = app;
