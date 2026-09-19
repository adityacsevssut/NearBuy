"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Search } from "lucide-react";

const searchPlaceholders = [
  "Search for 'Burger'",
  "Search for 'Pizza'",
  "Search for 'Biryani'",
  "Search for 'Dosa'",
  "Search for 'Fries'",
];

const slides = [
  {
    id: 1,
    title: "with FREE Delivery",
    subtitle: "Dishes starting at ₹49",
    bgColor: "bg-yellow-400 dark:bg-yellow-500",
    textColor: "text-blue-900 dark:text-gray-900",
    imageUrl: "/burger_new.jpg",
  },
  {
    id: 2,
    title: "Breakfast Staples",
    subtitle: "Start your day right",
    bgColor: "bg-blue-900 dark:bg-blue-950",
    textColor: "text-white",
    imageUrl: "/dosa_new.jpg",
  },
  {
    id: 3,
    title: "Midnight Cravings",
    subtitle: "Up to 50% off",
    bgColor: "bg-orange-500 dark:bg-orange-600",
    textColor: "text-white",
    imageUrl: "/pizza_gemini.png",
  },
];

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchIndex, setSearchIndex] = useState(0);

  // Carousel timer
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(slideTimer);
  }, []);

  // Search placeholder timer
  useEffect(() => {
    const searchTimer = setInterval(() => {
      setSearchIndex((prev) => (prev + 1) % searchPlaceholders.length);
    }, 2000);
    return () => clearInterval(searchTimer);
  }, []);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* ── Dynamic Search Bar ── */}
      <div className="px-4 pt-2">
        <div className="flex items-center bg-gray-100 dark:bg-[#151522] rounded-2xl px-4 py-3 shadow-sm border border-transparent hover:border-orange-400 transition-colors">
          <Search className="w-5 h-5 text-gray-400 shrink-0 mr-3" />
          <div className="flex-1 relative h-6 overflow-hidden">
            {searchPlaceholders.map((text, idx) => (
              <span
                key={idx}
                className={`absolute inset-0 flex items-center text-sm font-medium text-gray-500 transition-all duration-500 ${
                  idx === searchIndex
                    ? "opacity-100 translate-y-0"
                    : idx < searchIndex || (searchIndex === 0 && idx === searchPlaceholders.length - 1)
                    ? "opacity-0 -translate-y-full"
                    : "opacity-0 translate-y-full"
                }`}
              >
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Hero Carousel ── */}
      <div className="relative w-full h-[180px] sm:h-[220px] overflow-hidden rounded-[24px] shadow-sm mx-auto w-[calc(100%-32px)]">
        {slides.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 flex items-center px-6 transition-opacity duration-700 ease-in-out ${
                slide.bgColor
              } ${isActive ? "opacity-100 z-10" : "opacity-0 z-0"}`}
            >
              {/* Text Content */}
              <div className="relative z-20 w-3/5 flex flex-col items-start gap-2">
                <h2
                  className={`text-2xl sm:text-3xl font-black leading-tight tracking-tight ${slide.textColor}`}
                >
                  {slide.title}
                </h2>
                <p className={`text-sm sm:text-base font-semibold opacity-90 ${slide.textColor}`}>
                  {slide.subtitle}
                </p>
                <button
                  className="mt-2 bg-white text-black font-extrabold text-[11px] px-4 py-1.5 rounded-full shadow-md hover:scale-105 active:scale-95 transition-transform"
                >
                  ORDER NOW
                </button>
              </div>

              {/* Food Image */}
              <div className="absolute right-[-20px] top-[10%] w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] z-10">
                <Image
                  src={slide.imageUrl}
                  alt={slide.title}
                  fill
                  className="object-contain drop-shadow-2xl scale-110"
                />
              </div>
            </div>
          );
        })}

        {/* Carousel Indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentSlide ? "w-4 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
