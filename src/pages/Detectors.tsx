"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Play, 
  Pause,
  RotateCcw,
  Settings,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DetectorStatus {
  name: string;
  enabled: boolean;
  lastRun: string | null;
  status: 'active' | 'inactive' | 'error'; // Added 'error' status
}

const Detectors = () => {
  const { toast } = useToast();
  const [detectors, setDetectors] = useState<DetectorStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDetectors = async () => {
    try {
      const response = await fetch('/api/detectors/status');
      if (!response.ok) {
        throw new Error('Failed to fetch detector status');
      }
      const data: DetectorStatus[] = await response.json();
      setDetectors(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load detectors: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetectors();
    // Optionally, refresh detector status periodically
    const interval = setInterval(fetchDetectors, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [toast]);

  const toggleDetector = async (name: string) => {
    try {
      const response = await fetch(`/api/detectors/${name}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to toggle detector ${name}`);
      }

      const data = await response.json();
      toast({
        title: "Detector Toggled",
        description: data.message,
      });
      fetchDetectors(); // Refresh the list to show updated status
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to toggle detector: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const restartDetector = (id: string) => {
    // In a real application, this would call a backend API to restart a specific detector
    const detector = detectors.find(d => d.name === id);
    if (detector) {
      toast({
        title: "Restarting Detector",
        description: `${detector.name} is restarting... (simulated)`
      });
      // Simulate a restart by briefly changing status and then reverting
      setDetectors(prevDetectors => 
        prevDetectors.map(d => 
          d.name === id ? { ...d, status: 'inactive', lastRun: new Date().toISOString() } : d
        )
      );
      setTimeout(() => {
        setDetectors(prevDetectors => 
          prevDetectors.map(d => 
            d.name === id ? { ...d, status: 'active', lastRun: new Date().toISOString() } : d
          )
        );
        toast({
          title: "Detector Restarted",
          description: `${detector.name} has been restarted.`,
        });
      }, 2000); // Simulate 2-second restart
    }
  };

  const activeCount = detectors.filter(d => d.enabled).length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Detectors</h1>
            <p className="text-muted-foreground">Manage and monitor detection modules</p>
          </div>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <div className="flex items-center">
              <Activity className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm font-medium">{activeCount} Active</span>
            </div>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground">Loading detectors...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {detectors.map((detector) => (
              <Card key={detector.name} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center">
                        {detector.name}
                        <Badge 
                          variant={detector.status === 'active' ? 'default' : detector.status === 'error' ? 'destructive' : 'secondary'}
                          className="ml-2"
                        >
                          {detector.status}
                        </Badge>
                      </CardTitle>
                      {/* Placeholder for description, as it's not returned by API yet */}
                      <p className="text-sm text-muted-foreground mt-1">
                        {detector.name.includes('MEV') ? 'MEV Detector' : 'Testnet Opportunity Detector'}
                      </p>
                    </div>
                    <Switch
                      checked={detector.enabled}
                      onCheckedChange={() => toggleDetector(detector.name)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {/* Placeholder for chains, as it's not returned by API yet */}
                    <Badge variant="secondary">
                      {detector.name.includes('EVM') ? 'EVM' : 'All'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Last run: {detector.lastRun ? new Date(detector.lastRun).toLocaleString() : 'Never'}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => restartDetector(detector.name)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={!detector.enabled}
                      >
                        {detector.enabled ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Detectors;