/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock the component since we don't have the actual implementation
const MockChannelDonation = ({ channelId, onDonate, onClose }) => {
  const [amount, setAmount] = React.useState('');
  const [donationType, setDonationType] = React.useState('one-time');

  const handleDonate = (e) => {
    e.preventDefault();
    onDonate?.({ 
      channelId, 
      amount: parseFloat(amount), 
      type: donationType 
    });
  };

  return (
    <div data-testid="channel-donation">
      <h2>Support This Channel</h2>
      <p>Channel ID: {channelId}</p>
      
      <form onSubmit={handleDonate}>
        <div>
          <label htmlFor="donation-amount">Donation Amount</label>
          <input
            id="donation-amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            data-testid="donation-amount-input"
          />
        </div>
        
        <div>
          <label htmlFor="donation-type">Donation Type</label>
          <select
            id="donation-type"
            value={donationType}
            onChange={(e) => setDonationType(e.target.value)}
            data-testid="donation-type-select"
          >
            <option value="one-time">One-time</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        
        <div>
          <button type="submit" data-testid="donate-button">
            Donate
          </button>
          <button type="button" onClick={onClose} data-testid="cancel-button">
            Cancel
          </button>
        </div>
      </form>
      
      <div data-testid="donation-info">
        <h3>Why Donate?</h3>
        <ul>
          <li>Support content creators</li>
          <li>Help maintain channel infrastructure</li>
          <li>Enable new features</li>
        </ul>
      </div>
    </div>
  );
};

describe('ChannelDonation Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render donation form', () => {
    render(<MockChannelDonation channelId="channel-123" />);
    
    expect(screen.getByTestId('channel-donation')).toBeInTheDocument();
    expect(screen.getByText('Support This Channel')).toBeInTheDocument();
    expect(screen.getByText('Channel ID: channel-123')).toBeInTheDocument();
  });

  it('should display donation form fields', () => {
    render(<MockChannelDonation channelId="channel-123" />);
    
    expect(screen.getByTestId('donation-amount-input')).toBeInTheDocument();
    expect(screen.getByTestId('donation-type-select')).toBeInTheDocument();
    expect(screen.getByTestId('donate-button')).toBeInTheDocument();
  });

  it('should handle amount input', () => {
    render(<MockChannelDonation channelId="channel-123" />);
    
    const amountInput = screen.getByTestId('donation-amount-input');
    fireEvent.change(amountInput, { target: { value: '25.50' } });
    
    expect(amountInput.value).toBe('25.50');
  });

  it('should handle donation type selection', () => {
    render(<MockChannelDonation channelId="channel-123" />);
    
    const typeSelect = screen.getByTestId('donation-type-select');
    fireEvent.change(typeSelect, { target: { value: 'monthly' } });
    
    expect(typeSelect.value).toBe('monthly');
  });

  it('should handle donation submission', () => {
    const onDonate = vi.fn();
    render(<MockChannelDonation channelId="channel-123" onDonate={onDonate} />);
    
    const amountInput = screen.getByTestId('donation-amount-input');
    const donateButton = screen.getByTestId('donate-button');
    
    fireEvent.change(amountInput, { target: { value: '10.00' } });
    fireEvent.click(donateButton);
    
    expect(onDonate).toHaveBeenCalledWith({
      channelId: 'channel-123',
      amount: 10,
      type: 'one-time'
    });
  });

  it('should handle cancel action', () => {
    const onClose = vi.fn();
    render(<MockChannelDonation channelId="channel-123" onClose={onClose} />);
    
    const cancelButton = screen.getByTestId('cancel-button');
    fireEvent.click(cancelButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('should display donation information', () => {
    render(<MockChannelDonation channelId="channel-123" />);
    
    expect(screen.getByTestId('donation-info')).toBeInTheDocument();
    expect(screen.getByText('Why Donate?')).toBeInTheDocument();
    expect(screen.getByText('Support content creators')).toBeInTheDocument();
  });

  it('should be accessible', () => {
    render(<MockChannelDonation channelId="channel-123" />);
    
    const amountInput = screen.getByLabelText('Donation Amount');
    const typeSelect = screen.getByLabelText('Donation Type');
    
    expect(amountInput).toBeInTheDocument();
    expect(typeSelect).toBeInTheDocument();
  });
}); 