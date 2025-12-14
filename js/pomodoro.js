// Classe para gerenciar todas as funcionalidades do Pomodoro
class PomodoroManager {
  constructor() {
    this.interval = null;
    this.syncInterval = null; // Intervalo para sincronização automática
    this.timeLeft = 25 * 60; // 25 minutos em segundos
    this.isRunning = false;
    this.currentSession = "work"; // 'work', 'break', 'longBreak'
    this.completedPomodoros = 0;
    this.sessionStartTime = null; // Timestamp de quando a sessão começou
    this.sessionData = null; // Dados da sessão atual
    this.settings = {
      workTime: 25,
      breakTime: 5,
      longBreakTime: 15,
      autoStartBreaks: true,
      autoStartWork: false,
      soundNotifications: true,
      desktopNotifications: true,
      pomodorosUntilLongBreak: 4,
    };

    this.audioContext = null;
    this.stats = this.loadStats();

    this.init();
  }

  init() {
    this.loadSettings();
    this.restoreSessionIfActive(); // Restaurar sessão ativa se existir
    this.updateDisplay();
    this.bindEvents();
    this.initAudioContext();
    this.updateProgressCircle();
    this.updateSessionIndicator(); // Inicializar indicador de sessão
    this.startSyncInterval(); // Iniciar sincronização automática

    // Solicitar permissão para notificações se ainda não foi concedida
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Listeners para detectar quando a página vai para segundo plano
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && this.isRunning) {
        this.syncWithStoredSession();
      }
    });

    // Listener para quando a janela ganha foco
    window.addEventListener("focus", () => {
      if (this.isRunning) {
        this.syncWithStoredSession();
      }
    });
  }

  initAudioContext() {
    document.addEventListener(
      "click",
      () => {
        if (!this.audioContext) {
          try {
            this.audioContext = new (window.AudioContext ||
              window.webkitAudioContext)();
          } catch (error) {
            console.error("Erro ao inicializar contexto de áudio:", error);
          }
        }
      },
      { once: true }
    );
  }

  bindEvents() {
    // Eventos dos botões de controle
    document.getElementById("start-pomodoro").addEventListener("click", () => {
      this.toggleTimer();
    });

    document.getElementById("reset-pomodoro").addEventListener("click", () => {
      this.resetTimer();
    });

    // Evento para mudança do tempo no input
    document
      .getElementById("pomodoro-time-input")
      .addEventListener("change", (e) => {
        this.updateWorkTime(parseInt(e.target.value, 10));
      });
  }

  toggleTimer() {
    if (!this.isRunning) {
      this.startTimer();
    } else {
      this.pauseTimer();
    }
  }

  startTimer() {
    this.isRunning = true;
    this.sessionStartTime = Date.now();

    // Salvar dados da sessão no localStorage
    this.sessionData = {
      startTime: this.sessionStartTime,
      initialTimeLeft: this.timeLeft,
      currentSession: this.currentSession,
      completedPomodoros: this.completedPomodoros,
      isActive: true,
    };
    this.saveSessionData();

    this.updateButtonStates();

    // Som ao iniciar o pomodoro
    this.playStartSound();

    this.interval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
        this.updateDisplay();
        this.updateProgressCircle();
        this.updateSessionData(); // Atualizar dados da sessão
      } else {
        this.completeSession();
      }
    }, 1000);
  }

  pauseTimer() {
    this.isRunning = false;
    clearInterval(this.interval);
    this.clearSessionData(); // Limpar dados da sessão quando pausar
    this.updateButtonStates();
  }

  resetTimer() {
    this.pauseTimer();
    this.timeLeft = this.getCurrentSessionTime() * 60;
    this.clearSessionData(); // Limpar dados da sessão quando resetar
    this.updateDisplay();
    this.updateProgressCircle();
    this.updateButtonStates();

    // Efeito visual de reset
    this.showResetEffect();
  }

  showResetEffect() {
    const timerElement = document.getElementById("pomodoro-timer");
    if (timerElement) {
      timerElement.style.transform = "scale(1.1)";
      timerElement.style.transition = "transform 0.2s ease";
      setTimeout(() => {
        timerElement.style.transform = "scale(1)";
        timerElement.style.transition = "all 0.3s ease";
      }, 200);
    }
  }

  completeSession() {
    this.pauseTimer();
    this.clearSessionData(); // Limpar dados da sessão quando completar

    if (this.currentSession === "work") {
      this.completedPomodoros++;
      this.updateStats();
    }

    this.playNotificationSound();
    this.showNotification();

    // Determinar próxima sessão
    if (this.currentSession === "work") {
      if (
        this.completedPomodoros % this.settings.pomodorosUntilLongBreak ===
        0
      ) {
        this.currentSession = "longBreak";
      } else {
        this.currentSession = "break";
      }
    } else {
      this.currentSession = "work";
    }

    this.timeLeft = this.getCurrentSessionTime() * 60;
    this.updateDisplay();
    this.updateProgressCircle();
    this.updateSessionIndicator(); // Atualizar indicador quando muda de sessão

    // Auto-iniciar se configurado
    if (
      (this.currentSession !== "work" && this.settings.autoStartBreaks) ||
      (this.currentSession === "work" && this.settings.autoStartWork)
    ) {
      setTimeout(() => this.startTimer(), 1000);
    }
  }

  getCurrentSessionTime() {
    switch (this.currentSession) {
      case "work":
        return this.settings.workTime;
      case "break":
        return this.settings.breakTime;
      case "longBreak":
        return this.settings.longBreakTime;
      default:
        return this.settings.workTime;
    }
  }

  updateDisplay() {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;

    const timerElement = document.getElementById("pomodoro-timer");
    if (timerElement) {
      timerElement.textContent = `${String(minutes).padStart(2, "0")}:${String(
        seconds
      ).padStart(2, "0")}`;

      // Adicionar efeito visual quando está rodando
      if (this.isRunning) {
        timerElement.classList.add("running");
      } else {
        timerElement.classList.remove("running");
      }
    }

    // Atualizar título da página com o tempo restante quando ativo
    if (this.isRunning) {
      const sessionType =
        this.currentSession === "work"
          ? "Foco"
          : this.currentSession === "break"
          ? "Pausa"
          : "Pausa Longa";
      document.title = `${String(minutes).padStart(2, "0")}:${String(
        seconds
      ).padStart(2, "0")} - ${sessionType} | TaskLite`;
    } else {
      document.title = "TaskLite - Pomodoro";
    }
  }

  updateProgressCircle() {
    const circle = document.getElementById("progress-circle");
    if (!circle) return;

    const totalTime = this.getCurrentSessionTime() * 60;
    const progress = (totalTime - this.timeLeft) / totalTime;
    const circumference = 2 * Math.PI * 63; // raio = 63 (30% menor)
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - progress * circumference;

    circle.style.strokeDasharray = strokeDasharray;
    circle.style.strokeDashoffset = strokeDashoffset;

    // Efeito de pulsação quando próximo do fim
    if (this.timeLeft <= 60 && this.isRunning) {
      // Último minuto
      circle.style.animation = "circlePulse 1s ease-in-out infinite";
    } else {
      circle.style.animation = "none";
    }

    // Atualizar o gradiente baseado no progresso
    const svg = circle.closest("svg");
    if (svg) {
      const gradient = svg.querySelector("#progressGradient");
      if (gradient) {
        const stops = gradient.querySelectorAll("stop");
        if (this.currentSession === "work") {
          stops[0].setAttribute("stop-color", "var(--cor-primaria)");
          stops[1].setAttribute("stop-color", "#ff8c42");
          stops[2].setAttribute("stop-color", "var(--cor-primaria)");
        } else if (this.currentSession === "break") {
          stops[0].setAttribute("stop-color", "#4CAF50");
          stops[1].setAttribute("stop-color", "#66BB6A");
          stops[2].setAttribute("stop-color", "#4CAF50");
        } else {
          stops[0].setAttribute("stop-color", "#FF9800");
          stops[1].setAttribute("stop-color", "#FFB74D");
          stops[2].setAttribute("stop-color", "#FF9800");
        }
      }
    }
  }

  updateButtonStates() {
    const startButton = document.getElementById("start-pomodoro");

    if (this.isRunning) {
      startButton.classList.add("active");
      startButton.textContent = "Pausar";
    } else {
      startButton.classList.remove("active");
      startButton.textContent = "Iniciar";
    }

    // Atualizar indicador de sessão
    this.updateSessionIndicator();
  }

  updateSessionIndicator() {
    const sessionElement = document.getElementById("session-type");
    if (!sessionElement) return;

    // Remover classes anteriores
    sessionElement.classList.remove("break-session", "long-break-session");

    if (this.currentSession === "work") {
      sessionElement.textContent = "Sessão de Foco";
    } else if (this.currentSession === "break") {
      sessionElement.textContent = "Sessão de Pausa";
      sessionElement.classList.add("break-session");
    } else if (this.currentSession === "longBreak") {
      sessionElement.textContent = "Pausa Longa";
      sessionElement.classList.add("long-break-session");
    }
  }

  updateWorkTime(minutes) {
    if (isNaN(minutes) || minutes <= 0) {
      alert("Por favor, insira um tempo válido em minutos.");
      document.getElementById("pomodoro-time-input").value =
        this.settings.workTime;
      return;
    }

    this.settings.workTime = minutes;
    if (this.currentSession === "work" && !this.isRunning) {
      this.timeLeft = minutes * 60;
      this.updateDisplay();
      this.updateProgressCircle();
    }

    this.saveSettings();
  }

  playNotificationSound() {
    if (!this.settings.soundNotifications) return;

    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
      }

      if (this.audioContext.state === "suspended") {
        this.audioContext.resume().then(() => {
          this.createAndPlaySound();
        });
      } else {
        this.createAndPlaySound();
      }
    } catch (error) {
      console.error("Erro ao reproduzir som:", error);
    }
  }

  createAndPlaySound() {
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
      oscillator.frequency.setValueAtTime(
        600,
        this.audioContext.currentTime + 0.1
      );
      oscillator.frequency.setValueAtTime(
        800,
        this.audioContext.currentTime + 0.2
      );

      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.3
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.3);
    } catch (error) {
      console.error("Erro ao criar som:", error);
    }
  }

  playStartSound() {
    if (!this.settings.soundNotifications) return;

    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
      }

      if (this.audioContext.state === "suspended") {
        this.audioContext.resume().then(() => {
          this.createStartSound();
        });
      } else {
        this.createStartSound();
      }
    } catch (error) {
      console.error("Erro ao reproduzir som de início:", error);
    }
  }

  createStartSound() {
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Som ascendente para indicar início
      oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
      oscillator.frequency.linearRampToValueAtTime(
        600,
        this.audioContext.currentTime + 0.2
      );
      oscillator.frequency.linearRampToValueAtTime(
        800,
        this.audioContext.currentTime + 0.4
      );

      gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        0.3,
        this.audioContext.currentTime + 0.2
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.5
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.5);
    } catch (error) {
      console.error("Erro ao criar som de início:", error);
    }
  }

  showNotification() {
    if (!this.settings.desktopNotifications) return;

    const title = "TaskLite - Pomodoro";
    let message = "";

    if (this.currentSession === "break") {
      message = `Sessão de trabalho concluída! Hora de uma pausa de ${this.settings.breakTime} minutos.`;
    } else if (this.currentSession === "longBreak") {
      message = `Sessão de trabalho concluída! Hora de uma pausa longa de ${this.settings.longBreakTime} minutos.`;
    } else {
      message = "Pausa concluída! Hora de voltar ao trabalho.";
    }

    if (Notification.permission === "granted") {
      new Notification(title, { body: message });
    } else {
      alert(message);
    }
  }

  updateStats() {
    const today = new Date().toDateString();

    if (!this.stats.dailyStats[today]) {
      this.stats.dailyStats[today] = { count: 0, focusTime: 0 };
    }

    this.stats.dailyStats[today].count++;
    this.stats.dailyStats[today].focusTime += this.settings.workTime;
    this.stats.totalPomodoros++;

    this.saveStats();
  }

  loadStats() {
    const saved = localStorage.getItem("pomodoro_stats");
    if (saved) {
      return JSON.parse(saved);
    }

    return {
      totalPomodoros: 0,
      dailyStats: {},
    };
  }

  saveStats() {
    localStorage.setItem("pomodoro_stats", JSON.stringify(this.stats));
  }

  loadSettings() {
    const saved = localStorage.getItem("pomodoro_settings");
    if (saved) {
      this.settings = { ...this.settings, ...JSON.parse(saved) };
    }

    // Aplicar configurações na interface
    const timeInput = document.getElementById("pomodoro-time-input");
    if (timeInput) {
      timeInput.value = this.settings.workTime;
      this.timeLeft = this.settings.workTime * 60;
    }
  }

  saveSettings() {
    localStorage.setItem("pomodoro_settings", JSON.stringify(this.settings));
  }

  // Métodos para gerenciar sincronização de sessão
  saveSessionData() {
    if (this.sessionData) {
      localStorage.setItem(
        "pomodoro_session",
        JSON.stringify(this.sessionData)
      );
    }
  }

  loadSessionData() {
    const saved = localStorage.getItem("pomodoro_session");
    return saved ? JSON.parse(saved) : null;
  }

  clearSessionData() {
    localStorage.removeItem("pomodoro_session");
    this.sessionData = null;
    this.sessionStartTime = null;
  }

  updateSessionData() {
    if (this.sessionData && this.isRunning) {
      this.sessionData.timeLeft = this.timeLeft;
      this.sessionData.lastUpdate = Date.now();
      this.saveSessionData();
    }
  }

  restoreSessionIfActive() {
    const savedSession = this.loadSessionData();
    if (!savedSession || !savedSession.isActive) {
      return;
    }

    // Calcular tempo decorrido desde o início da sessão
    const currentTime = Date.now();
    const elapsedSeconds = Math.floor(
      (currentTime - savedSession.startTime) / 1000
    );
    const newTimeLeft = savedSession.initialTimeLeft - elapsedSeconds;

    // Se ainda há tempo restante, restaurar a sessão
    if (newTimeLeft > 0) {
      this.timeLeft = newTimeLeft;
      this.currentSession = savedSession.currentSession;
      this.completedPomodoros = savedSession.completedPomodoros;
      this.sessionStartTime = savedSession.startTime;
      this.sessionData = savedSession;
      this.isRunning = true;

      console.log(
        `Sessão restaurada: ${Math.floor(newTimeLeft / 60)}:${(newTimeLeft % 60)
          .toString()
          .padStart(2, "0")} restantes`
      );

      // Reiniciar o timer
      this.interval = setInterval(() => {
        if (this.timeLeft > 0) {
          this.timeLeft--;
          this.updateDisplay();
          this.updateProgressCircle();
          this.updateSessionData();
        } else {
          this.completeSession();
        }
      }, 1000);

      this.updateButtonStates();
    } else {
      // Se o tempo acabou, completar a sessão
      this.timeLeft = 0;
      this.currentSession = savedSession.currentSession;
      this.completedPomodoros = savedSession.completedPomodoros;
      this.completeSession();
    }
  }

  syncWithStoredSession() {
    const savedSession = this.loadSessionData();
    if (!savedSession || !savedSession.isActive || !this.isRunning) {
      return;
    }

    // Calcular tempo decorrido desde o início da sessão
    const currentTime = Date.now();
    const elapsedSeconds = Math.floor(
      (currentTime - savedSession.startTime) / 1000
    );
    const expectedTimeLeft = savedSession.initialTimeLeft - elapsedSeconds;

    // Sincronizar apenas se houver diferença significativa (mais de 2 segundos)
    if (Math.abs(this.timeLeft - expectedTimeLeft) > 2) {
      if (expectedTimeLeft > 0) {
        this.timeLeft = expectedTimeLeft;
        console.log(
          `Timer sincronizado: diferença de ${Math.abs(
            this.timeLeft - expectedTimeLeft
          )} segundos`
        );
        this.showSyncIndicator();
      } else {
        // Se o tempo acabou, completar a sessão
        this.timeLeft = 0;
        this.completeSession();
        return;
      }
    }

    this.updateDisplay();
    this.updateProgressCircle();
  }

  startSyncInterval() {
    // Sincronização a cada 5 segundos para garantir precisão
    this.syncInterval = setInterval(() => {
      if (this.isRunning) {
        this.syncWithStoredSession();
      }
    }, 5000);
  }

  stopSyncInterval() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Método para limpar todos os recursos quando necessário
  destroy() {
    this.pauseTimer();
    this.stopSyncInterval();
    this.clearSessionData();
  }

  // Mostrar indicador de sincronização
  showSyncIndicator() {
    const timerElement = document.getElementById("pomodoro-timer");
    if (timerElement) {
      // Adicionar classe para efeito visual de sincronização
      timerElement.classList.add("synced");
      setTimeout(() => {
        timerElement.classList.remove("synced");
      }, 1000);
    }
  }

  // Método público para testar notificações
  testNotification() {
    this.playNotificationSound();

    if (this.settings.desktopNotifications) {
      if (Notification.permission === "granted") {
        new Notification("TaskLite - Teste", {
          body: "Som de notificação testado! 🔊",
        });
      } else {
        alert("🔊 Teste de som realizado!");
      }
    }
  }

  // Método para obter estatísticas
  getStats() {
    return this.stats;
  }

  // Método para atualizar configurações
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }
}

// Exportar a classe para uso global
window.PomodoroManager = PomodoroManager;
