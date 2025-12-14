const form = document.getElementById("registration-form");

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const email = document.getElementById("email-id").value.trim();
  const password = document.getElementById("password-id").value.trim();
  const confirmPassword = document
    .getElementById("password-confirm-id")
    .value.trim();
  const termsAccepted = document.getElementById("checkbox").checked;

  if (!email) {
    alert("Insira um email válido!");
    return;
  }
  if (!password) {
    alert("Insira uma senha válida!");
    return;
  }
  if (!confirmPassword) {
    alert("Confirme sua senha!");
    return;
  }
  if (password !== confirmPassword) {
    alert("As senhas não coincidem!");
    return;
  }
  if (!termsAccepted) {
    alert("Você precisa aceitar os termos de uso.");
    return;
  }

  const users = JSON.parse(localStorage.getItem("users")) || [];

  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    alert("Este email já está registrado!");
    return;
  }

  users.push({ email, password, termsAccepted });
  localStorage.setItem("users", JSON.stringify(users));

  alert("Cadastro realizado com sucesso!");
  form.reset();
  window.location.href = "/auth/login.html";
});
