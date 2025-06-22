# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build the production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint to check code quality

## Architecture

This is a Next.js 15 application using the App Router architecture with TypeScript and Tailwind CSS v4.

### Key Structure
- Uses App Router (app/ directory) instead of Pages Router
- TypeScript configuration with strict mode enabled
- Tailwind CSS for styling with PostCSS
- Geist font family (sans and mono variants) configured via next/font/google
- Path alias `@/*` maps to project root

### Technology Stack
- Next.js 15.3.4 with React 19
- TypeScript with strict mode
- Tailwind CSS v4 (using @tailwindcss/postcss)
- ESLint with Next.js configuration

### Font Configuration
The app uses Geist fonts loaded via next/font/google with CSS variables:
- `--font-geist-sans` for the main sans-serif font
- `--font-geist-mono` for monospace text