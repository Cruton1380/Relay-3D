import React from "react";
import { Helmet } from "react-helmet-async";

const JuryInterfacePage = () => {
  return (
    <>
      <Helmet>
        <title>Jury Interface - Relay</title>
        <meta name="description" content="Participate in democratic content moderation and community justice" />
      </Helmet>
      <div className="page-container">
        <div className="max-w-6xl mx-auto py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Jury Interface</h1>
            <p className="text-lg text-gray-600">Participate in democratic content moderation and community justice</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 ml-3">Pending Cases</h3>
              </div>
              <div className="text-2xl font-bold text-red-600">5</div>
              <p className="text-sm text-gray-500">Cases requiring your review</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 ml-3">Cases Completed</h3>
              </div>
              <div className="text-2xl font-bold text-green-600">23</div>
              <p className="text-sm text-gray-500">Cases you've reviewed</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 ml-3">Accuracy Score</h3>
              </div>
              <div className="text-2xl font-bold text-blue-600">92%</div>
              <p className="text-sm text-gray-500">Community agreement rate</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Cases</h2>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center mb-2">
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">High Priority</span>
                      <span className="ml-2 text-sm text-gray-500">Case #JR-2024-001</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Content Moderation Review</h3>
                    <p className="text-gray-600">Review reported content for community guidelines violation</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Assigned: 2 hours ago</div>
                    <div className="text-sm text-red-600 font-medium">Due: 22 hours remaining</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Evidence:</span>
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">2 attachments</span>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Review Case
                  </button>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center mb-2">
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">Medium Priority</span>
                      <span className="ml-2 text-sm text-gray-500">Case #JR-2024-002</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Community Dispute Resolution</h3>
                    <p className="text-gray-600">Mediate channel ownership dispute between community members</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Assigned: 4 hours ago</div>
                    <div className="text-sm text-yellow-600 font-medium">Due: 20 hours remaining</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Evidence:</span>
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">5 attachments</span>
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Review Case
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Jury Guidelines</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Responsibilities</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    Review evidence objectively and thoroughly
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    Consider community standards and guidelines
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    Provide clear reasoning for decisions
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-600 mr-2">•</span>
                    Maintain confidentiality of case details
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Decision Process</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    Cases require majority consensus
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    Multiple jurors review each case
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    Appeals process available for complex cases
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    Transparent reporting of outcomes
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default JuryInterfacePage; 