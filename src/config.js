const apiUrl = process.env.NODE_ENV === 'production'
    ? 'http://54.219.34.238'
    : 'http://localhost:3000';

export default apiUrl;