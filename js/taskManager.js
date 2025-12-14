const loggedUserData = localStorage.getItem("loggedUser");
const loggedUser = loggedUserData ? JSON.parse(loggedUserData).email : null;

// Exibir email do usuário logado
document.getElementById("user-email").textContent = loggedUser || "Usuário";

let currentTasks = [];
let currentSort = "alphabetical";
let currentSearchTerm = "";

// Inicializar a página
document.addEventListener("DOMContentLoaded", function () {
  loadCompletedTasks();
  setupEventListeners();
});

function setupEventListeners() {
  // Controles de ordenação
  document
    .getElementById("sort-select")
    .addEventListener("change", function () {
      currentSort = this.value;
      displayTasks();
    });

  // Busca
  document
    .getElementById("search-input")
    .addEventListener("input", function () {
      currentSearchTerm = this.value.toLowerCase().trim();
      displayTasks();
    });

  // Modal
  document.getElementById("close-modal").addEventListener("click", closeModal);
  document.getElementById("cancel-edit").addEventListener("click", closeModal);
  document
    .getElementById("save-task")
    .addEventListener("click", saveEditedTask);

  // Fechar modal ao clicar fora
  document.getElementById("edit-modal").addEventListener("click", function (e) {
    if (e.target === this) {
      closeModal();
    }
  });

  // Logout
  document.getElementById("logout-btn").addEventListener("click", function () {
    logout();
  });
}

function loadCompletedTasks() {
  try {
    const localStorageTasks = localStorage.getItem(`tasks_${loggedUser}`);
    console.log("Raw localStorage data:", localStorageTasks); // Debug

    if (localStorageTasks) {
      const allTasks = JSON.parse(localStorageTasks);
      console.log("Parsed all tasks:", allTasks); // Debug

      // Filtrar apenas tarefas completadas
      currentTasks = allTasks.filter((task) => {
        // Compatibilidade com formato antigo (string simples)
        if (typeof task === "string") {
          return false; // tarefas antigas são consideradas não completadas
        }
        return task.isCompleted === true;
      });

      console.log("Filtered completed tasks:", currentTasks); // Debug

      // Garantir que todas as propriedades existam
      currentTasks = currentTasks.map((task) => {
        if (!task.createdAt) {
          task.createdAt = new Date().toISOString();
        }
        if (task.isCompleted === undefined) {
          task.isCompleted = true;
        }
        return task;
      });

      updateStats();
      displayTasks();
    } else {
      currentTasks = [];
      updateStats();
      showEmptyState();
    }
  } catch (error) {
    console.error("Erro ao carregar tarefas:", error);
    currentTasks = [];
    updateStats();
    showEmptyState();
  }
}

function updateStats() {
  const completedCount = currentTasks.length;
  document.getElementById("completed-count").textContent = completedCount;
}

function displayTasks() {
  const tasksList = document.getElementById("tasks-list");
  const emptyState = document.getElementById("empty-state");

  // Filtrar por termo de busca
  let filteredTasks = currentTasks.filter((task) =>
    task.name.toLowerCase().includes(currentSearchTerm)
  );

  if (filteredTasks.length === 0) {
    tasksList.innerHTML = "";
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  // Ordenar tarefas
  filteredTasks.sort((a, b) => {
    if (currentSort === "alphabetical") {
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    } else if (currentSort === "creation-date") {
      return new Date(b.createdAt) - new Date(a.createdAt); // Mais recentes primeiro
    }
    return 0;
  });

  // Renderizar tarefas
  tasksList.innerHTML = "";
  filteredTasks.forEach((task) => {
    const taskElement = createTaskElement(task);
    tasksList.appendChild(taskElement);
  });
}

function createTaskElement(task) {
  const taskItem = document.createElement("div");
  taskItem.className = "task-item";
  taskItem.dataset.taskId = task.name; // Usar nome como ID único

  const createdDate = new Date(task.createdAt);
  const formattedDate = createdDate.toLocaleDateString("pt-BR");
  const formattedTime = createdDate.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  taskItem.innerHTML = `
    <div class="task-content">
      <div class="task-name">${escapeHtml(task.name)}</div>
      <div class="task-meta">
        <span class="task-date">Criada em: ${formattedDate} às ${formattedTime}</span>
        <span class="task-status">✓ Completada</span>
      </div>
    </div>
    <div class="task-actions">
      <button class="action-button edit-button" onclick="editTask('${escapeHtml(
        task.name
      )}')" title="Editar tarefa">
        ✏️
      </button>
      <button class="action-button toggle-button" onclick="toggleTaskStatus('${escapeHtml(
        task.name
      )}')" title="Marcar como não completada">
        ↩️
      </button>
      <button class="action-button delete-button" onclick="deleteTask('${escapeHtml(
        task.name
      )}')" title="Excluir tarefa">
        🗑️
      </button>
    </div>
  `;

  return taskItem;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showEmptyState() {
  const tasksList = document.getElementById("tasks-list");
  const emptyState = document.getElementById("empty-state");

  tasksList.innerHTML = "";
  emptyState.style.display = "block";
}

// Funções globais para os botões
window.editTask = function (taskName) {
  const task = currentTasks.find((t) => t.name === taskName);
  if (!task) return;

  // Preencher modal
  document.getElementById("edit-task-name").value = task.name;

  const createdDate = new Date(task.createdAt);
  const formattedDate = createdDate.toLocaleDateString("pt-BR");
  const formattedTime = createdDate.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  document.getElementById(
    "edit-task-date"
  ).textContent = `${formattedDate} às ${formattedTime}`;

  // Armazenar nome original para referência
  document.getElementById("edit-modal").dataset.originalName = taskName;

  // Mostrar modal
  document.getElementById("edit-modal").style.display = "flex";
  document.getElementById("edit-task-name").focus();
};

window.toggleTaskStatus = function (taskName) {
  const task = currentTasks.find((t) => t.name === taskName);
  if (!task) return;

  if (
    confirm(
      "Marcar esta tarefa como não completada? Ela será movida de volta para a lista principal."
    )
  ) {
    task.isCompleted = false;
    saveTasks();

    // Remover da lista atual
    currentTasks = currentTasks.filter((t) => t.name !== taskName);
    updateStats();
    displayTasks();
  }
};

window.deleteTask = function (taskName) {
  if (confirm("Tem certeza que deseja excluir esta tarefa permanentemente?")) {
    // Remover da lista atual
    currentTasks = currentTasks.filter((t) => t.name !== taskName);

    // Remover do localStorage
    saveTasks();
    updateStats();
    displayTasks();
  }
};

function closeModal() {
  document.getElementById("edit-modal").style.display = "none";
  delete document.getElementById("edit-modal").dataset.originalName;
}

function saveEditedTask() {
  const originalName =
    document.getElementById("edit-modal").dataset.originalName;
  const newName = document.getElementById("edit-task-name").value.trim();

  if (!newName) {
    alert("O nome da tarefa não pode estar vazio.");
    return;
  }

  // Verificar se já existe uma tarefa com este nome (exceto a atual)
  const existingTask = currentTasks.find(
    (t) => t.name === newName && t.name !== originalName
  );
  if (existingTask) {
    alert("Já existe uma tarefa com este nome.");
    return;
  }

  // Atualizar tarefa
  const task = currentTasks.find((t) => t.name === originalName);
  if (task) {
    task.name = newName;
    saveTasks();
    displayTasks();
  }

  closeModal();
}

function saveTasks() {
  try {
    // Buscar todas as tarefas do localStorage
    const allStoredTasks = JSON.parse(
      localStorage.getItem(`tasks_${loggedUser}`) || "[]"
    );

    // Remover tarefas completadas antigas e adicionar as atuais
    const incompleteTasks = allStoredTasks.filter((task) => {
      if (typeof task === "string") return true; // Manter tarefas antigas
      return !task.isCompleted;
    });

    // Combinar tarefas incompletas com as completadas atuais
    const allTasks = [...incompleteTasks, ...currentTasks];

    localStorage.setItem(`tasks_${loggedUser}`, JSON.stringify(allTasks));
  } catch (error) {
    console.error("Erro ao salvar tarefas:", error);
    alert("Erro ao salvar alterações. Tente novamente.");
  }
}

// Tecla ESC para fechar modal
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeModal();
  }
});

// Enter para salvar no modal
document
  .getElementById("edit-task-name")
  .addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      saveEditedTask();
    }
  });
