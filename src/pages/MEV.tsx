"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

const MEV = () => {
  const [mevOpportunities] = useState([
    {
      id: 'mev-001',
      type: 'Arbitrage',
      chain: 'Ethereum Sepolia',
      profit: '0.025 ETH',
      confidence: 92,
      urgency: 'High',
      timestamp: '2023-06-15T14:30:00Z',
      status: 'detected'
    },
    {
      id: 'mev-002',
      type: 'Liquidation',
      chain: 'Arbitrum Nitro',
      profit: '0.15 ETH',
      confidence: 87,
      urgency: 'High',
      timestamp: '2023-06-15T14:25:00Z',
      status: 'detected'
    },
    {
      id: 'mev-003',
      type: 'Sandwich',
      chain: 'Optimism Goerli',
      profit: '0.08 ETH',
      confidence: 78,
      urgency: 'Medium',
      timestamp: '2023-06-15T14:20:00Z',
      status: 'detected'
    },
    {
      id: 'mev-004',
      type: 'Oracle Manipulation',
      chain: 'Base Goerli',
      profit: '0.03 ETH',
      confidence: 65,
      urgency: 'Low',
      timestamp: '2023-06-15T14:15:00Z',
      status: 'detected'
    }
  ]);

  const [priceAnomalies] = useState([
    {
      id: 'anomaly-001',
      token: 'WETH',
      chain: 'Ethereum Sepolia',
      deviation: '+15.2%',
      timestamp: '2023-06-15T14:30:00Z',
      status: 'critical'
    },
    {
      id: 'anomaly-002',
      token: 'USDC',
      chain: 'Arbitrum Nitro',
      deviation: '-8.7%',
      timestamp: '2023-06-15T14:25:00Z',
      status: 'warning'
    }
  ]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">MEV Intelligence</h1>
            <p className="text-muted-foreground">Monitor and analyze MEV opportunities on testnets</p>
          </div>
          <div className="flex space-x-2 mt-4 md:mt-0">
            <Button>
              <Zap className="h-4 w-4 mr-2" />
              Run MEV Detectors
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Opportunities</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">+8 from last hour</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0.042 ETH</div>
              <p className="text-xs text-muted-foreground">+0.012 from yesterday</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Confidence</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">16</div>
              <p className="text-xs text-muted-foreground">Above 80% confidence</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>MEV Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mevOpportunities.map((opportunity) => (
                  <div key={opportunity.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div>
                      <div className="font-medium flex items-center">
                        {opportunity.type}
                        <Badge 
                          variant={opportunity.urgency === 'High' ? 'destructive' : opportunity.urgency === 'Medium' ? 'default' : 'secondary'}
                          className="ml-2"
                        >
                          {opportunity.urgency}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {opportunity.chain} • {new Date(opportunity.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="font-medium">{opportunity.profit}</div>
                        <div className="text-sm text-muted-foreground">{opportunity.confidence}% confidence</div>
                      </div>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Price Anomalies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {priceAnomalies.map((anomaly) => (
                  <div key={anomaly.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div>
                      <div className="font-medium flex items-center">
                        {anomaly.token}
                        <Badge 
                          variant={anomaly.status === 'critical' ? 'destructive' : 'default'}
                          className="ml-2"
                        >
                          {anomaly.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {anomaly.chain} • {new Date(anomaly.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className={`text-right font-medium ${anomaly.deviation.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {anomaly.deviation}
                      </div>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MEV;