window.onload = function () {
    const audio = document.getElementById('audio');
    const canvas = document.getElementById('visualizer');
    const canvasContext = canvas.getContext('2d');
  
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;  // Number of frequency bins
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
  
    // Connect the audio element to the Web Audio API
    const audioSource = audioContext.createMediaElementSource(audio);
    audioSource.connect(analyser);
    analyser.connect(audioContext.destination);
  
    // Visualize the frequency data on the canvas
    function draw() {
      requestAnimationFrame(draw);
  
      analyser.getByteFrequencyData(dataArray);
  
      canvasContext.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / analyser.frequencyBinCount) * 2.5;
      let barHeight;
      let x = 0;
  
      for (let i = 0; i < analyser.frequencyBinCount; i++) {
        barHeight = dataArray[i];
  
        canvasContext.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
        canvasContext.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2);
  
        x += barWidth + 1;
      }
    }
  
    draw();
  
    // Play the audio when the user clicks play
    audio.onplay = function () {
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
    };
  };
