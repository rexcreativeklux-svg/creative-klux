"use client";
import React, { useState, useEffect } from 'react';
import { ArrowUp, CircleArrowDown, Ellipsis, ChevronLeft, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const StatementChart = {
    series: [
        {
            name: "Orders",
            data: [31, 40, 28, 51, 42, 109, 100],
        },
    ],
    options: {
        chart: { type: "area", height: 150, toolbar: { show: false } },
        stroke: { curve: "smooth" },
        dataLabels: { enabled: false },
        xaxis: {
            categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            labels: { show: false },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: { show: false },
        },
        grid: { show: false },
        tooltip: {
            x: { show: false },
        },
        legend: { show: false },
        colors: ["#ffffff"],
    },
};

const carouselCharts = [
    {
        title: "Sales",
        series: [
            {
                name: "Sales",
                data: [2348, 2450, 2300, 2600, 2550, 2800, 3000],
            },
        ],
        options: {
            chart: { type: "area", height: 100, toolbar: { show: false } },
            stroke: { curve: "smooth" },
            dataLabels: { enabled: false },
            xaxis: {
                categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                labels: { show: false },
                axisBorder: { show: false },
                axisTicks: { show: false },
            },
            yaxis: {
                labels: { show: false },
            },
            grid: { show: false },
            tooltip: {
                x: { show: false },
            },
            legend: { show: false },
            colors: ["#5d7bf0"],
        },
        metric: 2348,
        change: 4.3,
        changeDirection: "up",
    },
    {
        title: "Revenue",
        series: [
            {
                name: "Revenue",
                data: [15000, 17000, 14000, 18000, 16500, 20000, 22000],
            },
        ],
        options: {
            chart: { type: "area", height: 100, toolbar: { show: false } },
            stroke: { curve: "smooth" },
            dataLabels: { enabled: false },
            xaxis: {
                categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                labels: { show: false },
                axisBorder: { show: false },
                axisTicks: { show: false },
            },
            yaxis: {
                labels: { show: false },
            },
            grid: { show: false },
            tooltip: {
                x: { show: false },
            },
            legend: { show: false },
            colors: ["#10b981"],
        },
        metric: 22000,
        change: 5.1,
        changeDirection: "up",
    },
    {
        title: "Impressions",
        series: [
            {
                name: "Impressions",
                data: [50000, 52000, 48000, 55000, 53000, 60000, 62000],
            },
        ],
        options: {
            chart: { type: "area", height: 100, toolbar: { show: false } },
            stroke: { curve: "smooth" },
            dataLabels: { enabled: false },
            xaxis: {
                categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                labels: { show: false },
                axisBorder: { show: false },
                axisTicks: { show: false },
            },
            yaxis: {
                labels: { show: false },
            },
            grid: { show: false },
            tooltip: {
                x: { show: false },
            },
            legend: { show: false },
            colors: ["#f59e0b"],
        },
        metric: 62000,
        change: 2.5,
        changeDirection: "down",
    },
];

const Statement = () => {
    const [activeChart, setActiveChart] = useState(0);

    // Auto-scroll functionality
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveChart((prev) => (prev === carouselCharts.length - 1 ? 0 : prev + 1));
        }, 5000); // Change chart every 5 seconds

        return () => clearInterval(interval); // Clean up interval on unmount
    }, []);

    const handlePrev = () => {
        setActiveChart((prev) => (prev === 0 ? carouselCharts.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setActiveChart((prev) => (prev === carouselCharts.length - 1 ? 0 : prev + 1));
    };

    const handleIndicatorClick = (index) => {
        setActiveChart(index);
    };

    return (
        <div className="py-3 flex flex-col gap-4">
            <div className="px-5 py-1 rounded-lg bg-blue-600">
                <div>
                    <Chart
                        options={StatementChart.options}
                        series={StatementChart.series}
                        type="area"
                        height={200}
                       
                    />
                </div>
                <div>
                    <p className="text-3xl font-bold text-white py-1">$31,313</p>
                    <p className="text-xl font-medium text-white">Current Balance</p>
                </div>
                <div className="flex justify-center py-3 w-full">
                    <button className="text-white flex justify-center w-full gap-2 text-xl border py-2 rounded-full font-semibold">
                        <div className="flex py-0.5">
                            <CircleArrowDown strokeWidth={1.5} />
                        </div>
                        <div>Get Statement</div>
                    </button>
                </div>
            </div>

            <div className="px-5 border border-gray-300 rounded-lg">
                <div className="flex justify-between py-2">
                    <div>Top Sellers</div>
                    <div className="flex py-2 justify-center">
                        <Ellipsis strokeWidth={1.5} />
                    </div>
                </div>
                <div className="flex flex-col">
                    <div className="py-1 px-3 flex justify-center rounded-full">
                        <img src="/travis.jpg" alt="Brand" className="w-14 flex rounded-full h-14 object-contain" />
                    </div>
                    <div className="flex flex-col py-1">
                        <p className="flex justify-center font-semibold text-lg">Travis Fuller</p>
                        <p className="flex justify-center pb-1 text-gray-500">Salesman</p>
                    </div>
                </div>

                {/* Carousel */}
                <div className="bg-gray-100 rounded-xl relative">
                    <div className="p-4">
                        <p className="text-sm">{carouselCharts[activeChart].title}</p>
                        <div className="flex flex-row gap-2">
                            <p className="font-semibold py-1 text-lg">
                                {carouselCharts[activeChart].metric.toLocaleString()}
                            </p>
                            <div
                                className={`flex flex-row py-1 text-xs ${carouselCharts[activeChart].changeDirection === "up"
                                    ? "text-green-600"
                                    : "text-red-600"
                                    }`}
                            >
                                <div>
                                    {carouselCharts[activeChart].changeDirection === "up" ? (
                                        <ArrowUp strokeWidth={1.5} className="w-4 mt-1.5 h-4" />
                                    ) : (
                                        <ArrowUp strokeWidth={1.5} className="w-4 mt-1.5 h-4 rotate-180" />
                                    )}
                                </div>
                                <div className="py-2">{Math.abs(carouselCharts[activeChart].change)}%</div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <Chart
                            options={carouselCharts[activeChart].options}
                            series={carouselCharts[activeChart].series}
                            type="area"
                            height={100}
                            width="100%"
                        />
                    </div>

                    {/* Navigation Arrows */}
                    {/* <button
                        onClick={handlePrev}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 shadow hover:bg-gray-50"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-1 shadow hover:bg-gray-50"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button> */}

                  
                </div>

                <div className="flex flex-row py-2 justify-center gap-2">
                    <div className="flex justify-center items-center bg-sky-100 py-2 px-2 rounded-full">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-6 w-6 text-sky-600"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                            />
                        </svg>
                    </div>

                    <div className="py-2 px-2 flex justify-center items-center bg-sky-100 rounded-full">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-6 w-6 text-sky-500"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                            />
                        </svg>
                    </div>

                    <div className="py-2 px-2 flex justify-center items-center bg-sky-100 rounded-full">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-6 w-6 text-sky-500"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
                            />
                        </svg>
                    </div>
                </div>

                  {/* Carousel Indicators */}
                    <div className="flex justify-center py-3 gap-2">
                        {carouselCharts.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => handleIndicatorClick(index)}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${activeChart === index ? "bg-blue-600" : "bg-gray-300"
                                    }`}
                            />
                        ))}
                    </div>
            </div>
        </div>
    );
};

export default Statement;