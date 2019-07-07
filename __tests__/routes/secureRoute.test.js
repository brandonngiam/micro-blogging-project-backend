const app = require("../../src/app");
const request = require("supertest");
const { MongoClient } = require("mongodb");
const mongoose = require("mongoose");

describe("Secure route", () => {
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

  it("GET /secure should return 200 if req contains token header", async () => {
    //sign up
    const newUser = { username: "johnny", password: "12345Abde." };
    await request(app)
      .post("/signup")
      .send(newUser);

    //login
    const responseLogin = await request(app)
      .post("/login")
      .send(newUser);

    const jwt = responseLogin.body.jwt;
    const responseSecure = await request(app)
      .get("/secure")
      .set("Authorization", "Bearer " + jwt);
    expect(responseSecure.status).toEqual(200);
  });

  it("GET /secure should return 401 if req contains no token header", async () => {
    //sign up
    const newUser = { username: "johnny", password: "12345Abde." };
    await request(app)
      .post("/signup")
      .send(newUser);

    //login
    const responseLogin = await request(app)
      .post("/login")
      .send(newUser);

    const responseSecure = await request(app).get("/secure");
    expect(responseSecure.status).toEqual(401);
  });
});
