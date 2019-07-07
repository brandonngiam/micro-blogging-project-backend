const app = require("../../src/app");
const request = require("supertest");
const { MongoClient } = require("mongodb");
const mongoose = require("mongoose");

describe("Newsfeed route", () => {
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
  });

  it("GET /newsfeed should get array of activities", async () => {
    const newUser1 = { username: "johnny", password: "12345Abde." };
    const newUser2 = { username: "michael", password: "12345Abde." };
    await request(app)
      .post("/signup")
      .send(newUser1);
    await request(app)
      .post("/signup")
      .send(newUser2);
    const responseLogin = await request(app)
      .post("/login")
      .send(newUser2);
    await request(app)
      .post("/login")
      .send(newUser1);
    const twittausers = await db.collection("twittausers");
    const johnny = twittausers.find({ username: "johnny" });
    const michael = twittausers.find({ username: "michael" });

    const response = await request(app)
      .get("/newsfeed")
      .set("Authorization", "Bearer " + responseLogin.body.jwt);

    expect(response.status).toEqual(200);
    expect(response.body[0].username).toEqual("johnny");
    expect(response.body[0].activity).toEqual("login");
    expect(response.body[1].username).toEqual("michael");
    expect(response.body[1].activity).toEqual("login");
    expect(response.body[2].username).toEqual("michael");
    expect(response.body[2].activity).toEqual("signup");
    expect(response.body[3].username).toEqual("johnny");
    expect(response.body[3].activity).toEqual("signup");
  });
});
