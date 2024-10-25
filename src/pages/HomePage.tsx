import { useEffect, useState } from "react";
import { databases } from "../appwrite";
import { Navbar } from "@/components/Navbar";
import { EventCard } from "@/components/EventCard";
import { EventFilters } from "@/components/EventFilters";
import {
  Loader2,
  LayoutGrid,
  List,
  Calendar,
  Radio,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Interface for the EventCard props
interface EventCardProps {
  id: number;
  title: string;
  date: string;
  time: string;
  venue: string;
  category: string;
  attendees: number;
  image: string;
}

declare namespace AppwriteModels {
  interface Document {
    $id: string;
    $createdAt: string;
    $updatedAt: string;
    $permissions: string[];
    $collectionId: string;
    $databaseId: string;
  }
}

// Interface matching your Appwrite document structure
interface EventDocument extends AppwriteModels.Document {
  title: string;
  date: string;
  location: string;
  description: string;
  attendeesCount: number;
  type: string;
}

export function HomePage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeCategory, setActiveCategory] = useState("All");
  const [events, setEvents] = useState<EventDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await databases.listDocuments(
          import.meta.env.VITE_DATABASE_ID,
          import.meta.env.VITE_EVENT_COLLECTION_ID
        );

        const eventsData = response.documents.map((doc) => ({
          ...doc,
          title: doc.title,
          date: doc.date,
          location: doc.location,
          description: doc.description,
          attendeesCount: doc.attendeesCount,
          type: doc.type,
        })) as EventDocument[];

        setEvents(eventsData);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Failed to load events. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Format date for display
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  // Convert Appwrite document to EventCard props
  const mapEventToCardProps = (event: EventDocument): EventCardProps => {
    const { date, time } = formatEventDate(event.date);
    return {
      // Here we map $id to the id field, if needed, else just use $id directly.
      id: parseInt(event.$id), // This line is only if you want to use id as a number
      title: event.title,
      date,
      time,
      venue: event.location,
      category: typeof event.type === "string" ? event.type : "General",
      attendees: event.attendeesCount,
      image: "/api/placeholder/400/200",
    };
  };

  // Filter events based on category
  const filterEventsByCategory = (events: EventDocument[]) => {
    if (activeCategory === "All") return events;
    return events.filter((event) => event.type === activeCategory);
  };

  // Categorize events based on their date
  const categorizeEvents = () => {
    const now = new Date();
    const filteredEvents = filterEventsByCategory(events);

    const upcoming = filteredEvents.filter(
      (event) => new Date(event.date) > now
    );
    const past = filteredEvents.filter((event) => new Date(event.date) < now);
    const live = filteredEvents.filter((event) => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === now.toDateString();
    });

    return { upcoming, live, past };
  };

  const { upcoming, live, past } = categorizeEvents();

  if (error) {
    return (
      <>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-red-600">
            <p>{error}</p>
          </div>
        </div>
      </>
    );
  }

  const renderEvents = (
    eventList: EventDocument[],
    type: "upcoming" | "live" | "past"
  ) => {
    if (eventList.length === 0) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
          <Calendar className="w-12 h-12 mb-4 opacity-50" />
          <p>No {type} events found</p>
        </div>
      );
    }

    return eventList.map((event) => (
      <EventCard
        key={event.$id} // Ensure you're using $id as the key
        event={{
          $id: event.$id, // Ensure to include $id in the event object
          title: mapEventToCardProps(event).title,
          date: mapEventToCardProps(event).date,
          time: mapEventToCardProps(event).time,
          venue: mapEventToCardProps(event).venue,
          category: mapEventToCardProps(event).category,
          attendees: mapEventToCardProps(event).attendees,
          image: mapEventToCardProps(event).image,
        }}
        type={type}
      />
    ));
  };

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <EventFilters
            activeCategory={activeCategory}
            setCategory={setActiveCategory}
          />
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="upcoming" className="flex gap-2">
                <Calendar className="w-4 h-4" />
                Upcoming ({upcoming.length})
              </TabsTrigger>
              <TabsTrigger value="live" className="flex gap-2">
                <Radio className="w-4 h-4" />
                Live ({live.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="flex gap-2">
                <Clock className="w-4 h-4" />
                Past ({past.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              <div
                className={`grid ${
                  viewMode === "grid"
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "grid-cols-1 gap-4"
                }`}
              >
                {renderEvents(upcoming, "upcoming")}
              </div>
            </TabsContent>

            <TabsContent value="live">
              <div
                className={`grid ${
                  viewMode === "grid"
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "grid-cols-1 gap-4"
                }`}
              >
                {renderEvents(live, "live")}
              </div>
            </TabsContent>

            <TabsContent value="past">
              <div
                className={`grid ${
                  viewMode === "grid"
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "grid-cols-1 gap-4"
                }`}
              >
                {renderEvents(past, "past")}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
}
