// ============================================================
// NYC Airbnb Room Type Predictor
// Change API_BASE_URL if your FastAPI server is deployed.
// ============================================================
const API_BASE_URL = "http://127.0.0.1:8000";

const form = document.getElementById("predictForm");
const predictBtn = document.getElementById("predictBtn");
const errorMsg = document.getElementById("errorMsg");
const fillDemo = document.getElementById("fillDemo");
const resetBtn = document.getElementById("resetBtn");
const newPrediction = document.getElementById("newPrediction");

const emptyState = document.getElementById("emptyState");
const predictionState = document.getElementById("predictionState");
const predictionText = document.getElementById("predictionText");
const topProbability = document.getElementById("topProbability");
const confidenceText = document.getElementById("confidenceText");
const confidenceBar = document.getElementById("confidenceBar");
const probabilityList = document.getElementById("probabilityList");

const demoData = {
  neighbourhood_group: "Brooklyn",
  neighbourhood: "Williamsburg",
  latitude: 40.7181,
  longitude: -73.9571,
  price: 150,
  minimum_nights: 3,
  number_of_reviews: 85,
  reviews_per_month: 2.5,
  calculated_host_listings_count: 2,
  availability_365: 220
};

function setValue(id, value) {
  document.getElementById(id).value = value;
}

function getNumber(id) {
  return Number(document.getElementById(id).value);
}

function buildPayload() {
  return {
    neighbourhood_group: document.getElementById("neighbourhood_group").value.trim(),
    neighbourhood: document.getElementById("neighbourhood").value.trim(),
    latitude: getNumber("latitude"),
    longitude: getNumber("longitude"),
    price: getNumber("price"),
    minimum_nights: getNumber("minimum_nights"),
    number_of_reviews: getNumber("number_of_reviews"),
    reviews_per_month: getNumber("reviews_per_month"),
    calculated_host_listings_count: getNumber("calculated_host_listings_count"),
    availability_365: getNumber("availability_365")
  };
}

function validatePayload(data) {
  if (!data.neighbourhood_group || !data.neighbourhood) {
    return "Please enter both neighbourhood fields.";
  }

  if (data.latitude < -90 || data.latitude > 90 || Number.isNaN(data.latitude)) {
    return "Latitude must be between -90 and 90.";
  }

  if (data.longitude < -180 || data.longitude > 180 || Number.isNaN(data.longitude)) {
    return "Longitude must be between -180 and 180.";
  }

  if (data.price < 0 || data.minimum_nights < 1 || data.number_of_reviews < 0 ||
      data.reviews_per_month < 0 || data.calculated_host_listings_count < 0 ||
      data.availability_365 < 0 || data.availability_365 > 365) {
    return "Please check the numeric values.";
  }

  return "";
}

function prettyRoomType(value) {
  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function resetResults() {
  predictionState.classList.add("hidden");
  emptyState.classList.remove("hidden");
  probabilityList.innerHTML = "";
  confidenceBar.style.width = "0%";
  errorMsg.textContent = "";
}

function showError(message) {
  errorMsg.textContent = message;
}

function renderResult(result) {
  const predicted = result.Predicted_Room_Type;
  const probabilities = Array.isArray(result.Probability) ? result.Probability : [];

  predictionText.textContent = prettyRoomType(predicted);

  // The FastAPI response currently returns only probability values, not class labels.
  // Most sklearn classifiers expose classes_ in the model. If labels are not returned,
  // use the standard NYC Airbnb room-type order as a UI fallback.
  const fallbackLabels = ["Entire home/apt", "Private room", "Shared room", "Hotel room"];
  const labels = probabilities.map((_, i) => fallbackLabels[i] || `Class ${i + 1}`);

  const ranked = probabilities
    .map((value, index) => ({
      label: labels[index],
      value: Number(value) || 0
    }))
    .sort((a, b) => b.value - a.value);

  const top = ranked[0] || { value: 0 };
  const topPct = Math.max(0, Math.min(100, top.value * 100));

  topProbability.textContent = `${topPct.toFixed(1)}%`;
  confidenceText.textContent =
    topPct >= 80 ? "High confidence" :
    topPct >= 60 ? "Moderate confidence" :
    "Lower confidence";

  emptyState.classList.add("hidden");
  predictionState.classList.remove("hidden");

  requestAnimationFrame(() => {
    confidenceBar.style.width = `${topPct}%`;
  });

  probabilityList.innerHTML = ranked.map(item => {
    const pct = Math.max(0, Math.min(100, item.value * 100));
    return `
      <div class="prob-row">
        <div class="prob-label">${escapeHtml(item.label)}</div>
        <div class="prob-value">${pct.toFixed(1)}%</div>
        <div class="mini-track">
          <div class="mini-fill" style="width:${pct}%"></div>
        </div>
      </div>
    `;
  }).join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

fillDemo.addEventListener("click", () => {
  Object.entries(demoData).forEach(([key, value]) => setValue(key, value));
  errorMsg.textContent = "";
});

resetBtn.addEventListener("click", () => {
  form.reset();
  resetResults();
});

newPrediction.addEventListener("click", () => {
  resetResults();
  document.querySelector(".form-card").scrollIntoView({ behavior: "smooth", block: "center" });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError("");

  const data = buildPayload();
  const validationError = validatePayload(data);

  if (validationError) {
    showError(validationError);
    return;
  }

  predictBtn.disabled = true;
  predictBtn.classList.add("loading");

  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    let result = {};
    try {
      result = await response.json();
    } catch {
      throw new Error("The API returned an invalid response.");
    }

    if (!response.ok) {
      const detail = result.detail
        ? (Array.isArray(result.detail)
            ? result.detail.map(x => x.msg).join(" ")
            : result.detail)
        : `API request failed (${response.status}).`;
      throw new Error(detail);
    }

    if (result.Predicted_Room_Type === undefined) {
      throw new Error("The API response is missing Predicted_Room_Type.");
    }

    renderResult(result);
  } catch (error) {
    if (error instanceof TypeError) {
      showError("Could not connect to FastAPI. Start Uvicorn and make sure the API is running on port 8000.");
    } else {
      showError(error.message || "Something went wrong while predicting.");
    }
  } finally {
    predictBtn.disabled = false;
    predictBtn.classList.remove("loading");
  }
});
