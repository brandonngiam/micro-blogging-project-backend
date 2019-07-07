const app = require("../../src/app");
const request = require("supertest");
const mockData = require("../../data/mockData");
const { MongoClient } = require("mongodb");
const mongoose = require("mongoose");

describe("profile route", () => {
  let connection;
  let db;

  beforeAll(async () => {
    connection = await MongoClient.connect(global.__MONGO_URI__, {
      useNewUrlParser: true
    });
    const uriSplit = global.__MONGO_URI__.split("/");
    const realDBName = uriSplit[uriSplit.length - 1];
    db = await connection.db(realDBName);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await connection.close();
    await db.close();
  });

  beforeEach(async () => {
    await db.dropDatabase();
    const twittausers = await db.collection("twittausers");
    await twittausers.insertMany(mockData);
  });

  it("GET /u/:usr should return 401 if not logged in ", async () => {
    const response = await request(app).get("/u/brandonnnn");
    expect(response.status).toEqual(401);
  });

  it("GET /u/:usr should return 400 if usr does not exist ", async () => {
    const responseLogin = await request(app)
      .post("/login")
      .send({ username: "brandonnnn", password: "Abcde1234." });

    const responseGet = await request(app)
      .get("/u/brandon")
      .set("Authorization", "Bearer " + responseLogin.body.jwt);
    expect(responseGet.status).toEqual(400);
  });

  it("GET /:usr show return all twits", async () => {
    const responseLogin = await request(app)
      .post("/login")
      .send({ username: "brandonnnn", password: "Abcde1234." });

    const responseGet = await request(app)
      .get("/u/brandonnnn")
      .set("Authorization", "Bearer " + responseLogin.body.jwt);
    expect(responseGet.status).toEqual(200);
  });

  it("GET /:usr show return all twits even if user is different from token", async () => {
    const responseLogin = await request(app)
      .post("/login")
      .send({ username: "brandonnnn", password: "Abcde1234." });

    const responseGet = await request(app)
      .get("/u/sally1988")
      .set("Authorization", "Bearer " + responseLogin.body.jwt);
    expect(responseGet.status).toEqual(200);
  });

  it("POST /:usr show return 401 if user not logged in", async () => {
    const newTwit = { twit: "New Twit" };
    const response = await request(app)
      .post("/u/brandonnnn")
      .send(newTwit);
    expect(response.status).toEqual(401);
  });

  it("POST /:usr show allow user to post a new twit on his/her own profile", async () => {
    const responseLogin = await request(app)
      .post("/login")
      .send({ username: "brandonnnn", password: "Abcde1234." });

    const newTwit = { twit: "New Twit" };
    const response = await request(app)
      .post("/u/brandonnnn")
      .set("Authorization", "Bearer " + responseLogin.body.jwt)
      .send(newTwit);
    expect(response.status).toEqual(201);
    expect(response.body.twit).toEqual(newTwit.twit);
    expect(Object.keys(response.body)).toMatchObject([
      "_id",
      "twit",
      "timeStamp"
    ]);

    const twittausers = await db.collection("twittausers");
    const found = await twittausers.findOne({ username: "brandonnnn" });
    expect(found.twits[0].twit).toEqual(newTwit.twit);
  });

  it("POST /:usr should return 400 if twit is > 140 characters", async () => {
    let longTwit = "";
    for (let i = 0; i <= 140; i++) longTwit += "a";

    const responseLogin = await request(app)
      .post("/login")
      .send({ username: "brandonnnn", password: "Abcde1234." });

    const newTwit = { twit: "New Twit" };
    const response = await request(app)
      .post("/u/brandonnnn")
      .set("Authorization", "Bearer " + responseLogin.body.jwt)
      .send({ twit: longTwit });

    expect(response.status).toEqual(400);
    expect(response.body).toEqual({
      err:
        'child "twit" fails because ["twit" length must be less than or equal to 140 characters long]'
    });
  });

  it("POST /:usr should not a user post on another user's profile", async () => {
    const newTwit = { twit: "New Twit" };
    const responseLogin = await request(app)
      .post("/login")
      .send({ username: "brandonnnn", password: "Abcde1234." });

    const response = await request(app)
      .post("/u/sally1988")
      .send(newTwit)
      .set("Authorization", "Bearer " + responseLogin.body.jwt);

    expect(response.status).toEqual(401);
  });

  it("DELETE /:usr should return 401 if not logged in", async () => {
    const TwitToDelete = {
      _id: "5d1af4b5b583bc6aad75428b"
    };
    const response = await request(app)
      .delete("/u/brandonnnn")
      .send(TwitToDelete);

    expect(response.status).toEqual(401);
  });

  it("DELETE /:usr should delete twit, and return 404 if twit no longer exists", async () => {
    const responseLogin = await request(app)
      .post("/login")
      .send({ username: "brandonnnn", password: "Abcde1234." });
    const TwitToDelete = {
      _id: "5d1af4b5b583bc6aad75428b"
    };

    const twittausers = await db.collection("twittausers");
    const foundTweet = (await twittausers.findOne({
      username: "brandonnnn"
    })).twits.find(twit => twit._id.toString() === TwitToDelete._id);

    const response = await request(app)
      .delete("/u/brandonnnn")
      .send(TwitToDelete)
      .set("Authorization", "Bearer " + responseLogin.body.jwt);

    expect(response.status).toEqual(200);
    expect(response.body).toMatchObject(foundTweet);

    const updatedUsrTwits = (await twittausers.findOne({
      username: "brandonnnn"
    })).twits;
    const findDeleteElement = updatedUsrTwits.findIndex(
      twit => twit._id.toString() === TwitToDelete._id
    );
    expect(findDeleteElement).toEqual(-1);

    //delete again
    const responseDuplicate = await request(app)
      .delete("/u/brandonnnn")
      .send(TwitToDelete)
      .set("Authorization", "Bearer " + responseLogin.body.jwt);

    expect(responseDuplicate.status).toEqual(400);
    expect(responseDuplicate.body).toEqual({ err: "Twit does not exist" });
  });

  it("DELETE /:user should not let a user delete another user's twit ", async () => {
    const responseLogin = await request(app)
      .post("/login")
      .send({ username: "brandonnnn", password: "Abcde1234." });
    //sally1988's twit
    const TwitToDelete = {
      _id: "5d1af5d8f118c26d25aa6139"
    };

    const response = await request(app)
      .delete("/u/sally1988")
      .send(TwitToDelete)
      .set("Authorization", "Bearer " + responseLogin.body.jwt);

    expect(response.status).toEqual(401);
  });

  it("PUT /:usr should return 401 if not logged in", async () => {
    const twitUpdate = {
      _id: "5d1af4b5b583bc6aad75428a",
      twit: "Updated Twit"
    };
    const response = await request(app)
      .put("/u/brandonnnn")
      .send(twitUpdate);

    expect(response.status).toEqual(401);
  });

  it("PUT /:usr show allow user to update an old twit", async () => {
    const responseLogin = await request(app)
      .post("/login")
      .send({ username: "brandonnnn", password: "Abcde1234." });

    const twitUpdate = {
      _id: "5d1af4b5b583bc6aad75428a",
      twit: "Updated Twit"
    };

    const twittausers = await db.collection("twittausers");
    const foundOldTwits = (await twittausers.findOne({
      username: "brandonnnn"
    })).twits;
    const oldTwit = foundOldTwits.find(
      twit => twit._id.toString() === twitUpdate._id
    );

    const response = await request(app)
      .put("/u/brandonnnn")
      .send(twitUpdate)
      .set("Authorization", "Bearer " + responseLogin.body.jwt);

    const foundNewTwits = (await twittausers.findOne({
      username: "brandonnnn"
    })).twits;
    const newTwit = foundNewTwits.find(twit => twit =>
      twit._id.toString() === twitUpdate._id
    );
    const newIndex = foundNewTwits.findIndex(twit => twit =>
      twit._id.toString() === twitUpdate._id
    );

    expect(response.status).toEqual(200);
    expect(response.body.twit).toEqual(twitUpdate.twit);
    expect(oldTwit.twit).not.toEqual(twitUpdate.twit);
    expect(newTwit.twit).toEqual(twitUpdate.twit);
    expect(foundOldTwits.length).toEqual(foundNewTwits.length);
    expect(newIndex).toEqual(0);
  });

  it("PUT /:usr should return 400 if twit is > 140 characters", async () => {
    let longTwit = "";
    for (let i = 0; i <= 140; i++) longTwit += "a";

    const responseLogin = await request(app)
      .post("/login")
      .send({ username: "brandonnnn", password: "Abcde1234." });

    const response = await request(app)
      .put("/u/brandonnnn")
      .send({
        _id: "5d1af4b5b583bc6aad75428b",
        twit: longTwit
      })
      .set("Authorization", "Bearer " + responseLogin.body.jwt);

    expect(response.status).toEqual(400);
    expect(response.body).toEqual({
      err:
        'child "twit" fails because ["twit" length must be less than or equal to 140 characters long]'
    });
  });

  it("PUT/ :usr should return 400 if twit id does not exist", async () => {
    const responseLogin = await request(app)
      .post("/login")
      .send({ username: "brandonnnn", password: "Abcde1234." });

    const twitDoesNotExist = {
      _id: "123",
      twit: "Updated Twit"
    };

    const response = await request(app)
      .put("/u/brandonnnn")
      .send(twitDoesNotExist)
      .set("Authorization", "Bearer " + responseLogin.body.jwt);

    expect(response.status).toEqual(400);
    expect(response.body).toMatchObject({ err: "Twit does not exist" });
  });

  it("PUT /:usr show not allow user to update another person's  old twit", async () => {
    const responseLogin = await request(app)
      .post("/login")
      .send({ username: "brandonnnn", password: "Abcde1234." });

    const twitUpdate = {
      _id: "5d1af4b5b583bc6aad75428a",
      twit: "Updated Twit"
    };

    const twittausers = await db.collection("twittausers");
    const foundOldTwits = (await twittausers.findOne({
      username: "brandonnnn"
    })).twits;
    const oldTwit = foundOldTwits.find(
      twit => twit._id.toString() === twitUpdate._id
    );

    const response = await request(app)
      .put("/u/brandonnnn")
      .send(twitUpdate)
      .set("Authorization", "Bearer " + responseLogin.body.jwt);

    const foundNewTwits = (await twittausers.findOne({
      username: "brandonnnn"
    })).twits;
    const newTwit = foundNewTwits.find(twit => twit =>
      twit._id.toString() === twitUpdate._id
    );
    const newIndex = foundNewTwits.findIndex(twit => twit =>
      twit._id.toString() === twitUpdate._id
    );

    expect(response.status).toEqual(200);
    expect(response.body.twit).toEqual(twitUpdate.twit);
    expect(oldTwit.twit).not.toEqual(twitUpdate.twit);
    expect(newTwit.twit).toEqual(twitUpdate.twit);
    expect(foundOldTwits.length).toEqual(foundNewTwits.length);
    expect(newIndex).toEqual(0);
  });
});
