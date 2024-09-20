window.onload = function () {
    const audio = document.getElementById('audio');
    const canvas = document.getElementById('visualizer');
    const canvasContext = canvas.getContext('2d');
  
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    
    analyser.fftSize = 64;  // Mindre fftSize för att minska antalet frekvensband (32 band)
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
  
    // Skapa en array för att hålla alla cirklar för varje frekvens
    const allCircles = [];
    let spawnTimer = 0;  // Timer för att kontrollera spawn rate
    const spawnInterval = 10;  // Justerbar spawn rate, högre värde = färre cirklar
  
    // Koppla ljudkällan (audio element) till Web Audio API
    const audioSource = audioContext.createMediaElementSource(audio);
    audioSource.connect(analyser);
    analyser.connect(audioContext.destination);
  
    // Färg baserat på frekvens (från blått till rött)
    function getColorForFrequency(index, frequencyBinCount) {
      const ratio = index / frequencyBinCount;
      const red = Math.round(255 * ratio);
      const blue = 255 - red;
      return `rgb(${red}, 50, ${blue})`;  // Blå för låga frekvenser, röd för höga
    }
  
    // Funktion för att skapa nya cirklar baserat på frekvenser
    function spawnCircles(index, barHeight, barWidth) {
      // Generera ännu färre cirklar för varje volymnivå
      const numCircles = Math.floor(barHeight / 60);  // Ännu färre cirklar genereras
      for (let j = 0; j < numCircles; j++) {
        const circle = {
          x: index * barWidth + Math.random() * barWidth, // Slumpmässig x-position inom frekvensens intervall
          y: 80,                           // Starta från toppen (molnets höjd)
          speed: 1 + Math.random() * 2,    // Slumpmässig hastighet mellan 1 och 4
          radius: 3,                       // Alla cirklar har samma storlek
          color: getColorForFrequency(index, analyser.frequencyBinCount)
        };
        allCircles.push(circle);  // Lägg till cirkeln i listan
      }
    }
  
    // Funktion för att rita moln
    function drawCloud() {
      const cloudX = canvas.width / 2;
      const cloudY = 50;
      const cloudRadius = 80;
      
      canvasContext.fillStyle = '#B0C4DE';  // Ljusblå färg för molnet
      canvasContext.beginPath();
      canvasContext.arc(cloudX - 100, cloudY, cloudRadius, 0, Math.PI * 2);  // Vänstra delen av molnet
      canvasContext.arc(cloudX, cloudY - 20, cloudRadius + 30, 0, Math.PI * 2);  // Centern av molnet
      canvasContext.arc(cloudX + 100, cloudY, cloudRadius, 0, Math.PI * 2);  // Högra delen av molnet
      canvasContext.fill();
    }
  
    // Funktion för att uppdatera och rita alla cirklar
    function updateAndDrawCircles() {
      // Loopa över alla cirklar
      for (let i = allCircles.length - 1; i >= 0; i--) {
        const circle = allCircles[i];
  
        // Uppdatera y-positionen
        circle.y += circle.speed;
  
        // Rita cirkeln
        canvasContext.fillStyle = circle.color;
        canvasContext.beginPath();
        canvasContext.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
        canvasContext.fill();
  
        // Om cirkeln når botten, ta bort den
        if (circle.y > canvas.height) {
          allCircles.splice(i, 1);  // Ta bort cirkeln från listan
        }
      }
    }
  
    // Funktion för att rita regn av cirklar baserat på frekvenser
    function draw() {
      requestAnimationFrame(draw);
  
      analyser.getByteFrequencyData(dataArray);
  
      canvasContext.clearRect(0, 0, canvas.width, canvas.height);
  
      // Rita molnet
      drawCloud();
  
      const barWidth = canvas.width / analyser.frequencyBinCount;  // Varje frekvensband har sitt eget segment
  
      // Endast de frekvenser som ger utslag visualiseras
      if (spawnTimer === 0) {  // Skapa cirklar endast när timern är 0
        for (let i = 0; i < analyser.frequencyBinCount; i++) {
          const barHeight = dataArray[i];  // Amplituden (volymen) för frekvensen
  
          // Om frekvensens volym är väldigt låg, hoppa över
          if (barHeight < 30) continue;  // Strängare tröskel för att ignorera svaga frekvenser
  
          // Skapa nya cirklar baserat på volymen
          spawnCircles(i, barHeight, barWidth);
        }
      }
  
      // Hantera spawn rate-timer
      spawnTimer++;
      if (spawnTimer >= spawnInterval) {
        spawnTimer = 0;  // Återställ spawn-timern efter ett visst intervall
      }
  
      // Uppdatera och rita alla cirklar som finns
      updateAndDrawCircles();
    }
  
    // Starta ritloopen
    draw();
  
    // Se till att AudioContext återupptas när ljudet spelas
    audio.onplay = function () {
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
    };
  };