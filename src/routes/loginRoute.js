const express = require("express");
const loginRouter = express.Router();
const TwittaUser = require("../models/user.model");

loginRouter.post("/", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const found = await TwittaUser.findOne({ username: username });
    if (!found) {
      res.status(401).json({ err: "Username not found" });
    } else {
      found.password === password
        ? res.sendStatus(200)
        : res.status(401).json({ err: "Incorrect password" });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = loginRouter;
