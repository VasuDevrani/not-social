# not-social

A modern, full-featured social media application built with Next.js 15, featuring real-time messaging, advanced post interactions, and a comprehensive user experience.

<img width="700" height="500" alt="image" src="https://github.com/user-attachments/assets/4bc24dfc-2abf-4a98-b3d4-9886d59c4aba" />
<p></p>

![Next.js](https://img.shields.io/badge/Next.js-15.0.0--rc.0-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.0.0--rc-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5.16.1-2D3748?style=for-the-badge&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=for-the-badge&logo=postgresql)

## ✨ Features

### 🔐 Authentication & Security
- **Multi-provider Authentication**: Google OAuth and email/password
- **Session Management**: Secure authentication with Lucia Auth
- **Protected Routes**: Role-based access control

### 📱 Core Social Features
- **Post Creation**: Rich text editor with TipTap integration
- **Media Support**: Image and video uploads with UploadThing
- **Advanced Reactions**: Multiple reaction types (Like, Love, Laugh, Wow, Sad, Angry)
- **Comments System**: Threaded comments on posts
- **Bookmarks**: Save and organize favorite posts
- **User Profiles**: Customizable profiles with bio and avatar

### 👥 Social Interactions
- **Follow System**: Follow/unfollow users
- **User Recommendations**: AI-powered user suggestions
- **Real-time Notifications**: Instant updates for interactions
- **Activity Feed**: Personalized "For You" and "Following" feeds

### 💬 Messaging
- **Real-time Chat**: Powered by Stream Chat
- **Direct Messages**: Private conversations between users
- **Unread Count**: Badge notifications for new messages

### 🔍 Discovery & Search
- **Full-text Search**: Find users, posts, and content
- **Trending Content**: Discover popular posts and users
- **People You May Know**: Smart user recommendations

### 🎨 User Experience
- **Dark/Light Theme**: Theme switching with next-themes
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Infinite Scroll**: Smooth content loading
- **Loading States**: Skeleton screens and loading indicators
- **Image Cropping**: Built-in image editing capabilities

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19 RC** - Latest React features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible UI components
- **TipTap** - Rich text editor
- **TanStack Query** - Server state management

### Backend & Database
- **Prisma** - Type-safe database ORM
- **PostgreSQL** - Primary database
- **Lucia Auth** - Authentication library
- **UploadThing** - File upload service
- **Stream Chat** - Real-time messaging

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

## 🚀 Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn
- PostgreSQL database
- Google OAuth credentials (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/VasuDevrani/not-social.git
   cd not-social
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in the required environment variables in `.env`:

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [localhost](http://localhost:3000)

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run postinstall` - Generate Prisma client

### Environment Variables for Production

Make sure to set all environment variables from `.env.example` in your production environment.
