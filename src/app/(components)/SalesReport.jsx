"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";

// dynamically import ApexCharts (fixes Next.js SSR issues)
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function SalesReport() {
    const [filter, setFilter] = useState("daily");

    const chartData = {
        daily: {
            series: [
                { name: "Orders", data: [20, 22.6, 21, 23, 22, 21.5, 22.6, 23, 22, 21.5, 22.6, 20] },
                { name: "Earnings", data: [14, 16.4, 15, 18, 16, 17, 16.4, 14, 16.4, 15, 18, 12] },

            ],
            categories: [
                "10 Mar", "11 Mar", "12 Mar", "13 Mar", "14 Mar", "15 Mar", "16 Mar", "17 Mar", "18 Mar", "19 Mar", "20 Mar", "21 Mar"
            ]
        },
        monthly: {
            series: [
                { name: "Orders", data: [200, 210, 180, 230, 220, 240] },
                { name: "Earnings", data: [120, 130, 110, 150, 140, 160] },

            ],
            categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
        },
        yearly: {
            series: [
                { name: "Orders", data: [2500, 2600, 2700, 2650, 2800] },
                { name: "Earnings", data: [1500, 1600, 1700, 1650, 1800] },

            ],
            categories: ["2019", "2020", "2021", "2022", "2023"]
        }
    };

    const chartOptions = {
        chart: {
            type: "bar",
            height: 300,
            toolbar: { show: false }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: "30%",  // adjust width of bars
                borderRadius: 6       // rounded bars
            }
        },
        colors: ["#6668ea", "#31b2ec",],
        dataLabels: { enabled: false },
        grid: { strokeDashArray: 4 },
        xaxis: {
            categories: chartData[filter].categories,
            labels: { style: { colors: "#6B7280" } }
        },
        yaxis: {
            labels: { style: { colors: "#6B7280" } }
        },
        legend: {
            position: "top",
            horizontalAlign: "right"
        }
    };

    return (
        <div className="bg-white px-6 py-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between py-3 ">
                <div className="text-lg font-semibold">Sales Report</div>
                <div className="flex">
                    {["daily", "monthly", "yearly"].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`px-3 border  border-gray-200 py-1 ${filter === type ? "bg-gray-300 text-black" : "bg-white"
                                }`}
                        >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <Chart
                    options={chartOptions}
                    series={chartData[filter].series}
                    type="bar"
                    height={250}
                />
            </div>
        </div>
    );
}
