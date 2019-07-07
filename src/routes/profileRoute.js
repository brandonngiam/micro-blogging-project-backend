const express = require("express");
const profileRouter = express.Router();
const TwittaUser = require("../models/user.model");
const Joi = require("@hapi/joi");
const settings = require("../util/settings");
const checkAuthorization = require("../middleware/Authorization");

profileRouter.param("usr", async function(req, res, next, usr) {
  try {
    usrLC = usr.toLowerCase();
    const found = await TwittaUser.findOne({ username: usrLC });
    if (!found) {
      const err = new Error("User not found");
      err.statusCode = 400;
      throw err;
    } else {
      req.usr = found;
      next();
    }
  } catch (err) {
    next(err);
  }
});

function validator(req, res, next) {
  const newTwit = req.body.twit;
  const validated = Joi.validate({ twit: newTwit }, schema);

  if (validated.error) {
    res.status(400).json({ err: validated.error.message });
  } else next();
}

async function twitExists(req, res, next) {
  const newTwitid = req.body._id;
  const found = req.usr.twits.id(newTwitid);
  if (!found) {
    res.status(400).json({ err: "Twit does not exist" });
  } else {
    next();
  }
}

profileRouter.get("/:usr", checkAuthorization, async (req, res) => {
  const found = req.usr;
  res.status(200).json(found.twits);
});

profileRouter.post(
  "/:usr",
  checkAuthorization,
  validator,
  async (req, res, next) => {
    try {
      if (req.usr.username === req.verifiedUser) {
        req.usr.twits.unshift({ twit: req.body.twit });
        req.usr.activities.unshift({ activity: settings.activityType.twit });
        req.usr.save();
        res.status(201).json(req.usr.twits[0]);
      } else res.sendStatus(401);
    } catch (err) {
      next(err);
    }
  }
);

profileRouter.delete(
  "/:usr",
  checkAuthorization,
  twitExists,
  async (req, res, next) => {
    try {
      if (req.usr.username === req.verifiedUser) {
        const twitIdToDelete = req.body._id;
        const indexToDelete = req.usr.twits.findIndex(
          twit => twit._id.toString() === twitIdToDelete
        );
        const deletedTwit = req.usr.twits[indexToDelete];
        req.usr.twits.splice(indexToDelete, 1);
        req.usr.save();
        res.status(200).json(deletedTwit);
      } else res.sendStatus(401);
    } catch (err) {
      next(err);
    }
  }
);

profileRouter.put(
  "/:usr",
  checkAuthorization,
  validator,
  twitExists,
  async (req, res, next) => {
    try {
      if (req.usr.username === req.verifiedUser) {
        const newUpdate = req.body;
        const indexToUpdate = req.usr.twits.findIndex(
          twit => twit._id.toString() === newUpdate._id
        );
        req.usr.twits.splice(indexToUpdate, 1);
        req.usr.twits.unshift({ twit: newUpdate.twit });
        req.usr.twits[0]._id = newUpdate._id;
        req.usr.save();
        res.status(200).json(req.usr.twits[0]);
      } else res.sendStatus(401);
    } catch (err) {
      console.log(err.message);
      next(err);
    }
  }
);

const schema = Joi.object().keys({
  twit: Joi.string()
    .max(140)
    .required()
});

module.exports = profileRouter;
