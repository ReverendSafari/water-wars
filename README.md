# 💧 Water Wars

A fun and competitive water intake tracking app for Safari and Brielle! Every day is a new battle to see who can drink the most water. The app features animated water jugs, real-time tracking, and daily winner calculations.

![Water Wars](https://via.placeholder.com/800x400/ec4899/ffffff?text=Water+Wars)

## 🎯 Features

- **Daily Water Tracking**: Add water intake throughout the day
- **Real-time Competition**: See who's winning in real-time
- **Animated Water Jugs**: Beautiful visual representation of water levels
- **Daily Timer**: Countdown to midnight when the day resets
- **Historical Stats**: Track total water intake and wins over time
- **Simple Login**: Easy access for Safari and Brielle
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🏗️ Architecture

- **Frontend**: React with Framer Motion animations
- **Backend**: Node.js/Express API
- **Database**: SQLite for simple deployment
- **Styling**: CSS with pink and blue theme (Brielle's favorite colors!)

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

The frontend will run on `http://localhost:3000`

### Backend Setup
```bash
cd backend
npm install
npm start
```

The backend will run on `http://localhost:3001`

## 📱 Usage

### Login
- **Safari**: username: `safari`, password: `water123`
- **Brielle**: username: `brielle`, password: `water123`

### Adding Water
1. Click "Add Water" button
2. Choose from preset amounts (4, 8, 12, 16, 20 oz) or enter custom amount
3. Click "Add [amount] oz" to save

### Viewing Stats
- See today's progress in the animated water jugs
- Check historical stats in the Battle Statistics section
- View total water intake and days won for each player

## 🗄️ Database Schema

### water_entries
- `id`: Primary key
- `player`: 'safari' or 'brielle'
- `amount`: Water amount in oz
- `date`: Date in YYYY-MM-DD format
- `created_at`: Timestamp

### daily_winners
- `id`: Primary key
- `player`: Winner of the day
- `date`: Date in YYYY-MM-DD format
- `total_amount`: Total water consumed by winner
- `created_at`: Timestamp

## 🌐 API Endpoints

### GET `/api/today`
Get today's water intake for both players

### POST `/api/water`
Add water intake
```json
{
  "player": "safari",
  "amount": 8
}
```

### GET `/api/stats`
Get historical statistics
- Query params: `days` (default: 30)

### GET `/api/entries`
Get water entries for a date range
- Query params: `start_date`, `end_date`, `player`

### GET `/api/winners`
Get daily winners
- Query params: `days` (default: 30)

### POST `/api/calculate-winner`
Calculate and store today's winner (call at midnight)

### GET `/api/health`
Health check endpoint

## 🚀 Deployment

### Frontend (GitHub Pages)
1. Update `homepage` in `frontend/package.json` with your GitHub Pages URL
2. Run `npm run deploy` from the frontend directory

### Backend (AWS/Heroku/Railway)
1. Set environment variables:
   - `PORT`: Server port (optional, defaults to 3001)
2. Deploy to your preferred platform
3. Update frontend API base URL to point to your backend

## 🎨 Customization

### Colors
The app uses a pink and blue theme:
- Primary Pink: `#ec4899`
- Primary Blue: `#3b82f6`
- Safari Color: `#3b82f6`
- Brielle Color: `#ec4899`

### Water Jug Capacity
Default capacity is 128 oz (1 gallon). You can modify this in the `WaterJug.js` component.

## 🔧 Development

### Frontend Scripts
- `npm start`: Start development server
- `npm run build`: Build for production
- `npm run deploy`: Deploy to GitHub Pages

### Backend Scripts
- `npm start`: Start production server
- `npm run dev`: Start development server with nodemon

## 📊 Daily Winner Calculation

The app automatically calculates the daily winner at midnight. The winner is determined by who drank the most water that day. In case of a tie, the first player alphabetically wins.

## 🎯 Future Enhancements

- [ ] Push notifications for water reminders
- [ ] Weekly/monthly challenges
- [ ] Achievement badges
- [ ] Water intake goals
- [ ] Export data functionality
- [ ] Dark mode toggle

## 🤝 Contributing

This is a personal project for Safari and Brielle, but feel free to fork and customize for your own water tracking needs!

## 📄 License

MIT License - feel free to use this code for your own projects!

---

**Happy Hydrating! 💧🏆**

*Built with ❤️ for the ultimate water drinking competition*
