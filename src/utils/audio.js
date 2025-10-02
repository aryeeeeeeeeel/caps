// utils/audio.js
export const playNotificationSound = () => {
  try {
    const audio = new Audio('/notification_sound.mp3');
    audio.play().catch(e => {
      console.log('Audio play failed, using fallback');
      // Fallback: Use browser beep
      playFallbackBeep();
    });
  } catch (error) {
    console.log('Audio error:', error);
    playFallbackBeep();
  }
};

const playFallbackBeep = () => {
  // Simple beep using Web Audio API
  const context = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  
  oscillator.frequency.value = 800;
  gainNode.gain.value = 0.1;
  
  oscillator.start();
  oscillator.stop(context.currentTime + 0.1);
};