
import React from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, Check } from 'lucide-react';

interface TaskOptInButtonProps {
  isOptingIn: boolean;
  address?: string;
  onOptIn: () => void;
}

export const TaskOptInButton: React.FC<TaskOptInButtonProps> = ({
  isOptingIn,
  address,
  onOptIn
}) => {
  return (
    <Button 
      size="sm" 
      variant="outline"
      onClick={onOptIn}
      disabled={isOptingIn || !address}
      className="text-xs h-7 bg-white/20 text-white hover:bg-white/10 hover:text-white hover:border-white/30 flex-shrink-0"
    >
      {isOptingIn ? (
        <Check className="w-3 h-3 mr-1" />
      ) : (
        <UserPlus className="w-3 h-3 mr-1" />
      )}
      {isOptingIn ? 'Opting...' : 'Opt In'}
    </Button>
  );
};
