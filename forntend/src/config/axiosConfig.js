
import axios from 'axios';

const instance = axios.create({
 baseURL: 'http://13.126.76.196:8081/v1/invoice/', // replace with your API base URL
  headers: {
    'Content-Type': 'application/json',
    // Add any other default headers here
  },
});

export default instance;
