import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock, ArrowRight, Radio } from "lucide-react";
import RegistrationModal from './RegistrationModal';

interface EventCardProps {
  event: {
    $id: string;  // Ensure $id is here
    title: string;
    date: string;
    time: string;
    venue: string;
    category: string;
    Attendee: string[];  // Changed from attendees number to array of attendee IDs
    image: string;
    Max_Attendees: number;
  };
  type: 'upcoming' | 'live' | 'past';
}

export function EventCard({ event, type }: EventCardProps) {
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);

  const getBadgeStyle = () => {
    switch (type) {
      case 'live':
        return 'bg-green-100 text-green-800 animate-pulse';
      case 'past':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getGradientStyle = () => {
    switch (type) {
      case 'live':
        return 'from-green-100 to-green-200';
      case 'past':
        return 'from-gray-100 to-gray-200';
      default:
        return 'from-blue-100 to-blue-200';
    }
  };

  const renderStatusIcon = () => {
    switch (type) {
      case 'live':
        return <Radio className="w-16 h-16 text-green-500 opacity-50 animate-pulse" />;
      case 'past':
        return <Calendar className="w-16 h-16 text-gray-500 opacity-50" />;
      default:
        return <Calendar className="w-16 h-16 text-blue-500 opacity-50" />;
    }
  };

  return (
    <>
      <Card className={`overflow-hidden transition-shadow duration-300 ${type === 'past' ? 'opacity-75' : 'hover:shadow-lg'}`}>
        <div className={`relative h-48 bg-gradient-to-r ${getGradientStyle()}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            {renderStatusIcon()}
          </div>
        </div>
        
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-bold mb-2">{event.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 flex-wrap">
                <Calendar className="w-4 h-4" />
                <span>{event.date}</span>
                <Clock className="w-4 h-4 ml-2" />
                <span>{event.time}</span>
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2">
              <Badge variant="secondary" className={`text-xs ${getBadgeStyle()}`}>
                {event.category}
              </Badge>
              {type === 'live' && (
                <Badge className="bg-green-500 text-white text-xs">
                  Live Now
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm break-words">{event.venue}</span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">
                {type === 'past' ? `${event.Attendee.length} Attended` : `${event.Attendee.length} Attendees`}
              </span>
            </div>

            <div className="flex gap-2 mt-4">
              <Button 
                variant={type === 'past' ? "outline" : "default"} 
                className="flex-1 flex items-center justify-center"
              >
                View Details
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              {type === 'upcoming' && (
                <Button 
                  className="flex-1"
                  onClick={() => setIsRegistrationModalOpen(true)}
                >
                  Register
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <RegistrationModal 
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        event={event}
      />
    </>
  );
}