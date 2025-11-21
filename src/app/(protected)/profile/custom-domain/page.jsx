"use client";

import React, { useState } from 'react';
import { ChevronDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const CustomDomainIntegration = () => {
  const [selectedWebsite, setSelectedWebsite] = useState('');
  const [domainName, setDomainName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [domains, setDomains] = useState([]);

  const websites = [
    { value: '', label: 'Select Website' },
    { value: 'website1', label: 'My Portfolio Site' },
    { value: 'website2', label: 'Business Landing Page' },
    { value: 'website3', label: 'E-commerce Store' },
  ];

  const handleConnectDomain = async () => {
    if (!selectedWebsite || !domainName) return;

    setLoading(true);

    try {
      // Replace this with your actual API call
      const response = await fetch('/api/connect-domain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          website: selectedWebsite,
          domain: domainName
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setDomains(prev => [...prev, {
          id: Date.now(),
          website: websites.find(w => w.value === selectedWebsite)?.label || selectedWebsite,
          customDomain: domainName,
          status: result.status || 'Pending',
        }]);
        setSelectedWebsite('');
        setDomainName('');
      } else {
        console.error('Failed to connect domain');
      }
    } catch (error) {
      console.error('Error connecting domain:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDomains = domains.filter(domain =>
    domain.website.toLowerCase().includes(searchTerm.toLowerCase()) ||
    domain.customDomain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDomains.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedDomains = filteredDomains.slice(startIndex, startIndex + entriesPerPage);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 bg-white">
      {/* Header */}
      <div className="space-y-2 pb-10">
        <h1 className="font-semibold text-2xl">Resell accounts</h1>
        <p className="text-gray-600">Expand Your Business by Managing Resell Accounts Effectively</p>
      </div>


      <div className="mb-8">
        <h1 className="text-md sm:text-xl font-medium text-gray-900 mb-6">
          Custom Domain Integration Rules
        </h1>

        {/* Integration Rules */}
        <div className="space-y-6 text-gray-700">
          {/* Rule 1 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              1. Change Nameservers
            </h2>
            <p className="mb-4">
              *Go to your domain registrar (e.g., GoDaddy, Namecheap, etc.), and edit your domain's DNS settings and change your domain's nameservers to
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-blue-800 font-mono text-sm">
                website.com
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-blue-800 font-mono text-sm">
               website.com
              </div>
            </div>
          </div>

          {/* Rule 2 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              2. Allow DNS Propagation Time
            </h2>
            <p className="mb-4">
              *Keep in mind that DNS changes may take up to 48 hours to propagate, although they often happen much quicker.
            </p>
          </div>

          {/* Rule 3 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              3. Verify & Connect Your Domain
            </h2>
            <p className="mb-2">
              *After saving your DNS settings, return to Weviy, enter your domain and click on "Connect Domain"
            </p>
            <p className="mb-4">
              *We will automatically detect the domain, link it to your site, and install an SSL certificate..
            </p>
          </div>
        </div>
      </div>

      {/* Domain Connection Form */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Website Address</h3>
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          {/* Website Select */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <select
                value={selectedWebsite}
                onChange={(e) => setSelectedWebsite(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none text-gray-700"
              >
                {websites.map((website) => (
                  <option key={website.value} value={website.value}>
                    {website.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Domain Input */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={domainName}
              onChange={(e) => setDomainName(e.target.value)}
              placeholder="Domain name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none"
              disabled={loading}
            />
          </div>

          {/* Connect Button */}
          <button
            onClick={handleConnectDomain}
            disabled={loading || !selectedWebsite || !domainName}
            className="px-5 py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors min-w-[160px] flex items-center justify-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Connect Domain'
            )}
          </button>
        </div>
      </div>

      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={entriesPerPage}
              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <span className="text-sm text-gray-600">entries per page</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Search:</span>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none w-full sm:w-64"
              placeholder="Search domains..."
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg mb-6">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Website
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Custom Domain
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedDomains.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                  No data available in table
                </td>
              </tr>
            ) : (
              paginatedDomains.map((domain) => (
                <tr key={domain.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {domain.website}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {domain.customDomain}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(domain.status)}`}>
                      {domain.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-700 hover:text-blue-800 text-sm font-medium">
                      Manage
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredDomains.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(startIndex + entriesPerPage, filteredDomains.length)} of {filteredDomains.length} {filteredDomains.length === 1 ? 'entry' : 'entries'}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 text-sm border rounded ${currentPage === pageNum
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDomainIntegration;