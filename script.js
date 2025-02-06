// Initialiser la carte Leaflet
var map = L.map('map', {
    center: [43.592785743777796, 1.1282534121094123],
    zoom: 10,
    layers: []
});

// Centrage sur la zone d'étude avec les coordonnées récupérées dans GEOSERVER
var bounds = [[43.2374, 0.5244], [43.9234, 1.8893]];
map.fitBounds(bounds);

// Gestion de l'introduction
document.getElementById("startButton").addEventListener("click", function () {
    let introOverlay = document.getElementById("introOverlay");
    introOverlay.style.opacity = "0";
    setTimeout(() => {
        introOverlay.style.display = "none";
    }, 500);
});


// Ajout d'une échelle dynamique
L.control.scale({ position: 'bottomleft', metric: true, imperial: false }).addTo(map);

// Ajout d'une flèche nord
var north = L.control({ position: "bottomleft" });
north.onAdd = function (map) {
    var div = L.DomUtil.create("div", "info legend");
    div.innerHTML = '<img src="images/arrow.png" style="width: 30px; height: 30px;">';
    return div;
}
north.addTo(map);

// Déclaration de la couche active
var currentLayer = null;

// Définition des fonds de carte
var baseMaps = {
    "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }),
    "Satellite": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '© Esri' }),
    "Gris clair": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', { attribution: '© Esri' })
};

// Ajout du fond OpenStreetMap par défaut
baseMaps["OpenStreetMap"].addTo(map);

// Ajout de l'emprise d'étude (toujours visible)
var empriseEtude = L.tileLayer.wms("https://www.geotests.net/geoserver/romainb/wms?", {
    layers: "romainb:emprise_etude",
    format: "image/png",
    transparent: true
}).addTo(map);

// Définition des couches WMS
var layers = {
    essences: L.tileLayer.wms("https://www.geotests.net/geoserver/romainb/wms?", {
        layers: "romainb:carte_essences_echelle_pixel",
        format: "image/png",
        transparent: true
    }),
    ndvi_02_22: L.tileLayer.wms("https://www.geotests.net/geoserver/romainb/wms?", {
        layers: "romainb:Serie_temp_S2_ndvi_02_2022",
        format: "image/png",
        transparent: true
    }),
    ndvi_03_22: L.tileLayer.wms("https://www.geotests.net/geoserver/romainb/wms?", {
        layers: "romainb:Serie_temp_S2_ndvi_03_2022",
        format: "image/png",
        transparent: true
    }),
    ndvi_04_22: L.tileLayer.wms("https://www.geotests.net/geoserver/romainb/wms?", {
        layers: "romainb:Serie_temp_S2_ndvi_04_2022",
        format: "image/png",
        transparent: true
    }),
    ndvi_07_22: L.tileLayer.wms("https://www.geotests.net/geoserver/romainb/wms?", {
        layers: "romainb:Serie_temp_S2_ndvi_07_2022",
        format: "image/png",
        transparent: true
    }),
    ndvi_09_22: L.tileLayer.wms("https://www.geotests.net/geoserver/romainb/wms?", {
        layers: "romainb:Serie_temp_S2_ndvi_09_2022",
        format: "image/png",
        transparent: true
    }),
    ndvi_11_22: L.tileLayer.wms("https://www.geotests.net/geoserver/romainb/wms?", {
        layers: "romainb:Serie_temp_S2_ndvi_11_2022",
        format: "image/png",
        transparent: true
    }),
    masque_foret: L.tileLayer.wms("https://www.geotests.net/geoserver/romainb/wms?", {
        layers: "romainb:masque_foret",
        format: "image/png",
        transparent: true
    }),
};

// Message d'erreur chargement de la couche
Object.values(layers).forEach(layer => {
    layer.on("tileerror", function () {
        console.warn('Impossible de charger la couche WMS : ${layer.wmsParams.layers}');
    });
});


// Fonction pour mettre à jour le titre et la description de la couche sélectionnée
function updateLayerInfo(layerName) {
    var infoContainer = document.getElementById("layerInfo");
    var titleElement = document.getElementById("layerTitle");
    var descriptionElement = document.getElementById("layerDescription");

    // Si aucune couche n'est sélectionnée, cacher le bloc d'information
    if (!layerName) {
        infoContainer.style.display = "none";
        return;
    }

    // Supprimer le préfixe "romainb:" s'il est présent
    if (layerName.startsWith("romainb:")) {
        layerName = layerName.replace("romainb:", "");
    }

    // Définition des titres et descriptions des couches
    var layerDescriptions = {
        essences: {
            title: "Carte des essences forestières",
            description: "Cette carte montre la répartition des différentes essences d'arbres sur la zone d'étude, classées en fonction des données de télédétection."
        },
        ndvi: {
            title: "Carte NDVI (Indice de Végétation)",
            description: "L'indice NDVI permet d'analyser la densité et la santé de la végétation à différentes périodes de l'année."
        },
        masque_foret: {
            title: "Masque Forêt",
            description: "Cette carte identifie les zones boisées et non boisées pour mieux analyser la couverture végétale."
        }
    };

    // Vérification pour les NDVI
    if (layerName.startsWith("ndvi")) {
        titleElement.textContent = layerDescriptions.ndvi.title;
        descriptionElement.textContent = layerDescriptions.ndvi.description;
        infoContainer.style.display = "block";
        return;
    }

    // Mise à jour du titre et de la description pour les autres couches
    if (layerDescriptions[layerName]) {
        titleElement.textContent = layerDescriptions[layerName].title;
        descriptionElement.textContent = layerDescriptions[layerName].description;
        infoContainer.style.display = "block";
    } else {
        infoContainer.style.display = "none"; // Cacher si aucune info disponible
    }
}

// Fonction pour mettre à jour la légende
function updateLegend(layerName) {
    var legendImg = document.getElementById("legendImage");

    if (!legendImg) return;

    // Si la couche est un NDVI, toujours afficher la légende de février 2022
    var legendLayer = layerName.startsWith("romainb:Serie_temp_S2_ndvi")
        ? "romainb:Serie_temp_S2_ndvi_02_2022"
        : layerName;

    var legendUrl = `https://www.geotests.net/geoserver/romainb/wms?REQUEST=GetLegendGraphic&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=${legendLayer}`;

    console.log("Légende mise à jour :", legendUrl);

    legendImg.src = legendUrl;
    document.getElementById("legendContainer").style.display = "block";
}


// Cacher la légende au départ
document.getElementById("legendContainer").style.display = "none";

// Gérer la sélection de la couche principale
document.getElementById("layerSelector").addEventListener("change", function (e) {
    var selectedLayer = e.target.value;

    // Supprimer la couche actuelle si elle existe
    if (currentLayer) {
        map.removeLayer(currentLayer);
    }

    document.getElementById("infoContainer").style.display = "none";

    // Si aucune couche n'est sélectionnée
    if (!selectedLayer) {
        document.getElementById("legendContainer").style.display = "none";
        document.getElementById("ndviSelector").style.display = "none";
        document.getElementById("ndviLabel").style.display = "none";
        document.getElementById("infoContainer").style.display = "none";
        currentLayer = null;
        updateLayerInfo(null);
        return;
    }

    // Cacher la légende si aucune couche n'est sélectionnée
    if (!selectedLayer) {
        document.getElementById("legendContainer").style.display = "none";
        return;
    }
    if (selectedLayer === "ndvi") {
        document.getElementById("ndviSelector").style.display = "inline";
        document.getElementById("ndviLabel").style.display = "inline";
        document.getElementById("ndviSelector").value = "ndvi_02_22";
        currentLayer = layers.ndvi_02_22;
        updateLegend("romainb:Serie_temp_S2_ndvi_02_2022");
    } else {
        document.getElementById("ndviSelector").style.display = "none";
        document.getElementById("ndviLabel").style.display = "none";
        currentLayer = layers[selectedLayer];

        if (selectedLayer === "essences") {
            updateLegend("romainb:carte_essences_echelle_pixel");
        } else {
            updateLegend(`romainb:${selectedLayer}`);
        }
    }

    // Ajouter la couche sélectionnée à la carte et s'assurer qu'elle est bien visible
    map.addLayer(currentLayer);
    currentLayer.bringToFront();

    // Mise à jour du titre et de la description en plus de la légende
    updateLayerInfo(selectedLayer);

});

// S'assurer que la couche active reste visible après un changement de fond de carte
map.on('baselayerchange', function () {
    empriseEtude.bringToFront();
    if (currentLayer) {
        map.addLayer(currentLayer);
        currentLayer.bringToFront();
    }
});
// Gérer la sélection des dates NDVI
document.getElementById("ndviSelector").addEventListener("change", function (e) {
    var selectedDate = e.target.value;

    if (currentLayer) {
        map.removeLayer(currentLayer);
    }

    currentLayer = layers[selectedDate];

    if (!map.hasLayer(currentLayer)) {
        map.addLayer(currentLayer);
    }

    currentLayer.bringToFront();

    // Cacher l'onglet "Informations" au changement de date NDVI
    document.getElementById("infoContainer").style.display = "none"; 

    // Toujours afficher la légende de février 2022
    updateLegend("romainb:Serie_temp_S2_ndvi_02_2022");
});


// Ajouter un contrôle des fonds de carte
L.control.layers(baseMaps, {}, { collapsed: true, position: 'topright' }).addTo(map);

// S'assurer que les couches restent au premier plan
map.on('baselayerchange', function () {
    empriseEtude.bringToFront();
    if (currentLayer) currentLayer.bringToFront();
});

// Correspondances des valeurs de pixels pour l'affichage
const pixelDescriptions = {
    masque_foret: {
        0: "Hors forêt",
        1: "Forêt"
    },
    essences: {
        0: "Hors forêt",
        11: "Autres feuillus",
        12: "Chêne",
        13: "Robinier",
        14: "Peupleraie",
        21: "Autres conifères (hors pin)",
        22: "Autres pins",
        23: "Douglas",
        24: "Pin laricio ou pin noir",
        25: "Pin maritime"
    }
};

// Correspondance des bandes NDVI avec les dates et noms de couche
const ndviLayers = {
    "Serie_temp_S2_ndvi_02_2022": "Band1",
    "Serie_temp_S2_ndvi_03_2022": "Band2",
    "Serie_temp_S2_ndvi_04_2022": "Band3",
    "Serie_temp_S2_ndvi_07_2022": "Band4",
    "Serie_temp_S2_ndvi_09_2022": "Band5",
    "Serie_temp_S2_ndvi_11_2022": "Band6"
};

// Description des valeurs NDVI
const ndviDescriptions = [
    { min: 0, max: 0, label: "Pas de végétation" },
    { min: 0, max: 0.25, label: "Végétation basse" },
    { min: 0.25, max: 0.50, label: "Végétation moyenne" },
    { min: 0.50, max: 0.75, label: "Végétation forte" },
    { min: 0.75, max: Infinity, label: "Végétation dense" }
];


// Intéractivité
map.on('click', function (e) {
    if (!currentLayer) return;

    var wmsUrl = currentLayer._url;
    var wmsParams = currentLayer.wmsParams;
    
    var url = `${wmsUrl}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&LAYERS=${wmsParams.layers}` +
              `&QUERY_LAYERS=${wmsParams.layers}&BBOX=${map.getBounds().toBBoxString()}` +
              `&FEATURE_COUNT=1&SRS=EPSG:4326&INFO_FORMAT=application/json&TILED=false` +
              `&WIDTH=${map.getSize().x}&HEIGHT=${map.getSize().y}&X=${Math.round(e.containerPoint.x)}` +
              `&Y=${Math.round(e.containerPoint.y)}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            var infoContainer = document.getElementById("infoContainer");
            var infoBox = document.getElementById("infoBox");

            if (data.features && data.features.length > 0) {
                var feature = data.features[0];
                var properties = feature.properties;
                var infoContent = ``;

                for (var key in properties) {
                    let value = properties[key];

                    // Si c'est "masque_foret", affichage spécial
                    if (wmsParams.layers.includes("masque_foret") && key === "GRAY_INDEX") {
                        let description = pixelDescriptions.masque_foret[value] || `Valeur inconnue`;
                        infoContent += `<b>Valeur du pixel :</b> ${value} (${description}) <br>`;
                    } 
                    // Si c'est "essences", affichage spécial
                    else if (wmsParams.layers.includes("carte_essences") && key === "GRAY_INDEX") {
                        let description = pixelDescriptions.essences[value] || `Essence inconnue`;
                        infoContent += `<b>Valeur du pixel :</b> ${value} (${description}) <br>`;
                    } 
                    // Gestion spécifique pour NDVI : afficher uniquement la bande NDVI correspondant à la couche active
                    else if (wmsParams.layers.includes("Serie_temp_S2_ndvi")) {
                        let selectedLayer = Object.keys(ndviLayers).find(layer => wmsParams.layers.includes(layer));
                        let selectedBand = ndviLayers[selectedLayer];

                        if (key === selectedBand) {
                            let ndviValue = parseFloat(value);
                            let vegetationType = ndviDescriptions.find(range => ndviValue > range.min && ndviValue <= range.max)?.label || "Valeur inconnue";

                            infoContent += `<b>Date :</b> ${selectedLayer.split("_").slice(-2).join("/")} <br>`;
                            infoContent += `<b>Valeur du pixel :</b> ${ndviValue.toFixed(4)} (${vegetationType}) <br>`;
                        }
                    }
                    // Cas général
                    else {
                        infoContent += `<b>${key}:</b> ${value} <br>`;
                    }
                }

                infoBox.innerHTML = infoContent;
                infoContainer.style.display = "block";  
            } else {
                infoBox.innerHTML = "Aucune information disponible.";
                infoContainer.style.display = "block";  
            }
        })
        .catch(error => console.error("Erreur GetFeatureInfo WMS:", error));
});






