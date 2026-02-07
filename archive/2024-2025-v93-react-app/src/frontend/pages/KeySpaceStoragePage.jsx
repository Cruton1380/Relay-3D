/**
 * KeySpace Storage Management Page
 * 
 * Main interface for managing decentralized storage,
 * plan selection, and monitoring storage usage with
 * Relay fallback options.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StoragePlanSelector from '../components/StoragePlanSelector';
import StorageMetricsDashboard from '../components/StorageMetricsDashboard';
import SimpleStorageEconomy from '../components/SimpleStorageEconomy';
import './KeySpaceStoragePage.css';

const KeySpaceStoragePage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('economy'); // 'files', 'metrics', 'economy'
    const [storageFiles, setStorageFiles] = useState([]);
    const [totalUsage, setTotalUsage] = useState({
        files: 0,
        totalSize: 0,
        monthlyCost: 0,
        relayShards: 0,
        p2pShards: 0
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [showPlanSelector, setShowPlanSelector] = useState(false);
    const [storageStats, setStorageStats] = useState({
        availability: { p2p: 0, relay: 0 },
        regions: [],
        activeProviders: 0
    });
    const [loading, setLoading] = useState(true);

    // Mock storage broker instance (in real app, would come from context/service)
    const [storageBroker] = useState({
        planConfigs: {
            basic: { totalShards: 3, threshold: 2, maxCostPerMonth: 10.0 },
            secure: { totalShards: 5, threshold: 3, maxCostPerMonth: 25.0 },
            vault: { totalShards: 8, threshold: 5, maxCostPerMonth: 50.0 }
        },
        getUserCredits: () => 250.50,
        storageRegistry: {
            checkRelayFallbackNeeded: async () => ({
                fallbackNeeded: true,
                p2pAvailable: 2,
                relayRequired: 3,
                estimatedCost: { p2p: 5.20, relay: 12.80, total: 18.00 }
            })
        }
    });

    useEffect(() => {
        loadStorageData();
    }, []);

    const loadStorageData = async () => {
        setLoading(true);
        try {
            // In real implementation, these would be API calls
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
            
            setStorageFiles([
                {
                    id: 'file_001',
                    name: 'Important Documents.zip',
                    size: 1024 * 1024 * 15, // 15MB
                    plan: 'secure',
                    status: 'active',
                    shards: { total: 5, p2p: 3, relay: 2 },
                    cost: { monthly: 8.50, total: 42.50 },
                    uploadedAt: '2024-01-15T10:30:00Z',
                    region: 'us-east-1'
                },
                {
                    id: 'file_002',
                    name: 'Family Photos 2024',
                    size: 1024 * 1024 * 250, // 250MB
                    plan: 'vault',
                    status: 'degraded',
                    shards: { total: 8, p2p: 6, relay: 2 },
                    cost: { monthly: 35.20, total: 176.00 },
                    uploadedAt: '2024-01-10T15:45:00Z',
                    region: 'eu-west-1'
                },
                {
                    id: 'file_003',
                    name: 'Project Backup.tar.gz',
                    size: 1024 * 1024 * 80, // 80MB
                    plan: 'basic',
                    status: 'active',
                    shards: { total: 3, p2p: 3, relay: 0 },
                    cost: { monthly: 4.20, total: 21.00 },
                    uploadedAt: '2024-01-20T09:15:00Z',
                    region: 'asia-pacific-1'
                }
            ]);

            setTotalUsage({
                files: 3,
                totalSize: 1024 * 1024 * 345, // 345MB
                monthlyCost: 47.90,
                relayShards: 4,
                p2pShards: 12
            });

            setStorageStats({
                availability: { p2p: 0.85, relay: 0.99 },
                regions: ['us-east-1', 'eu-west-1', 'asia-pacific-1'],
                activeProviders: 47
            });

        } catch (error) {
            console.error('Failed to load storage data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlanSelected = (planData) => {
        console.log('Plan selected:', planData);
        setShowPlanSelector(false);
        // In real implementation, this would trigger file upload flow
    };

    const handleFileUpload = () => {
        setShowPlanSelector(true);
    };

    const formatFileSize = (bytes) => {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return '#10B981';
            case 'degraded': return '#F59E0B';
            case 'failed': return '#EF4444';
            default: return '#6B7280';
        }
    };

    if (loading) {
        return (
            <div className="keyspace-storage-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading storage data...</p>
                </div>
            </div>
        );
    }    return (
        <div className="keyspace-storage-page">
            <header className="page-header">
                <h1>🗄️ KeySpace Storage</h1>
                <p>Secure, decentralized file storage with end-to-end encryption</p>
                
                <div className="header-actions">
                    <button 
                        className="btn btn-primary"
                        onClick={handleFileUpload}
                    >
                        📁 Upload File
                    </button>
                    <button 
                        className="btn btn-secondary"
                        onClick={() => navigate('/settings')}
                    >
                        ⚙️ Settings
                    </button>
                </div>
            </header>            {/* Navigation Tabs */}
            <nav className="storage-tabs">
                <button 
                    className={`tab ${activeTab === 'economy' ? 'active' : ''}`}
                    onClick={() => setActiveTab('economy')}
                >
                    💰 Storage Economy
                </button>
                <button 
                    className={`tab ${activeTab === 'files' ? 'active' : ''}`}
                    onClick={() => setActiveTab('files')}
                >
                    📁 My Files
                </button>
                <button 
                    className={`tab ${activeTab === 'metrics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('metrics')}
                >
                    📊 Network Metrics
                </button>
            </nav>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'files' && (
                    <div className="files-tab">
                        {/* Storage Overview */}
                        <section className="storage-overview">
                            <div className="overview-grid">
                                <div className="stat-card">
                                    <div className="stat-icon">📊</div>
                                    <div className="stat-content">
                                        <h3>Total Files</h3>
                                        <p className="stat-value">{totalUsage.files}</p>
                                        <p className="stat-detail">{formatFileSize(totalUsage.totalSize)}</p>
                                    </div>
                                </div>
                                
                                <div className="stat-card">
                                    <div className="stat-icon">💰</div>
                                    <div className="stat-content">
                                        <h3>Monthly Cost</h3>
                                        <p className="stat-value">${totalUsage.monthlyCost.toFixed(2)}</p>
                                        <p className="stat-detail">
                                            {totalUsage.p2pShards} P2P + {totalUsage.relayShards} Relay shards
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="stat-card">
                                    <div className="stat-icon">🌐</div>
                                    <div className="stat-content">
                                        <h3>Network Status</h3>
                                        <p className="stat-value">{Math.round(storageStats.availability.p2p * 100)}%</p>
                                        <p className="stat-detail">{storageStats.activeProviders} active providers</p>
                                    </div>
                                </div>
                                
                                <div className="stat-card">
                                    <div className="stat-icon">🛡️</div>
                                    <div className="stat-content">
                                        <h3>Relay Fallback</h3>
                                        <p className="stat-value">{Math.round(storageStats.availability.relay * 100)}%</p>
                                        <p className="stat-detail">Available when needed</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Files List */}
                        <section className="files-section">
                <h2>Your Files</h2>
                
                <div className="files-table">
                    <div className="table-header">
                        <div className="header-cell">File</div>
                        <div className="header-cell">Size</div>
                        <div className="header-cell">Plan</div>
                        <div className="header-cell">Shards</div>
                        <div className="header-cell">Cost</div>
                        <div className="header-cell">Status</div>
                        <div className="header-cell">Actions</div>
                    </div>
                    
                    {storageFiles.map(file => (
                        <div key={file.id} className="table-row">
                            <div className="cell file-cell">
                                <div className="file-info">
                                    <div className="file-name">{file.name}</div>
                                    <div className="file-date">
                                        Uploaded {formatDate(file.uploadedAt)}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="cell">{formatFileSize(file.size)}</div>
                            
                            <div className="cell">
                                <span className={`plan-badge plan-${file.plan}`}>
                                    {file.plan}
                                </span>
                            </div>
                            
                            <div className="cell">
                                <div className="shards-info">
                                    <div>{file.shards.total} total</div>
                                    <div className="shard-breakdown">
                                        {file.shards.p2p} P2P, {file.shards.relay} Relay
                                    </div>
                                </div>
                            </div>
                            
                            <div className="cell">
                                <div className="cost-info">
                                    <div>${file.cost.monthly.toFixed(2)}/mo</div>
                                    <div className="cost-total">${file.cost.total.toFixed(2)} total</div>
                                </div>
                            </div>
                            
                            <div className="cell">
                                <span 
                                    className="status-indicator"
                                    style={{ backgroundColor: getStatusColor(file.status) }}
                                >
                                    {file.status}
                                </span>
                            </div>
                            
                            <div className="cell actions-cell">
                                <button 
                                    className="btn btn-small"
                                    onClick={() => setSelectedFile(file)}
                                >
                                    📋 Details
                                </button>
                                <button className="btn btn-small btn-danger">
                                    🗑️ Delete
                                </button>
                            </div>                        </div>
                    ))}
                </div>
                
                {storageFiles.length === 0 && (
                    <div className="empty-state">
                        <p>No files stored yet</p>
                        <button 
                            className="btn btn-primary"
                            onClick={handleFileUpload}
                        >
                            Upload Your First File
                        </button>
                    </div>
                )}
            </section>
                    </div>
                )}                {activeTab === 'metrics' && (
                    <div className="metrics-tab">
                        <StorageMetricsDashboard />
                    </div>
                )}

                {activeTab === 'economy' && (
                    <div className="economy-tab">
                        <SimpleStorageEconomy />
                    </div>
                )}
            </div>

            {/* Plan Selector Modal */}
            {showPlanSelector && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Select Storage Plan</h2>
                            <button 
                                className="close-btn"
                                onClick={() => setShowPlanSelector(false)}
                            >
                                ✕
                            </button>
                        </div>
                        
                        <StoragePlanSelector
                            onPlanSelected={handlePlanSelected}
                            fileSize={1024 * 1024 * 10} // 10MB example
                            userRegion="us-east-1"
                            storageBroker={storageBroker}
                        />
                    </div>
                </div>
            )}

            {/* File Details Modal */}
            {selectedFile && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>File Details</h2>
                            <button 
                                className="close-btn"
                                onClick={() => setSelectedFile(null)}
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="file-details">
                            <div className="detail-section">
                                <h3>📁 {selectedFile.name}</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>Size:</label>
                                        <span>{formatFileSize(selectedFile.size)}</span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Plan:</label>
                                        <span className={`plan-badge plan-${selectedFile.plan}`}>
                                            {selectedFile.plan}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Status:</label>
                                        <span 
                                            className="status-indicator"
                                            style={{ backgroundColor: getStatusColor(selectedFile.status) }}
                                        >
                                            {selectedFile.status}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <label>Region:</label>
                                        <span>{selectedFile.region}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h4>🔀 Shard Distribution</h4>
                                <div className="shard-distribution">
                                    <div className="distribution-bar">
                                        <div 
                                            className="bar-segment p2p"
                                            style={{ 
                                                width: `${(selectedFile.shards.p2p / selectedFile.shards.total) * 100}%` 
                                            }}
                                        >
                                            P2P: {selectedFile.shards.p2p}
                                        </div>
                                        <div 
                                            className="bar-segment relay"
                                            style={{ 
                                                width: `${(selectedFile.shards.relay / selectedFile.shards.total) * 100}%` 
                                            }}
                                        >
                                            Relay: {selectedFile.shards.relay}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h4>💰 Cost Breakdown</h4>
                                <div className="cost-breakdown">
                                    <div className="cost-item">
                                        <span>Monthly Cost:</span>
                                        <span>${selectedFile.cost.monthly.toFixed(2)}</span>
                                    </div>
                                    <div className="cost-item">
                                        <span>Total Paid:</span>
                                        <span>${selectedFile.cost.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KeySpaceStoragePage;
