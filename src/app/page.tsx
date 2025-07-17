import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Brain, Play, Target, Trophy } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-8">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-white" />
          <span className="text-lg font-medium">ChessAI</span>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-2xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-6xl font-light tracking-tight">Master Chess with AI</h1>
          <p className="text-xl text-gray-400 font-light leading-relaxed">
            Challenge yourself against an intelligent opponent that adapts to your skill level.
          </p>
          <Link href="/game">
            <Button className="bg-white text-black hover:bg-gray-100 px-8 py-3 text-base font-medium">
              <Play className="w-4 h-4 mr-2" />
              Start Playing
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center space-y-4">
              <Brain className="w-8 h-8 text-white mx-auto" />
              <h3 className="text-lg font-medium">Smart Opponent</h3>
              <p className="text-gray-400 font-light">AI that adapts to your playing style</p>
            </div>
            <div className="text-center space-y-4">
              <Target className="w-8 h-8 text-white mx-auto" />
              <h3 className="text-lg font-medium">Learn Strategy</h3>
              <p className="text-gray-400 font-light">Improve through intelligent gameplay</p>
            </div>
            <div className="text-center space-y-4">
              <Trophy className="w-8 h-8 text-white mx-auto" />
              <h3 className="text-lg font-medium">Track Progress</h3>
              <p className="text-gray-400 font-light">Monitor your skill development</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-16">
          <h2 className="text-3xl font-light">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-12 h-12 border border-white rounded-full flex items-center justify-center mx-auto text-lg font-light">
                1
              </div>
              <h3 className="font-medium">Choose Side</h3>
              <p className="text-gray-400 font-light text-sm">Select white or black pieces</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 border border-white rounded-full flex items-center justify-center mx-auto text-lg font-light">
                2
              </div>
              <h3 className="font-medium">Make Moves</h3>
              <p className="text-gray-400 font-light text-sm">Click and drag to move pieces</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 border border-white rounded-full flex items-center justify-center mx-auto text-lg font-light">
                3
              </div>
              <h3 className="font-medium">Improve</h3>
              <p className="text-gray-400 font-light text-sm">Learn from each game</p>
            </div>
          </div>
        </div>
      </section>

     

      {/* CTA */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-xl mx-auto text-center space-y-8">
          <h2 className="text-3xl font-light">Ready to Play?</h2>
          <p className="text-gray-400 font-light">Start your chess journey with our intelligent AI opponent.</p>
          <Link href="/game">
            <Button className="bg-white text-black hover:bg-gray-100 px-8 py-3 text-base font-medium">
              Start Your First Game
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-white" />
            <span className="font-medium">ChessAI</span>
          </div>
          <div className="text-gray-400 text-sm font-light">© 2024 ChessAI</div>
        </div>
      </footer>
    </div>
  )
}
