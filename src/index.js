import "../public/index.html";
import "./styles/styles.scss";
import "normalize.css/normalize.css";

const toBase64 = file =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

const linkedInAuth = () => {
  const clientId = "78cty7fz766w1r";
  const responseType = "code";
  const redirectUri =
    "http://ec2-34-220-169-81.us-west-2.compute.amazonaws.com/code";
  const scope = "w_member_social%20r_liteprofile";
  const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=${responseType}&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

  window.location.replace(url);
};

async function submitPost() {
  // get and clear text field
  const body = document.getElementById("post-body").value;
  document.getElementById("post-body").value = "";

  // get and convert file
  const image = document.getElementById("image-upload").files[0];
  let b64image = undefined;
  if (image) {
    b64image = await toBase64(image);
  }

  fetch("/post", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ body: body, image: b64image })
  })
    .then(response => console.log(response))
    .catch(error => {
      console.error("Error:", error);
    });
}

document.getElementById("linkedin-auth").onclick = linkedInAuth;
document.getElementById("post-submit").onclick = submitPost;
