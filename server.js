const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Proxy for search API
app.get('/api/search', async (req, res) => {
  try {
    const apiKey = req.headers['api-key'];
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (apiKey) {
      headers['API-Key'] = apiKey;
    }
    
    // Pass all query parameters directly to URLScan API
    const response = await axios.get(`https://urlscan.io/api/v1/search/`, {
      params: req.query,
      headers
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Search API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data?.message || error.message 
    });
  }
});

// Proxy for result API
app.get('/api/result/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const apiKey = req.headers['api-key'];
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (apiKey) {
      headers['API-Key'] = apiKey;
    }
    
    const response = await axios.get(`https://urlscan.io/api/v1/result/${uuid}/`, { headers });
    
    res.json(response.data);
  } catch (error) {
    console.error('Result API error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data?.message || error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});