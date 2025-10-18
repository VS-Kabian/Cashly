import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DOMPurify from 'dompurify';

interface MaintenanceModeProps {
  children: React.ReactNode;
}

/**
 * Maintenance Mode Component
 * Checks if the app is in maintenance mode and displays a message to users
 * Admins can bypass maintenance mode
 */
export default function MaintenanceMode({ children }: MaintenanceModeProps) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkMaintenanceMode();

    // Set up real-time subscription to maintenance mode changes
    const channel = supabase
      .channel('maintenance_mode_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_settings',
          filter: 'setting_key=eq.maintenance_mode',
        },
        () => {
          checkMaintenanceMode();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkMaintenanceMode = async () => {
    try {
      // Fetch maintenance mode setting
      const { data: modeData } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'maintenance_mode')
        .single();

      // Fetch maintenance message
      const { data: messageData } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'maintenance_message')
        .single();

      setIsMaintenanceMode(modeData?.setting_value === 'true');
      setMaintenanceMessage(
        messageData?.setting_value ||
          'We are currently performing scheduled maintenance. Please check back soon.'
      );
    } catch (error) {
      console.error('Error checking maintenance mode:', error);
      // If there's an error, assume maintenance mode is off
      setIsMaintenanceMode(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // Show loading state while checking maintenance mode
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // If maintenance mode is enabled, show maintenance message
  if (isMaintenanceMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <Card className="w-full max-w-lg shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-orange-100 rounded-full">
                <Wrench className="h-12 w-12 text-orange-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              Maintenance in Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Render HTML/CSS maintenance message (set by admin) - sanitized for security */}
            <div
              className="text-center text-muted-foreground"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(
                  maintenanceMessage || 'We are currently performing maintenance. Please check back soon.',
                  {
                    ALLOWED_TAGS: ['div', 'span', 'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'style'],
                    ALLOWED_ATTR: ['style', 'class'],
                  }
                )
              }}
            />
            <div className="pt-4">
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Again
              </Button>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              We'll be back shortly. Thank you for your patience!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If not in maintenance mode, render children (the app)
  return <>{children}</>;
}
