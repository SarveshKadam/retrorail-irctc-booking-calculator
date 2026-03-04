# RetroRail: IRCTC Booking Calculator

[aureliabutton]

RetroRail is a highly polished, retro-themed Advance Reservation Period (ARP) calculator for Indian Railways (IRCTC). Blending the nostalgic aesthetic of 90s web design with modern React performance, this utility calculates the exact date and time train tickets open for booking—exactly 60 days prior to the journey date at 08:00 AM IST.

## 🚂 Key Features

- **Precise ARP Calculation**: Automatically calculates the booking opening date based on the 60-day IRCTC rule.
- **IST Timezone Awareness**: Intelligent countdown logic that respects Indian Standard Time (UTC+5:30) regardless of the user's local system time.
- **Smart Reminders**: One-click Google Calendar integration that sets an alarm for 07:55 AM IST (5 minutes before booking opens).
- **Dynamic Status States**: Visual feedback for future bookings, today's openings (with pulsing alerts), and already open windows.
- **Mobile-First Retro UI**: A responsive, thumb-friendly interface featuring classic IRCTC blue and safety orange accents.
- **No-Friction UX**: Pre-filled dates and deep links to the IRCTC login page to streamline the booking process.

## 🛠️ Technology Stack

- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with Shadcn UI components
- **Animations**: Framer Motion for smooth retro transitions
- **State Management**: Zustand for reactive UI updates
- **Date Handling**: date-fns for robust 60-day math and leap year support
- **Icons**: Lucide React
- **Platform**: Cloudflare Workers & Pages

## 🚀 Getting Started

### Prerequisites

You will need [Bun](https://bun.sh/) installed on your machine to run this project.

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd retro-irctc-calc
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Start the development server:
   ```bash
   bun run dev
   ```

The application will be available at `http://localhost:3000`.

## 💻 Development

### Project Structure

- `src/pages/HomePage.tsx`: Main calculator logic and interface.
- `src/components/ui/`: Reusable Shadcn UI components.
- `src/hooks/`: Custom React hooks for theme and responsiveness.
- `worker/`: Cloudflare Worker logic for backend API requirements (if any).

### Available Scripts

- `bun run dev`: Starts the Vite development server.
- `bun run build`: Generates the production build.
- `bun run lint`: Runs ESLint for code quality checks.
- `bun run preview`: Previews the production build locally.

## 🌐 Deployment

This project is optimized for deployment on Cloudflare via Aurelia.

### Instant Deploy

You can deploy your own version of this tool instantly using the button below:

[aureliabutton]

### Manual Deployment

To deploy manually using Wrangler:

```bash
bun run build
bun run deploy
```

## 📝 License

This project is built as a mission-critical travel utility. All rights reserved.