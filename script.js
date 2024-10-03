window.onload = function () {
  const audio = document.getElementById('audio');
  const canvas = document.getElementById('visualizer');
  const canvasContext = canvas.getContext('2d');

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = audioContext.createAnalyser();

  analyser.fftSize = 256;  // Higher resolution for better frequency separation
  analyser.minDecibels = -70;  // Adjust min dB to ignore very low amplitudes
  analyser.maxDecibels = -10;  // Max dB to limit sensitivity
  const dataArray = new Uint8Array(analyser.frequencyBinCount);

  const allCircles = [];
  let spawnTimer = 0;  
  const spawnInterval = 15;  // Control spawn rate

  // Water wave parameters
  const waves = [];  // Store wave objects for localized wave effects
  const waveSpeed = 0.05;  // Speed of wave movement

  // Color palette for the 8 frequency intervals
  const colorPalette = [
    '#66ccff',  // Light neon blue
    '#99ffff',  // Light cyan (transition from blue to white)
    '#ffffff',  // White (transition color)
    '#ff99ff',  // Light neon pink
    '#ff66cc',  // Bright pink (neon pink)
    '#ff3399',  // Neon pink
    '#ff0066',  // Bright neon magenta
    '#cc00ff',  // Neon purple
  ];

  // Define logarithmic frequency ranges for visualization and hover
  const fMin = 20;  // Minimum frequency in Hz
  const fMax = 20000;  // Maximum frequency in Hz

  const frequencyRanges = Array.from({ length: 8 }, (_, index) => {
    const min = fMin * Math.pow(fMax / fMin, index / 8);
    const max = fMin * Math.pow(fMax / fMin, (index + 1) / 8);
    return { min, max };
  });

  // Connect audio source to Web Audio API
  const audioSource = audioContext.createMediaElementSource(audio);
  audioSource.connect(analyser);
  analyser.connect(audioContext.destination);

  // Function to count frequencies and return frequency data
  function countFrequencies() {
    const freqCounts = Array.from({ length: 8 }, () => ({ count: 0, bands: [] }));
    
    const sampleRate = audioContext.sampleRate;
    const binFrequency = sampleRate / analyser.fftSize;  // Calculate bin size in Hz

    for (let i = 0; i < analyser.frequencyBinCount; i++) {
      const amplitude = dataArray[i];
      const threshold = 20;  // Ignore low amplitudes
      const frequency = i * binFrequency;  // Actual frequency for this bin

      if (amplitude > threshold) {
        // Check which logarithmic band this frequency belongs to
        for (let bandIndex = 0; bandIndex < frequencyRanges.length; bandIndex++) {
          const { min, max } = frequencyRanges[bandIndex];
          if (frequency >= min && frequency < max) {
            freqCounts[bandIndex].count++;
            freqCounts[bandIndex].bands.push(i);
            break;  // Stop once the correct band is found
          }
        }
      }
    }

    return freqCounts;
  }

  // Function to get color based on frequency band
  function getColorForFrequency(bandIndex) {
    return colorPalette[bandIndex];  // Return color from palette based on the interval
  }

  // Function to spawn circles based on frequency activity
  function spawnCircles(frequencyData) {
    const canvasSectionWidth = canvas.width / 8;  // Each frequency band gets one-eighth of the canvas width
    const columnWidth = canvasSectionWidth * 0.8;  // Width of the column, with gaps between columns

    frequencyData.forEach((freqData, bandIndex) => {
      const { count, bands } = freqData;

      if (count > 0) {  // Only create circles if there's activity in the frequency band
        const numCircles = count;  // The number of circles corresponds to frequency activity

        for (let i = 0; i < numCircles; i++) {
          const circle = {
            x: bandIndex * canvasSectionWidth + (canvasSectionWidth - columnWidth) / 2 + Math.random() * columnWidth,  // Place circles within column
            y: 0,  // Start from the top of the canvas
            speed: 1 + Math.random() * 2,  // Random speed
            radius: 3,  // Fixed size of circles
            color: getColorForFrequency(bandIndex)  // Get color from color palette
          };
          allCircles.push(circle);
        }
      }
    });
  }

  // Function to create localized wave effect at the water surface
  function createLocalizedWave(x) {
    waves.push({
      x: x,            // X-coordinate where raindrop hits
      amplitude: 20,   // Initial amplitude of the wave
      decay: 0.98,     // Wave decay over time
      offset: 0        // Initial wave offset
    });
  }

  // Function to draw water waves (localized where raindrops hit)
  function drawWater() {
    const waterHeight = canvas.height - 100;
    canvasContext.fillStyle = '#001f3f';  // Water color
    canvasContext.fillRect(0, waterHeight, canvas.width, 100);  // Draw the water

    // Draw localized waves on the water
    waves.forEach((wave, index) => {
      canvasContext.beginPath();
      for (let i = 0; i < canvas.width; i++) {
        // Calculate wave height only near the wave's origin (localized)
        const distance = Math.abs(i - wave.x);
        const waveEffect = Math.exp(-distance * 0.05);  // Dampen wave effect with distance

        const waveY = waterHeight + Math.sin(i * waveSpeed + wave.offset) * wave.amplitude * waveEffect;
        canvasContext.lineTo(i, waveY);
      }
      canvasContext.lineTo(canvas.width, canvas.height);  // Complete the shape
      canvasContext.lineTo(0, canvas.height);
      canvasContext.closePath();
      canvasContext.fillStyle = '#0074D9';  // Wave color
      canvasContext.fill();

      // Update wave parameters
      wave.offset += 0.05;  // Shift wave to create animation
      wave.amplitude *= wave.decay;  // Reduce wave amplitude over time

      // Remove wave if amplitude becomes too small
      if (wave.amplitude < 1) {
        waves.splice(index, 1);
      }
    });
  }

  // Function to update and draw all circles
  function updateAndDrawCircles() {
    for (let i = allCircles.length - 1; i >= 0; i--) {
      const circle = allCircles[i];
      circle.y += circle.speed;

      // Draw circle
      canvasContext.fillStyle = circle.color;
      canvasContext.beginPath();
      canvasContext.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
      canvasContext.fill();

      // Check if circle hits the water
      if (circle.y > canvas.height - 100) {
        createLocalizedWave(circle.x);  // Create a localized wave at the impact point
        allCircles.splice(i, 1);  // Remove circle from list
      }
    }
  }

  // Tooltip element
  const tooltip = document.createElement('div');
  tooltip.style.position = 'absolute';
  tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  tooltip.style.color = 'white';
  tooltip.style.padding = '5px';
  tooltip.style.borderRadius = '3px';
  tooltip.style.pointerEvents = 'none';
  tooltip.style.display = 'none'; // Initially hidden
  document.body.appendChild(tooltip);

  // Function to visualize the rain and frequency data
  function draw() {
    requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);

    // Spawn circles based on frequency bands
    if (spawnTimer === 0) {
      const frequencyData = countFrequencies();  // Analyze distribution of frequencies
      spawnCircles(frequencyData);               // Create circles based on frequency activity
    }

    spawnTimer++;
    if (spawnTimer >= spawnInterval) {
      spawnTimer = 0;
    }

    // Draw circles (raindrops)
    updateAndDrawCircles();

    // Draw localized water waves
    drawWater();
  }

  // Event listener for mouse movement over the canvas
  canvas.addEventListener('mousemove', (event) => {
    const canvasSectionWidth = canvas.width / 8; // Width of each frequency band
    const mouseX = event.clientX - canvas.getBoundingClientRect().left;

    // Determine the hovered frequency band
    const hoveredBandIndex = Math.floor(mouseX / canvasSectionWidth);
    if (hoveredBandIndex >= 0 && hoveredBandIndex < frequencyRanges.length) {
      const { min, max } = frequencyRanges[hoveredBandIndex];
      tooltip.innerText = `Frequency Range: ${min.toFixed(2)} Hz - ${max.toFixed(2)} Hz`;
      tooltip.style.left = `${event.clientX + 10}px`;
      tooltip.style.top = `${event.clientY + 10}px`;
      tooltip.style.display = 'block'; // Show the tooltip
    } else {
      tooltip.style.display = 'none'; // Hide the tooltip if outside bands
    }
  });

  // Event listener to hide the tooltip when not hovering over the canvas
  canvas.addEventListener('mouseleave', () => {
    tooltip.style.display = 'none';
  });

  // Ensure AudioContext resumes when audio is played
  audio.onplay = function () {
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
  };

  draw();
};