import React from "react";
import { Link } from "react-router-dom";

const TermsPage: React.FC = () => (
  <div className="min-h-screen bg-white">
    {/* Header */}
    <header className="bg-white shadow-sm py-3 px-4 md:px-8 fixed top-0 left-0 w-full z-50">
      <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
          <div className="bg-blue-500 text-white p-1.5 rounded-lg font-bold">IQ</div>
          <span className="text-xl font-bold text-slate-800">Athena</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">Home</Link>
          <Link to="/terms" className="text-blue-600 hover:text-blue-700 font-medium">Terms</Link>
          <Link to="/privacy" className="text-blue-600 hover:text-blue-700 font-medium">Privacy</Link>
        </div>
      </div>
    </header>

    <div className="flex justify-center pt-28 pb-16 px-2">
      {/* Main Content */}
      <main className="max-w-3xl w-full bg-white">
        <h1 className="text-5xl font-bold mb-6">Terms of Service</h1>
        <p className="text-base text-slate-500 mb-8">Last updated: 05/03/25</p>
        <ol className="list-decimal pl-6 space-y-8 text-slate-800">
          <li>
            <h2 className="font-semibold text-lg mb-2">Definitions</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>“Service” means the Athena applications and website.</li>
              <li>“User,” “you,” “your” means any individual or entity accessing or using the Service.</li>
              <li>“Content” means all text, data, information, software, graphics, and other materials provided by the Service.</li>
            </ul>
          </li>
          <li>
            <h2 className="font-semibold text-lg mb-2">Acceptance</h2>
            <p>By creating an account or using the Service, you agree to these Terms. If you do not agree, do not use the Service.</p>
          </li>
          <li>
            <h2 className="font-semibold text-lg mb-2">Eligibility</h2>
            <p>You must be at least 13 years old (or older as required by your jurisdiction) to use the Service. If under 18, you must have parental consent.</p>
          </li>
          <li>
            <h2 className="font-semibold text-lg mb-2">Accounts & Access</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><b>4.1 Registration.</b> You agree to provide accurate information and keep your credentials secure.</li>
              <li><b>4.2 Canvas Integration.</b> You authorize Gambit to access your Canvas LMS data (read‑only) under your Canvas credentials. You may revoke this access at any time in your Canvas account settings.</li>
            </ul>
          </li>
          <li>
            <h2 className="font-semibold text-lg mb-2">User Conduct</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>You will not use the Service to violate any applicable laws or infringe others' rights.</li>
              <li>You will not reverse‑engineer, sublicense, redistribute, or misuse the Service in any way.</li>
              <li>Inappropriate content (harassing, defamatory, obscene, or infringing) is prohibited, and Athena may remove it at its discretion.</li>
            </ul>
          </li>
          <li>
            <h2 className="font-semibold text-lg mb-2">Subscriptions, Virtual Currency & Rewards</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>The Service may offer free and paid subscription tiers. Fees, billing, and cancellation terms will be disclosed at point of sale.</li>
              <li>Virtual points (XP) and in‑app rewards have no cash value and are non‑transferable and non‑redeemable for any real‑world item or currency.</li>
              <li>Athena reserves the right to modify, add, or remove features, XP mechanics, and rewards at any time.</li>
            </ul>
          </li>
          <li>
            <h2 className="font-semibold text-lg mb-2">Intellectual Property</h2>
            <p>All rights, title, and interest in the Service, Content, and trademarks belong to Athena or its licensors. You may not copy, modify, or distribute any part of the Service without prior written permission.</p>
          </li>
          <li>
            <h2 className="font-semibold text-lg mb-2">Privacy & Data Use</h2>
            <p>Your use of data is governed by our Privacy Policy, incorporated herein by reference. By using the Service, you consent to that Policy.</p>
          </li>
          <li>
            <h2 className="font-semibold text-lg mb-2">Disclaimers & Warranties</h2>
            <p>The Service is provided “AS IS,” without warranty of any kind. Athena disclaims all implied warranties, including merchantability, fitness for a particular purpose, and non‑infringement.</p>
          </li>
          <li>
            <h2 className="font-semibold text-lg mb-2">Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Athena will not be liable for indirect, incidental, special, or consequential damages arising out of your use of the Service.</p>
          </li>
          <li>
            <h2 className="font-semibold text-lg mb-2">Indemnification</h2>
            <p>You agree to indemnify, defend, and hold harmless Athena and its officers, directors, employees, and agents from any claims, damages, liabilities, or expenses arising from your use of the Service or violation of these Terms.</p>
          </li>
          <li>
            <h2 className="font-semibold text-lg mb-2">Termination</h2>
            <p>Athena may suspend or terminate your account if you breach these Terms or misuse the Service. Upon termination, your right to use the Service ceases immediately.</p>
          </li>
          <li>
            <h2 className="font-semibold text-lg mb-2">Governing Law</h2>
            <p>These Terms are governed by the laws of California, without regard to conflict of law principles. Any dispute will be resolved in court.</p>
          </li>
          <li>
            <h2 className="font-semibold text-lg mb-2">Changes to Terms</h2>
            <p>Athena may modify these Terms at any time. We will provide notice by email or in‑app notification. Continued use after changes constitutes acceptance.</p>
          </li>
        </ol>
      </main>
      {/* Sidebar for large screens (right side) */}
      <aside className="hidden lg:block ml-12 w-64">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 mt-2">
          <h3 className="font-semibold text-blue-800 mb-2">Related Policies</h3>
          <ul className="space-y-1 text-blue-700 text-sm">
            <li>
              <Link to="/terms" className="hover:underline">Terms of Service</Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
            </li>
          </ul>
        </div>
      </aside>
      {/* Sidebar */}
      <div className="block lg:hidden w-full mt-8">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 mx-auto max-w-md">
          <h3 className="font-semibold text-blue-800 mb-2">Related Policies</h3>
          <ul className="space-y-1 text-blue-700 text-sm">
            <li>
              <Link to="/terms" className="hover:underline">Terms of Service</Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
            </li>
          </ul>
        </div>
        
      </div>
    </div>
  </div>
);

export default TermsPage;
