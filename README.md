# 🏠 NYC Airbnb Room Type Prediction

A complete Machine Learning project that predicts the **room type of an Airbnb listing in New York City** using listing-related features.

The project includes:

- Exploratory Data Analysis (EDA)
- Data preprocessing
- Machine Learning model training
- Trained model serialization using Joblib
- FastAPI backend
- HTML/CSS/JavaScript frontend
- REST API for making predictions

---

## 📌 Project Overview

The objective of this project is to build a machine learning system that predicts the **room type** of an Airbnb listing based on information such as:

- Location
- Price
- Number of reviews
- Availability
- Minimum nights
- Host/listing information
- Other Airbnb listing features

The trained model is integrated with a **FastAPI backend**, which provides a `/predict` API endpoint. A simple frontend is used to send user inputs to the API and display the prediction.

---

## 🏗️ Project Architecture

```text
                    User
                     │
                     ▼
              ┌─────────────┐
              │  Frontend   │
              │ HTML/CSS/JS │
              └──────┬──────┘
                     │
                     │ HTTP POST Request
                     ▼
              ┌─────────────┐
              │   FastAPI   │
              │   Backend   │
              └──────┬──────┘
                     │
                     ▼
              ┌─────────────┐
              │   Trained   │
              │ ML Model    │
              │   (.pkl)    │
              └──────┬──────┘
                     │
                     ▼
                Prediction
                     │
                     ▼
              ┌─────────────┐
              │  Frontend   │
              │ Displays    │
              │ Prediction  │
              └─────────────┘