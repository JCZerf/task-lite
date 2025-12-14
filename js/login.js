document.getElementById("login-button").addEventListener("click", function (e) {
  e.preventDefault();
  let emailInput = document.getElementById("email").value;
  let passwordInput = document.getElementById("password").value;
  passwordInput = fakeHash(passwordInput);
  const users = JSON.parse(localStorage.getItem("users")) || [];

  const user = users.find(
    (u) => u.email.toLowerCase() === emailInput.toLowerCase()
  );

  if (!user) {
    alert("Usuário não encontrado!");
    return;
  }

  if (user.password !== passwordInput) {
    alert("Senha incorreta!");
    return;
  }

  localStorage.setItem("loggedUser", JSON.stringify({ email: user.email }));
  window.location.href = "../dashboard/dashboard.html";
});
