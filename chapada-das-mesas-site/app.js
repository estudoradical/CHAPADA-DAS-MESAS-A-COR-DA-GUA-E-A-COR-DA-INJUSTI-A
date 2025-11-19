document.addEventListener("DOMContentLoaded", () => {
  // Troca de abas
  const buttons = document.querySelectorAll(".nav button");
  const tabs = document.querySelectorAll(".tab");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      tabs.forEach(tab => tab.classList.remove("active"));
      document.getElementById(btn.getAttribute("data-tab")).classList.add("active");
    });
  });

  // Animações de rolagem
  const observers = document.querySelectorAll(".fade-zoom");
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.3 });
  observers.forEach(el => observer.observe(el));

  // Monitoramento Arduino
  const connectBtn = document.getElementById("connect");
  const statusEl = document.getElementById("status");
  const uv = document.getElementById("uv");
  const air = document.getElementById("air");
  const humidity = document.getElementById("humidity");
  const tempAir = document.getElementById("tempAir");
  const tempWater = document.getElementById("tempWater");

  let port, reader, keepReading = false;
  let chart, labels = [], dataAir = [], dataTemp = [];

  const ctx = document.getElementById("sensorChart").getContext("2d");
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "Temperatura do Ar (°C)", data: dataTemp, borderColor: "#2eb7b5", borderWidth: 2 },
        { label: "Qualidade do Ar (ppm)", data: dataAir, borderColor: "#e74c3c", borderWidth: 2 }
      ]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });

  async function connectSerial() {
    try {
      port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      statusEl.textContent = "✅ Conectado ao Arduino (porta ativa)";
      const decoder = new TextDecoderStream();
      port.readable.pipeTo(decoder.writable);
      reader = decoder.readable.getReader();
      keepReading = true;
      readLoop();
    } catch (err) {
      statusEl.textContent = "❌ Erro: " + err.message;
    }
  }

  async function readLoop() {
    while (keepReading && reader) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        try {
          const data = JSON.parse(value.trim());
          if (data.uv !== undefined) uv.textContent = data.uv + " lux";
          if (data.air !== undefined) air.textContent = data.air + " ppm";
          if (data.humidity !== undefined) humidity.textContent = data.humidity + "%";
          if (data.tempAir !== undefined) tempAir.textContent = data.tempAir + "°C";
          if (data.tempWater !== undefined) tempWater.textContent = data.tempWater + "°C";

          const now = new Date().toLocaleTimeString();
          labels.push(now);
          dataTemp.push(data.tempAir);
          dataAir.push(data.air);
          if (labels.length > 20) {
            labels.shift(); dataTemp.shift(); dataAir.shift();
          }
          chart.update();
        } catch {}
      }
    }
  }

  connectBtn.addEventListener("click", connectSerial);
});
