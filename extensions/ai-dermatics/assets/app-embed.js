document.addEventListener("DOMContentLoaded", () => {
  console.log("AI Dermatics app embed loaded!");
  const message = "AI Dermatics Widget Active";
  const div = document.getElementById("ai-dermatics-widget");
  div.insertAdjacentHTML("beforeend", `<p>${message}</p>`);
});

