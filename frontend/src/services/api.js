import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api', // Note: in production use relative or env
});

export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const fetchDocuments = async () => {
  const response = await api.get('/documents/');
  return response.data;
};

export const sendChatMessage = async (sessionId, message, imageData = null) => {
  const payload = { session_id: sessionId, message };
  if (imageData) {
    payload.image_data = imageData;
  }
  const response = await api.post('/chat/', payload);
  return response.data;
};

export const fetchAnalytics = async () => {
  const response = await api.get('/analytics/');
  return response.data;
};
