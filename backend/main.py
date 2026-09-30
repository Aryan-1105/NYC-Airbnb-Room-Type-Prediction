import joblib
import pandas as pd

from fastapi import FastAPI
from pydantic import BaseModel, Field

from fastapi.middleware.cors import CORSMiddleware


# ============================================================
# FastAPI App
# ============================================================

app = FastAPI(
    title="NYC Airbnb Room Type Prediction API",
    description="API for predicting the room type of an NYC Airbnb listing.",
    version="1.0.0"
)

# ============================================================
# CORS Configuration
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Model Columns
# ============================================================

Columns = [
    "neighbourhood_group",
    "neighbourhood",
    "latitude",
    "longitude",
    "price",
    "minimum_nights",
    "number_of_reviews",
    "reviews_per_month",
    "calculated_host_listings_count",
    "availability_365"
]


# ============================================================
# Load Model
# ============================================================

model = joblib.load("airbnb_model.pkl")


# ============================================================
# Pydantic Input Model
# ============================================================

class AirbnbInput(BaseModel):
    """
    Input features required for the NYC Airbnb
    room type prediction model.
    """

    neighbourhood_group: str = Field(
        ...,
        min_length=1,
        description="The borough or neighbourhood group where the Airbnb listing is located."
    )

    neighbourhood: str = Field(
        ...,
        min_length=1,
        description="The specific neighbourhood where the Airbnb listing is located."
    )

    latitude: float = Field(
        ...,
        ge=-90,
        le=90,
        description="The geographical latitude of the Airbnb listing."
    )

    longitude: float = Field(
        ...,
        ge=-180,
        le=180,
        description="The geographical longitude of the Airbnb listing."
    )

    price: float = Field(
        ...,
        ge=0,
        description="The nightly price of the Airbnb listing."
    )

    minimum_nights: int = Field(
        ...,
        ge=1,
        description="The minimum number of nights required for a booking."
    )

    number_of_reviews: int = Field(
        ...,
        ge=0,
        description="The total number of reviews received by the listing."
    )

    reviews_per_month: float = Field(
        ...,
        ge=0,
        description="The average number of reviews received by the listing per month."
    )

    calculated_host_listings_count: int = Field(
        ...,
        ge=0,
        description="The total number of listings managed by the host."
    )

    availability_365: int = Field(
        ...,
        ge=0,
        le=365,
        description="The number of days the listing is available for booking during the next 365 days."
    )


# ============================================================
# Home Endpoint
# ============================================================

@app.get("/")
def greet():
    return {
        "message": "Welcome to the NYC Room Type Prediction Service"
    }


# ============================================================
# Prediction Endpoint
# ============================================================

@app.post("/predict")
def predict(features: AirbnbInput):

    # Convert Pydantic model to dictionary
    data = features.model_dump()

    # Create one-row DataFrame
    row = pd.DataFrame(
        [data],
        columns=Columns
    )

    # Make prediction
    prediction = model.predict(row)

    # Predict probabilities
    probability = model.predict_proba(row)

    return {
        "Predicted_Room_Type": prediction[0],
        "Probability": probability[0].tolist()
    }