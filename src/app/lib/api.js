import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

export const createObjectFromPrompt = async (prompt) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/interpret`, { "prompt": prompt }, { headers: {
            'Content-Type': 'application/json'
    }})
        return response.data;
    } catch (error) {
        console.error("Error creating object: ", error);
    }
}