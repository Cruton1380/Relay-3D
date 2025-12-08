/**
 * Guardian Recovery Dashboard
 * 
 * Interface for guardians to view and manage their recovery duties,
 * approve recovery requests, and monitor their guardian responsibilities.
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Alert, AlertDescription } from '../ui/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { 
  Shield, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  Key,
  History
} from 'lucide-react';

const GuardianRecoveryDashboard = () => {
  const [guardianDuties, setGuardianDuties] = useState([]);
  const [pendingRecoveries, setPendingRecoveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadGuardianData();
    // Poll for new recovery requests every 30 seconds
    const interval = setInterval(loadGuardianData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadGuardianData = async () => {
    try {
      // Load guardian duties
      const dutiesResponse = await fetch('/api/guardian-recovery/guardian-duties', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (dutiesResponse.ok) {
        const result = await dutiesResponse.json();
        if (result.success) {
          setGuardianDuties(result.data.guardianDuties);
        }
      }

      // Load pending recovery requests (this would need additional API endpoint)
      // For now, we'll simulate this
      setPendingRecoveries([]);

    } catch (err) {
      setError('Failed to load guardian data');
    } finally {
      setLoading(false);
    }
  };

  const approveRecovery = async (recoveryId) => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, this would require the guardian's signature
      const signature = 'guardian-signature-placeholder';

      const response = await fetch(`/api/guardian-recovery/approve/${recoveryId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          signature,
          consent: true
        })
      });

      const result = await response.json();
      if (result.success) {
        setSuccess(`Recovery ${recoveryId} approved successfully`);
        loadGuardianData(); // Refresh data
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to approve recovery');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor(diff / (60 * 1000));

    if (days > 0) return `${days} days ago`;
    if (hours > 0) return `${hours} hours ago`;
    if (minutes > 0) return `${minutes} minutes ago`;
    return 'Just now';
  };

  if (loading && guardianDuties.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading guardian dashboard...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Shield className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Guardian Dashboard</h1>
        <Badge variant="outline" className="ml-auto">
          {guardianDuties.filter(d => d.status === 'active').length} Active Duties
        </Badge>
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{guardianDuties.length}</p>
                <p className="text-sm text-gray-500">Total Guardian Duties</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Key className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {guardianDuties.filter(d => d.status === 'active').length}
                </p>
                <p className="text-sm text-gray-500">Active Key Shards</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{pendingRecoveries.length}</p>
                <p className="text-sm text-gray-500">Pending Recoveries</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="duties" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="duties">My Guardian Duties</TabsTrigger>
          <TabsTrigger value="pending">Pending Recoveries</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="duties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Guardian Duties</CardTitle>
            </CardHeader>
            <CardContent>
              {guardianDuties.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">You are not currently a guardian for any users</p>
                  <p className="text-sm text-gray-400 mt-2">
                    When someone adds you as their recovery guardian, their key shards will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {guardianDuties.map((duty) => (
                    <Card key={duty.shareId} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">
                                User: {duty.originalUserId}
                              </span>
                              <Badge 
                                variant={duty.status === 'active' ? 'success' : 'secondary'}
                              >
                                {duty.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                              Share ID: {duty.shareId}
                            </p>
                            <p className="text-sm text-gray-500">
                              Assigned: {formatTimeAgo(duty.assignedAt)}
                            </p>
                            {duty.lastAccessed && (
                              <p className="text-sm text-gray-500">
                                Last accessed: {formatTimeAgo(duty.lastAccessed)}
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Recovery Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingRecoveries.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-500">No pending recovery requests</p>
                  <p className="text-sm text-gray-400 mt-2">
                    When users you're a guardian for request recovery, they'll appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRecoveries.map((recovery) => (
                    <Card key={recovery.recoveryId} className="border-l-4 border-l-orange-500">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">
                                Recovery Request from {recovery.userId}
                              </span>
                              <Badge variant="warning">
                                Pending Approval
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                              Recovery ID: {recovery.recoveryId}
                            </p>
                            <p className="text-sm text-gray-500">
                              Requested: {formatTimeAgo(recovery.initiatedAt)}
                            </p>
                            <p className="text-sm text-gray-500">
                              Expires: {new Date(recovery.expiresAt).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">
                              Approvals: {recovery.approvedCount} / {recovery.requiredThreshold}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              onClick={() => approveRecovery(recovery.recoveryId)}
                              disabled={loading}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve Recovery
                            </Button>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="w-5 h-5" />
                <span>Guardian Activity History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No guardian activity history</p>
                <p className="text-sm text-gray-400 mt-2">
                  Your guardian approvals and activities will appear here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Guardian Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Guardian Responsibilities</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <div className="space-y-2 text-sm">
            <p><strong>🔐 Security:</strong> You hold encrypted key shards for users who trust you as their guardian.</p>
            <p><strong>🚨 Recovery Approval:</strong> When users lose access, you can help them recover by approving their recovery request.</p>
            <p><strong>🔍 Verification:</strong> Always verify the identity of users requesting recovery through secure channels.</p>
            <p><strong>🗝️ Key Protection:</strong> Never share or expose the key shards stored in your account.</p>
            <p><strong>⏰ Responsiveness:</strong> Monitor for recovery requests as they have time limits (typically 24 hours).</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GuardianRecoveryDashboard;
