document.getElementById("login").addEventListener("click", logar);
document.getElementById("registration").addEventListener("click", registrar);
function logar() {
  window.location.href = "/auth/login.html";
}

function registrar() {
  alert("precisa registrar");
}
