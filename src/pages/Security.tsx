"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff
} from 'lucide-react';

const Security = () => {
  const [showSecrets, setShowSecrets] = useState(false);
  const [securityAlerts] = useState([
    {
      id: 'alert-001',
      title: 'High Confidence Signal Detected',
      description: 'New contract deployment with potential airdrop mechanics',
      severity: 'high',
      timestamp: '2023-06-15T14:30:00Z',
      status: 'new'
    },
    {
      id: 'alert-002',
      title: 'Unusual Activity Pattern',
      description: 'Multiple rapid transactions from new address',
      severity: 'medium',
      timestamp: '2023-06-15T14:25:00Z',
      status: 'investigating'
    },
    {
      id: 'alert-003',
      title: 'Potential Sybil Attack',
      description: 'Multiple similar addresses interacting with same contract',
      severity: 'high',
      timestamp: '2023-06-15T14:20:00Z',
      status: 'mitigated'
    }
  ]);

  const [apiKeys] = useState([
    {
      id: 'key-001',
      name: 'Alchemy API Key',
      service: 'Ethereum RPC',
      key: 'alk_****************abcd',
      status: 'active',
      lastUsed: '2023-06-15T14:30:00Z'
    },
    {
      id: 'key-002',
      name: 'Infura API Key',
      service: 'Polygon RPC',
      key: 'inf_****************efgh',
      status: 'active',
      lastUsed: '2023-06-15T14:25:00Z'
    }
  ]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Security</h1>
            <p className="text-muted-foreground">Monitor and manage security for testnet operations</p>
          </div>
          <div className="flex space-x-2 mt-4 md:mt-0">
            <Button>
              <Shield className="h-4 w-4 mr-2" />
              Run Security Scan
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">2 require attention</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Threats Mitigated</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Blocked Requests</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">142</div>
              <p className="text-xs text-muted-foreground">+24 from yesterday</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="font-medium flex items-center">
                        {alert.title}
                        <Badge 
                          variant={alert.severity === 'high' ? 'destructive' : 'default'}
                          className="ml-2"
                        >
                          {alert.severity}
                        </Badge>
                        <Badge 
                          variant={alert.status === 'mitigated' ? 'secondary' : alert.status === 'investigating' ? 'default' : 'destructive'}
                          className="ml-2"
                        >
                          {alert.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                      <div className="text-xs text-muted-foreground mt-2">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Investigate
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>API Keys & Secrets</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowSecrets(!showSecrets)}
                  >
                    {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{key.name}</div>
                        <div className="text-sm text-muted-foreground">{key.service}</div>
                        <div className="text-xs font-mono mt-1">
                          {showSecrets ? key.key : key.key.replace(/\*/g, '•')}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Last used: {new Date(key.lastUsed).toLocaleString()}
                        </div>
                      </div>
                      <Badge variant={key.status === 'active' ? 'default' : 'secondary'}>
                        {key.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Anti-Sybil Measures</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Behavioral Analysis</div>
                      <div className="text-sm text-muted-foreground">Monitor interaction patterns</div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Address Reputation</div>
                      <div className="text-sm text-muted-foreground">Track address history</div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Transaction Velocity</div>
                      <div className="text-sm text-muted-foreground">Limit rapid transactions</div>
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Security;