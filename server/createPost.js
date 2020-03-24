const fs = require("fs");
const request = require("request");
const axios = require("axios").default;

const createImagePost = (body, b64string, userId, token) => {
  axios // register image with linkedin
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
      // get upload URL and asset ID from registration response
      let uploadUrl =
        res.data.value.uploadMechanism[
          "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
        ].uploadUrl;
      uploadUrl = uploadUrl + `&oauth2_access_token=${token}`;
      const asset = res.data.value.asset;

      // convert image string into file before uploading
      b64prefix = b64string.split(";base64,")[0].toLowerCase();
      b64string = b64string.split(";base64,")[1];
      const fileType = b64prefix.includes("png") ? "png" : "jpg";
      const fileName = "image" + "." + fileType;
      fs.writeFileSync(`./${fileName}`, b64string, "base64");

      const contentType = "application/octet-stream";
      const transferEncoding = "chunked";
      const options = {
        method: "post",
        headers: {
          "content-type": contentType,
          "transfer-encoding": transferEncoding
        }
      };
      // upload image to linkedin
      fs.createReadStream(`./${fileName}`).pipe(
        request(uploadUrl, options, (err, httpsResponse, streamBody) => {
          // create image post
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
                          text: "" // not sure where this is used
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
            .then()
            .catch(err => {
              console.log("post creation error: ", err);
            });
        })
      );
    })
    .catch(err => {
      console.log("image registration error: ", err);
    });
};

const createTextPost = (body, userId, token) => {
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
    .then()
    .catch(err => {
      console.log(err);
    });
};

module.exports = { createImagePost, createTextPost };
