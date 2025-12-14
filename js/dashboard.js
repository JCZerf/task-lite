const loggedUserData = localStorage.getItem("loggedUser");
const loggedUser = loggedUserData ? JSON.parse(loggedUserData).email : null;

let allTasks = [];

let audioContext = null;

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
    const taskIndex = allTasks.findIndex((t) => t.name === task.name);
    if (taskIndex !== -1) {
      allTasks[taskIndex].isCompleted = !allTasks[taskIndex].isCompleted;
    }

    saveTasks();
    fetchTasks();
  });

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-task";
  deleteButton.textContent = "🗑️";
  deleteButton.title = "Excluir tarefa";

  deleteButton.addEventListener("click", function () {
    if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
      const taskIndex = allTasks.findIndex((t) => t.name === task.name);
      if (taskIndex !== -1) {
        allTasks.splice(taskIndex, 1);
      }

      saveTasks();
      fetchTasks();
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
  // Fallback usando beep do sistema ou elemento audio
  try {
    // Criar um beep usando data URL
    const audio = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAcCEeL0fPQfS0EKYXK8d+SQwsIa8HTvWAcCkaP0/PQfi0EKYXI8t+SQwsIa8HTvWAcCkaP0/PQfi0EKYXI8t+SQwsIa8HTvWAcCkaP0/PQfi0EKYXI8t+SQwsIa8HTvWAcCkaP0/PQfi0EKYXI8t+SQwsIa8HTvWAcCkaP0/PQfi0EKYXI8t+SQwsIa8HTvWAcCkaP0/PQfi0EKYXI8t+SQwsIa8HTvWAcCkaP0/PQfi0EKYXI8t+SQwsIa8HTvWAcCkaP0/PQfi0EKYXI8t+SQwsIa8HTvWAcCkaP0/PQfi0EKYXI8t+SQwsIa8HTvWAcCjaI0fPSfC0EKYXI8t+SQwwEa8HTvmAcDEaK0fPTfSwEKIXJ8t+SQwwFZ8HTv2AcDEaO0/LVfCsEKIXJ8t+SQwwFbcHTvWAcDkaO0/DWfCsEKITJ8t6SQQwGa8XTvWAcEEaO0/DTfCsEKITK8t6SQQwGZ8XTvmAcEEaM0/LXfCkFK4PJ8d+SQQ0FasTTvmAcEkSM0/LYfCkELIXJ8d6SQg0GbcXTvWAcFESP0/DSfSoFKoTJ8t6SQg0Hb8XUvWAcFUSO0/DUfCoEKoXJ8t6SQw0HZ8bTvmAcFUSM0fHUfSsEKoXJ8t6SRAwFbcXTvWAcF0SM0/HVfCsEKoXJ8t+SQwwFa8bTvmAcGEaM0fHTfCsEKoXJ8t6SRAwFbcXTvWAcGESP0/HVfCoEKYXJ8d6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0GbcXTvWAcFUSP0/DVfSoEKYXJ8t6SQw0Gb"
    );
    audio.play().catch((error) => {
      console.error("Erro ao tocar som fallback:", error);
      // Último recurso: vibrar se disponível
      if ("vibrate" in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    });
  } catch (error) {
    console.error("Erro no fallback de som:", error);
    // Último recurso: vibrar se disponível
    if ("vibrate" in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  }
}

document.getElementById("add-task-btn").addEventListener("click", function () {
  const taskInput = document.getElementById("new-task-input");
  const taskText = taskInput.value.trim();
  if (taskText) {
    const task = {
      name: taskText,
      createdAt: new Date().toISOString(),
      isCompleted: false,
    };

    // Adicionar à lista global
    allTasks.push(task);

    // Salvar e recarregar a lista
    saveTasks();
    fetchTasks();

    taskInput.value = "";
  } else {
    alert("Por favor, insira uma tarefa válida.");
  }
});

let pomodoroInterval;
let pomodoroTimeLeft = 25 * 60;
let isPomodoroRunning = false;

function updatePomodoroDisplay() {
  const minutes = Math.floor(pomodoroTimeLeft / 60);
  const seconds = pomodoroTimeLeft % 60;
  document.getElementById("pomodoro-timer").textContent = `${String(
    minutes
  ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

document
  .getElementById("start-pomodoro")
  .addEventListener("click", function () {
    const startButton = document.getElementById("start-pomodoro");

    if (!isPomodoroRunning) {
      isPomodoroRunning = true;
      startButton.classList.add("active");
      startButton.textContent = "Rodando...";

      pomodoroInterval = setInterval(function () {
        if (pomodoroTimeLeft > 0) {
          pomodoroTimeLeft--;
          updatePomodoroDisplay();
        } else {
          clearInterval(pomodoroInterval);
          isPomodoroRunning = false;
          startButton.classList.remove("active");
          startButton.textContent = "Iniciar";

          playNotificationSound();

          if (Notification.permission === "granted") {
            new Notification("TaskLite", {
              body: "Tempo de Pomodoro concluído!",
            });
          } else {
            alert("Tempo de Pomodoro concluído!");
          }
        }
      }, 1000);
    }
  });

document
  .getElementById("pause-pomodoro")
  .addEventListener("click", function () {
    const startButton = document.getElementById("start-pomodoro");

    if (isPomodoroRunning) {
      clearInterval(pomodoroInterval);
      isPomodoroRunning = false;
      startButton.classList.remove("active");
      startButton.textContent = "Iniciar";
    }
  });

document
  .getElementById("reset-pomodoro")
  .addEventListener("click", function () {
    const startButton = document.getElementById("start-pomodoro");

    clearInterval(pomodoroInterval);
    isPomodoroRunning = false;
    startButton.classList.remove("active");
    startButton.textContent = "Iniciar";

    const inputTime = document.getElementById("pomodoro-time-input").value;
    pomodoroTimeLeft = parseInt(inputTime, 10) * 60 || 25 * 60;
    updatePomodoroDisplay();
  });

updatePomodoroDisplay();

document
  .getElementById("pomodoro-time-input")
  .addEventListener("change", function () {
    const newTime = parseInt(this.value, 10);
    if (!isNaN(newTime) && newTime > 0) {
      pomodoroTimeLeft = newTime * 60;
      updatePomodoroDisplay();
    } else {
      alert("Por favor, insira um tempo válido em minutos.");
    }
  });

function saveTasks() {
  localStorage.setItem(`tasks_${loggedUser}`, JSON.stringify(allTasks));
}

async function fetchTasks() {
  try {
    const localStorageTasks = localStorage.getItem(`tasks_${loggedUser}`);
    if (localStorageTasks) {
      allTasks = JSON.parse(localStorageTasks);

      // Garantir compatibilidade e propriedades
      allTasks = allTasks.map((task) => {
        if (typeof task === "string") {
          return {
            name: task,
            createdAt: new Date().toISOString(),
            isCompleted: false,
          };
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
    } else {
      allTasks = [];
    }
  } catch (error) {
    console.error("Erro ao buscar tarefas:", error);
    allTasks = [];
  }
}

fetchTasks();

if ("Notification" in window && Notification.permission === "default") {
  Notification.requestPermission();
}

document
  .getElementById("test-notification-btn")
  .addEventListener("click", function () {
    playNotificationSound();

    // Também testar notificação visual
    if (Notification.permission === "granted") {
      new Notification("TaskLite - Teste", {
        body: "Som de notificação testado! 🔊",
      });
    } else {
      alert("🔊 Teste de som realizado!");
    }
  });

document.getElementById("logout-btn").addEventListener("click", function () {
  logout();
});
