import "../public/index.html";
import "./styles/styles.scss";
import "normalize.css/normalize.css";

const linkedInAuth = () => {
  const clientId = "78cty7fz766w1r";
  const responseType = "code";
  const redirectUri =
    "http://ec2-34-220-169-81.us-west-2.compute.amazonaws.com/code";
  const scope = "w_member_social%20r_liteprofile";
  const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=${responseType}&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

  window.location.replace(url);
};

const submitPost = () => {
  const body = document.getElementById("post-body").value;
  document.getElementById("post-body").value = "";

  fetch("/post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: { body: body }
  })
    .then(response => console.log(response))
    .catch(error => {
      console.error("Error:", error);
    });
};

document.getElementById("linkedin-auth").onclick = linkedInAuth;
document.getElementById("post-submit").onclick = submitPost;
