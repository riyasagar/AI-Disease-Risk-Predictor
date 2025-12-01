# Disease Predictor Web Application

This is a full-stack web application that allows users to get potential disease predictions based on their symptoms. The prediction is powered by a machine learning model trained on a comprehensive dataset. The application features secure user authentication, session management, and a personal history of past predictions.

---

## ✨ Features

* **Secure User Authentication:** Users can register for an account and log in securely. Passwords are encrypted using `bcrypt`.
* **Session Management:** The application keeps users logged in as they navigate between pages using `express-session` with a MySQL store.
* **Symptom-Based Prediction:** Logged-in users can select multiple symptoms from a list to get a disease prediction from the machine learning model.
* **Personal Prediction History:** Every prediction is saved to the user's account, and they can view their history on a dedicated page.
* **Account Management:** Users can view their account details (name, email) and securely change their password.
* **RESTful API:** A clear separation between the frontend and backend, with API endpoints for handling predictions, history, and user data.

---

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3, Vanilla JavaScript
* **Backend:** Node.js, Express.js
* **Database:** MySQL
* **Machine Learning:**
    * **Language:** Python
    * **Libraries:** Scikit-learn, Pandas, NumPy, Joblib

---

## 📂 Project Structure

```
disease_predictor_project/
│
├── 📂 backend/
│   └── server.js           # Main Express.js server logic
│
├── 📂 data/
│   ├── Training.csv        # Dataset for training the model
│   └── Testing.csv
│
├── 📂 ml_model/
│   ├── disease_predictor.py # Python script for making predictions
│   ├── best_model.joblib    # The pre-trained ML model
│   └── label_encoder.joblib # The pre-trained label encoder
│
├── 📂 static/
│   ├── 📂 css/
│   │   └── style.css
│   └── 📂 js/
│       ├── account.js
│       └── history.js
│
├── 📂 templates/
│   ├── account.html
│   ├── history.html
│   ├── login.html
│   ├── predictor.html
│   └── register.html
│
├── 📜 package.json          # Node.js project dependencies
├── 📜 README.md             # You are here!
└── 📜 requirements.txt      # Python dependencies
```

---

## 🚀 Setup and Installation

Follow these steps to get the project running on your local machine.

### 1. Prerequisites

* **Node.js:** Make sure you have Node.js installed.
* **Python:** Make sure you have Python installed.
* **MySQL:** A running instance of a MySQL server.

### 2. Clone the Repository

```bash
git clone <your-repository-url>
cd disease_predictor_project
```

### 3. Set Up the Database

1.  Log in to your MySQL client.
2.  Create the database: `CREATE DATABASE disease_predictor;`
3.  Run the SQL script located in `MySQL Table Schema` to create the `users` and `predictions` tables.

### 4. Install Dependencies

1.  **Node.js Dependencies:** Install the required `npm` packages.
    ```bash
    npm install
    ```
2.  **Python Dependencies:** Install the required Python libraries using the `requirements.txt` file.
    ```bash
    pip install -r requirements.txt
    ```

### 5. Configure the Backend

1.  Open the `backend/server.js` file.
2.  Find the `dbOptions` object and update the `user` and `password` fields with your MySQL credentials.

### 6. Run the Application

Start the Node.js server from the main project directory.

```bash
npm start
```

The application should now be running at `http://localhost:3000`.

---

## 📖 Usage

1.  **Register:** Navigate to the registration page and create a new account.
2.  **Login:** Log in with your credentials.
3.  **Predict:** Go to the "Predictor" page, select your symptoms, and click "Predict Disease".
4.  **View History:** Go to the "History" page to see a list of your past predictions.
5.  **Manage Account:** Go to the "Account" page to view your details or change your password.
