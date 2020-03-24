const path = require("path");
const express = require("express");
const axios = require("axios").default;
const app = express();
const bodyParser = require("body-parser");
var request = require("request");
const fs = require("fs");
const publicPath = path.join(__dirname, "..", "public");
const port = process.env.PORT || 3000;

app.use(express.static(publicPath));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

const { init, insertItem, getItems } = require("./db");

const postImage = (body, b64string, userId, token) => {
  // register image
  axios
    .post(
      `https://api.linkedin.com/v2/assets?action=registerUpload&oauth2_access_token=${token}`,
      {
        registerUploadRequest: {
          recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
          owner: `urn:li:person:${userId}`,
          serviceRelationships: [
            {
              relationshipType: "OWNER",
              identifier: "urn:li:userGeneratedContent"
            }
          ]
        }
      }
    )
    .then(res => {
      const uploadUrl =
        res.data.value.uploadMechanism[
          "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
        ].uploadUrl + `&oauth2_access_token=${token}`;
      const asset = res.data.value.asset;

      b64prefix = b64string.split(";base64,")[0].toLowerCase();
      b64string = b64string.split(";base64,")[1];
      const fileType = b64prefix.includes("png") ? "png" : "jpg";
      const fileName = "image" + fileType;

      fs.writeFile(`./${fileName}`, b64string, "base64", function(err) {
        console.log(err);
      });

      var contentType = "application/octet-stream";
      var transferEncoding = "chunked";
      var options = {
        method: "post",
        headers: {
          "content-type": contentType,
          "transfer-encoding": transferEncoding
        }
      };
      fs.createReadStream(`./${fileName}`).pipe(
        request(uploadUrl, options, function(err, httpsResponse, streamBody) {
          axios
            .post(
              `https://api.linkedin.com/v2/ugcPosts?oauth2_access_token=${token}`,
              {
                author: `urn:li:person:${userId}`,
                lifecycleState: "PUBLISHED",
                specificContent: {
                  "com.linkedin.ugc.ShareContent": {
                    shareCommentary: {
                      text: `${body}` // this is the text for the post body
                    },
                    shareMediaCategory: "IMAGE",
                    media: [
                      {
                        status: "READY",
                        description: {
                          text: "" // this is the image alt text
                        },
                        media: `${asset}`,
                        title: {
                          text: "" // not sure what this is
                        }
                      }
                    ]
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
      );
    })
    .catch(err => {
      console.log(err);
    });
};

const postText = (body, userId, token) => {
  axios
    .post(`https://api.linkedin.com/v2/ugcPosts?oauth2_access_token=${token}`, {
      author: `urn:li:person:${userId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: `${body}`
          },
          shareMediaCategory: "NONE"
        }
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
      }
    })
    .then(response => {
      console.log(response);
    })
    .catch(err => {
      console.log(err);
    });
};

app.post("/post", (req, res) => {
  const b64image = req.body.image;
  const body = req.body.body;

  getItems()
    .then(res => {
      const token = res.token;
      axios
        .get(`https://api.linkedin.com/v2/me?oauth2_access_token=${token}`)
        .then(res => {
          const userId = res.data.id;
          if (b64image) {
            postImage(body, b64image, userId, token);
          } else {
            postText(body, userId, token);
          }
        })
        .catch(err => {
          console.log("error getting user ID: ", err);
        });
    })
    .catch(err => {
      console.log("error getting token from db: ", err);
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
          console.log(dbRes.ops[0]);
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
