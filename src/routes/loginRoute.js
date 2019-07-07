const express = require("express");
const loginRouter = express.Router();
const TwittaUser = require("../models/user.model");
const jwt = require("jsonwebtoken");
const secret_key = require("../util/key");
const bcrypt = require("bcrypt");
const settings = require("../util/settings");

loginRouter.post("/", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const found = await TwittaUser.findOne({ username: username });
    if (!found) {
      res.status(401).json({ err: "Username not found" });
    } else {
      const isUser = await bcrypt.compare(password, found.password);
      if (isUser) {
        const token = jwt.sign(
          { sub: found._id, iat: new Date().getTime(), user: username },
          secret_key,
          {
            expiresIn: 1000 * 60 * 5
          }
        );
        res.status(200).json({ jwt: token });
      } else {
        res.status(401).json({ err: "Incorrect password" });
      }
    }
  } catch (err) {
    next(err);
  }
});

module.exports = loginRouter;
