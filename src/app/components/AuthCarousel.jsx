import Image from "next/image";
import React, { useState, useEffect } from "react";

const slides = [
    {
        image: "/medi.png",
        tagline: "Data-driven ad creatives that speak louder than words.",
    },
    {
        image: "/medi.png",
        tagline: "Your brand deserves designs that convert, not just look pretty.",
    },
    {
        image: "/medi.png",
        tagline: "Smart creatives for smarter campaigns.",
    },
    {
        image: "/medi.png",
        tagline: "From idea to impact — scale ads with confidence.",
    },
];

export default function AuthCarousel() {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative bg-[#f6faf4] w-full pb-20 flex flex-col justify-center items-center  mx-auto overflow-hidden rounded-2xl shadow-4xl">
            {/* Slides */}
            <div
                className="flex  transition-transform duration-700 ease-in-out h-full"
                style={{ transform: `translateX(-${current * 100}%)` }}
            >
                {slides.map((slide, index) => (
                    <div
                        key={index}
                        className="w-full flex-shrink-0 flex flex-col items-center justify-center  text-center px-6"
                    >
                        <Image
                            src={slide.image}
                            alt={slide.tagline}
                            width={500}   // smaller width
                            height={400}
                            className="object-contain h-[800px] mb-"
                            priority={index === 0}
                        />


                    </div>
                ))}

                {/* <div className=" absolute bottom-[60%] left-[5%] rounded-full border">
                    <Image
                        src='/head.png'
                        alt='image'
                        width={100}
                        height={100}
                        className="object-contain w-20 h-20 mb-"
                    />
                </div> */}
            </div>

            {/* Indicators */}
            <div className="absolute bottom-[22%] left-1/2 -translate-x-1/2 flex space-x-2">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrent(index)}
                        className={`w-2 h-2 rounded-full transition ${current === index ? "bg-black" : "bg-gray-400"
                            }`}
                    />
                ))}
            </div>




            <h2 className="text-xl absolute bottom-[10%]  flex justify-center items-center md:text-3xl px-12 text-center max-w-xl">
                Make your work easier and faster with Tuga's app
            </h2>
        </div>
    );
}
