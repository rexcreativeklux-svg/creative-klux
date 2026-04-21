"use client";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });


const earningsChart = {
    series: [
        {
            name: "Earnings", // still required internally
            data: [44, 55, 13, 33],
        },
    ],
    options: {
        chart: {
            type: "bar",
            height: 150,
            toolbar: { show: false }, // hides the toolbar
        },
        plotOptions: {
            bar: {
                borderRadius: 6,
                columnWidth: "25%",
                distributed: true,
            },
        },
        dataLabels: { enabled: false }, // hides numbers on bars
        xaxis: {
            categories: ["Product A", "Product B", "Product C", "Product D"],
            labels: {
                show: false, // set false if you want even x-axis labels hidden
            },
            axisTicks: { show: false },
            axisBorder: { show: false },
        },
        yaxis: {
            labels: { show: false }, // hides Y-axis
        },
        grid: { show: false }, // removes grid lines
        legend: { show: false }, // hides legend
    },
};

const ratingChart = {
    series: [76],
    options: {
        chart: { type: "radialBar", height: 150 },
        plotOptions: {
            radialBar: {
                hollow: { size: "60%" },
                dataLabels: {
                    name: { show: false },
                    value: {
                        show: true,
                        fontSize: "14px",
                        color: "#111",
                        offsetY: 5, // pushes value towards the center
                    },
                },
            },
        },
        labels: ["Rating"],
    },
};

const closedOrdersChart = {
    series: [68],
    options: {
        chart: { type: "radialBar", height: 150 },
        plotOptions: {
            radialBar: {
                hollow: { size: "60%" },
                dataLabels: {
                    name: { show: false },
                    value: {
                        show: true,
                        fontSize: "12px",
                        color: "#111",
                        offsetY: 5, // pushes value towards the center
                    },
                },
            },
        },
        labels: ["Closed Orders"],
        colors: ["#049a68"],
    },
};

const ordersChart = {
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
            labels: { show: false }, // 🔹 hide x-axis labels
            axisBorder: { show: false }, // 🔹 hide x-axis border
            axisTicks: { show: false }, // 🔹 hide ticks
        },
        yaxis: {
            labels: { show: false }, // 🔹 hide y-axis labels
        },
        grid: { show: false }, // 🔹 hide gridlines
        tooltip: {
            x: { show: false }, // 🔹 hides x-axis tooltip
        },
        legend: { show: false }, // 🔹 hide legend
        colors: ["#ff9800"],
    },
};

const Statistics = () => (
    <div className='flex flex-col sm:flex-row w-full gap-2'>
        <div className='flex w-full flex-col gap-4 '>
            <div className="flex flex-col justify-between rounded-lg border border-gray-200">
                <div className='flex-1 flex flex-col px-4'>
                    <p className='py-2 px-2'>Earning</p>
                    <p className="text-xl  px-2 font-meduim ">$16.4k</p>
                </div>

                <div className="">
                    <Chart
                        options={earningsChart.options}
                        series={earningsChart.series}
                        type="bar"
                        height={150}
                        
                    />
                </div>
            </div>
            <div className='flex flex-row h-full rounded-lg border border-gray-200'>
                <div className="flex justify-center z-0 items-center">
                    <Chart
                        options={ratingChart.options}
                        series={ratingChart.series}
                        type="radialBar"
                        height={100}
                        width={100}

                    />
                </div>
                <p className='flex justify-center items-center text-md font-normal'>Closed Orders</p>
            </div>
        </div>

        <div className='flex w-full flex-col h-full gap-4'>
            <div className='flex flex-row rounded-lg border border-gray-200'>
                <div className="h-full  z-0">
                    <Chart
                        options={closedOrdersChart.options}
                        series={closedOrdersChart.series}
                        type="radialBar"
                        height={100}
                        width={100}
                    />

                </div>
                <p className='flex justify-center items-center text-md font-normal'>Current Rating</p>
            </div>

            <div className="flex flex-col flex-2/3 justify-between rounded-lg border border-gray-200">
                <div className='px-4 '>
                    <p className='py-2 px-2'>Orders</p>
                    <p className="text-xl  px-2 font-semibold ">22.6k</p>
                </div>

                <div className=" z-0">
                    <Chart
                        options={ordersChart.options}
                        series={ordersChart.series}
                        type="area"
                        height={100}
                    />
                </div>
            </div>

        </div>
    </div>
);
export default Statistics;
