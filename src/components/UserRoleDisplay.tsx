import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { User, Shield, Eye } from 'lucide-react';

interface UserRoleDisplayProps {
  role?: 'Admin' | 'Researcher' | 'Viewer';
  username?: string;
}

export const UserRoleDisplay: React.FC<UserRoleDisplayProps> = ({ 
  role = 'Viewer', 
  username = 'Guest User' 
}) => {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin':
        return <Shield className="h-4 w-4" />;
      case 'Researcher':
        return <User className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'destructive';
      case 'Researcher':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <Card className="shadow-card mt-9">
      <CardContent className="p-4">
        <div className="flex items-center justify-between max-sm:flex-col">
          <div className="flex items-center">
            <div className="p-1 rounded-full bg-muted">
              {getRoleIcon(role)}
            </div>
              <p className="font-medium m-1">{username}</p>
          </div>
          <Badge variant={getRoleColor(role) as any} className="flex items-center gap-1">
            {role}
          </Badge>
        </div>
        
        <div className="mt-3 pt-3 border-t max-sm:hidden">
          <p className="text-xs text-muted-foreground text-center max-sm:hidden">
            {new Date().toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};