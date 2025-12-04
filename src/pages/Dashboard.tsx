"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  Zap,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Signal {
  id: string;
  chain: string;
  type: string;
  contract: string;
  score: number;
  urgency: 'High' | 'Medium' | 'Low';
  timestamp: string;
  status: string;
  detector: string;
}

interface DetectorStatus {
  name: string;
  enabled: boolean;
  lastRun: string | null;
  status: 'active' | 'inactive';
}

const Dashboard = () => {
  const { toast } = useToast();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [detectorStatuses, setDetectorStatuses] = useState<DetectorStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const signalsResponse = await fetch('/api/signals');
        if (!signalsResponse.ok) throw new Error('Failed to fetch signals');
        const signalsData: Signal[] = await signalsResponse.json();
        setSignals(signalsData);

        const detectorsResponse = await fetch('/api/detectors/status');
        if (!detectorsResponse.ok) throw new Error('Failed to fetch detector statuses');
        const detectorsData: DetectorStatus[] = await detectorsResponse.json();
        setDetectorStatuses(detectorsData);
      } catch (error: any) {
        toast({
          title: "Error",
          description: `Failed to load dashboard data: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, [toast]);

  const activeSignalsCount = signals.length;
  const activeDetectorsCount = detectorStatuses.filter(d => d.enabled).length;
  const totalDetectors = detectorStatuses.length;
  const highPrioritySignals = signals.filter(s => s.urgency === 'High').length;
  const averageScore = signals.length > 0 
    ? (signals.reduce((sum, s) => sum + s.score, 0) / signals.length).toFixed(1) 
    : 'N/A';

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const signalDate = new Date(timestamp);
    const diffSeconds = Math.floor((now.getTime() - signalDate.getTime()) / 1000);

    if (diffSeconds < 60) return `${diffSeconds} sec ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Testnet Intelligence Engine</h1>
            <p className="text-muted-foreground">Monitor and analyze testnet opportunities in real-time</p>
          </div>
          <Button>
            <Zap className="mr-2 h-4 w-4" />
            Run Detectors
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Signals</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSignalsCount}</div>
              <p className="text-xs text-muted-foreground">+12 from last hour</p> {/* This would need more complex backend logic */}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Detectors Active</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeDetectorsCount}/{totalDetectors}</div>
              <p className="text-xs text-muted-foreground">{totalDetectors - activeDetectorsCount} offline</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{highPrioritySignals}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Score</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageScore}</div>
              <p className="text-xs text-muted-foreground">+5.2 from yesterday</p> {/* This would need more complex backend logic */}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Signals</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center text-muted-foreground">Loading recent signals...</div>
              ) : (
                <div className="space-y-4">
                  {signals.slice(0, 4).map((signal) => ( // Display top 4 recent signals
                    <div key={signal.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <div className="font-medium">{signal.chain}</div>
                        <div className="text-sm text-muted-foreground">{signal.type}</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={signal.score > 80 ? "default" : signal.score > 60 ? "secondary" : "outline"}>
                          {signal.score}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{getRelativeTime(signal.timestamp)}</span>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                  {signals.length === 0 && <p className="text-center text-muted-foreground">No recent signals found.</p>}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detector Status</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center text-muted-foreground">Loading detector statuses...</div>
              ) : (
                <div className="space-y-4">
                  {detectorStatuses.map((detector, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{detector.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {detector.name.includes('MEV') ? 'MEV Detector' : 'Testnet Opportunity Detector'}
                        </div>
                      </div>
                      <Badge variant={detector.status === 'active' ? 'default' : 'destructive'}>
                        {detector.status}
                      </Badge>
                    </div>
                  ))}
                  {detectorStatuses.length === 0 && <p className="text-center text-muted-foreground">No detectors found.</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;