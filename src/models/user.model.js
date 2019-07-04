const mongoose = require("mongoose");
mongoose.set("useCreateIndex", true);

const twitSchema = new mongoose.Schema({
  twit: { type: String, required: true, maxlength: 140 },
  timeStamp: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 5,
    maxlength: 32,
    validate: {
      validator: v => {
        const re = /^[a-z0-9.\-_]*$/;
        return re.test(v);
      }
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    maxlength: 128,
    validate: {
      validator: v => {
        const re = /[*@!#%&()^~{}.,$%^]+/;
        return re.test(v);
      }
    }
  },
  twits: [twitSchema]
});

const TwittaUser = mongoose.model("TwittaUser", userSchema);

module.exports = TwittaUser;
