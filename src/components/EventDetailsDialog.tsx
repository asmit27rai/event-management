import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
  } from "@/components/ui/dialog";
  import { Badge } from "@/components/ui/badge";
  import { Button } from "@/components/ui/button";
  import { Calendar, Clock, MapPin, Users, Share2 } from "lucide-react";
  import { Separator } from "@/components/ui/separator";
  
  interface EventDetailsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    event: {
      $id: string;
      title: string;
      date: string;
      time: string;
      venue: string;
      category: string;
      Attendee: string[];
      Max_Attendees: number;
      description?: string;
      image?: string;
    };
    type: "upcoming" | "live" | "past";
  }
  
  export function EventDetailsDialog({
    isOpen,
    onClose,
    event,
    type,
  }: EventDetailsDialogProps) {
    const getBadgeStyle = () => {
      switch (type) {
        case "live":
          return "bg-green-100 text-green-800 animate-pulse";
        case "past":
          return "bg-gray-100 text-gray-800";
        default:
          return "bg-blue-100 text-blue-800";
      }
    };
  
    const getStatusText = () => {
      switch (type) {
        case "live":
          return "Happening Now";
        case "past":
          return "Event Completed";
        default:
          return "Upcoming Event";
      }
    };
  
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <DialogTitle className="text-xl font-semibold">
                  {event.title}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600">
                  {getStatusText()}
                </DialogDescription>
              </div>
              <Badge
                variant="secondary"
                className={`${getBadgeStyle()} px-3 py-1`}
              >
                {event.category}
              </Badge>
            </div>
          </DialogHeader>
  
          <div className="grid gap-4">
            {/* Event Image and Description Section */}
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  About This Event
                </h3>
                <p className="text-sm leading-relaxed text-gray-700">
                  {event.description || "No description available for this event."}
                </p>
              </div>
            </div>
  
            {/* Event Details */}
            <div className="grid gap-2 text-gray-700 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{event.date}</span>
                <Clock className="w-4 h-4 ml-2" />
                <span>{event.time}</span>
              </div>
  
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{event.venue}</span>
              </div>
  
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>
                  {event.Attendee.length} / {event.Max_Attendees} Attendees
                </span>
              </div>
            </div>
  
            <Separator />
  
            {/* Attendance Status */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-medium text-sm mb-2">Attendance Status</h3>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(event.Attendee.length / event.Max_Attendees) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {event.Max_Attendees - event.Attendee.length} Spots remaining
              </p>
            </div>
  
            <div className="flex gap-3 mt-3">
              <Button variant="outline" className="flex gap-1">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  export default EventDetailsDialog;