"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Play, 
  Pause,
  RotateCcw,
  Activity
} from 'lucide-react';

interface DetectorCardProps {
  id: string;
  name: string;
  description: string;
  chains: string[];
  status: 'active' | 'offline' | 'error';
  lastRun: string;
  enabled: boolean;
  onToggle: (id: string) => void;
  onRestart: (id: string) => void;
}

const DetectorCard: React.FC<DetectorCardProps> = ({
  id,
  name,
  description,
  chains,
  status,
  lastRun,
  enabled,
  onToggle,
  onRestart
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center">
              {name}
              <Badge 
                variant={status === 'active' ? 'default' : status === 'offline' ? 'destructive' : 'outline'}
                className="ml-2"
              >
                {status}
              </Badge>
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={() => onToggle(id)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {chains.map((chain, index) => (
            <Badge key={index} variant="secondary">
              {chain}
            </Badge>
          ))}
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Last run: {new Date(lastRun).toLocaleString()}
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onRestart(id)}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              disabled={!enabled}
            >
              {enabled ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DetectorCard;