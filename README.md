# URLScan Dashboard

### Why ?
The live feed on Urlscan.io is restricted to 16 screenshots at a time, while my dashboard continuously displays all scanned websites along with historical scan data visualization.

![LiveFeed](https://github.com/user-attachments/assets/e3a58e34-c4c1-42bd-b22c-91eff853795e)
![Details](https://github.com/user-attachments/assets/47540b5a-3cf6-4475-afcf-381d0be68cbf)

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

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| REACT_APP_URLSCAN_API_KEY | Your URLScan.io API key | Yes |


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [URLScan.io](https://urlscan.io) for their excellent API
- [React](https://reactjs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)
