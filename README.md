# 🌿 Plant Care Management Platform

An AI-powered plant care management platform that combines advanced technologies to deliver intelligent, personalized plant care experiences.

## 🚀 Features

### Core Features
- 📱 Mobile-responsive design
- 🪴 Comprehensive plant management
- 📈 Growth timeline tracking
- 🎯 Personalized care recommendations
- 🌡️ Real-time weather-based care advice

### AI Integration
- 🤖 AI-powered plant care assistant
- 📸 Computer vision plant identification
- 🎵 Personalized plant soundtracks
- 📊 Growth prediction visualization
- 🎮 Interactive AR tutorial system

### Community Features
- 💚 Plant rescue mission board
- 🔄 Plant swap marketplace
- 🌟 Social media milestone sharing
- 👥 Community engagement

## 🛠️ Tech Stack

- **Frontend:**
  - TypeScript + React
  - Tailwind CSS
  - shadcn/ui components
  - TanStack Query
  - Wouter for routing

- **Backend:**
  - Node.js with Express
  - PostgreSQL database
  - Drizzle ORM
  - OpenAI integration
  - WebRTC capabilities

## 🚀 Getting Started

1. **Clone the repository**

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
Create a `.env` file with:
```env
DATABASE_URL=your_postgresql_url
OPENAI_API_KEY=your_openai_api_key
```

4. **Start the development server:**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 📚 API Documentation

### Plant Management
- `GET /api/plants` - List all plants
- `POST /api/plants` - Add a new plant
- `GET /api/plants/:id` - Get plant details
- `PATCH /api/plants/:id` - Update plant
- `DELETE /api/plants/:id` - Delete plant

### Growth Timeline
- `GET /api/plants/:id/timeline` - Get plant timeline
- `POST /api/plants/:id/timeline` - Add timeline entry

### Plant Identification
- `POST /api/identify-plant` - Identify plant from image

### Growth Predictions
- `GET /api/plants/:id/growth-predictions` - Get growth predictions
- `POST /api/plants/:id/generate-prediction` - Generate new prediction

### Rescue Missions
- `GET /api/rescue-missions` - List rescue missions
- `POST /api/rescue-missions` - Create rescue mission
- `GET /api/rescue-missions/:id` - Get mission details
- `POST /api/rescue-missions/:id/responses` - Add response to mission

### Plant Swap Marketplace
- `GET /api/swap-listings` - List swap listings
- `POST /api/swap-listings` - Create swap listing
- `GET /api/swap-listings/:id` - Get listing details

## 📱 Mobile Features

The platform is fully responsive and includes:
- Bottom navigation bar
- Camera integration for plant identification
- AR capabilities for interactive tutorials
- Social sharing integration

## 🔒 Security

- Database security with PostgreSQL
- API key protection
- Input validation with Zod schemas
- Secure file handling

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
