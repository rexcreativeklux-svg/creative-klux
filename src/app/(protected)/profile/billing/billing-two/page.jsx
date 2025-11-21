"use client";

import { Settings } from "lucide-react";
import { useState, useEffect } from "react";

export default function Billing() {
    const [plan, setPlan] = useState({ name: "Premium Plan", used: 136, total: 300 });
    const [methods, setMethods] = useState([]);
    const [invoices, setInvoices] = useState([]);

    // Fetch payment methods & invoices
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [methodsRes, invoicesRes] = await Promise.all([
                    fetch("https://creatives.weviy.com/creatives-app/user/payment-methods", {
                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                    }),
                    fetch("https://creatives.weviy.com/creatives-app/user/invoices", {
                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                    }),
                ]);

                const methodsData = await methodsRes.json();
                const invoicesData = await invoicesRes.json();

                setMethods(methodsData.methods || []);
                setInvoices(invoicesData.invoices || []);
            } catch (err) {
                console.error("Failed to fetch billing data", err);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="flex flex-col">
            {/* Billing & Payments Header */}
            <div className="rounded-lg px-12 py-6 bg-white ">
                <h2 className="text-2xl font-semibold mb-2">Billing & Payments</h2>
                <p className="text-gray-600">
                    Manage your Billing and Payments from here. You can also manage your payment methods from here.
                </p>

                {/* Plan Summary */}
                <div className="mt-6 border border-gray-200 flex justify-between items-center rounded-lg p-4">
                    <div>
                        <h3 className="font-medium">{plan.name}</h3>
                        <p className="text-gray-600 text-sm">
                            {plan.used} / {plan.total} Days left
                        </p>
                        <div className="w-64 bg-gray-200 rounded-full h-2 mt-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${(plan.used / plan.total) * 100}%` }}
                            />
                        </div>
                    </div>
                    <button className="bg-[#155dfc] hover:bg-blue-800 cursor-pointer duration-300 text-white px-5 py-2 rounded-lg">
                        Upgrade
                    </button>
                </div>
            </div>

            {/* Payment Methods */}
            <div className=" rounded-lg px-12 py-6 bg-white ">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold">Payment Methods</h2>
                    <button className="border border-gray-200 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100">
                        + New Method
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {methods.length === 0 ? (
                        // <p className="text-gray-500">No payment methods added.</p>
                        <div
                            className={`border-2 border-orange-500 rounded-lg p-4 flex flex-col justify-between`}
                        >
                            <div className="flex justify-between">
                            <div>
                                <p className="text-lg font-semibold">Visa</p>
                                <p className="text-gray-600">name</p>
                                <p className="text-gray-500">**** 4444</p>

                            </div>
                            <div>
                                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                                    PRIMARY
                                </span>
                            </div>
                            </div>

                            <div className="flex justify-between items-center mt-3">
                                <p className="text-sm text-gray-500">Expired</p>



                                <button className="text-gray-500 hover:text-gray-700">⚙️</button>
                            </div>
                        </div>
                    ) : (
                        methods.map((method, idx) => (
                            <div
                                key={idx}
                                className={`border-2 rounded-lg p-4 flex flex-col justify-between ${idx === 0 ? "border-blue-600" : "border-gray-200"
                                    }`}
                            >
                                <div>
                                    <p className="text-lg font-semibold">{method.brand}</p>
                                    <p className="text-gray-600">{method.name}</p>
                                    <p className="text-gray-500">**** {method.last4}</p>
                                    <p className="text-sm text-gray-500">Expired {method.expiry}</p>
                                </div>
                                <div className="flex justify-between items-center mt-3">
                                    {idx === 0 && (
                                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                                            PRIMARY
                                        </span>
                                    )}
                                    <button className="text-gray-500 hover:text-gray-700">
                                        <Settings />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Invoices Table */}
            <div className=" rounded-lg px-12 py-6 bg-white">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold">Invoices</h2>
                    <button className="border border-gray-200 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100">
                        Export
                    </button>
                </div>

                {/* Search + Filter */}
                <div className="flex gap-3 mb-4">
                    <input
                        type="text"
                        placeholder="Search Name..."
                        className="border border-gray-200 rounded-lg px-3 py-2 w-64"
                    />
                    <button className="border border-gray-200 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100">
                        Filter
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-sm">
                                <th className="p-3 text-left">INVOICE NAME</th>
                                <th className="p-3">#</th>
                                <th className="p-3">INVOICE DATE</th>
                                <th className="p-3">DUE DATE</th>
                                <th className="p-3">AMOUNT</th>
                                <th className="p-3">STATUS</th>
                                <th className="p-3">DOWNLOAD</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center text-gray-500 py-6">
                                        No invoices found.
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((inv, idx) => (
                                    <tr key={idx} className="border-t text-sm">
                                        <td className="p-3">{inv.name}</td>
                                        <td className="p-3 text-center">{inv.number}</td>
                                        <td className="p-3">{inv.invoice_date}</td>
                                        <td className="p-3">{inv.due_date}</td>
                                        <td className="p-3">${inv.amount}</td>
                                        <td className="p-3">
                                            <span
                                                className={`px-2 py-1 rounded text-white text-xs ${inv.status === "Paid"
                                                        ? "bg-green-500"
                                                        : inv.status === "Pending"
                                                            ? "bg-yellow-500"
                                                            : "bg-red-500"
                                                    }`}
                                            >
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-blue-600 hover:underline cursor-pointer">
                                            Download
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-end mt-4 space-x-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                        <button
                            key={num}
                            className={`px-3 py-1 rounded ${num === 1
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                        >
                            {num}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
