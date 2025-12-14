function auth() {
  const loggedUser = localStorage.getItem("loggedUser");
  if (!loggedUser) {
    alert("Por favor faça seu login!");
    window.location.replace("auth/login.html");
  }
}

function logout() {
  localStorage.removeItem("loggedUser");
  alert("Logout realizado com sucesso!");
  if (window.location.pathname.includes("/dashboard/")) {
    window.location.replace("../auth/login.html");
  } else {
    window.location.replace("auth/login.html");
  }
}

auth();
