'use client';

import React, { useState } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

export default function AdminDashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const [showMore, setShowMore] = useState(false);

    // Sample data for the line charts
    const lineChartData = {
        labels: ['January', 'February', 'March', 'April', 'May'],
        datasets: [
            {
                label: 'Sales',
                data: [100, 225, 150, 300, 100],
                borderColor: 'rgba(0, 0, 0, 1)',
                backgroundColor: 'rgba(139, 0, 0, 1)',
                pointBackgroundColor: 'rgba(139, 0, 0, 1)',
                fill: true,
            },
        ],
    };

    const revenueChartData = {
        labels: ['January', 'February', 'March', 'April', 'May'],
        datasets: [
            {
                label: 'Revenue',
                data: [300, 450, 350, 800, 300],
                borderColor: 'rgba(0, 0, 0, 1)',
                backgroundColor: 'rgba(139, 0, 0, 1)',
                pointBackgroundColor: 'rgba(139, 0, 0, 1)',
                fill: true,
            },
        ],
    };

    const chartOptions = {
        scales: {
            x: {
                grid: {
                    color: 'rgba(0, 0, 0, 1)',
                },
            },
            y: {
                grid: {
                    color: 'rgba(0, 0, 0, 1)',
                },
            },
        },
    };

    // Sample data for the pending deliveries table
    const initialData = [
        { id: 1, firstName: 'Ahmad', lastName: 'Ali', email: 'ahmadd@email.com', city: 'Lahore', zip: '123', status: 'Member' },
        { id: 2, firstName: 'Abubakar', lastName: 'Mumtaz', email: 'abubakar@email.com', city: 'Lahore', zip: '456', status: 'Member' },
        { id: 3, firstName: 'Muhammad', lastName: 'Haaris', email: 'Haaris@email.com', city: 'Lahore', zip: '789', status: 'Member' },
    ];

    const additionalData = [
        { id: 4, firstName: 'Ali', lastName: 'Khan', email: 'ali.khan@email.com', city: 'Karachi', zip: '101', status: 'Pending' },
        { id: 5, firstName: 'Sara', lastName: 'Ahmed', email: 'sara.ahmed@email.com', city: 'Faisalabad', zip: '202', status: 'Pending' },
        { id: 6, firstName: 'Hassan', lastName: 'Raza', email: 'hassan.raza@email.com', city: 'Multan', zip: '303', status: 'Pending' },
    ];

    return (
        <div className="min-h-screen flex">
            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-screen w-64 bg-gray-900 text-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } transition-transform lg:translate-x-0`}
            >
                <div className="p-4">
                    <h3 className="text-2xl font-bold text-red-500">Autopart Bazar</h3>
                </div>
                <nav className="mt-6">
                    <ul>
                        <li className="mb-4">
                            <a
                                href="/addproduct"
                                className="block py-4 px-6 text-lg text-gray-300 hover:bg-black hover:text-red-500 rounded-lg"
                            >
                                Add product
                            </a>
                        </li>
                        <li className="mb-4">
                            <a
                                href="/removeproduct"
                                className="block py-4 px-6 text-lg text-gray-300 hover:bg-black hover:text-red-500 rounded-lg"
                            >
                                Remove product
                            </a>
                        </li>
                        <li className="mb-4">
                            <a
                                href="/updateproduct"
                                className="block py-4 px-6 text-lg text-gray-300 hover:bg-black hover:text-red-500 rounded-lg"
                            >
                                Update product
                            </a>
                        </li>
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-black lg:ml-64">
                {/* Navbar */}
                <header className="bg-gray-900 text-white flex items-center px-6 py-4 relative">
                    {/* Dashboard Title */}
                    <h1 className="absolute left-1/2 transform -translate-x-1/2 text-2xl font-semibold text-red-500">
                        Dashboard
                    </h1>

                    {/* Right Section */}
                    <div className="ml-auto relative">
                        <button
                            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                            className="flex items-center text-gray-300 focus:outline-none"
                        >
                            <img
                                src="/Images/admin.jpeg"
                                alt="Profile"
                                className="w-8 h-8 rounded-full"
                            />
                            <span className="ml-2 text-sm">Admin</span>
                        </button>
                    </div>
                </header>

                {/* Dashboard Content */}
                <main className="p-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-gray-900 rounded shadow p-4">
                            <div className="flex items-center space-x-4">
                                <i className="fas fa-chart-line text-red-500 text-2xl"></i>
                                <div>
                                    <p className="text-gray-300">Today Sale</p>
                                    <p className="text-white text-xl font-semibold">$1234</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-900 rounded shadow p-4">
                            <div className="flex items-center space-x-4">
                                <i className="fas fa-chart-bar text-red-500 text-2xl"></i>
                                <div>
                                    <p className="text-gray-300">Total Return</p>
                                    <p className="text-white text-xl font-semibold">$5678</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-900 rounded shadow p-4">
                            <div className="flex items-center space-x-4">
                                <i className="fas fa-chart-area text-red-500 text-2xl"></i>
                                <div>
                                    <p className="text-gray-300">Today Revenue</p>
                                    <p className="text-white text-xl font-semibold">$91011</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-900 rounded shadow p-4">
                            <div className="flex items-center space-x-4">
                                <i className="fas fa-chart-pie text-red-500 text-2xl"></i>
                                <div>
                                    <p className="text-gray-300">Total Loss</p>
                                    <p className="text-white text-xl font-semibold">$121314</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-6">
                        <div className="bg-gray-900 rounded shadow p-4 h-full">
                            <h6 className="mb-4 text-white">Single Line Chart</h6>
                            <Line data={lineChartData} options={chartOptions} />
                        </div>
                        <div className="bg-gray-900 rounded shadow p-4 h-full">
                            <h6 className="mb-4 text-white">Revenue Line Chart</h6>
                            <Line data={revenueChartData} options={chartOptions} />
                        </div>
                    </div>

                    {/* Pending Deliveries Table */}
                    <div className="bg-gray-900 rounded shadow mt-6">
                        <h6 className="p-4 text-lg text-white">Pending Deliveries</h6>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-800">
                                    <tr>
                                        <th className="px-4 py-2 text-white border-b border-gray-700">ID</th>
                                        <th className="px-4 py-2 text-white border-b border-gray-700">First Name</th>
                                        <th className="px-4 py-2 text-white border-b border-gray-700">Last Name</th>
                                        <th className="px-4 py-2 text-white border-b border-gray-700">Email</th>
                                        <th className="px-4 py-2 text-white border-b border-gray-700">City</th>
                                        <th className="px-4 py-2 text-white border-b border-gray-700">Zip</th>
                                        <th className="px-4 py-2 text-white border-b border-gray-700">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="text-white">
                                    {showMore
                                        ? [...initialData, ...additionalData].map((item) => (
                                            <tr key={item.id} className="border-b border-gray-700">
                                                <td className="px-4 py-2 border-r border-gray-700">{item.id}</td>
                                                <td className="px-4 py-2 border-r border-gray-700">{item.firstName}</td>
                                                <td className="px-4 py-2 border-r border-gray-700">{item.lastName}</td>
                                                <td className="px-4 py-2 border-r border-gray-700">{item.email}</td>
                                                <td className="px-4 py-2 border-r border-gray-700">{item.city}</td>
                                                <td className="px-4 py-2 border-r border-gray-700">{item.zip}</td>
                                                <td className="px-4 py-2">{item.status}</td>
                                            </tr>
                                        ))
                                        : initialData.map((item) => (
                                            <tr key={item.id} className="border-b border-gray-700">
                                                <td className="px-4 py-2 border-r border-gray-700">{item.id}</td>
                                                <td className="px-4 py-2 border-r border-gray-700">{item.firstName}</td>
                                                <td className="px-4 py-2 border-r border-gray-700">{item.lastName}</td>
                                                <td className="px-4 py-2 border-r border-gray-700">{item.email}</td>
                                                <td className="px-4 py-2 border-r border-gray-700">{item.city}</td>
                                                <td className="px-4 py-2 border-r border-gray-700">{item.zip}</td>
                                                <td className="px-4 py-2">{item.status}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 flex justify-center">
                            <button
                                onClick={() => setShowMore(!showMore)}
                                className="text-red-500 text-sm"
                            >
                                {showMore ? 'Show Less' : 'Show More'}
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
    {/* Order Dispatched Table */}
    <div className="bg-gray-900 rounded shadow p-4">
        <div className="flex justify-between items-center mb-4">
            <h6 className="text-white text-lg">Order Dispatched</h6>
            <a href="#" className="text-red-500 text-sm">Show All</a>
        </div>
        <ul>
            {[
                { id: 'P101', firstName: 'Ahmad', timestamp: '10 minutes ago' },
                { id: 'P102', firstName: 'Sara', timestamp: '20 minutes ago' },
                { id: 'P103', firstName: 'Ali', timestamp: '30 minutes ago' },
                { id: 'P104', firstName: 'Hassan', timestamp: '45 minutes ago' },
            ].map((item, index) => (
                <li
                    key={index}
                    className="flex justify-between items-center mb-2 border-b border-gray-800 pb-2"
                >
                    <div>
                        <p className="text-white">Product ID: {item.id}</p>
                        <p className="text-gray-400 text-sm">First Name: {item.firstName}</p>
                    </div>
                    <p className="text-gray-400 text-sm">{item.timestamp}</p>
                </li>
            ))}
        </ul>
    </div>

    {/* Delivered Table */}
    <div className="bg-gray-900 rounded shadow p-4">
        <div className="flex justify-between items-center mb-4">
            <h6 className="text-white text-lg">Delivered</h6>
            <a href="#" className="text-red-500 text-sm">Show All</a>
        </div>
        <ul>
            {[
                { id: 'P201', firstName: 'Zain', timestamp: '1 hour ago' },
                { id: 'P202', firstName: 'Mariam', timestamp: '2 hours ago' },
                { id: 'P203', firstName: 'Usman', timestamp: '3 hours ago' },
                { id: 'P204', firstName: 'Noor', timestamp: '4 hours ago' },
            ].map((item, index) => (
                <li
                    key={index}
                    className="flex justify-between items-center mb-2 border-b border-gray-800 pb-2"
                >
                    <div>
                        <p className="text-white">Product ID: {item.id}</p>
                        <p className="text-gray-400 text-sm">First Name: {item.firstName}</p>
                    </div>
                    <p className="text-gray-400 text-sm">{item.timestamp}</p>
                </li>
            ))}
        </ul>
    </div>
</div>


                    <footer className="bg-secondary mt-auto p-4">
                        <div className="container-fluid">
                            <div className="row">
                                <div className="col-12 col-sm-6 text-center text-sm-start text-gray-300">
                                    &copy; <a href="#" className="text-white">AutopartBazar</a>, All Right Reserved.
                                </div>
                            </div>
                        </div>
                    </footer>
                </main>
            </div>
        </div>
    );
}
