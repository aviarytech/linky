const path = require("path");
const express = require("express");
const axios = require("axios").default;
const app = express();
const publicPath = path.join(__dirname, "..", "public");
const port = process.env.PORT || 3000;

app.use(express.static(publicPath));

const MongoClient = require("mongodb").MongoClient;
const dbUri =
  "mongodb+srv://admin:AviaryTech123@cluster0-asppv.mongodb.net/test?retryWrites=true&w=majority";

// this gets called by our client
app.post("/post", (req, res) => {
  // first get the token from the DB
  MongoClient.connect(dbUri, { useNewUrlParser: true }, err => {
    client
      .db("linky")
      .collection("users")
      .findOne({}, function(error, dbResponse) {
        if (error) {
          console.log("Error occurred while inserting");
        } else {
          // now use the token to get the user ID
          axios
            .get(`https://api.linkedin.com/v2/me`, {
              headers: { Authorization: dbResponse.token }
            })
            // now create the post on linkedin
            .then(idResponse => {
              axios
                .post(
                  `https://api.linkedin.com/v2/ugcPosts`,
                  { Authorization: dbResponse.token },
                  {
                    author: `urn:li:person:${idResponse.id}`,
                    lifecycleState: "PUBLISHED",
                    specificContent: {
                      "com.linkedin.ugc.ShareContent": {
                        shareCommentary: {
                          text:
                            "Hello World! This is my first Share on LinkedIn!"
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
                });
            });
        }
      });
    client.close();
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
      console.log("accessToken", accessToken);
      MongoClient.connect(dbUri, { useNewUrlParser: true }, err => {
        client
          .db("linky")
          .collection("users")
          .insertOne({ code: code, token: accessToken }, function(
            error,
            response
          ) {
            if (error) {
              console.log("Error occurred while inserting");
            } else {
              console.log("inserted record", response.ops[0]);
            }
          });
        client.close();
      });
      res.sendFile(path.join(publicPath, "index.html"));
    })
    .catch(function(error) {
      console.log(error);
      res.sendFile(path.join(publicPath, "index.html"));
    });
});

app.listen(port, () => {
  console.log("Server is running on port", port);
});
