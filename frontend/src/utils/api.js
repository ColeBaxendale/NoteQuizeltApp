import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5001',
    withCredentials: true, // Ensures cookies are sent with requests
});

export default API;