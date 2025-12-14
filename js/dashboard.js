const loggedUserData = localStorage.getItem("loggedUser");
const loggedUser = loggedUserData ? JSON.parse(loggedUserData).email : null;

let allTasks = [];
let addTaskTimer = null; // Timer para prevenir cliques múltiplos

let audioContext = null;

// Função para gerar ID único
function generateUniqueId() {
  return Date.now() + Math.random().toString(36).substr(2, 9);
}

function initAudioContext() {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.error("Erro ao inicializar contexto de áudio:", error);
    }
  }
}

document.addEventListener("click", initAudioContext, { once: true });
document.addEventListener("keydown", initAudioContext, { once: true });

document.getElementById("user-email").textContent = loggedUser || "Usuário";

function createTaskElement(task) {
  const taskItem = document.createElement("div");
  taskItem.className = task.isCompleted ? "task-item completed" : "task-item";

  const taskContent = document.createElement("div");
  taskContent.className = "task-content";

  const taskName = document.createElement("span");
  taskName.className = "task-name";
  taskName.textContent = task.name;

  const taskActions = document.createElement("div");
  taskActions.className = "task-actions";

  const toggleButton = document.createElement("button");
  toggleButton.className = "toggle-task";
  toggleButton.textContent = task.isCompleted ? "✓" : "○";
  toggleButton.title = task.isCompleted
    ? "Marcar como não completada"
    : "Marcar como completada";

  toggleButton.addEventListener("click", function () {
    // Prevenir múltiplos cliques rápidos
    if (this.disabled) return;
    this.disabled = true;

    const taskIndex = allTasks.findIndex((t) => t.id === task.id);
    if (taskIndex !== -1) {
      allTasks[taskIndex].isCompleted = !allTasks[taskIndex].isCompleted;

      // Se marcado como completo, adicionar delay antes de remover
      if (allTasks[taskIndex].isCompleted) {
        // Dar feedback visual imediato
        taskItem.style.opacity = "0.6";
        taskItem.style.transform = "scale(0.98)";

        // Aguardar 1 segundo antes de remover da lista
        setTimeout(() => {
          saveTasks();
          fetchTasks();
          updateTaskCounter();
        }, 1000);
      } else {
        // Se desmarcado, atualizar imediatamente
        saveTasks();
        fetchTasks();
        updateTaskCounter();
      }
    }

    // Reabilitar botão após pequeno delay
    setTimeout(() => {
      this.disabled = false;
    }, 300);
  });

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-task";
  deleteButton.textContent = "🗑️";
  deleteButton.title = "Excluir tarefa";

  deleteButton.addEventListener("click", function () {
    if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
      const taskIndex = allTasks.findIndex((t) => t.id === task.id);
      if (taskIndex !== -1) {
        allTasks.splice(taskIndex, 1);
      }

      saveTasks();
      fetchTasks();
      updateTaskCounter();
    }
  });

  taskContent.appendChild(taskName);
  taskActions.appendChild(toggleButton);
  taskActions.appendChild(deleteButton);

  taskItem.appendChild(taskContent);
  taskItem.appendChild(taskActions);

  return taskItem;
}

function playNotificationSound() {
  try {
    if (!window.AudioContext && !window.webkitAudioContext) {
      console.warn("Web Audio API não está disponível");
      playFallbackSound();
      return;
    }

    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioContext.state === "suspended") {
      audioContext
        .resume()
        .then(() => {
          createAndPlaySound(audioContext);
        })
        .catch((error) => {
          console.error("Erro ao retomar contexto de áudio:", error);
          playFallbackSound();
        });
    } else {
      createAndPlaySound(audioContext);
    }
  } catch (error) {
    console.error("Erro ao tocar som de notificação:", error);
    playFallbackSound();
  }
}

function createAndPlaySound(context) {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.frequency.setValueAtTime(880, context.currentTime);
  oscillator.frequency.setValueAtTime(1108, context.currentTime + 0.15);
  oscillator.frequency.setValueAtTime(880, context.currentTime + 0.3);

  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(0.5, context.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.8);

  oscillator.start(context.currentTime);
  oscillator.stop(context.currentTime + 0.8);
}

function playFallbackSound() {
  try {
    const audio = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAcCEeL0fPQfS0EKYXK8d+SQwsIa8HTvWAcCkaP0/PQfi0EKYXI8t+SQwsIa8HTvWAcCkaP0/PQfi0EKYXI8t+SQwsIa8HTvWAcCkaP0/PQfi0EKYXI8t+SQwsIa8HTvWAcCkaP0/PQfi0EKYXI8t+SQwsIa8HTvWAcCkaP0/PQfi0EKYXI8t+SQwsIa8HTvWAcCkaP0/PQfi0EKYXI8t+SQwsIa8HTvWAcCkaP0/PQfi0EKYXI8t+SQwsIa8HTvWAcCkaP0/PQfi0EKYXI8t+SQwsIa8HTvWAcCkaP0/PQfi0EKYXI8t+SQwsIa8HTvWAcCjaI0fPSfC0EKYXI8t+SQwwEa8HTvmAcDEaK0fPTfSwEKIXJ8t+SQwwFZ8HTv2AcDEaO0/LVfCsEKIXJ8t+SQwwFbcHTvWAcDkaO0/DWfCsEKITJ8t6SQQwGa8XTvWAcEEaO0/DTfCsEKITK8t6SQQwGZ8XTvmAcEEaM0/LXfCkFK4PJ8d+SQQ0FasTTvmAcEkSM0/LYfCkELIXJ8d6SQg0GbcXTvWAcFESP0/DSfSoFKoTJ8t6SQg0Hb8XUvWAcFUSO0/DUfCoEKoXJ8t6SQw0HZ8bTvmAcFUSM0fHUfSsEKoXJ8t6SRAwFbcXTvWAcF0SM0/HVfCsEKoXJ8t+SQwwFa8bTvmAcGEaM0fHTfCsEKoXJ8t6SRAwFbcXTvWAcGESP0/HVfCoEKYXJ8d6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0Gb"
    );
    audio.play().catch((error) => {
      console.error("Erro ao tocar som fallback:", error);
      if ("vibrate" in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    });
  } catch (error) {
    console.error("Erro no fallback de som:", error);
    if ("vibrate" in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  }
}

document.getElementById("add-task-btn").addEventListener("click", function () {
  // Prevenir cliques múltiplos com timer
  if (addTaskTimer) {
    return; // Ignorar clique se timer ativo
  }

  const taskInput = document.getElementById("new-task-input");
  const taskText = taskInput.value.trim();

  if (taskText) {
    // Ativar timer para prevenir cliques múltiplos
    addTaskTimer = setTimeout(() => {
      addTaskTimer = null;
    }, 500); // 500ms de cooldown

    const task = {
      id: generateUniqueId(), // Adicionar ID único
      name: taskText,
      createdAt: new Date().toISOString(),
      isCompleted: false,
    };

    allTasks.push(task);

    saveTasks();
    fetchTasks();
    updateTaskCounter();

    taskInput.value = "";

    // Feedback visual
    const addButton = this;
    addButton.style.transform = "scale(0.95)";
    setTimeout(() => {
      addButton.style.transform = "scale(1)";
    }, 150);
  } else {
    alert("Por favor, insira uma tarefa válida.");
  }
});

document.addEventListener("DOMContentLoaded", function () {
  if (window.PomodoroManager) {
    window.pomodoroManager = new window.PomodoroManager();
  } else {
    console.error("PomodoroManager não foi carregado");
  }
});

function saveTasks() {
  localStorage.setItem(`tasks_${loggedUser}`, JSON.stringify(allTasks));
}

// Função para atualizar contador de tarefas ativas
function updateTaskCounter() {
  const activeTasksCount = allTasks.filter((task) => !task.isCompleted).length;
  const counterElement = document.getElementById("active-tasks-count");
  if (counterElement) {
    counterElement.textContent = activeTasksCount;

    // Efeito visual no contador
    counterElement.style.transform = "scale(1.1)";
    setTimeout(() => {
      counterElement.style.transform = "scale(1)";
    }, 200);
  }
}

async function fetchTasks() {
  try {
    const localStorageTasks = localStorage.getItem(`tasks_${loggedUser}`);
    if (localStorageTasks) {
      allTasks = JSON.parse(localStorageTasks);

      allTasks = allTasks.map((task) => {
        if (typeof task === "string") {
          return {
            id: generateUniqueId(), // Adicionar ID se não existir
            name: task,
            createdAt: new Date().toISOString(),
            isCompleted: false,
          };
        }

        // Adicionar ID se não existir (compatibilidade com versões antigas)
        if (!task.id) {
          task.id = generateUniqueId();
        }
        if (!task.createdAt) {
          task.createdAt = new Date().toISOString();
        }
        if (task.isCompleted === undefined) {
          task.isCompleted = false;
        }

        return task;
      });

      const tasksList = document.getElementById("tasks-list");
      tasksList.innerHTML = "";

      const incompleteTasks = allTasks
        .filter((task) => !task.isCompleted)
        .sort((a, b) =>
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        );

      incompleteTasks.forEach((task) => {
        const taskItem = createTaskElement(task);
        tasksList.appendChild(taskItem);
      });

      // Atualizar contador após carregar tarefas
      updateTaskCounter();
    } else {
      allTasks = [];
      updateTaskCounter();
    }
  } catch (error) {
    console.error("Erro ao buscar tarefas:", error);
    allTasks = [];
    updateTaskCounter();
  }
}

fetchTasks();

if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission();
}

document
  .getElementById("test-notification-btn")
  .addEventListener("click", function () {
    if (window.pomodoroManager) {
      window.pomodoroManager.testNotification();
    } else {
      playNotificationSound();

      if (Notification.permission === "granted") {
        new Notification("TaskLite - Teste", {
          body: "Som de notificação testado!",
        });
      } else {
        alert("Teste de som realizado!");
      }
    }
  });

document.getElementById("logout-btn").addEventListener("click", function () {
  logout();
});

// Carregar tarefas quando a página carrega
document.addEventListener("DOMContentLoaded", function () {
  fetchTasks();
});
