"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-gray-950 via-[#171725] to-gray-950 text-white overflow-hidden">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">
            Projects.AI
          </h1>
          <span className="text-xs text-gray-400 font-normal">AI project management</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="px-6 py-2 text-sm font-medium bg-gradient-to-r from-purple-600 to-teal-600 rounded-lg text-white hover:shadow-lg hover:shadow-purple-500/50 transition-all"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 sm:py-32 text-center relative">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10">
          <div className="inline-block mb-6 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full text-sm text-purple-300">
            ✨ Plan → Build → Deploy
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-teal-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
            Manage Projects from
            <br />
            <span className="bg-gradient-to-r from-teal-400 via-purple-400 to-teal-400 bg-clip-text text-transparent">
              Start to Deployment
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            One hub for planning, development, testing, and production releases.
            <br className="hidden sm:block" />
            Lifecycle phases, milestones, Kanban tasks, and deployment tracking — with AI assistance.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/sign-up"
              className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-purple-600 to-teal-600 rounded-lg text-white hover:shadow-xl hover:shadow-purple-500/50 transition-all transform hover:scale-105"
            >
              Start Free Trial
            </Link>
            <Link
              href="/sign-in"
              className="px-8 py-4 text-lg font-semibold bg-gray-800/50 border border-purple-500/30 rounded-lg text-white hover:bg-gray-800 transition-all"
            >
              Sign In
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto mt-16">
            <div className="bg-gray-900/50 border border-purple-500/20 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-3xl font-bold text-purple-400 mb-2">20 Days</div>
              <div className="text-sm text-gray-400">Free Trial</div>
            </div>
            <div className="bg-gray-900/50 border border-teal-500/20 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-3xl font-bold text-teal-400 mb-2">AI-Powered</div>
              <div className="text-sm text-gray-400">Task Management</div>
            </div>
            <div className="bg-gray-900/50 border border-purple-500/20 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-3xl font-bold text-purple-400 mb-2">Unlimited</div>
              <div className="text-sm text-gray-400">Team Members</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 sm:py-32">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Everything you need to manage tasks efficiently with AI assistance
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-gray-900/50 border border-purple-500/20 rounded-xl p-8 hover:border-purple-500/40 transition-all hover:shadow-lg hover:shadow-purple-500/20">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-3 text-white">AI Assistant</h3>
            <p className="text-gray-400 leading-relaxed">
              Conversational AI powered by Google Gemini. Create, edit, and manage tasks using natural language. Voice commands supported.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-gray-900/50 border border-teal-500/20 rounded-xl p-8 hover:border-teal-500/40 transition-all hover:shadow-lg hover:shadow-teal-500/20">
            <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-3 text-white">Kanban Board</h3>
            <p className="text-gray-400 leading-relaxed">
              Visual task management with drag-and-drop. Organize tasks by status: To Do, In Progress, Done, and Blocked.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-gray-900/50 border border-purple-500/20 rounded-xl p-8 hover:border-purple-500/40 transition-all hover:shadow-lg hover:shadow-purple-500/20">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-3 text-white">Team Management</h3>
            <p className="text-gray-400 leading-relaxed">
              Invite team members, assign roles, and track performance. AI-powered workload balancing ensures fair task distribution.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-gray-900/50 border border-teal-500/20 rounded-xl p-8 hover:border-teal-500/40 transition-all hover:shadow-lg hover:shadow-teal-500/20">
            <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-3 text-white">Voice Commands</h3>
            <p className="text-gray-400 leading-relaxed">
              Speak to the AI assistant using your voice. Speech-to-text and text-to-speech support for hands-free task management.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-gray-900/50 border border-purple-500/20 rounded-xl p-8 hover:border-purple-500/40 transition-all hover:shadow-lg hover:shadow-purple-500/20">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-3 text-white">Performance Analytics</h3>
            <p className="text-gray-400 leading-relaxed">
              AI-powered performance monitoring. Get insights on completion rates, average time, and personalized recommendations.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-gray-900/50 border border-teal-500/20 rounded-xl p-8 hover:border-teal-500/40 transition-all hover:shadow-lg hover:shadow-teal-500/20">
            <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-3 text-white">Smart Filtering</h3>
            <p className="text-gray-400 leading-relaxed">
              Search and filter tasks by status, priority, assignee, and more. Quick task creation with keyboard shortcuts.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-20 sm:py-32">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">
            How It Works
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Get started in minutes with our intuitive AI-powered platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold">
              1
            </div>
            <h3 className="text-xl font-semibold mb-3">Sign Up</h3>
            <p className="text-gray-400">
              Create your account and organization. Start your 20-day free trial instantly.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-700 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold">
              2
            </div>
            <h3 className="text-xl font-semibold mb-3">Invite Team</h3>
            <p className="text-gray-400">
              Add team members and assign roles. The AI assistant will help balance workloads automatically.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold">
              3
            </div>
            <h3 className="text-xl font-semibold mb-3">Start Managing</h3>
            <p className="text-gray-400">
              Talk to the AI assistant, create tasks, and watch your team's productivity soar.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 sm:py-32">
        <div className="bg-gradient-to-r from-purple-600/20 to-teal-600/20 border border-purple-500/30 rounded-2xl p-12 sm:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-teal-500/5"></div>
          <div className="relative z-10">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">
              Ready to Transform Your Workflow?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join teams already using Projects.AI to manage their tasks more efficiently with AI assistance.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/sign-up"
                className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-purple-600 to-teal-600 rounded-lg text-white hover:shadow-xl hover:shadow-purple-500/50 transition-all transform hover:scale-105"
              >
                Start Free Trial
              </Link>
              <Link
                href="/sign-in"
                className="px-8 py-4 text-lg font-semibold bg-gray-800/50 border border-purple-500/30 rounded-lg text-white hover:bg-gray-800 transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t border-purple-500/20">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">
              Projects.AI
            </h1>
            <span className="text-xs text-gray-400">AI-Powered Task Management</span>
          </div>
          <div className="text-sm text-gray-400">
            © {new Date().getFullYear()} Projects.AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

