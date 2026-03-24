// Coordenadas aproximadas das RAs de Brasília
const coordinates = {
  "CEILÂNDIA": [-15.818, -48.096],
  "PLANO PILOTO": [-15.79399, -47.88271],
  "SAMAMBAIA": [-15.873, -48.086],
  "TAGUATINGA": [-15.837, -48.056],
  "GAMA": [-16.014, -48.066],
  "SANTA MARIA": [-16.023, -47.987],
  "RECANTO DAS EMAS": [-15.917, -48.102],
  "SOBRADINHO": [-15.65056, -47.78538],
  "PLANALTINA": [-15.61936, -47.65577],
  "RIACHO FUNDO": [-15.882, -48.015],
  "GUARÁ": [-15.810, -47.979],
  "PARANOÁ": [-15.768, -47.779],
  "SÃO SEBASTIÃO": [-15.903, -47.772],
  "BRAZLÂNDIA": [-15.677, -48.201],
  "ÁGUAS CLARAS": [-15.837, -48.027],
  "CANDANGOLÂNDIA": [-15.851, -47.951],
  "NÚCLEO BANDEIRANTE": [-15.872, -47.965],
  "ITAPOÃ": [-15.745, -47.764],
  "CRUZEIRO": [-15.783, -47.935],
  "SCIA/ESTRUTURAL": [-15.78304, -47.98751],
  "VICENTE PIRES": [-15.805, -48.031],
  "VARJÃO": [-15.710, -47.876],
  "LAGO NORTE": [-15.723, -47.873],
  "LAGO SUL": [-15.851, -47.872],
  "PARK WAY": [-15.86420, -47.97193],
  "SUDOESTE": [-15.80076, -47.92425],
  "FERCAL": [-15.601, -47.871],
  "SOL NASCENTE/PÔR DO SOL": [-15.822, -48.129],
  "JARDIM BOTÂNICO": [-15.859, -47.797],
  "ARNIQUEIRA": [-15.85935, -48.01223],
  "SIA": [-15.805, -47.959],
  "SOBRADINHO II": [-15.64461, -47.82623],
  "ARAPOANGA": [-15.6432, -47.6518],
  "ÁGUA QUENTE": [-15.94062, -48.23290],
  "ÁGUAS LINDAS DE GOIÁS(ENTORNO)": [-15.73666, -48.27856],
  "VALPARAÍSO DE GOIÁS (ENTORNO)": [-16.0739, -47.9828],
  "LUZIÂNIA (ENTORNO)": [-16.2473, -47.9382],
  "NOVO GAMA (ENTORNO)": [-16.05052, -48.03034],
  "CIDADE OCIDENTAL (ENTORNO)": [-16.10264, -47.94846],
  "SANTO ANTÔNIO DO DESCOBERTO (ENTORNO)": [-15.94474, -48.26225],
  "FORMOSA (ENTORNO)": [-15.5448, -47.3367]
};

// Inicializar o mapa centrado em Brasília
const map = L.map('map').setView([-15.7999, -47.8640], 11);

// Adicionar camada de mapa (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Layer groups para os círculos
const circlesLayer = L.layerGroup().addTo(map);
const empreendimentosLayer = L.layerGroup().addTo(map);

// Elementos para a lista lateral
const regionListElement = document.getElementById('regionList');
const empreendimentosListElement = document.getElementById('empreendimentosList');

// Auxiliares para destacar seleção
const circlesByRa = {};
let currentSelectedRa = null;

// Armazenar empreendimentos
const empreendimentos = [];
const empreendimentosByNome = {};
let currentSelectedEmpreendimento = null;

const baseCircleStyle = {
  color: 'blue',
  fillColor: 'rgb(25, 0, 255)',
  fillOpacity: 0.5,
  weight: 2
};

const highlightCircleStyle = {
  color: 'gold',
  fillColor: 'rgba(255, 215, 0, 0.5)',
  weight: 4
};

const empreendimentoCircleStyle = {
  color: '#d10b0b',
  fillColor: '#d10b0b',
  fillOpacity: 0.6,
  weight: 2
};

const highlightEmpreendimentoStyle = {
  color: 'red',
  fillColor: 'rgba(255, 0, 0, 0.6)',
  weight: 4
};

function getRadius(quantidade) {
  return Math.sqrt(quantidade) * 35; // Ajuste o multiplicador conforme necessário
}

function parseCSV(csvText) {
  const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes('ra;quantidade') || lower.includes('ra;quantidade')) {
      headerIndex = i;
      break;
    }
  }
  if (headerIndex === -1) return [];

  const data = [];
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const parts = lines[i].split(';');
    if (parts.length >= 2) {
      const ra = parts[0].trim();
      const quantidade = parseInt(parts[1].trim(), 10);
      if (ra && !Number.isNaN(quantidade)) {
        data.push({ ra, quantidade });
      }
    }
  }
  return data;
}

function parseCSVEmpreendimentos(csvText) {
  const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
  let headerIndex = -1;

  // Procura pela linha de cabeçalho
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes('quantidade') && lower.includes('empreendimento') && lower.includes('ra')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) return [];

  const data = [];
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const parts = lines[i].split(';');
    if (parts.length >= 3) {
      const quantidade = parseInt(parts[0].trim(), 10);
      const empreendimento = parts[1].trim();
      const ra = parts[2].trim();

      if (ra && empreendimento && !Number.isNaN(quantidade)) {
        data.push({ quantidade, empreendimento, ra });
      }
    }
  }
  return data;
}

function clearSelection() {
  if (!currentSelectedRa) return;

  const previousCircle = circlesByRa[currentSelectedRa];
  if (previousCircle) {
    previousCircle.setStyle(baseCircleStyle);
  }

  const previousListItem = document.querySelector(`#regionList li[data-ra="${CSS.escape(currentSelectedRa)}"]`);
  if (previousListItem) {
    previousListItem.classList.remove('selected');
  }

  currentSelectedRa = null;
}

function highlightRegion(ra) {
  if (!ra) return;
  clearSelection();

  const circle = circlesByRa[ra];
  if (!circle) return;

  circle.setStyle(highlightCircleStyle);
  circle.bringToFront();
  circle.openPopup();

  const coord = coordinates[ra];
  if (coord) {
    map.setView(coord, Math.max(map.getZoom(), 12));
  }

  const listItem = document.querySelector(`#regionList li[data-ra="${CSS.escape(ra)}"]`);
  if (listItem) {
    listItem.classList.add('selected');
    listItem.scrollIntoView({ block: 'nearest' });
  }

  currentSelectedRa = ra;
}

function clearEmpreendimentoSelection() {
  if (!currentSelectedEmpreendimento) return;

  const previousCircle = empreendimentosByNome[currentSelectedEmpreendimento];
  if (previousCircle) {
    previousCircle.setStyle(empreendimentoCircleStyle);
  }

  const previousListItem = document.querySelector(`#empreendimentosList li[data-empreendimento="${CSS.escape(currentSelectedEmpreendimento)}"]`);
  if (previousListItem) {
    previousListItem.classList.remove('selected');
  }

  currentSelectedEmpreendimento = null;
}

function highlightEmpreendimento(nome) {
  if (!nome) return;
  clearEmpreendimentoSelection();

  const circle = empreendimentosByNome[nome];
  if (!circle) return;

  circle.setStyle(highlightEmpreendimentoStyle);
  circle.bringToFront();
  circle.openPopup();

  // Encontrar as coordenadas do empreendimento
  const emp = empreendimentos.find(e => e.nome === nome);
  if (emp) {
    const coord = coordinates[emp.ra];
    if (coord) {
      map.setView(coord, Math.max(map.getZoom(), 12));
    }
  }

  const listItem = document.querySelector(`#empreendimentosList li[data-empreendimento="${CSS.escape(nome)}"]`);
  if (listItem) {
    listItem.classList.add('selected');
    listItem.scrollIntoView({ block: 'nearest' });
  }

  currentSelectedEmpreendimento = nome;
}

function updateMap(data) {
  circlesLayer.clearLayers();
  regionListElement.innerHTML = '';
  Object.keys(circlesByRa).forEach(key => delete circlesByRa[key]);
  currentSelectedRa = null;

  const sortedData = [...data].sort((a, b) => b.quantidade - a.quantidade);

  // Calcular o total
  const total = sortedData.reduce((sum, item) => sum + item.quantidade, 0);

  // Adicionar item do total
  const totalItem = document.createElement('li');
  totalItem.innerHTML = `<strong>TOTAL</strong><br><span style="font-size:0.9em;">${total.toLocaleString()} candidatos</span>`;
  regionListElement.appendChild(totalItem);

  sortedData.forEach(item => {
    const coord = coordinates[item.ra];
    if (!coord) return;

    const circle = L.circle(coord, {
      ...baseCircleStyle,
      radius: getRadius(item.quantidade)
    }).addTo(circlesLayer);

    circle.bindPopup(`<b>${item.ra}</b><br>Candidatos: ${item.quantidade}`);
    circle.on('click', () => highlightRegion(item.ra));

    circlesByRa[item.ra] = circle;

    const listItem = document.createElement('li');
    listItem.dataset.ra = item.ra;
    listItem.innerHTML = `<strong>${item.ra}</strong><br><span style="font-size:0.9em;">${item.quantidade.toLocaleString()} candidatos</span>`;
    listItem.addEventListener('click', () => highlightRegion(item.ra));

    regionListElement.appendChild(listItem);
  });
}

async function loadEmpreendimentos() {
  try {
    const response = await fetch('RII_ENTIDADE/empreendimentos.csv');
    const csvText = await response.text();
    const data = parseCSVEmpreendimentos(csvText);

    // Limpar layer anterior
    empreendimentosLayer.clearLayers();
    empreendimentos.length = 0;
    Object.keys(empreendimentosByNome).forEach(key => delete empreendimentosByNome[key]);
    empreendimentosListElement.innerHTML = '';
    currentSelectedEmpreendimento = null;

    const sortedData = [...data].sort((a, b) => b.quantidade - a.quantidade);

    // Calcular o total de unidades
    const totalUnidades = sortedData.reduce((sum, item) => sum + item.quantidade, 0);

    // Adicionar item do total
    const totalItem = document.createElement('li');
    totalItem.innerHTML = `<strong>TOTAL</strong><br><span style="font-size:0.9em;">${totalUnidades.toLocaleString()} unidades</span>`;
    empreendimentosListElement.appendChild(totalItem);

    sortedData.forEach(item => {
      const coord = coordinates[item.ra];
      if (!coord) return;

      const radius = Math.sqrt(item.quantidade) * 35; // Raio 
      const circle = L.circle(coord, {
        ...empreendimentoCircleStyle,
        radius: radius
      }).addTo(empreendimentosLayer);

      circle.bindPopup(`<b>${item.empreendimento}</b><br>RA: ${item.ra}<br>Unidades: ${item.quantidade}`);
      circle.on('click', () => highlightEmpreendimento(item.empreendimento));

      empreendimentos.push({
        nome: item.empreendimento,
        ra: item.ra,
        quantidade: item.quantidade,
        circle: circle
      });

      empreendimentosByNome[item.empreendimento] = circle;

      // Adicionar na lista lateral
      const listItem = document.createElement('li');
      listItem.dataset.empreendimento = item.empreendimento;
      listItem.innerHTML = `<strong>${item.empreendimento}</strong><br><span style="font-size:0.9em;">RA: ${item.ra}</span><br><span style="font-size:0.9em;">${item.quantidade.toLocaleString()} unidades</span>`;
      listItem.addEventListener('click', () => highlightEmpreendimento(item.empreendimento));
      empreendimentosListElement.appendChild(listItem);
    });

    document.querySelector('h1').textContent = 'Empreendimentos CODHAB';
  } catch (error) {
    console.error('Erro ao carregar empreendimentos:', error);
  }
}

async function loadData(filename) {
  try {
    const response = await fetch(filename);
    const csvText = await response.text();
    const data = parseCSV(csvText);
    updateMap(data);
    document.querySelector('h1').textContent = `Candidatos Habilitados por região - ${filename.replace('.csv', '')}`;
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
  }
}

// Carregar empreendimentos e dados iniciais
loadEmpreendimentos();
loadData('RII/RII_3SM.csv');