import axios from "axios";

const API_BASE = "http://localhost:3000";

export async function sendMessage(message: string): Promise<string> {
  const response = await axios.post(`${API_BASE}/api/chat`, { message });
  return response.data.response;
}
