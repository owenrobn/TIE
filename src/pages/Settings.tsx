"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Save, 
  RotateCcw,
  Key,
  Database,
  Network
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    rpcEndpoints: {
      ethereum: 'https://eth-sepolia.g.alchemy.com/v2/your-api-key',
      arbitrum: 'https://arb-sepolia.g.alchemy.com/v2/your-api-key',
      optimism: 'https://opt-sepolia.g.alchemy.com/v2/your-api-key',
      base: 'https://base-sepolia.g.alchemy.com/v2/your-api-key'
    },
    database: {
      host: 'localhost',
      port: '5432',
      name: 'tie_db',
      user: 'tie_user'
    },
    security: {
      enableHMAC: true,
      webhookSecret: 'your-webhook-secret-key',
      apiKey: 'your-api-key'
    },
    performance: {
      detectorLatency: 1000,
      simulationTimeout: 3000,
      maxConcurrentSimulations: 5
    }
  });

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your configuration has been successfully updated."
    });
  };

  const handleReset = () => {
    toast({
      title: "Settings Reset",
      description: "Configuration has been reset to default values."
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Configure system parameters and connections</p>
          </div>
          <div className="flex space-x-2 mt-4 md:mt-0">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Network className="h-5 w-5 mr-2" />
                RPC Endpoints
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(settings.rpcEndpoints).map(([chain, endpoint]) => (
                <div key={chain} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <Label className="capitalize">{chain}</Label>
                  <div className="md:col-span-3">
                    <Input 
                      value={endpoint} 
                      onChange={(e) => setSettings({
                        ...settings,
                        rpcEndpoints: {
                          ...settings.rpcEndpoints,
                          [chain]: e.target.value
                        }
                      })}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Database Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <Label>Host</Label>
                <div className="md:col-span-3">
                  <Input 
                    value={settings.database.host} 
                    onChange={(e) => setSettings({
                      ...settings,
                      database: {
                        ...settings.database,
                        host: e.target.value
                      }
                    })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <Label>Port</Label>
                <div className="md:col-span-3">
                  <Input 
                    value={settings.database.port} 
                    onChange={(e) => setSettings({
                      ...settings,
                      database: {
                        ...settings.database,
                        port: e.target.value
                      }
                    })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <Label>Database Name</Label>
                <div className="md:col-span-3">
                  <Input 
                    value={settings.database.name} 
                    onChange={(e) => setSettings({
                      ...settings,
                      database: {
                        ...settings.database,
                        name: e.target.value
                      }
                    })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <Label>User</Label>
                <div className="md:col-span-3">
                  <Input 
                    value={settings.database.user} 
                    onChange={(e) => setSettings({
                      ...settings,
                      database: {
                        ...settings.database,
                        user: e.target.value
                      }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable HMAC Signing</Label>
                  <p className="text-sm text-gray-500">Sign all outgoing signals with HMAC-SHA256</p>
                </div>
                <Switch
                  checked={settings.security.enableHMAC}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    security: {
                      ...settings.security,
                      enableHMAC: checked
                    }
                  })}
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <Label>Webhook Secret</Label>
                <Input 
                  type="password"
                  value={settings.security.webhookSecret} 
                  onChange={(e) => setSettings({
                    ...settings,
                    security: {
                      ...settings.security,
                      webhookSecret: e.target.value
                    }
                  })}
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <Label>API Key</Label>
                <Input 
                  type="password"
                  value={settings.security.apiKey} 
                  onChange={(e) => setSettings({
                    ...settings,
                    security: {
                      ...settings.security,
                      apiKey: e.target.value
                    }
                  })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <Label>Detector Latency (ms)</Label>
                <div className="md:col-span-3">
                  <Input 
                    type="number"
                    value={settings.performance.detectorLatency} 
                    onChange={(e) => setSettings({
                      ...settings,
                      performance: {
                        ...settings.performance,
                        detectorLatency: parseInt(e.target.value)
                      }
                    })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <Label>Simulation Timeout (ms)</Label>
                <div className="md:col-span-3">
                  <Input 
                    type="number"
                    value={settings.performance.simulationTimeout} 
                    onChange={(e) => setSettings({
                      ...settings,
                      performance: {
                        ...settings.performance,
                        simulationTimeout: parseInt(e.target.value)
                      }
                    })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <Label>Max Concurrent Simulations</Label>
                <div className="md:col-span-3">
                  <Input 
                    type="number"
                    value={settings.performance.maxConcurrentSimulations} 
                    onChange={(e) => setSettings({
                      ...settings,
                      performance: {
                        ...settings.performance,
                        maxConcurrentSimulations: parseInt(e.target.value)
                      }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;