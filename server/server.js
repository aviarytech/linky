const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios").default;

const publicPath = path.join(__dirname, "..", "public");

const app = express();

app.use(express.static(publicPath));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

const { init, insertItem, getItems } = require("./db");
const { createImagePost, createTextPost } = require("./createPost");

// this is the endpoint linkedin redirects the browser to to pass in the auth code
app.get("/code", (req, res) => {
  if (req.query.error) {
    console.log("error getting auth code: ", req.query.error_description);
  }

  const code = req.query.code;
  const grantType = "authorization_code";
  // const redirectUri = "http://ec2-34-220-169-81.us-west-2.compute.amazonaws.com/code";
  const redirectUri = "http://localhost:3000/code";
  const clientId = "78cty7fz766w1r";
  const clientSecret = "xmCCF6zDo3SGhY31";

  // use the auth code to get an access token
  axios
    .post(
      `https://www.linkedin.com/oauth/v2/accessToken/?grant_type=${grantType}&code=${code}&redirect_uri=${redirectUri}&client_id=${clientId}&client_secret=${clientSecret}`,
      { headers: { "Content-Type": "x-www-form-urlencoded" } }
    )
    .then(apiRes => {
      // write access token to db
      insertItem({ code: code, token: apiRes.data.access_token })
        .then()
        .catch(err => {
          console.log(err);
        });
    })
    .catch(err => {
      console.log(err);
    });

  res.sendFile(path.join(publicPath, "index.html"));
});

app.post("/post", (req, res) => {
  const b64image = req.body.image;
  const body = req.body.body;

  // pull access token from DB
  getItems()
    .then(dbRes => {
      const token = dbRes.token;
      // send request to linkedin to create post
      axios
        .get(`https://api.linkedin.com/v2/me?oauth2_access_token=${token}`)
        .then(apiRes => {
          const userId = apiRes.data.id;
          if (b64image) {
            createImagePost(body, b64image, userId, token);
          } else {
            createTextPost(body, userId, token);
          }
        })
        .catch(err => {
          console.log("error getting user ID: ", err);
        });
    })
    .catch(err => {
      console.log("error getting token from db: ", err);
    });
});

// init db then start server
init().then(() => {
  app.listen(3000, () => {
    console.log("Server is running on port 3000");
  });
});
