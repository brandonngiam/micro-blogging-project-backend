const express = require("express");
const signupRouter = express.Router();
const TwittaUser = require("../models/user.model");
const Joi = require("@hapi/joi");
const jwt = require("jsonwebtoken");
const secret_key = require("../util/key");
const bcrypt = require("bcrypt");
const settings = require("../util/settings");

signupRouter.post("/", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const validated = Joi.validate({ username, password }, schema);

    if (!validated.error) {
      const found = await TwittaUser.findOne({ username: username });
      if (!found) {
        const hash = await bcrypt.hash(password, 10);
        await TwittaUser.create({ username: username, password: hash });
        const newUser = await TwittaUser.findOne({ username: username });
        const token = jwt.sign(
          { sub: newUser._id, iat: new Date().getTime(), user: username },
          secret_key,
          {
            expiresIn: settings.tokenSessionTime
          }
        );
        res.status(201).json({ jwt: token });
      } else {
        res.status(400).json({ err: "Username already taken" });
      }
    } else {
      res.status(400).json({ err: validated.error.message });
    }
  } catch (err) {
    next(err);
  }
});

const schema = Joi.object().keys({
  username: Joi.string()
    .min(5)
    .max(32)
    .regex(/^[a-z0-9.\-_]*$/)
    .required(),
  password: Joi.string()
    .min(8)
    .max(128)
    .regex(/[*@!#%&()^~{}.,$%^]+/)
    .required()
});

module.exports = signupRouter;
