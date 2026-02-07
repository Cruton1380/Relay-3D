/**
 * Guardian Recovery Setup Component
 * 
 * Allows users to configure their guardian-based recovery system,
 * set thresholds, add guardians, and distribute key shards.
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Alert, AlertDescription } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { 
  Shield, 
  Users, 
  Key, 
  UserPlus, 
  UserMinus, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Download
} from 'lucide-react';

const GuardianRecoverySetup = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Setup form state
  const [threshold, setThreshold] = useState(3);
  const [totalShares, setTotalShares] = useState(5);
  const [newGuardianId, setNewGuardianId] = useState('');
  const [guardians, setGuardians] = useState([]);
  
  // Backup options
  const [backupOptions, setBackupOptions] = useState({
    keySpaceBackup: true,
    emergencyPrintout: false,
    coldStorage: false
  });

  useEffect(() => {
    loadRecoveryStatus();
  }, []);

  const loadRecoveryStatus = async () => {
    try {
      const response = await fetch('/api/guardian-recovery/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setConfig(result.data);
          setThreshold(result.data.threshold);
          setTotalShares(result.data.totalShares);
          setGuardians(result.data.guardians || []);
        }
      } else if (response.status === 404) {
        // No configuration found - user needs to set up
        setConfig(null);
      }
    } catch (err) {
      setError('Failed to load recovery configuration');
    } finally {
      setLoading(false);
    }
  };

  const initializeRecovery = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/guardian-recovery/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          threshold,
          totalShares,
          guardians,
          backupOptions
        })
      });

      const result = await response.json();
      if (result.success) {
        setSuccess('Recovery configuration initialized successfully');
        setConfig(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to initialize recovery configuration');
    } finally {
      setLoading(false);
    }
  };

  const distributeShards = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, this would get the user's private key securely
      const privateKey = 'placeholder-private-key-hex';
      
      const response = await fetch('/api/guardian-recovery/distribute-shards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          privateKey,
          guardianIds: guardians,
          redistributeExisting: true
        })
      });

      const result = await response.json();
      if (result.success) {
        setSuccess(`Key shards distributed to ${result.data.guardianShares} guardians`);
        loadRecoveryStatus(); // Refresh status
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to distribute key shards');
    } finally {
      setLoading(false);
    }
  };

  const addGuardian = async () => {
    if (!newGuardianId.trim()) {
      setError('Please enter a guardian ID');
      return;
    }

    if (guardians.includes(newGuardianId)) {
      setError('Guardian already exists');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/guardian-recovery/guardians/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          guardianId: newGuardianId,
          redistributeShares: true
        })
      });

      const result = await response.json();
      if (result.success) {
        setGuardians([...guardians, newGuardianId]);
        setNewGuardianId('');
        setSuccess(`Guardian ${newGuardianId} added successfully`);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to add guardian');
    } finally {
      setLoading(false);
    }
  };

  const removeGuardian = async (guardianId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/guardian-recovery/guardians/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          guardianId
        })
      });

      const result = await response.json();
      if (result.success) {
        setGuardians(guardians.filter(g => g !== guardianId));
        setSuccess(`Guardian ${guardianId} removed and shares revoked`);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to remove guardian');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !config) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading recovery configuration...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Shield className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Guardian Recovery Setup</h1>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="guardians">Guardians</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="w-5 h-5" />
                <span>Recovery Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="threshold">Recovery Threshold</Label>
                  <Input
                    id="threshold"
                    type="number"
                    min="2"
                    max="10"
                    value={threshold}
                    onChange={(e) => setThreshold(parseInt(e.target.value))}
                    disabled={config !== null}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Number of guardian approvals needed for recovery
                  </p>
                </div>
                <div>
                  <Label htmlFor="totalShares">Total Shares</Label>
                  <Input
                    id="totalShares"
                    type="number"
                    min={threshold}
                    max="15"
                    value={totalShares}
                    onChange={(e) => setTotalShares(parseInt(e.target.value))}
                    disabled={config !== null}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Total number of key shards to create
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Backup Options</Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={backupOptions.keySpaceBackup}
                      onChange={(e) => setBackupOptions({
                        ...backupOptions,
                        keySpaceBackup: e.target.checked
                      })}
                    />
                    <span>Store backup share in KeySpace</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={backupOptions.emergencyPrintout}
                      onChange={(e) => setBackupOptions({
                        ...backupOptions,
                        emergencyPrintout: e.target.checked
                      })}
                    />
                    <span>Generate emergency printout/QR code</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={backupOptions.coldStorage}
                      onChange={(e) => setBackupOptions({
                        ...backupOptions,
                        coldStorage: e.target.checked
                      })}
                    />
                    <span>Cold storage backup</span>
                  </label>
                </div>
              </div>

              {!config ? (
                <Button 
                  onClick={initializeRecovery}
                  disabled={loading || guardians.length < threshold}
                  className="w-full"
                >
                  Initialize Recovery Configuration
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button 
                    onClick={distributeShards}
                    disabled={loading || guardians.length < threshold}
                    className="w-full"
                  >
                    Distribute Key Shards to Guardians
                  </Button>
                  <p className="text-sm text-gray-500">
                    This will split your private key and distribute shards to your guardians
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guardians" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Guardian Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter guardian user ID"
                  value={newGuardianId}
                  onChange={(e) => setNewGuardianId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addGuardian()}
                />
                <Button onClick={addGuardian} disabled={loading}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Guardian
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Current Guardians ({guardians.length})</Label>
                {guardians.length === 0 ? (
                  <p className="text-gray-500">No guardians configured</p>
                ) : (
                  <div className="space-y-2">
                    {guardians.map((guardianId) => (
                      <div key={guardianId} className="flex items-center justify-between p-2 border rounded">
                        <span>{guardianId}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeGuardian(guardianId)}
                          disabled={loading}
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {guardians.length < threshold && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    You need at least {threshold} guardians to meet your recovery threshold.
                    Currently have {guardians.length} guardians.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recovery Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {config ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Configuration</Label>
                    <div className="space-y-1 text-sm">
                      <div>Threshold: {config.threshold} of {config.totalShares}</div>
                      <div>Guardians: {config.guardianCount}</div>
                      <div>Last Updated: {new Date(config.lastUpdated).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="space-y-1">
                      <Badge variant={config.isConfigured ? "success" : "warning"}>
                        {config.isConfigured ? "Configured" : "Not Configured"}
                      </Badge>
                      {config.activeRecovery && (
                        <Badge variant="warning">
                          Active Recovery: {config.activeRecovery.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No recovery configuration found</p>
              )}

              {config?.activeRecovery && (
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium">Active Recovery Session</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div>Recovery ID: {config.activeRecovery.recoveryId}</div>
                      <div>Status: {config.activeRecovery.status}</div>
                      <div>Approvals: {config.activeRecovery.approvedCount} / {config.activeRecovery.requiredThreshold}</div>
                      <div>Expires: {new Date(config.activeRecovery.expiresAt).toLocaleString()}</div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Security Audit</span>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Audit functionality will be implemented here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GuardianRecoverySetup;
