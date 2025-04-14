// URLScanDashboard.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Activity, X, Settings, Sun, Moon, ExternalLink, History, Clock, Search } from 'lucide-react';

const URLScanDashboard = () => {
  // Core state
  const [apiKey, setApiKey] = useState(localStorage.getItem('urlscanApiKey') || '');
  const [showSettings, setShowSettings] = useState(!apiKey);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('urlscanDarkMode') === 'true');
  const [isPaused, setIsPaused] = useState(localStorage.getItem('urlscanPaused') === 'true');
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('live'); // 'live' or 'history'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Live feed state
  const [liveFeedResults, setLiveFeedResults] = useState(() => {
    const savedResults = localStorage.getItem('urlscanResults');
    return savedResults ? JSON.parse(savedResults) : [];
  });
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [newResultsCount, setNewResultsCount] = useState(0);
  const [liveFeedError, setLiveFeedError] = useState(null);
  const liveFeedInterval = useRef(null);
  const seenResults = useRef(new Set());
  
  // Store paused state results
  const pausedResults = useRef(null);
  
  // History state
  const [historyResults, setHistoryResults] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  
  // Selected scan state
  const [selectedScan, setSelectedScan] = useState(null);
  const [scanDetails, setScanDetails] = useState(null);

  // Memoize fetchLiveFeedResults
  const fetchLiveFeedResults = useCallback(async () => {
    setLiveFeedError(null);
    
    try {
      const timeQuery = 'date:>now-3m';
      const url = `http://localhost:3001/api/search?q=${encodeURIComponent(timeQuery)}&size=50`;
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (apiKey) {
        headers['api-key'] = apiKey;
      }
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const newResults = data.results || [];
      
      // Filter unseen results
      const unseenResults = newResults.filter(result => !seenResults.current.has(result._id));
      
      // Add new results to seen set
      unseenResults.forEach(result => seenResults.current.add(result._id));
      
      // Update results
      if (unseenResults.length > 0) {
        setLiveFeedResults(prevResults => [...unseenResults, ...prevResults].slice(0, 100));
        setNewResultsCount(prevCount => prevCount + unseenResults.length);
      }
      
      setLastFetchTime(new Date());
    } catch (err) {
      console.error('Live feed error:', err);
      setLiveFeedError(err.message);
    }
  }, [apiKey]);

  // Memoize startLiveFeed
  const startLiveFeed = useCallback(() => {
    if (isPaused) return; // Don't start if paused
    
    // Clear any existing interval
    if (liveFeedInterval.current) {
      clearInterval(liveFeedInterval.current);
    }
    
    // Reset state but keep results if paused
    seenResults.current = new Set();
    setNewResultsCount(0);
    if (pausedResults.current) {
      setLiveFeedResults(pausedResults.current);
      pausedResults.current = null;
    } else {
      setLiveFeedResults([]);
    }
    
    // Start new interval
    fetchLiveFeedResults();
    liveFeedInterval.current = setInterval(fetchLiveFeedResults, 20000);
  }, [isPaused, fetchLiveFeedResults]);

  // Save results to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('urlscanResults', JSON.stringify(liveFeedResults));
  }, [liveFeedResults]);

  // Save paused state whenever it changes
  useEffect(() => {
    localStorage.setItem('urlscanPaused', isPaused);
  }, [isPaused]);

  // Initial setup
  useEffect(() => {
    // Only start live feed if not paused
    if (!isPaused) {
      startLiveFeed();
    }
    
    // Apply dark mode
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Cleanup
    return () => {
      if (liveFeedInterval.current) {
        clearInterval(liveFeedInterval.current);
      }
    };
  }, [darkMode, isPaused, startLiveFeed]);

  // Save API key
  const saveApiKey = () => {
    localStorage.setItem('urlscanApiKey', apiKey);
    setShowSettings(false);
    startLiveFeed(); // Restart live feed with new API key
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('urlscanDarkMode', newMode);
    
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Toggle pause
  const togglePause = () => {
    setIsPaused(prev => {
      const newPausedState = !prev;
      if (newPausedState) {
        // Pausing - stop everything and store current results
        if (liveFeedInterval.current) {
          clearInterval(liveFeedInterval.current);
          liveFeedInterval.current = null;
        }
        pausedResults.current = liveFeedResults;
        setNewResultsCount(0);
      } else {
        // Resuming - use startLiveFeed to properly reset and start
        startLiveFeed();
      }
      return newPausedState;
    });
  };

  // Fetch scan details
  const fetchScanDetails = async (uuid) => {
    if (!uuid) return;
    
    try {
      const headers = {};
      if (apiKey) {
        headers['API-Key'] = apiKey;
      }
      
      const response = await fetch(`http://localhost:3001/api/result/${uuid}`, { headers });
      
      if (!response.ok) {
        throw new Error(`Error fetching scan details: ${response.status}`);
      }
      
      const data = await response.json();
      setScanDetails(data);
    } catch (err) {
      console.error("Failed to fetch scan details:", err);
      setScanDetails(null);
    }
  };

  // Close details
  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedScan(null);
    setScanDetails(null);
  };

  // Handle scan selection
  const handleSelectScan = (scan) => {
    setSelectedScan(scan);
    fetchScanDetails(scan._id);
    setNewResultsCount(0);
    setShowDetails(true);
  };

  // Fetch history results
  const fetchHistoryResults = async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    
    try {
      let query = '*';
      if (searchQuery.trim()) {
        // Use page.url instead of url, and page.domain instead of domain
        query = searchQuery.includes(':') ? searchQuery : `page.domain:"${searchQuery}" OR page.url:"${searchQuery}"`;
      }
      
      const url = `http://localhost:3001/api/search?q=${encodeURIComponent(query)}&size=100`;
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (apiKey) {
        headers['api-key'] = apiKey;
      }
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setHistoryResults(data.results || []);
    } catch (err) {
      console.error('History fetch error:', err);
      setHistoryError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-blue-600'} text-white p-4 shadow-lg`}>
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">URLScan Live Feed</h1>
            <div className="flex items-center space-x-2 text-sm">
              <Activity size={16} className={isPaused ? '' : 'animate-pulse'} />
              <span>Last update: {lastFetchTime ? new Date(lastFetchTime).toLocaleTimeString() : 'Never'}</span>
              {newResultsCount > 0 && (
                <span className="bg-red-500 px-2 py-0.5 rounded-full text-xs">
                  +{newResultsCount} new
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={togglePause}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                isPaused 
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isPaused ? 'Resume Feed' : 'Pause Feed'}
            </button>
            <button onClick={toggleDarkMode} className="p-2 hover:bg-white/10 rounded-full">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 hover:bg-white/10 rounded-full">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="container mx-auto px-4">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('live')}
              className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'live'
                  ? `${darkMode ? 'border-blue-500 text-blue-500' : 'border-blue-600 text-blue-600'}`
                  : `${darkMode ? 'border-transparent text-gray-400 hover:text-gray-300' : 'border-transparent text-gray-500 hover:text-gray-700'}`
              }`}
            >
              <Activity size={16} className="inline-block mr-2" />
              Live Feed
            </button>
            <button
              onClick={() => {
                setActiveTab('history');
                fetchHistoryResults();
              }}
              className={`py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'history'
                  ? `${darkMode ? 'border-blue-500 text-blue-500' : 'border-blue-600 text-blue-600'}`
                  : `${darkMode ? 'border-transparent text-gray-400 hover:text-gray-300' : 'border-transparent text-gray-500 hover:text-gray-700'}`
              }`}
            >
              <History size={16} className="inline-block mr-2" />
              History
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        {/* Live Feed Content */}
        {activeTab === 'live' && (
          <>
            {liveFeedError && (
              <div className={`mb-4 p-4 rounded ${darkMode ? 'bg-red-900/50 text-red-100' : 'bg-red-100 text-red-800'}`}>
                <p className="flex items-center">
                  <Activity size={16} className="mr-2" />
                  Live feed error: {liveFeedError}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveFeedResults.length === 0 ? (
                <div className={`col-span-full text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <Activity size={32} className="mx-auto mb-4 animate-pulse" />
                  <p>Waiting for new scan results...</p>
                </div>
              ) : (
                liveFeedResults.map((result, index) => (
                  <div
                    key={result._id}
                    onClick={() => handleSelectScan(result)}
                    className={`${
                      darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
                    } rounded-lg shadow-sm p-4 cursor-pointer transition-colors ${
                      index < newResultsCount ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <div className="aspect-video mb-3 bg-gray-100 rounded overflow-hidden">
                      <img
                        src={`https://urlscan.io/screenshots/${result._id}.png`}
                        alt="Screenshot"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f0f0f0' width='100' height='100'/%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-medium truncate" title={result.task?.url}>
                        {result.task?.url || 'Unknown URL'}
                      </h3>
                      <div className="flex items-center justify-between text-sm">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                          {new Date(result.task?.time).toLocaleTimeString()}
                        </span>
                        <a
                          href={`https://urlscan.io/result/${result._id}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={`${
                            darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                          } flex items-center`}
                        >
                          View <ExternalLink size={14} className="ml-1" />
                        </a>
                      </div>
                      {result.page?.country && (
                        <span className={`inline-block px-2 py-0.5 text-xs rounded ${
                          darkMode ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {result.page.country.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* History Content */}
        {activeTab === 'history' && (
          <>
            {/* Search Bar */}
            <div className="mb-4">
              <div className="flex space-x-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by domain or URL (e.g., example.com) or use URLScan.io query syntax"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 placeholder-gray-500'
                    }`}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        fetchHistoryResults();
                      }
                    }}
                  />
                </div>
                <button
                  onClick={fetchHistoryResults}
                  className={`px-4 py-2 rounded-lg ${
                    darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                  } text-white flex items-center`}
                >
                  <Search size={16} className="mr-2" />
                  Search
                </button>
              </div>
              <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Pro tip: Use advanced queries like "domain:example.com", "ip:1.2.3.4", or "country:US"
              </p>
            </div>

            {/* History Error */}
            {historyError && (
              <div className={`mb-4 p-4 rounded ${darkMode ? 'bg-red-900/50 text-red-100' : 'bg-red-100 text-red-800'}`}>
                <p className="flex items-center">
                  <Activity size={16} className="mr-2" />
                  Error: {historyError}
                </p>
              </div>
            )}

            {/* History Results */}
            <div className="space-y-4">
              {historyLoading ? (
                <div className="text-center py-8">
                  <Activity size={32} className="animate-spin mx-auto mb-4" />
                  <p>Loading results...</p>
                </div>
              ) : historyResults.length === 0 ? (
                <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <History size={32} className="mx-auto mb-4" />
                  <p>No results found. Try a different search query.</p>
                </div>
              ) : (
                <div className={`rounded-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
                  {historyResults.map((result, index) => (
                    <div
                      key={result._id}
                      onClick={() => handleSelectScan(result)}
                      className={`p-4 cursor-pointer ${
                        darkMode 
                          ? 'hover:bg-gray-700 border-gray-700' 
                          : 'hover:bg-gray-50 border-gray-200'
                      } ${index !== 0 ? 'border-t' : ''}`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-24 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-900">
                          <img
                            src={`https://urlscan.io/screenshots/${result._id}.png`}
                            alt="Screenshot"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f0f0f0' width='100' height='100'/%3E%3C/svg%3E";
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate" title={result.task?.url}>
                            {result.task?.url || 'Unknown URL'}
                          </h3>
                          <div className="mt-1 flex items-center space-x-4 text-sm">
                            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                              <Clock size={14} className="inline mr-1" />
                              {new Date(result.task?.time).toLocaleString()}
                            </span>
                            {result.page?.country && (
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                darkMode ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {result.page.country.toUpperCase()}
                              </span>
                            )}
                            {result.task?.tags?.map((tag, i) => (
                              <span
                                key={i}
                                className={`px-2 py-0.5 rounded text-xs ${
                                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <a
                            href={`https://urlscan.io/result/${result._id}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={`${
                              darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                            } flex items-center text-sm`}
                          >
                            View <ExternalLink size={14} className="ml-1" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-md w-full p-6`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Settings</h2>
              <button onClick={() => setShowSettings(false)} className="hover:opacity-70">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">URLScan.io API Key</label>
                <div className="flex space-x-2">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key"
                    className={`flex-1 px-3 py-2 rounded border ${
                      darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                    }`}
                  />
                  <button
                    onClick={saveApiKey}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
                <p className="text-sm mt-1 text-gray-500">
                  An API key is required for higher rate limits and access to private scans.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scan Details Modal */}
      {showDetails && selectedScan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col`}>
            <div className="flex justify-between items-center p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold">Scan Details</h2>
              <button onClick={handleCloseDetails} className="hover:opacity-70">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              {!scanDetails ? (
                <div className="flex items-center justify-center py-8">
                  <Activity size={32} className="animate-spin" />
                  <span className="ml-2">Loading details...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Screenshot */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Screenshot</h3>
                    <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                      <img
                        src={`https://urlscan.io/screenshots/${selectedScan._id}.png`}
                        alt="Screenshot"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Basic Information</h3>
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg ${
                      darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                    }`}>
                      <div>
                        <p className="text-sm text-gray-500">URL</p>
                        <p className="font-medium break-all">{scanDetails.page?.url || scanDetails.task?.url}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Domain</p>
                        <p className="font-medium">{scanDetails.page?.domain || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">IP Address</p>
                        <p className="font-medium">{scanDetails.page?.ip || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Country</p>
                        <p className="font-medium">{scanDetails.page?.country || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Server</p>
                        <p className="font-medium">{scanDetails.page?.server || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Scan Time</p>
                        <p className="font-medium">{new Date(scanDetails.task?.time).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Statistics</h3>
                    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4`}>
                      {[
                        { label: 'Total Requests', value: scanDetails.stats?.requests || 0 },
                        { label: 'Unique Domains', value: scanDetails.stats?.domains || 0 },
                        { label: 'Resources', value: scanDetails.stats?.resources || 0 },
                        { label: 'Links Found', value: scanDetails.stats?.links || 0 },
                        { label: 'Unique IPs', value: scanDetails.stats?.uniqIPs || 0 },
                        { label: 'Countries', value: scanDetails.stats?.uniqCountries || 0 },
                        { label: 'ASN', value: scanDetails.page?.asn || 'N/A' },
                        { label: 'ASN Name', value: scanDetails.page?.asnname || 'N/A' }
                      ].map((stat, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}
                        >
                          <p className="text-sm text-gray-500">{stat.label}</p>
                          <p className="text-lg font-medium">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  {scanDetails.task?.tags && scanDetails.task.tags.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {scanDetails.task.tags.map((tag, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 rounded text-sm ${
                              darkMode ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Information */}
                  {scanDetails.verdicts && (
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Security Verdicts</h3>
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Overall Score</p>
                            <p className={`text-lg font-medium ${
                              scanDetails.verdicts.overall.score > 80 ? 'text-red-500' :
                              scanDetails.verdicts.overall.score > 50 ? 'text-yellow-500' :
                              'text-green-500'
                            }`}>
                              {scanDetails.verdicts.overall.score}/100
                            </p>
                          </div>
                          {scanDetails.verdicts.overall.categories?.length > 0 && (
                            <div>
                              <p className="text-sm text-gray-500">Categories</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {scanDetails.verdicts.overall.categories.map((category, index) => (
                                  <span
                                    key={index}
                                    className={`px-2 py-1 rounded text-sm ${
                                      darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {category}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        {scanDetails.verdicts.overall.brands?.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-500 mb-2">Detected Brands</p>
                            <div className="flex flex-wrap gap-2">
                              {scanDetails.verdicts.overall.brands.map((brand, index) => (
                                <span
                                  key={index}
                                  className={`px-2 py-1 rounded text-sm ${
                                    darkMode ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {brand}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4 sticky bottom-0 bg-inherit">
                    <a
                      href={`https://urlscan.io/result/${selectedScan._id}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center px-4 py-2 rounded ${
                        darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                      } text-white`}
                    >
                      View on URLScan.io <ExternalLink size={16} className="ml-2" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default URLScanDashboard;