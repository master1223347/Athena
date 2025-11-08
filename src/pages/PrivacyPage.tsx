import React from "react";
import { Link } from "react-router-dom";

const PrivacyPage: React.FC = () => (
  <div className="min-h-screen bg-white">
    {/* Header (reuse your nav if needed) */}
    <header className="bg-white shadow-sm py-3 px-4 md:px-8 fixed top-0 left-0 w-full z-50">
      <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
          <div className="bg-blue-500 text-white p-1.5 rounded-lg font-bold">IQ</div>
          <span className="text-xl font-bold text-slate-800">Athena</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/terms" className="text-blue-600 hover:text-blue-700 font-medium">Terms</Link>
          <Link to="/privacy" className="text-blue-600 hover:text-blue-700 font-medium">Privacy</Link>
        </div>
      </div>
    </header>

    <div className="flex justify-center pt-28 pb-16 px-2">
      {/* Main Content */}
      <main className="max-w-3xl w-full bg-white">
        <h1 className="text-5xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-base text-slate-500 mb-8">Last updated: 05/03/25</p>
        <ol className="list-decimal pl-6 space-y-8 text-slate-800">
          <li>
            <h2 className="font-semibold text-lg mb-2">Information We Collect</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><b>Account Data:</b> name, email, Canvas LMS identifier</li>
              <li><b>Academic Data:</b> courses, grades, assignments, deadlines via Canvas API (read‑only)</li>
              <li><b>Usage Data:</b> feature interactions, session logs, device/browser details</li>
              <li><b>Performance Data:</b> XP, streaks, gamble records, ranking data</li>
            </ul>
          </li>
          <li>
            <h2 className="font-semibold text-lg mb-2">How We Use Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide and improve the Service</li>
              <li>Personalize your dashboard and recommendations</li>
              <li>Analyze aggregate trends for development</li>
              <li>Communicate updates, features, and offers</li>
              <li>Prevent fraud and ensure security</li>
            </ul>
          </li>
          <li>
            <h2 className="font-semibold text-lg mb-2">Data Sharing & Disclosure</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>We do not sell personal or academic data.</li>
              <li>We may disclose data if required by law or to protect rights.</li>
            </ul>
          </li>
          <li>
            <h2 className="font-semibold text-lg mb-2">Cookies & Tracking</h2>
            <p>We use cookies and similar technologies to manage sessions, preferences, and analytics. You may manage your cookie settings in your browser.</p>
          </li>
          <li>
            <h2 className="font-semibold text-lg mb-2">Data Retention</h2>
            <p>We retain your data only as long as necessary to provide the Service or as required by law. You may request deletion of your data at any time.</p>
          </li>
          <li>
            <h2 className="font-semibold text-lg mb-2">Security</h2>
            <p>We implement industry‑standard security measures (encryption in transit, secure storage, access controls). However, no system is completely secure.</p>
          </li>
          <li>
            <h2 className="font-semibold text-lg mb-2">Your Rights</h2>
            <p>
              Depending on your jurisdiction, you may have rights to access, correct, delete, or port your data.
              To exercise these rights, contact us through this form:{" "}
              <a href="https://forms.gle/tFNcf4jXvf8qtWqA8" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
                https://forms.gle/tFNcf4jXvf8qtWqA8
              </a>.
            </p>
          </li>
          <li>
            <h2 className="font-semibold text-lg mb-2">Children's Privacy</h2>
            <p>We do not knowingly collect data from children under 13 without verifiable parental consent.</p>
          </li>
          <li>
            <h2 className="font-semibold text-lg mb-2">International Transfer</h2>
            <p>Your data may be transferred to servers in other countries. By using the Service, you consent to this transfer under applicable data protection laws.</p>
          </li>
          <li>
            <h2 className="font-semibold text-lg mb-2">Changes to Policy</h2>
            <p>We may update this Privacy Policy. We will notify you by email or in the app. Continued use indicates your acceptance.</p>
          </li>
        </ol>
      </main>
      {/* Sidebar */}
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

export default PrivacyPage;
