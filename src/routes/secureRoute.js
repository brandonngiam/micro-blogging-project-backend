const express = require("express");
const secureRouter = express.Router();
const TwittaUser = require("../models/user.model");
const jwt = require("jsonwebtoken");
const secret_key = require("../../src/util/key");

secureRouter.get("/", async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (authorization) {
      const token = authorization.split(" ")[1];
      const decoded = jwt.verify(token, secret_key, {
        clockTimestamp: new Date().getTime()
      });
      const found = await TwittaUser.findOne({ username: decoded.user });
      if (found) return res.sendStatus(200);
    }
    res.sendStatus(401);
  } catch (err) {
    if (err.message === "jwt expired") {
      res.sendStatus(401);
    }
  }
});

module.exports = secureRouter;
