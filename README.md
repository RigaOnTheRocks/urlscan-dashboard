# URLScan Dashboard

A modern dashboard for monitoring and analyzing URLScan.io data.

## Features

- Real-time URL scanning
- Historical scan data visualization
- Interactive dashboard interface
- API integration with URLScan.io

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose (optional, for containerized deployment)
- URLScan.io API key

## Getting Started

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/urlscan-dashboard.git
   cd urlscan-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your URLScan.io API key:
   ```
   REACT_APP_URLSCAN_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`.

### Docker Deployment

1. Build and start the containers:
   ```bash
   docker-compose up --build
   ```

2. To run in detached mode:
   ```bash
   docker-compose up -d --build
   ```

3. To stop the containers:
   ```bash
   docker-compose down
   ```

The application will be available at:
- Frontend: http://localhost
- Backend API: http://localhost/api

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| REACT_APP_URLSCAN_API_KEY | Your URLScan.io API key | Yes |

## Project Structure

```
urlscan-dashboard/
├── src/                 # Frontend source code
├── public/             # Static files
├── server.js           # Backend server
├── Dockerfile          # Frontend Docker configuration
├── Dockerfile.backend  # Backend Docker configuration
├── docker-compose.yml  # Docker Compose configuration
└── nginx.conf          # Nginx configuration
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [URLScan.io](https://urlscan.io) for their excellent API
- [React](https://reactjs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)
