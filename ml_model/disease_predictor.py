import pandas as pd
import numpy as np
import joblib
import sys
import os

# --- Global variables to hold the loaded model and data ---
# This prevents reloading from disk on every prediction.
model = None
encoder = None
all_symptoms = None

def load_model_and_data():
    """
    Loads the model, encoder, and training data columns into global variables.
    This function is called only once when the script starts.
    """
    global model, encoder, all_symptoms
    
    try:
        # Get the directory where this script is located (ml_model)
        script_dir = os.path.dirname(__file__)
        
        # Define paths based on your folder structure
        model_path = os.path.join(script_dir, 'best_model.joblib')
        encoder_path = os.path.join(script_dir, 'label_encoder.joblib')
        training_data_path = os.path.join(script_dir, '../data/Training.csv')

        # Load all necessary files
        model = joblib.load(model_path)
        encoder = joblib.load(encoder_path)
        df_train = pd.read_csv(training_data_path)
        
        # Prepare the feature list from the training data
        if 'Unnamed: 133' in df_train.columns:
            df_train = df_train.drop('Unnamed: 133', axis=1)
        all_symptoms = df_train.drop('prognosis', axis=1).columns.tolist()

    except FileNotFoundError as e:
        print(f"Error: A required file was not found. {e}", file=sys.stderr)
        sys.exit(1)

def predict_disease(symptom_string):
    """
    Takes a comma-separated string of symptoms and predicts the disease
    using the pre-loaded model and data.
    """
    # Create an input vector based on the user's symptoms
    input_vector = np.zeros(len(all_symptoms))
    user_symptoms = [s.strip().lower().replace(" ", "_") for s in symptom_string.split(',')]

    for symptom in user_symptoms:
        if symptom in all_symptoms:
            index = all_symptoms.index(symptom)
            input_vector[index] = 1

    # Create a DataFrame for prediction
    input_df = pd.DataFrame([input_vector], columns=all_symptoms)

    # Predict and decode the result
    predicted_code = model.predict(input_df)[0]
    predicted_disease = encoder.inverse_transform([predicted_code])[0]

    return predicted_disease

# This is the main execution block that runs when called from Node.js
if __name__ == '__main__':
    # Load the model and data once at the start
    load_model_and_data()
    
    if len(sys.argv) > 1:
        symptom_input = sys.argv[1]
        prediction = predict_disease(symptom_input)
        # Print the final result for Node.js to capture
        print(prediction)
    else:
        print("Error: No symptoms provided to the script.", file=sys.stderr)
        sys.exit(1)

