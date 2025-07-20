class PomodoroTimer {
  constructor() {
    // タイマー設定（分単位）
    this.focusTime = 25;
    this.shortBreakTime = 5;
    this.longBreakTime = 15;
    
    // 状態管理
    this.currentCycle = 1;
    this.isBreak = false;
    this.isRunning = false;
    this.timeLeft = this.focusTime * 60; // 秒単位
    this.intervalId = null;
    
    // DOM要素
    this.timeDisplay = document.getElementById('time');
    this.cycleInfo = document.getElementById('cycle-info');
    this.startStopBtn = document.getElementById('start-stop-btn');
    this.soundToggle = document.getElementById('sound-toggle');
    this.container = document.querySelector('.container');
    
    // イベントリスナー
    this.startStopBtn.addEventListener('click', () => this.toggleTimer());
    
    // 初期表示更新
    this.updateDisplay();
    this.updateUI();
  }
  
  toggleTimer() {
    if (this.isRunning) {
      this.stopTimer();
    } else {
      this.startTimer();
    }
  }
  
  startTimer() {
    this.isRunning = true;
    this.startStopBtn.textContent = '停止';
    this.startStopBtn.classList.add('stop');
    
    this.intervalId = setInterval(() => {
      this.timeLeft--;
      this.updateDisplay();
      
      if (this.timeLeft <= 0) {
        this.completeSession();
      }
    }, 1000);
  }
  
  stopTimer() {
    this.isRunning = false;
    this.startStopBtn.textContent = '開始';
    this.startStopBtn.classList.remove('stop');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  completeSession() {
    this.stopTimer();
    this.showNotification();
    
    if (this.soundToggle.checked) {
      this.playNotificationSound();
    }
    
    // 次のセッションへ移行
    if (!this.isBreak) {
      // 集中時間が終了 → 休憩時間へ
      this.isBreak = true;
      if (this.currentCycle % 4 === 0) {
        // 4サイクル目は長い休憩
        this.timeLeft = this.longBreakTime * 60;
      } else {
        // 短い休憩
        this.timeLeft = this.shortBreakTime * 60;
      }
    } else {
      // 休憩時間が終了 → 次の集中時間へ
      this.isBreak = false;
      this.currentCycle++;
      this.timeLeft = this.focusTime * 60;
    }
    
    this.updateDisplay();
    this.updateUI();
  }
  
  updateDisplay() {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // タイマー表示更新
    this.timeDisplay.textContent = timeString;
    
    // ページタイトル更新
    const status = this.isBreak ? '休憩' : '集中';
    document.title = `${timeString} - (${status}) - ポモドーロタイマー`;
  }
  
  updateUI() {
    // サイクル情報更新
    const sessionType = this.isBreak ? 
      (this.currentCycle % 4 === 0 ? '長休憩' : '短休憩') : 
      '集中時間';
    this.cycleInfo.textContent = `サイクル ${this.currentCycle} - ${sessionType}`;
    
    // UI色変更
    if (this.isBreak) {
      this.container.classList.remove('focus');
      this.container.classList.add('break');
    } else {
      this.container.classList.remove('break');
      this.container.classList.add('focus');
    }
  }
  
  showNotification() {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        const message = this.isBreak ? 
          '休憩時間が終了しました！集中時間を開始しましょう。' : 
          '集中時間が終了しました！休憩を取りましょう。';
        
        new Notification('ポモドーロタイマー', {
          body: message,
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23e74c3c"/></svg>'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            this.showNotification();
          }
        });
      }
    }
  }
  
  playNotificationSound() {
    // Web Audio APIを使用してビープ音を生成
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('音声再生に失敗しました:', error);
    }
  }
}

// ページ読み込み完了後にタイマーを初期化
document.addEventListener('DOMContentLoaded', () => {
  new PomodoroTimer();
  
  // 通知許可をリクエスト
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
});