const app = require("./src/app");
const port = process.env.PORT || 3001;

app.listen(port, () => {
  if (process.env.NODE_ENV === "production") {
    console.log(`Server is running on Heroku with port ${port}`);
  } else {
    console.log(`Server is running on http://localhost:${port}`);
  }
});
