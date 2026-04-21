"use client";

import { useState } from "react";
import { 
  Search, 
  MessageCircle, 
  Mail, 
  Phone, 
  Clock, 
  HelpCircle, 
  Book, 
  Video, 
  Zap,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle,
  AlertCircle,
  FileText,
  Users,
  Settings,
  CreditCard,
  Rocket,
  Shield
} from "lucide-react";

export default function Support({ activePanel, setActivePanel }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [ticketForm, setTicketForm] = useState({
    name: "",
    email: "",
    subject: "",
    category: "General",
    message: ""
  });
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);

  const categories = [
    { name: "All", icon: <HelpCircle className="w-4 h-4" /> },
    { name: "Getting Started", icon: <Rocket className="w-4 h-4" /> },
    { name: "Account & Billing", icon: <CreditCard className="w-4 h-4" /> },
    { name: "Features", icon: <Zap className="w-4 h-4" /> },
    { name: "Technical", icon: <Settings className="w-4 h-4" /> },
    { name: "Security", icon: <Shield className="w-4 h-4" /> },
  ];

  const faqs = [
    {
      id: 1,
      question: "How do I get started with Creative Klux?",
      answer: "Getting started is easy! Sign up for a free account, complete the onboarding tutorial, and start creating. You can choose from templates or start from scratch using our AI-powered tools.",
      category: "Getting Started",
      popular: true
    },
    {
      id: 2,
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for enterprise accounts. All payments are processed securely through our encrypted payment gateway.",
      category: "Account & Billing",
      popular: true
    },
    {
      id: 3,
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your billing period. No cancellation fees or hidden charges.",
      category: "Account & Billing",
      popular: true
    },
    {
      id: 4,
      question: "What AI features are included?",
      answer: "Creative Klux includes text-to-image generation, text-to-video creation, image variations, background removal, AI writing assistant, script-to-video, and smart design suggestions. All AI features are included in paid plans.",
      category: "Features",
      popular: true
    },
    {
      id: 5,
      question: "How many projects can I create?",
      answer: "Free accounts can create up to 3 projects. Pro accounts have unlimited projects. Each project can contain multiple assets, designs, and variations.",
      category: "Features",
      popular: false
    },
    {
      id: 6,
      question: "Can I collaborate with my team?",
      answer: "Yes! Team and Enterprise plans include collaboration features like shared workspaces, comments, version history, and role-based permissions. You can invite unlimited team members.",
      category: "Features",
      popular: true
    },
    {
      id: 7,
      question: "What file formats can I export?",
      answer: "You can export your creations in PNG, JPG, SVG, PDF, MP4, and GIF formats. We also support high-resolution exports for print materials.",
      category: "Technical",
      popular: false
    },
    {
      id: 8,
      question: "Is my data secure?",
      answer: "Absolutely. We use bank-level 256-bit SSL encryption for all data transmission. Your files are stored on secure servers with regular backups. We're GDPR compliant and never share your data with third parties.",
      category: "Security",
      popular: true
    },
    {
      id: 9,
      question: "Do you offer refunds?",
      answer: "Yes, we offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact our support team within 30 days of purchase for a full refund.",
      category: "Account & Billing",
      popular: false
    },
    {
      id: 10,
      question: "How do I upgrade my plan?",
      answer: "You can upgrade your plan anytime from the Billing section in your account settings. The upgrade takes effect immediately, and you'll only pay the prorated difference.",
      category: "Account & Billing",
      popular: false
    },
    {
      id: 11,
      question: "Can I use Creative Klux offline?",
      answer: "Creative Klux is a cloud-based platform that requires an internet connection. However, we're working on an offline mode that will be available soon for desktop users.",
      category: "Technical",
      popular: false
    },
    {
      id: 12,
      question: "What browsers are supported?",
      answer: "Creative Klux works best on the latest versions of Chrome, Firefox, Safari, and Edge. We recommend using Chrome for the best experience with AI features.",
      category: "Technical",
      popular: false
    }
  ];

  const contactMethods = [
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Live Chat",
      description: "Chat with our support team",
      availability: "Mon-Fri, 9 AM - 6 PM EST",
      action: "Start Chat",
      color: "bg-blue-500"
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email Support",
      description: "support@creativeklux.com",
      availability: "Response within 24 hours",
      action: "Send Email",
      color: "bg-purple-500"
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Phone Support",
      description: "+1 (555) 123-4567",
      availability: "Enterprise customers only",
      action: "Call Us",
      color: "bg-green-500"
    }
  ];

  const resources = [
    {
      icon: <Book className="w-8 h-8" />,
      title: "Documentation",
      description: "Comprehensive guides and API docs",
      link: "#",
      color: "bg-orange-100 text-orange-600"
    },
    {
      icon: <Video className="w-8 h-8" />,
      title: "Video Tutorials",
      description: "Step-by-step video guides",
      link: "#",
      color: "bg-red-100 text-red-600"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Community Forum",
      description: "Connect with other users",
      link: "#",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Blog & Updates",
      description: "Latest news and tips",
      link: "#",
      color: "bg-green-100 text-green-600"
    }
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const popularFaqs = faqs.filter(faq => faq.popular);

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    setTicketSubmitted(true);
    setTimeout(() => {
      setShowTicketForm(false);
      setTicketSubmitted(false);
      setTicketForm({
        name: "",
        email: "",
        subject: "",
        category: "General",
        message: ""
      });
    }, 3000);
  };

  return (
    <div className="min-h-screen px-13 py-5">
      <div className="">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16  rounded-2xl mb-4">
            <HelpCircle className="w-12 h-12 text-blue-700" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">How can we help you?</h1>
          <p className="text-gray-600 text-md">Search our knowledge base or get in touch with our support team</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-36">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              placeholder="Search for answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-500 hover:shadow"
            />
          </div>
        </div>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          {contactMethods.map((method, index) => (
            <div key={index} className="bg-white rounded-xl p-5 hover:shadow hover:border-blue-700 transition-all duration-300 border  cursor-pointer border-gray-200">
              <div className={`w-12 h-12 ${method.color} rounded-lg flex items-center justify-center text-white mb-4`}>
                {method.icon}
              </div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">{method.title}</h3>
              <p className="text-gray-600 text-sm mb-2">{method.description}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                <Clock className="w-3 h-3" />
                {method.availability}
              </div>
              <button className="w-full cursor-pointer border border-gray-200 hover:bg-gray-100 hover:scale-95 text-gray-800 font-medium py-2 px-4 rounded-lg transition-all duration-200">
                {method.action}
              </button>
            </div>
          ))}
        </div>

        {/* Submit a Ticket */}
        {/* <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 mb-12 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Need More Help?</h2>
              <p className="text-blue-100">Submit a support ticket and we'll get back to you within 24 hours</p>
            </div>
            <button
              onClick={() => setShowTicketForm(!showTicketForm)}
              className="bg-white text-blue-600 font-bold px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Submit Ticket
            </button>
          </div>
        </div> */}

        {/* Ticket Form Modal */}
        {/* {showTicketForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl">
              {!ticketSubmitted ? (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Submit a Support Ticket</h2>
                    <button
                      onClick={() => setShowTicketForm(false)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ×
                    </button>
                  </div>
                  <form onSubmit={handleTicketSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                        <input
                          type="text"
                          required
                          value={ticketForm.name}
                          onChange={(e) => setTicketForm({...ticketForm, name: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input
                          type="email"
                          required
                          value={ticketForm.email}
                          onChange={(e) => setTicketForm({...ticketForm, email: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={ticketForm.category}
                        onChange={(e) => setTicketForm({...ticketForm, category: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option>General</option>
                        <option>Technical Issue</option>
                        <option>Billing</option>
                        <option>Feature Request</option>
                        <option>Bug Report</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                      <input
                        type="text"
                        required
                        value={ticketForm.subject}
                        onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Brief description of your issue"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                      <textarea
                        required
                        value={ticketForm.message}
                        onChange={(e) => setTicketForm({...ticketForm, message: e.target.value})}
                        rows={6}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Describe your issue in detail..."
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Send className="w-5 h-5" />
                      Submit Ticket
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Ticket Submitted!</h3>
                  <p className="text-gray-600">We've received your ticket and will respond within 24 hours.</p>
                </div>
              )}
            </div>
          </div>
        )} */}

        {/* Popular FAQs */}
        <div className="mb-12">
          <h2 className="text-xl font-medium text-gray-900 mb-6">Popular Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {popularFaqs.map((faq) => (
              <div
                key={faq.id}
                className="bg-white rounded-lg p-5 hover:shadow transition-all duration-300 border border-gray-200 cursor-pointer"
                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-md text-gray-800 flex items-start gap-2">
                      <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      {faq.question}
                    </h3>
                    {expandedFaq === faq.id && (
                      <p className="text-gray-500 text-sm mt-3 pl-7">{faq.answer}</p>
                    )}
                  </div>
                  {expandedFaq === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Browse by Category</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`flex items-center cursor-pointer gap-2 px-4 py-2 rounded-lg font-normal whitespace-nowrap transition-all duration-300 ${
                  selectedCategory === category.name
                    ? "bg-blue-600 text-white "
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                {category.icon}
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* All FAQs */}
        <div className="mb-12">
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            {selectedCategory === "All" ? "All Questions" : `${selectedCategory} Questions`}
          </h2>
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No questions found</p>
              <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-white rounded-lg p-5 hover:shadow transition-all duration-300 border border-gray-200 cursor-pointer"
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-md text-gray-900">{faq.question}</h3>
                        <span className="text-xs bg-blue-100 text-blue-500 px-2 py-1 rounded-full font-medium">
                          {faq.category}
                        </span>
                      </div>
                      {expandedFaq === faq.id && (
                        <p className="text-gray-600 text-sm mt-3">{faq.answer}</p>
                      )}
                    </div>
                    {expandedFaq === faq.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resources */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-6">Additional Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {resources.map((resource, index) => (
              <a
                key={index}
                href={resource.link}
                className="bg-white rounded-lg p-6 hover:scale-105 transition-all duration-300 border border-gray-200 group"
              >
                <div className={`w-14 h-14 ${resource.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  {resource.icon}
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {resource.title}
                </h3>
                <p className="text-gray-600 text-sm">{resource.description}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}