import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Database,
  LineChart,
  Microscope,
  Shield,
  Zap,
  Check,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "CRM Analysis",
    description:
      "Control Reference Material tracking with ±2/3σ limits, bias calculation, and failure detection.",
  },
  {
    icon: Database,
    title: "Blanks Analysis",
    description:
      "Blank sample monitoring with LOD-based limits and contamination detection.",
  },
  {
    icon: LineChart,
    title: "Duplicates (HARD)",
    description:
      "Half Absolute Relative Difference index with configurable thresholds per duplicate type.",
  },
  {
    icon: Microscope,
    title: "Z-Score Charts",
    description:
      "Z-score visualization by CRM and company with outlier detection at ±2/3σ levels.",
  },
  {
    icon: Shield,
    title: "Check Assay",
    description:
      "Q-Q plots and scatter comparisons between primary and secondary lab results.",
  },
  {
    icon: Zap,
    title: "Export & Reports",
    description:
      "Download summary tables as Excel and charts as PowerPoint presentations.",
  },
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with basic QAQC tools",
    features: [
      "CRM Analysis (limited)",
      "5 analyses per month",
      "Basic export",
      "Community support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "per month",
    description: "Full access for professional geologists",
    features: [
      "All 5 QAQC tools",
      "Unlimited analyses",
      "Auto-save drafts",
      "PowerPoint export",
      "Priority support",
      "Custom branding",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "per year",
    description: "For mining companies and consultancies",
    features: [
      "Everything in Pro",
      "Team collaboration",
      "SSO integration",
      "Dedicated support",
      "On-premise option",
      "Custom integrations",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <Microscope className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">QAQC Pro</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-slate-400 hover:text-white transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-slate-400 hover:text-white transition-colors">
                Pricing
              </a>
              <Link href="/sign-in">
                <Button variant="ghost" className="text-slate-300">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                  Start Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <Badge className="mb-6 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            Mining QAQC Software
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Professional QAQC Analysis
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              For Mining Professionals
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-8">
            Streamline your quality assurance with CRM tracking, duplicate analysis,
            Z-scores, and comprehensive check assay tools. All in one modern platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-lg px-8"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="text-lg px-8 border-slate-700 text-slate-300 hover:bg-slate-800">
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Everything You Need for QAQC
          </h2>
          <p className="text-slate-400 text-center max-w-2xl mx-auto mb-12">
            Professional-grade tools ported from industry-standard Python workflows,
            now available in a modern web interface.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="bg-slate-900/50 border-slate-800 hover:border-emerald-500/50 transition-colors"
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-emerald-400" />
                  </div>
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-400">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-slate-400 text-center max-w-2xl mx-auto mb-12">
            Start free and upgrade as your needs grow. No hidden fees.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative bg-slate-900/50 border-slate-800 ${plan.popular ? "border-emerald-500 ring-2 ring-emerald-500/20" : ""
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-500 text-white">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-white text-xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-slate-400 ml-1">/{plan.period}</span>
                  </div>
                  <CardDescription className="text-slate-400 mt-2">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-slate-300">
                        <Check className="w-4 h-4 text-emerald-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${plan.popular
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                        : "bg-slate-800 hover:bg-slate-700"
                      }`}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <Microscope className="w-4 h-4 text-white" />
            </div>
            <span className="text-slate-400">© 2026 QAQC Pro. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-slate-400 hover:text-white text-sm">
              Privacy
            </a>
            <a href="#" className="text-slate-400 hover:text-white text-sm">
              Terms
            </a>
            <a href="#" className="text-slate-400 hover:text-white text-sm">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
