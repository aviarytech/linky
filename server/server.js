const path = require("path");
const express = require("express");
const axios = require("axios").default;
const app = express();
const publicPath = path.join(__dirname, "..", "public");
const port = process.env.PORT || 3000;

app.use(express.static(publicPath));
app.use(express.json());

const { init, insertItem, getItems } = require("./db");

// this gets called by our client
app.post("/post", (req, res) => {
  // first get the token from the DB
  getItems()
    .then(dbRes => {
      axios
        .get(
          `https://api.linkedin.com/v2/me?oauth2_access_token=${dbRes.token}`
        )
        .then(idResponse => {
          axios
            .post(
              `https://api.linkedin.com/v2/ugcPosts?oauth2_access_token=${dbRes.token}`,
              {
                author: `urn:li:person:${idResponse.data.id}`,
                lifecycleState: "PUBLISHED",
                specificContent: {
                  "com.linkedin.ugc.ShareContent": {
                    shareCommentary: {
                      text: `${req.body.body}`
                    },
                    shareMediaCategory: "NONE"
                  }
                },
                visibility: {
                  "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
                }
              }
            )
            .then(response => {
              console.log(response);
            })
            .catch(err => {
              console.log(err);
            });
        })
        .catch(err => {
          console.log(err);
        });
    })
    .catch(err => {
      console.log(err);
    });

  res.sendFile(path.join(publicPath, "index.html"));
});

// this gets called by the linkedin callback
app.get("/code", (req, res) => {
  if (req.query.error) {
    console.log(req.query.error_description);
    res.sendFile(path.join(publicPath, "index.html"));
  }

  const code = req.query.code;
  const grantType = "authorization_code";
  const redirectUri =
    "http://ec2-34-220-169-81.us-west-2.compute.amazonaws.com/code";
  const clientId = "78cty7fz766w1r";
  const clientSecret = "xmCCF6zDo3SGhY31";

  axios
    .post(
      `https://www.linkedin.com/oauth/v2/accessToken/?grant_type=${grantType}&code=${code}&redirect_uri=${redirectUri}&client_id=${clientId}&client_secret=${clientSecret}`,
      {},
      { "Content-Type": "x-www-form-urlencoded" }
    )
    .then(function(response) {
      const accessToken = response.data.access_token;

      insertItem({ code: code, token: accessToken })
        .then(dbRes => {
          console.log(dbRes);
        })
        .catch(err => {
          console.log(err);
        });

      res.sendFile(path.join(publicPath, "index.html"));
    })
    .catch(function(error) {
      console.log(error);
      res.sendFile(path.join(publicPath, "index.html"));
    });
});

init().then(() => {
  app.listen(port, () => {
    console.log("Server is running on port", port);
  });
});
