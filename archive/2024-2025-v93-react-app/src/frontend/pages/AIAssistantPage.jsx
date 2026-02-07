/**
 * @fileoverview AI Assistant Page
 * Main page for interacting with Navigator and Architect AI agents
 */
import React from 'react';
import AIAssistant from '../components/ai/AIAssistant';
import { Helmet } from 'react-helmet-async';

const AIAssistantPage = () => {
  return (
    <>
      <Helmet>
        <title>AI Assistant - Relay</title>
        <meta name="description" content="Get help from Navigator and Architect AI agents for democratic participation and development" />
      </Helmet>
      
      <div className="page-container full-height">
        <AIAssistant />
      </div>
    </>
  );
};

export default AIAssistantPage; 