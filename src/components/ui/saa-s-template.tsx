import React from "react";
import { ArrowRight, Menu as MenuIcon, X as XIcon } from "lucide-react";

// Inline Button Component
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost" | "gradient";
  size?: "default" | "sm" | "lg";
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "default", className = "", children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    
    const variants = {
      default: "bg-white text-black hover:bg-gray-100",
      secondary: "bg-gray-800 text-white hover:bg-gray-700",
      ghost: "hover:bg-gray-800/50 text-white",
      gradient: "bg-gradient-to-b from-white via-white/95 to-white/60 text-black hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
    };
    
    const sizes = {
      default: "h-10 px-4 py-2 text-sm",
      sm: "h-10 px-5 text-sm",
      lg: "h-12 px-8 text-base"
    };
    
    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

// Navigation Component
export const Navigation = React.memo(({ onLogin }: { onLogin?: () => void }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="fixed top-0 w-full z-50 border-b border-gray-800/50 bg-black/80 backdrop-blur-md">
      <nav className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold flex items-center gap-2 text-white">
            <span className="text-white">OS Copilot</span>
          </div>
          
          <div className="hidden md:flex items-center justify-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <a href="#getting-started" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Getting started
            </a>
            <a href="#features" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Features
            </a>
            <a href="#documentation" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
              Documentation
            </a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Button type="button" variant="ghost" size="sm" onClick={onLogin}>
              Sign in
            </Button>
            <Button type="button" variant="default" size="sm" onClick={onLogin}>
              Get Started
            </Button>
          </div>

          <button
            type="button"
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-md border-t border-gray-800/50 animate-[slideDown_0.3s_ease-out]">
          <div className="px-6 py-6 flex flex-col gap-4">
            <a
              href="#getting-started"
              className="text-sm font-medium text-white/60 hover:text-white transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Getting started
            </a>
            <a
              href="#features"
              className="text-sm font-medium text-white/60 hover:text-white transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#documentation"
              className="text-sm font-medium text-white/60 hover:text-white transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Documentation
            </a>
            <div className="flex flex-col gap-3 pt-4 border-t border-gray-800/50">
              <Button type="button" variant="ghost" size="sm" onClick={onLogin}>
                Sign in
              </Button>
              <Button type="button" variant="default" size="sm" onClick={onLogin}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
});

Navigation.displayName = "Navigation";

// Hero Component
export const Hero = React.memo(({ onLogin }: { onLogin?: () => void }) => {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-start px-6 pt-32 pb-20 md:pt-40"
      style={{
        animation: "fadeIn 0.6s ease-out"
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      
      {/* Background elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <aside className="mb-8 inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-full border border-gray-800 bg-gray-900/50 backdrop-blur-sm max-w-full">
        <span className="text-xs font-medium text-emerald-400 whitespace-nowrap">
          Open Source AI Agent
        </span>
        <div className="w-1 h-1 rounded-full bg-gray-700" />
        <a
          href="#features"
          className="flex items-center gap-1 text-xs font-medium hover:text-white transition-all active:scale-95 whitespace-nowrap text-gray-400"
        >
          See how it works
          <ArrowRight size={12} />
        </a>
      </aside>

      <h1
        className="text-5xl md:text-6xl lg:text-7xl font-bold text-center max-w-4xl px-6 leading-tight mb-8"
        style={{
          background: "linear-gradient(to bottom, #ffffff, #a3a3a3)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          letterSpacing: "-0.03em"
        }}
      >
        Automate your open source contributions
      </h1>

      <p className="text-base md:text-lg text-center max-w-2xl px-6 mb-12 text-gray-400 leading-relaxed font-light">
        Connect your GitHub to find issues, draft PRs, and maintain a consistent contribution graph. A Copilot that acts on your behalf, so you can build your portfolio while focusing on what matters.
      </p>

      <div className="flex items-center gap-4 relative z-10 mb-20">
        <Button
          type="button"
          variant="gradient"
          size="lg"
          className="rounded-lg shadow-[0_0_30px_rgba(255,255,255,0.15)] flex items-center justify-center font-bold px-8"
          onClick={onLogin}
        >
          Connect GitHub
        </Button>
      </div>

      <div className="w-full max-w-6xl relative pb-20 mt-10 perspective-[1000px]">
        <div
          className="absolute left-1/2 w-[120%] pointer-events-none z-0 rotate-180 mix-blend-screen opacity-50"
          style={{
            top: "-30%",
            transform: "translateX(-50%)"
          }}
          aria-hidden="true"
        >
          <img
            src="https://i.postimg.cc/Ss6yShGy/glows.png"
            alt=""
            className="w-full h-auto hue-rotate-180"
            loading="eager"
          />
        </div>
        
        <div className="relative z-10 rounded-2xl overflow-hidden border border-gray-800 shadow-[0_0_50px_-12px_rgba(0,0,0,1)] ring-1 ring-white/10"
             style={{ transform: "rotateX(5deg) scale(0.95)" }}>
          <div className="bg-gray-900 border-b border-gray-800 p-3 flex gap-2">
             <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
             <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
             <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <img
            src="https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=2688&auto=format&fit=crop"
            alt="Dashboard preview showing analytics and metrics interface"
            className="w-full h-auto object-cover opacity-80"
            loading="eager"
          />
        </div>
      </div>
    </section>
  );
});

Hero.displayName = "Hero";

import { HorizonHeroSection } from "./horizon-hero-section";
import { CheckCircle2, GitPullRequest, Settings, Terminal, Zap, Shield, Search } from "lucide-react";

const Features = React.memo(() => {
  const features = [
    {
      icon: <Search className="w-6 h-6 text-indigo-400" />,
      title: "Find 'Good First Issues'",
      description: "Our AI agents scan thousands of open source repositories to find issues that match your skill set and experience level."
    },
    {
      icon: <Terminal className="w-6 h-6 text-indigo-400" />,
      title: "Draft Solutions Automatically",
      description: "Get step-by-step guides and code snippets to help you understand and solve the issue, learning as you go."
    },
    {
      icon: <GitPullRequest className="w-6 h-6 text-indigo-400" />,
      title: "Review & Merge",
      description: "Submit your pull requests with confidence. Our tools help you write better PR descriptions and track your impact."
    }
  ];

  return (
    <section id="features" className="py-32 relative overflow-hidden bg-transparent">
      {/* Decorative top border */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-gray-800 to-transparent" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">
            Everything you need to start contributing
          </h2>
          <p className="text-lg text-gray-400 font-light leading-relaxed">
            Stop searching and start coding. OS Copilot gives you the guidance and tools you need to make your first open source contribution a success.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="card-liquid-glass p-8 hover:border-white/20 transition-all rounded-3xl group">
              <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-white/10 transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

Features.displayName = "Features";

export default function SaaSTemplate({ onLogin }: { onLogin?: () => void }) {
  return (
    <main className="min-h-screen bg-transparent text-white overflow-x-hidden selection:bg-white/30 relative scroll-smooth">
      <Navigation onLogin={onLogin} />
      <HorizonHeroSection onLogin={onLogin} />
      <Features />
    </main>
  );
}
