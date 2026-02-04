import streamlit as st
#mport picklei
import joblib
import numpy as np

#load th emodel 
with open('Road_accident_risk_prediction.pkl','rb') as file:
    model=joblib.load(file)

print(" Model loaded successfully")

#Title for your application
st.title("Sustainability Cheker")

#user inputs
latitude=st.number_input("latitude: ", min_value=0.0, format='%f')
longitude=st.number_input("longitude: ", min_value=0.0, format='%f')
road_type=st.number_input("road_type ", min_value=0.0, format='%f')
lanes=st.number_input("lanes: ", min_value=0.0, format='%f')
speed_limit=st.number_input("speed_limit", min_value=0.0, format='%f')
#speed_limit=st.number_input("speed_limit", min_value=0.0, format='%f')
#Predict
if st.button("Predict"):
    #prepare the inputs for prediction
    input_data = np.array({[latitude, longitude, road_type, lanes, speed_limit]})
    prediction = model.predict(input_data)

    if prediction[0] == 1:
        st.info("Low risk")
    elif prediction[1] ==1:
        st.info("Medium risk")
    else:
        st.info("High risk")