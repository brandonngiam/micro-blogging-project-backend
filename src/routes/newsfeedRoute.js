const express = require("express");
const newsFeedRouter = express.Router();
const TwittaUser = require("../models/user.model");
const checkAuthorization = require("../middleware/Authorization");

//get at most 10 latest activities
newsFeedRouter.get("/", async (req, res, next) => {
  try {
    const data = await TwittaUser.find();
    const activities = data.reduce((a, c) => {
      const addUsername = c.activities.map(x => {
        const clone = JSON.parse(JSON.stringify(x));
        clone.username = c.username;
        return clone;
      });
      return a.concat(addUsername);
    }, []);
    const sortedActivities = activities.sort((a, b) => {
      bTime = new Date(b.timeStamp);
      aTime = new Date(a.timeStamp);
      return bTime - aTime;
    });
    res.status(200).json(sortedActivities);
  } catch (err) {
    next(err);
  }
});

module.exports = newsFeedRouter;
