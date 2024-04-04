
import axios from 'axios';

const instance = axios.create({
 baseURL: 'http://43.204.229.55:8081/v1/invoice/', // replace with your API base URL
  headers: {
    'Content-Type': 'application/json',
    // Add any other default headers here
  },
});

export default instance;
