# URLScan Dashboard

A real-time dashboard for monitoring and analyzing URLScan.io scan results. Built with React and Node.js, featuring live feed updates, historical search, and detailed scan analysis.

![URLScan Dashboard Screenshot](.github/screenshot.png)

## Features

- 🔄 Real-time live feed of URLScan.io results
- 🔍 Advanced search capabilities with URLScan.io query syntax
- 🌓 Dark/Light mode support
- 📊 Detailed scan analysis with screenshots and security verdicts
- 🔐 API key integration for higher rate limits
- ⏸️ Pause/Resume live feed functionality
- 📱 Responsive design for all devices

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- URLScan.io API key (optional, but recommended)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/urlscan-dashboard.git
   cd urlscan-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory (optional):
   ```
   PORT=3001
   ```

## Usage

1. Start the backend server:
   ```bash
   node server.js
   ```

2. In a new terminal, start the frontend development server:
   ```bash
   npm start
   # or
   yarn start
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Setting Up Your API Key

1. Get your API key from [URLScan.io](https://urlscan.io/user/apikey/)
2. In the dashboard:
   - Click the Settings icon
   - Enter your API key
   - Click Save

## Search Syntax

The dashboard supports URLScan.io's query syntax:

- Basic search: Enter a domain or URL
- Advanced queries:
  - `page.domain:"example.com"`
  - `page.url:"https://example.com"`
  - `country:US`
  - `ip:1.2.3.4`
  - `asn:AS123456`
  - Multiple conditions: `country:US AND server:nginx`

## Development

### Project Structure

```
urlscan-dashboard/
├── src/
│   ├── components/
│   │   └── URLScanDashboard.js
│   ├── App.js
│   └── index.js
├── server.js
├── package.json
└── README.md
```

### Environment Variables

- `PORT`: Backend server port (default: 3001)

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [URLScan.io](https://urlscan.io) for their excellent API
- [React](https://reactjs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)
