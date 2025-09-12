"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import {
  ArrowRight,
  Book,
  Users,
  Laptop,
  Sparkles,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";

// Main Landing Page Component
export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 bg-muted/30 border-b">
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10"></div>
          <div className="container mx-auto px-4 md:px-6 text-center relative z-20">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-primary mb-4">
              Anipur Adarsha Vidyaniketan HS
            </h1>
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground mb-8">
              Fostering academic excellence and holistic development since 2000.
              Welcome to our digital campus.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="#about">
                <Button size="lg" className="cursor-pointer">
                  Learn More
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="cursor-pointer">
                  Portal Login
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Why Choose Us?</h2>
              <p className="max-w-2xl mx-auto mt-2 text-muted-foreground">
                A blend of traditional values and modern education.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard
                icon={<Book className="h-8 w-8 text-primary" />}
                title="Academic Excellence"
                description="A rigorous curriculum designed to challenge students and prepare them for higher education and beyond."
              />
              <FeatureCard
                icon={<Users className="h-8 w-8 text-primary" />}
                title="Experienced Faculty"
                description="Our dedicated and experienced teachers are committed to nurturing each student's potential."
              />
              <FeatureCard
                icon={<Laptop className="h-8 w-8 text-primary" />}
                title="Digital Campus"
                description="Leveraging technology with our online portal for fees, attendance, and communication."
              />
              <FeatureCard
                icon={<Sparkles className="h-8 w-8 text-primary" />}
                title="Holistic Development"
                description="Encouraging participation in sports, arts, and cultural activities for all-round growth."
              />
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section
          id="about"
          className="bg-muted/30 py-16 md:py-24 border-t border-b"
        >
          <div className="container mx-auto px-4 md:px-6 grid md:grid-cols-2 gap-12 items-center">
            <div className="relative h-64 md:h-96 rounded-lg overflow-hidden">
              {/* Placeholder for a school image */}
              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                <span className="text-gray-500">School Image Placeholder</span>
              </div>
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Our Mission & Vision
              </h2>
              <p className="text-muted-foreground text-lg mb-4">
                Our mission is to provide quality education that empowers
                students with knowledge, skills, and values to excel in life and
                contribute to society. We envision a community of lifelong
                learners who are prepared to face global challenges with
                confidence and integrity.
              </p>
              <p className="text-muted-foreground text-lg">
                Established in 2000, Anipur Adarsha Vidyaniketan has been a
                cornerstone of the community, dedicated to shaping the future of
                our children.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">Get In Touch</h2>
              <p className="max-w-2xl mx-auto mt-2 text-muted-foreground">
                We are here to help. Contact us for admissions, inquiries, or
                any other information.
              </p>
            </div>
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <ContactInfo
                icon={<MapPin className="h-8 w-8 text-primary" />}
                title="Address"
                info="Anipur, Vill-Anipur, P.O.-Purbasthali, Dist-Purba Bardhaman, West Bengal, 713513"
              />
              <ContactInfo
                icon={<Phone className="h-8 w-8 text-primary" />}
                title="Phone"
                info="+91 123-456-7890 (Placeholder)"
              />
              <ContactInfo
                icon={<Mail className="h-8 w-8 text-primary" />}
                title="Email"
                info="contact@aavhs.edu (Placeholder)"
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

// Helper component for Feature Cards
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="text-center p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </Card>
  );
}

// Helper component for Contact Info
function ContactInfo({
  icon,
  title,
  info,
}: {
  icon: React.ReactNode;
  title: string;
  info: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground">{info}</p>
    </div>
  );
}
