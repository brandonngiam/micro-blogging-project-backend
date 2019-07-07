const express = require("express");
const TwittaUser = require("../models/user.model");
const jwt = require("jsonwebtoken");
const secret_key = require("../util/key");

async function checkAuthorization(req, res, next) {
  try {
    const authorization = req.headers.authorization;
    if (authorization) {
      const token = authorization.split(" ")[1];
      const decoded = jwt.verify(token, secret_key, {
        clockTimestamp: new Date().getTime()
      });
      const found = await TwittaUser.findOne({ username: decoded.user });
      if (found) {
        req.verifiedUser = decoded.user;
        next();
      }
    }
    res.sendStatus(401);
  } catch (err) {
    if (err.message === "jwt expired") {
      res.sendStatus(401);
    }
  }
}

module.exports = checkAuthorization;
