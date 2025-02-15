import axios from "axios";

const API_URL = "http://localhost:8000";

export const fetchMessage = async () => {
  try {
    const response = await axios.get(`${API_URL}/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching message:", error);
    throw error;
  }
};

export const sendData = async (data) => {
  try {
    const response = await axios.post(`${API_URL}/process-data/`, data);
    return response.data;
  } catch (error) {
    console.error("Error sending data:", error);
    throw error;
  }
};
